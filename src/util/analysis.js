import LM from 'ml-levenberg-marquardt';
import { MODEL_LEFT_ANGLE, MODEL_LEFT_KEY_PARAM, MODEL_RIGHT_ANGLE, MODEL_RIGHT_KEY_PARAM } from '../constants';
import cloneDeep from 'lodash-es/cloneDeep';

/**
 * 计算关键特征
 * @param {*} rawData 
 * @param {*} params 
 * @returns 
 */
export function getKeyParam(rawData, params) {
  let pickedChar = "";
  let maxSt = 0;
  let maxRange = 0;
  params.forEach((key) => {
    const data = rawData.filter(d => {
      let index = 0;
      if (key.startsWith('r')) {
        index = MODEL_RIGHT_KEY_PARAM.indexOf(key);
        const indList = MODEL_RIGHT_ANGLE[index];
        const inVisible = indList.some(t => d[t].visibility < 0.8);
        return !inVisible;
      } else {
        index = MODEL_LEFT_KEY_PARAM.indexOf(key);
        const indList = MODEL_LEFT_ANGLE[index];
        const inVisible = indList.some(t => d[t].visibility < 0.8);
        return !inVisible;
      }
    }).map((d) => d[key]);
    const stat = jStat(data);
    // const min = stat.min();
    // const max = stat.max();
    const stdev = stat.stdev();
    const range = stat.range();
    if (stdev > maxSt && range > maxRange) {
      maxSt == stdev;
      maxRange = range;
      pickedChar = key;
    }
  });
  return pickedChar;
}

/**
 * 计算某特征的曲率变化数组
 * @param {*} rawData 
 * @param {*} params 
 */
export function calSlopeCurve(data) {
  const k = [];
  const len = data.length;
  for (let i = 0; i < len - 1; i++) {
    const y2 = data[i + 1];
    const y1 = data[i];
    k.push((y2 - y1) / 1.0);
  }
  return k;
}

/**
 * 正弦函数公式
 * @param {*} param0 
 * @returns 
 */
export function sinFunction([a, b, c, d]) {
  return (t) => a * Math.sin(b * t + c) + d;
}

/**
 * 正弦函数拟合
 * @param {*} rawData 
 * @param {*} param 
 */
export function curveFitting(x, y) {
  // array of points to fit
  let data = {
    x,
    y
  };

  // array of initial parameter values (must be provided)
  let initialValues = [
    1, 1, 0, 0
  ];

  // Optionally, restrict parameters to minimum & maximum values
  // let minValues = [
  //   -Math.PI, 
  // ];
  // let maxValues = [
  //   /* a_max, b_max, c_max, ... */
  // ];

  const options = {
    damping: 1.5,
    initialValues: initialValues,
    // minValues: minValues,
    // maxValues: maxValues,
    gradientDifference: 10e-6,
    maxIterations: 1000,
    errorTolerance: 10e-6,
  };

  let fittedParams = LM(data, sinFunction, options);
  return fittedParams;
}

/**
 * 四分位数
 * @param {*} data 
 * @param {*} k example: [0.25, 0.5, 0.75]
 * @returns 四分位数组
 */
export function quantiles(data, k) {
  return jStat.quantiles(data, k);
}

/**
 * 百分位
 * @param {*} data 
 * @param {*} k example: 0.5
 * @returns 百分位数
 */
export function percentile(data, k) {
  return jStat.percentile(data, k);
}

/**
 * 均值
 * @param {*} data 
 * @returns 
 */
export function mean(data) {
  return jStat.mean(data);
}

/**
 * 极值探测
 * rule: 
 * 1. 计算数据的斜率，斜率小于阈值，认为是拐点
 * 2. 如果斜率符号发生变化，认为是极值。根据上一个点的斜率正负，可以判断出是极大值
 * 还是极小值。最后，如果极值落在极值均值+-2个标准差范围内，则认为极值有效。否则，清空拐点数组。
 * 3. 如果斜率符号没有变化，清空拐点数组。
 * 4. 极值数除以2，得到动作完成数。
 * @param {*} data 
 * @param {*} tolerance 极值处斜率的容差
 * @returns 极值点的索引数组
 */
export function extremeValueDetect(data, tolerance) {
  const len = data.length;
  let lastK = 0; // 上一个点的斜率
  let extremeArr = []; // 拐点（斜率小于阈值的点集）
  const result = []; // 极值集合
  const maxRes = []; // 极大值集合
  const minRes = []; // 极小值集合
  let period = 0;
  for (let i = 0; i < len - 1; i++) {
    const y2 = data[i + 1];
    const y1 = data[i];
    const k = (y2 - y1) / 1.0;

    // 斜率小于阈值，认为是拐点，但不一定是极值点
    if (Math.abs(k) <= tolerance) {
      extremeArr.push(i + 0.5);
    } else {
      // 曲线方向改变，说明出现极值点
      if (lastK * k < 0) {
        let target = 0;
        // 多个拐点，取平均位置作为极值点位置
        if (extremeArr.length > 0) {
          target = mean(extremeArr);
        } else {
          target = i + 0.5;
        }
        // 算极值
        let val = 0;
        if (Math.round(target - 0.5) === target) {
          // 整数
          val = data[target];
        } else {
          val = (data[target - 0.5] + data[target + 0.5]) / 2;
        }

        if (lastK < 0) {
          // 极小值
          minRes.push(val);
          result.push({
            val: target,
            type: 'min',
            res: val,
            ind: result.length
          });
        } else {
          // 极大值
          maxRes.push(val);
          result.push({
            val: target,
            type: 'max',
            res: val,
            ind: result.length
          });
        }
        if (extremeArr.length > 0) {
          extremeArr = [];
        }
      } else {
        // 清空拐点
        extremeArr = [];
      }
      lastK = k;
    }
  }

  // 去掉最大值和最小值
  minRes.sort();
  maxRes.sort();
  const meanMin = jStat.mean(minRes.slice(1, -1));
  const stMin = Math.min(0.1, jStat.stdev(minRes.slice(1, -1)));
  const meanMax = jStat.mean(maxRes.slice(1, -1));
  const stMax = Math.min(0.1, jStat.stdev(maxRes.slice(1, -1)));

  // 极大值和极小值必须成对出现，否则成对剔除
  const finalRes = [];
  for (let i = 0; i < result.length - 1; i = i + 1) {
    if (result[i].type === result[i + 1].type) {
      finalRes.push(i);
    }
  }
  finalRes.sort((a, b) => b - a);
  finalRes.forEach(i => {
    result.splice(i, 1);
  })

  // 剔除不在阈值范围内的极值，极大值阈值为[avg-3st,avg+5st]，极小值阈值为[avg-5st,avg+3st]
  let cloneResult = [];
  for (let i = 0; i < result.length; i++) {
    const val = result[i].res;
    const type = result[i].type;
    if (type === 'min') {
      if (val >= meanMin - 5 * stMin && val <= meanMin + 3 * stMin) {
        if (cloneResult.length > 0) {
          if (type !== cloneResult[cloneResult.length - 1].type) {
            cloneResult.push(result[i]);
          }
        } else {
          cloneResult.push(result[i]);
        }
      }
    } else {
      if (val >= meanMax - 3 * stMax && val <= meanMax + 5 * stMax) {
        if (cloneResult.length > 0) {
          if (type !== cloneResult[cloneResult.length - 1].type) {
            cloneResult.push(result[i]);
          }
        } else {
          cloneResult.push(result[i]);
        }
      }
    }
  }

  // 剔除不连续的极值点
  for (let i = cloneResult.length - 2; i > 0; i--) {
    if (cloneResult[i].ind !== cloneResult[i + 1].ind - 1 && cloneResult[i].ind !== cloneResult[i - 1].ind + 1) {
      cloneResult.splice(i, 1);
    }
  }
  if (cloneResult[0].ind !== cloneResult[1].ind - 1) {
    cloneResult.splice(0, 1);
  }

  // 计算动作的周期
  const count = Math.floor(cloneResult.length / 2);
  const minCount = 8;
  let c = 0;
  for (let j = count > minCount ? 2 : 0; j < cloneResult.length - (count > minCount ? 4 : 2); j = j + 1) {
    period += Math.abs(cloneResult[j + 2].val - cloneResult[j].val);
    c++;
  }
  period /= c;
  console.log(cloneResult);

  return {
    extremes: cloneResult,
    maxAvg: mean(maxRes),
    minAvg: mean(minRes),
    maxQuant: quantiles(maxRes, [0.5])[0],
    minQuant: quantiles(minRes, [0.5])[0],
    count,
    period,
    lastK,
    extremeArr
  }
}