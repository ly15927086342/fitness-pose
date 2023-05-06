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
import { extremeValueDetect, getKeyParam, mean } from "./analysis";

/**
 * 特征数据记录
 */
export class Log {
  private _fileName: string;

  private _data: Record<string, unknown>[] = [];

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
          if (this._analysis.key === "" && this._data.length > 20) {
            const key = getKeyParam(this._data, [
              ...MODEL_LEFT_KEY_PARAM,
              ...MODEL_RIGHT_KEY_PARAM,
            ]);
            this._analysis.key = key;
          }
          if (this._analysis.key !== "") {
            if (!this._analysis.preProcess) {
              const res = extremeValueDetect(
                this._data.map((d) => d[this._analysis.key]),
                0.1
              );
              this._analysis.preProcess = true;
              this._analysis.count = res.count;
              this._analysis.lastK = res.lastK;
              this._analysis.extremeArr = res.extremeArr;
              this._analysis.extremes = res.extremes;
            } else {
              const i = this._data.length - 1;
              const y2 = this._data[i][this._analysis.key] as number;
              const y1 = this._data[i - 1][this._analysis.key] as number;
              const k = (y2 - y1) / 1.0;

              if (Math.abs(k) <= this._analysis.tolerance) {
                this._analysis.extremeArr.push(i - 0.5);
              } else {
                if (this._analysis.lastK * k < 0) {
                  let target = 0;
                  if (this._analysis.extremeArr.length > 0) {
                    target = mean(this._analysis.extremeArr);
                    this._analysis.extremeArr = [];
                  } else {
                    target = i - 0.5;
                  }
                  this._analysis.extremes.push(target);
                  if (this._analysis.extremes.length % 2 === 0) {
                    // 极值达到偶数，count+1
                    this._analysis.count++;
                    console.log(this._analysis.count);
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
