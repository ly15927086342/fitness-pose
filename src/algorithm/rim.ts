/**
 * 篮筐特征：
 * 1. 静止不动
 * 2. 重叠越多，为真实篮筐的概率越大
 * 3. 和篮球压盖越多，为真实篮筐的概率越大
 * 4. 篮筐的淘汰机制
 * 4.1 两面压盖超90%，直接提取压盖范围作为新面，并继承之前的频次，删除两个旧面
 * 4.2 面面压盖超50%，低于90%，
 * 4.3 迭代固定次数，淘汰频次最低的面
 */

import { BoundingBox } from "@mediapipe/tasks-vision";
import RBush from "rbush";
import { INode } from "./type";

export class RimDetector {
  _tree: RBush<any>;

  iter: number = 0;

  iterThreshold: number = 50;

  static instance: RimDetector;

  constructor() {
    this._tree = new RBush();
  }

  static getInstance() {
    if (!RimDetector.instance) {
      RimDetector.instance = new RimDetector();
    }
    return RimDetector.instance;
  }

  fit(box: BoundingBox) {
    this.iter++;

    const range: INode = {
      minX: box.originX,
      minY: box.originY,
      maxX: box.originX + box.width,
      maxY: box.originY + box.height,
    };
    const rangeArea = box.width * box.height;
    const intersectList = this._tree.search(range);
    if (intersectList.length === 0) {
      this._tree.insert({ ...range, count: 1 });
    } else {
      let maxArea = -Infinity;
      const bestIntersectBox = { ...intersectList[0] };
      // 求相交矩形
      const intersectBox: INode = intersectList.reduce((prev, curr) => {
        const minX = Math.max(range.minX, curr.minX);
        const minY = Math.max(range.minY, curr.minY);
        const maxX = Math.min(range.maxX, curr.maxX);
        const maxY = Math.min(range.maxY, curr.maxY);
        const area = (maxX - minX) * (maxY - minY);
        if (area > maxArea) {
          maxArea = area;
          bestIntersectBox.minX = minX;
          bestIntersectBox.minY = minY;
          bestIntersectBox.maxX = maxX;
          bestIntersectBox.maxY = maxY;
          return curr;
        } else {
          return prev;
        }
      }, {});
      const intersectBoxArea =
        (intersectBox.maxX - intersectBox.minX) *
        (intersectBox.maxY - intersectBox.minY);
      const areaRatio1 = maxArea / intersectBoxArea;
      const areaRatio2 = maxArea / rangeArea;
      // console.log(areaRatio);
      // 4.1
      if (areaRatio1 > 0.9 && areaRatio2 > 0.9) {
        this._tree.remove(intersectBox);
        this._tree.insert({
          ...bestIntersectBox,
          count: intersectBox.count! + 1,
        });
      }
    }

    // 4.3
    if (this.iter >= this.iterThreshold) {
      this.iter = 0;
      const allList = this._tree.all();
      if (allList.length === 1) return;
      const minCountNode = allList.reduce(
        (prev, curr) => (prev.count < curr.count ? prev : curr),
        { count: Infinity }
      );
      this._tree.remove(minCountNode);
    }
  }

  getBestRim(): BoundingBox {
    const allList = this._tree.all();
    const maxCountNode = allList.reduce(
      (prev, curr) => (prev.count > curr.count ? prev : curr),
      { count: -Infinity }
    );
    return {
      originX: maxCountNode.minX,
      originY: maxCountNode.minY,
      width: maxCountNode.maxX - maxCountNode.minX,
      height: maxCountNode.maxY - maxCountNode.minY,
      angle: 0,
    };
  }
}
