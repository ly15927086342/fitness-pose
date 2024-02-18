import { Image as ImageJS } from "image-js";
import { RimDetector } from "./rim";
import uniq from "lodash-es/uniq";

/**
 * 参考：https://www.mi-research.net/article/doi/10.1007/s11633-020-1259-7
 */
export class BallDetector2 {
  static instance: BallDetector2;

  baseImage?: ImageJS;

  guassianRadius = 3;

  left: number = 0;

  top: number = 0;

  width: number = 0;

  height: number = 0;

  dx: number[] = [-1, 0, 1, 0];

  dy: number[] = [0, -1, 0, 1];

  pointlist: Point[][] = [];

  startRecord: boolean = false;

  goal: number[] = [];

  shoot: number = 0;

  constructor() {}

  static getInstance() {
    if (!BallDetector2.instance) {
      BallDetector2.instance = new BallDetector2();
    }
    return BallDetector2.instance;
  }

  async fit(
    image: HTMLImageElement | HTMLVideoElement,
    ctx: CanvasRenderingContext2D
  ) {
    if (!this.width) {
      // 确定识别范围
      const { originX, originY, width, height } =
        RimDetector.getInstance().getBestRim();
      this.left = originX - width / 2;
      this.top = originY - height / 2;
      this.width = width * 2;
      this.height = height * 2;
    }
    var newCanvas = document.createElement("canvas");
    newCanvas.width = this.width;
    newCanvas.height = this.height;
    const ctxNew = newCanvas.getContext("2d")!;
    // 将原始Canvas上的指定矩形区域绘制到新Canvas上
    ctxNew.drawImage(
      image!,
      this.left,
      this.top,
      this.width,
      this.height,
      0,
      0,
      this.width,
      this.height
    );

    let rawBlob: Blob | null = null;
    await new Promise((resolve) => {
      newCanvas.toBlob((blob) => {
        rawBlob = blob;
        resolve(blob);
      });
    });
    const buffer = await rawBlob!.arrayBuffer();
    const image2 = await ImageJS.load(buffer!);
    if (!this.baseImage) {
      const cur = image2.grey().gaussianFilter({ radius: this.guassianRadius });
      // 全黑的图片跳过
      if (cur.getMean()[0] === 0) {
        return;
      } else {
        this.baseImage = cur;
      }
    } else {
      // 转灰度
      const grey = image2.grey();
      // 高斯模糊，去噪
      const noNoise = grey.gaussianFilter({ radius: this.guassianRadius });
      // 求灰度差
      const diff = noNoise.subtractImage(this.baseImage, {
        absolute: true,
      });
      // 二值化
      for (let i = 0; i < diff.data.length; i++) {
        // 默认otsu阈值法，方差最大
        const threshold = 20;
        if (diff.data[i] > threshold) {
          diff.data[i] = 255;
        } else {
          diff.data[i] = 0;
        }
      }
      // 连通域分析
      this.seedGrowth(diff.data as unknown as number[]);
      if (this.pointlist.length > 0) {
        // 找出最大的斑块，认为是篮球
        this.pointlist.sort((a, b) => b.length - a.length);
        const info = this.getAreaInfo(this.pointlist[0]);
        const { originX, originY, width, height } =
          RimDetector.getInstance().getBestRim();
        // 穿过篮筐上边缘条件
        if (
          info.minY + this.top < originY &&
          info.maxY + this.top > originY &&
          info.minX + this.left > originX &&
          info.maxX + this.left < originX + width
        ) {
          this.startRecord = true;
          this.goal = [1];
        }

        // 经过篮筐中心点条件
        // if (
        //   this.startRecord &&
        //   info.minY + this.top < originY + height / 2 &&
        //   info.maxY + this.top > originY + height / 2 &&
        //   info.minX + this.left < originX + width / 2 &&
        //   info.maxX + this.left > originX + width / 2
        // ) {
        //   this.goal.push(2);
        // }

        // 穿过篮筐下边缘条件
        if (
          this.startRecord &&
          info.minY + this.top < originY + height &&
          info.maxY + this.top > originY + height &&
          info.minX + this.left > originX &&
          info.maxX + this.left < originX + width
        ) {
          this.startRecord = false;
          this.goal.push(3);
        }
        if (this.checkIsGoal()) {
          this.shoot++;
        }
      }
      // ctx.drawImage(diff.getCanvas(), this.left, this.top);
    }
  }

  getShoot() {
    return this.shoot;
  }

  checkIsGoal() {
    const res = uniq(this.goal);
    if (res[0] === 1 && res[1] === 3) {
      this.goal = [];
      return true;
    }
    console.log(res)
    return false;
  }

  getAreaInfo(pList: Point[]) {
    const avg = [0, 0];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    pList.forEach((p) => {
      // diff.data[p.y * this.width + p.x] = 255;
      avg[0] += p.x;
      avg[1] += p.y;
      if (p.x < minX) {
        minX = p.x;
      } else if (p.x > maxX) {
        maxX = p.x;
      }
      if (p.y < minY) {
        minY = p.y;
      } else if (p.y > maxY) {
        maxY = p.y;
      }
    });
    avg[0] /= pList.length;
    avg[1] /= pList.length;
    return {
      minX,
      minY,
      maxX,
      maxY,
      avg,
    };
    // diff.data[avg[1] * this.width + avg[0]] = 100;
  }

  // CCA 连通域分析
  seedGrowth(data: number[]) {
    this.pointlist = [];
    let count = 0;
    //按顺序找种子点
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        if (data[i * this.width + j] !== 255) {
          continue;
        }
        this.pointlist.push(this.areaGrow(data, j, i));
        count++;
      }
    }
    return count;
  }

  areaGrow(output: number[], seedx: number, seedy: number) {
    const pointstack: Point[] = []; //存储待生长的种子
    const plist: Point[] = [];

    let current_x, current_y; //当前正在处理的中心像素点
    let lin_x, lin_y; //邻域待判断像素点

    const p = new Point(seedx, seedy);
    pointstack.push(p);
    plist.push(p);

    while (pointstack.length > 0) {
      const top = pointstack.pop()!;
      current_x = top.x;
      current_y = top.y;

      output[current_y * this.width + current_x] = 0;

      for (let k = 0; k < 4; k++) {
        lin_x = current_x + this.dx[k];
        lin_y = current_y + this.dy[k];
        //判断是否超界
        if (
          lin_x < this.width &&
          lin_x >= 0 &&
          lin_y < this.height &&
          lin_y >= 0
        ) {
          if (output[lin_y * this.width + lin_x] === 255) {
            //若点无归属，则压入栈
            const p = new Point(lin_x, lin_y);
            pointstack.push(p);
            plist.push(p);
            output[lin_y * this.width + lin_x] = 0; //点设置为有归属，不再判断该点
          }
        }
      }
    }
    return plist;
  }
}

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
