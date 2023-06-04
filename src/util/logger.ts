// import { NormalizedLandmarkList, NormalizedLandmark } from "@mediapipe/pose";
import { Point } from "./type";
import { eventEmitter } from "./eventEmitter";
import {
  DOWNLOAD_TXT_URL,
  MODEL_LEFT_ANGLE,
  MODEL_LEFT_KEY_PARAM,
  MODEL_RIGHT_ANGLE,
  MODEL_RIGHT_KEY_PARAM,
} from "../constants";
import { angVector, genVector } from "./math";
import {
  extremeValueDetect,
  getKeyParam,
  judgeExtreme,
  mean,
} from "./analysis";
import { Speaker } from "./speak";

/**
 * 特征数据记录
 */
export class Log {
  private _fileName: string;

  private _data: Record<string, unknown>[] = [];

  private _currentInd = 0;

  private _threshold: number = 50;

  private _analysis: any = {
    tolerance: 0.1,
    key: "",
    count: 0,
    preProcess: false,
    lastK: 0,
    extremeArr: [],
    extremes: [],
  };

  constructor(
    fileName: string,
    threshold: number,
    realTimeCount: boolean = false
  ) {
    this._fileName = fileName;
    this._threshold = threshold;
    if (realTimeCount) {
      this.initProxy();
    }
  }

  add(list: any[]) {
    const res: any = {};
    list.forEach((l, i) => {
      res[i] = l;
    });
    this.calcAngle(res, list);
    this._data.push(res);
  }

  initProxy() {
    this._data = new Proxy([] as Record<string, unknown>[], {
      set: (target, p, newValue) => {
        // length最后变更
        if (p === "length") {
          target[p] = newValue;
          // 每50个点重新计算一次关键特征
          if (this._data.length % 100 === 0) {
            const key = getKeyParam(this._data, [
              ...MODEL_LEFT_KEY_PARAM,
              ...MODEL_RIGHT_KEY_PARAM,
            ]);
            if (this._analysis.key !== key) {
              if (this._analysis.key !== "") {
                Speaker.getInstance().stop();
                Speaker.getInstance().speak("动作改变，开始重新计数");
              }
              this._currentInd = this._data.length - 1;
              this._analysis.key = key;
              this._analysis.preProcess = false;
            }
          }
          if (this._analysis.key !== "") {
            if (!this._analysis.preProcess) {
              const res = extremeValueDetect(
                this._data
                  .slice(this._currentInd)
                  .map((d) => d[this._analysis.key]),
                0.1
              );
              this._analysis.preProcess = true;
              this._analysis.count = res.count;
              this._analysis.lastK = res.lastK;
              this._analysis.extremeArr = [];
              this._analysis.extremes = [];
            } else {
              const validData = this._data.slice(this._currentInd);
              const i = validData.length - 1;
              const y2 = validData[i][this._analysis.key] as number;
              const y1 = validData[i - 1][this._analysis.key] as number;
              const k = (y2 - y1) / 1.0;

              if (Math.abs(k) <= this._analysis.tolerance) {
                this._analysis.extremeArr.push(i + 0.5);
              } else {
                if (this._analysis.lastK * k < 0) {
                  let target = 0;
                  if (this._analysis.extremeArr.length > 0) {
                    target = Math.floor(mean(this._analysis.extremeArr));
                  } else {
                    target = i + 0.5;
                  }
                  // 算极值
                  let val = 0;
                  if (Math.round(target - 0.5) === target) {
                    // 整数
                    val = validData[target][this._analysis.key] as number;
                  } else {
                    if (target + 0.5 < validData.length) {
                      val =
                        ((validData[target - 0.5][
                          this._analysis.key
                        ] as number) +
                          (validData[target + 0.5][
                            this._analysis.key
                          ] as number)) /
                        2;
                    } else {
                      val = validData[target - 0.5][
                        this._analysis.key
                      ] as number;
                    }
                  }

                  if (this._analysis.lastK < 0) {
                    // 极小值
                    this._analysis.extremes.push({
                      val: target,
                      type: "min",
                      res: val,
                      ind: this._analysis.extremes.length,
                    });
                  } else {
                    // 极大值
                    this._analysis.extremes.push({
                      val: target,
                      type: "max",
                      res: val,
                      ind: this._analysis.extremes.length,
                    });
                  }
                  if (this._analysis.extremeArr.length > 0) {
                    this._analysis.extremeArr = [];
                  }
                  // 是否计数
                  const whetherCount = judgeExtreme(this._analysis.extremes);
                  if (
                    whetherCount &&
                    this._analysis.extremes.length % 2 === 0
                  ) {
                    this._analysis.count++;
                    Speaker.getInstance().stop();
                    Speaker.getInstance()?.speak(this._analysis.count);
                    console.log(this._analysis.count);
                  } else {
                    console.log("no count");
                  }
                } else {
                  this._analysis.extremeArr = [];
                }
                this._analysis.lastK = k;
              }
            }
          }
        } else {
          target[Number(p)] = newValue;
        }
        return true;
      },
    });
  }

  print() {
    console.log(this._fileName);
    console.log(this._data.length);
    console.log(this._data.slice(-10));
  }

  calcAngle(res: any, list: any[]) {
    MODEL_LEFT_ANGLE.forEach((item, ind) => {
      const vecA = genVector(list[item[1]], list[item[0]]);
      const vecB = genVector(list[item[1]], list[item[2]]);
      const angle = angVector(vecA, vecB);
      res[MODEL_LEFT_KEY_PARAM[ind]] = angle;
    });
    MODEL_RIGHT_ANGLE.forEach((item, ind) => {
      const vecA = genVector(list[item[1]], list[item[0]]);
      const vecB = genVector(list[item[1]], list[item[2]]);
      const angle = angVector(vecA, vecB);
      res[MODEL_RIGHT_KEY_PARAM[ind]] = angle;
    });
  }

  download() {
    if (this._data.length > 0) {
      const url =
        "data:text/plain;charset=utf-8," +
        encodeURIComponent(
          JSON.stringify({
            t: this._threshold,
            data: this._data,
          })
        );
      eventEmitter.emit(DOWNLOAD_TXT_URL, url);
      this._data = [];
    }
  }
}
