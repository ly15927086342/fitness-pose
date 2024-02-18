/**
 * 投篮过程的篮球特征：
 * 1. 运动
 * 2. 呈抛物线
 * 3. 时序性，前后两个识别结果大概率是同一个球
 * 4. 如果时序断开，需要预测出剩余轨迹（后期）
 *
 * 错误识别特征：
 * 1. 静止
 * 2. 相似度高
 *
 * 命中投篮特征：
 * 1. 篮球运动过程（下落），篮球中心和篮筐中心基本重合
 * 2. 篮球和篮筐压盖时，篮球大小（宽高平均值）应该小于篮筐真实宽度（防止深度不一致）
 */

import { BoundingBox } from "@mediapipe/tasks-vision";
import RBush from "rbush";
import { INode, IPoint } from "./type";
import { RimDetector } from "./rim";

export class BallDetector {
  _tree: RBush<any>;

  iter: number = 0;

  round: number = 0;

  iterThreshold: number = 50;

  tracks: Record<string, INode[]> = {};

  curTrack: any[] = []; // 保留最近的10张图片识别结果

  static instance: BallDetector;

  constructor() {
    this._tree = new RBush();
  }

  static getInstance() {
    if (!BallDetector.instance) {
      BallDetector.instance = new BallDetector();
    }
    return BallDetector.instance;
  }

  fit(box: BoundingBox) {
    this.iter++;

    const range: INode = {
      minX: box.originX,
      minY: box.originY,
      maxX: box.originX + box.width,
      maxY: box.originY + box.height,
      centerX: box.originX + box.width / 2,
      centerY: box.originY + box.height / 2,
    };

    const rangeArea = box.width * box.height;
    const intersectList = this._tree.search(range);
    if (intersectList.length === 0) {
      this._tree.insert({ ...range, count: 1 });
    } else {
      // 求相交矩形
      intersectList.forEach((intersect) => {
        const intersectBoxArea =
          (intersect.maxX - intersect.minX) * (intersect.maxY - intersect.minY);
        const areaRatio = rangeArea / intersectBoxArea;
        if (areaRatio < 5 && areaRatio > 1 / 5) {
          if (
            intersect.centerX > range.minX &&
            intersect.centerX < range.maxX &&
            intersect.centerY > range.minY &&
            intersect.centerY < range.maxY
          ) {
            intersect.count++;
          }
        }
      });
    }

    // 4.3
    if (this.iter >= this.iterThreshold) {
      this.iter = 0;
      this.round++;
      const allList = this._tree.all();
      const rimBox = RimDetector.getInstance().getBestRim();
      const {
        originX: rimX,
        originY: rimY,
        width: rimW,
        height: rimH,
      } = rimBox;
      allList.forEach((item) => {
        if (item.count < countThreshold(this.round)) {
          this._tree.remove(item);
        }
        const { minX, minY, maxX, maxY } = item;
        // 和rim有相交
        if (
          !(
            rimX > maxX ||
            rimY > maxY ||
            rimX + rimW < minX ||
            rimY + rimH < minY
          )
        ) {
          this._tree.remove(item);
        }
      });
    }
  }

  getWrongBall(): BoundingBox[] {
    const allList = this._tree.all();
    const rimBox = RimDetector.getInstance().getBestRim();
    const { originX: rimX, originY: rimY, width: rimW, height: rimH } = rimBox;
    const res = allList
      .filter((node) => {
        if (node.count < countThreshold(this.round)) return false;
        const { minX, minY, maxX, maxY } = node;
        // 和rim有相交
        if (
          !(
            rimX > maxX ||
            rimY > maxY ||
            rimX + rimW < minX ||
            rimY + rimH < minY
          )
        ) {
          return false;
        }
        return true;
      })
      .map((node) => ({
        originX: node.minX,
        originY: node.minY,
        width: node.maxX - node.minX,
        height: node.maxY - node.minY,
      })) as BoundingBox[];
    return res;
  }

  isInWrongBall(ball: BoundingBox) {
    const wrongBalls = this.getWrongBall();
    return wrongBalls.some((box) => {
      const centerX = box.originX + box.width / 2;
      const centerY = box.originY + box.height / 2;
      return (
        centerX >= ball.originX &&
        centerX <= ball.originX + ball.width &&
        centerY >= ball.originY &&
        centerY <= ball.originY + ball.height
      );
    });
  }

  // track(box: BoundingBox, phash: string) {
  //   this.iter++;

  //   const range: INode = {
  //     minX: box.originX,
  //     minY: box.originY,
  //     maxX: box.originX + box.width,
  //     maxY: box.originY + box.height,
  //     phash,
  //   };

  //   const nearestTrack = {
  //     minDistance: Infinity,
  //     key: "",
  //   };
  //   Object.keys(this.tracks).forEach((key) => {
  //     const list = this.tracks[key];
  //     const distance = hammingDistance(list[list.length - 1].phash!, phash);
  //     if (distance < nearestTrack.minDistance) {
  //       nearestTrack.minDistance = distance;
  //       nearestTrack.key = key;
  //     }
  //   });

  //   if (nearestTrack.minDistance < 20) {
  //     this.tracks[nearestTrack.key].push(range);
  //   } else {
  //     this.tracks[Object.keys(this.tracks).length] = [range];
  //   }

  //   if (this.iter >= this.iterThreshold) {
  //     this.iter = 0;
  //     Object.keys(this.tracks).forEach((key) => {
  //       if (this.tracks[key].length <= 2) {
  //         delete this.tracks[key];
  //       }
  //     });
  //   }

  //   // console.log(this.tracks);
  // }

  // getTracks(): BoundingBox[][] {
  //   const tracks: BoundingBox[][] = [];
  //   Object.keys(this.tracks).forEach((key) => {
  //     const track = this.tracks[key];
  //     tracks.push(
  //       track.map((node) => {
  //         return {
  //           originX: node.minX,
  //           originY: node.minY,
  //           width: node.maxX - node.minX,
  //           height: node.maxY - node.minY,
  //           angle: 0,
  //         };
  //       })
  //     );
  //   });
  //   return tracks;
  // }

  isGoal(box: any): boolean {
    const rimBox = RimDetector.getInstance().getBestRim();
    const { originX: rimX, originY: rimY, width: rimW, height: rimH } = rimBox;
    const rimCenterX = rimX + rimW / 2;
    const rimCenterY = rimY + rimH / 2;
    const inWrongBall = this.isInWrongBall(box);
    if (inWrongBall) {
      return false;
    }
    const { originX, originY, width, height } = box;
    const averageWidth = (width + height) / 2;
    const ballArea = width * height;
    let isBallContainRimCenter = false;
    let isBallSmallerThanRim = false;
    let isIntersect = false;
    let intersectRatio = 0;
    if (averageWidth < rimW) {
      isBallSmallerThanRim = true;
    }
    if (
      originX < rimCenterX &&
      originX + width > rimCenterX &&
      originY < rimCenterY &&
      originY + height > rimCenterY
    ) {
      isBallContainRimCenter = true;
    }
    if (
      !(
        rimX > originX + width ||
        rimY > originY + height ||
        rimX + rimW < originX ||
        rimY + rimH < originY
      )
    ) {
      isIntersect = true;
    }
    if (isIntersect) {
      const minX = Math.max(originX, rimX);
      const minY = Math.max(originY, rimY);
      const maxX = Math.min(originX + width, rimX + rimW);
      const maxY = Math.min(originY + height, rimY + rimH);
      intersectRatio = ((maxX - minX) * (maxY - minY)) / ballArea;
    }

    box.isBallContainRimCenter = isBallContainRimCenter;
    box.isBallSmallerThanRim = isBallSmallerThanRim;
    box.isIntersect = isIntersect;
    box.intersectRatio = intersectRatio;
    this.curTrack.push(box);

    const relatedTrack: any[] = [];
    let maxRatio = -Infinity;
    let maxRatioIndex = -1;
    this.curTrack.forEach((track, index) => {
      if (
        track.isBallContainRimCenter &&
        track.isBallSmallerThanRim &&
        track.intersectRatio > maxRatio
      ) {
        maxRatio = track.intersectRatio;
        maxRatioIndex = index;
      }
    });

    if (maxRatioIndex >= 0) {
      relatedTrack.push(this.curTrack[maxRatioIndex]);

      let ind = maxRatioIndex + 1;
      while (ind < this.curTrack.length && ind <= maxRatioIndex + 1) {
        relatedTrack.push(this.curTrack[ind]);
        ind++;
      }

      ind = maxRatioIndex - 1;
      while (ind >= 0 && ind >= maxRatioIndex - 1) {
        relatedTrack.unshift(this.curTrack[ind]);
        ind--;
      }
    }

    // if goal, clear
    if (relatedTrack.length > 1) {
      // 如果只有一个点，无法判断
      // 趋势是否向下
      const isDownward = relatedTrack.every((track, index) => {
        if (index === 0) return true;
        return track.originY > relatedTrack[index - 1].originY;
      });
      if (isDownward) {
        this.curTrack = [];
        return true;
      }
    }

    if (this.curTrack.length > 10) {
      this.curTrack.shift();
    }

    return false;
  }

  getCurTrack(): BoundingBox[] {
    return this.curTrack;
  }
}

function hammingDistance(hash1: string, hash2: string) {
  // 首先检查哈希值长度是否相等
  if (hash1.length !== hash2.length) {
    throw new Error("Hashes must be of the same length");
  }

  let distance = 0;

  // 遍历哈希值的每一位，比较是否相同
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }

  return distance;
}

function countThreshold(round: number): number {
  return 2 * Math.log(round + 1);
}
