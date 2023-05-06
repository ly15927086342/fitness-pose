import LM from 'ml-levenberg-marquardt';

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
    const data = rawData.map((d) => d[key]);
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
 * @param {*} data 
 * @param {*} tolerance 极值处斜率的容差
 * @returns 极值点的索引数组
 */
export function extremeValueDetect(data, tolerance) {
  const len = data.length;
  let lastK = 0;
  let extremeArr = [];
  const result = [];
  const maxRes = [];
  const minRes = [];
  let period = 0;
  for (let i = 0; i < len - 1; i++) {
    const y2 = data[i + 1];
    const y1 = data[i];
    const k = (y2 - y1) / 1.0;

    if (Math.abs(k) <= tolerance) {
      extremeArr.push(i + 0.5);
    } else {
      if (lastK * k < 0) {
        let target = 0;
        if (extremeArr.length > 0) {
          target = jStat.mean(extremeArr);
          extremeArr = [];
        } else {
          target = i + 0.5;
        }
        result.push(target);
        let val = 0;
        if (Math.round(target - 0.5) === target) {
          // 整数
          val = data[target];
        } else {
          val = (data[target - 0.5] + data[target + 0.5]) / 2;
        }
        if (lastK < 0) {
          minRes.push(val);
        } else {
          maxRes.push(val);
        }
      } else {
        extremeArr = [];
      }
      lastK = k;
    }
  }
  const count = Math.floor(result.length / 2);
  const minCount = 8;
  let c = 0;
  for (let j = count > minCount ? 2 : 0; j < result.length - (count > minCount ? 4 : 2); j = j + 1) {
    period += Math.abs(result[j + 2] - result[j]);
    c++;
  }
  period /= c;
  return {
    extremes: result,
    maxAvg: jStat.mean(maxRes),
    minAvg: jStat.mean(minRes),
    count,
    period,
    lastK,
    extremeArr
  }
}