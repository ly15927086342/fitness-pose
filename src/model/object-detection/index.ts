import { BallDetector, BallDetector2, RimDetector } from "../../algorithm";
import { MediaPipeModal } from "../base";
import ImageJS from "image-js";
import {
  ObjectDetector,
  ObjectDetectorResult,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

let goal = 0;

let timeout: number = 0;

/**
 * @see https://developers.google.com/mediapipe/solutions/vision/object_detector/web_js
 */
export class ObjectDetection extends MediaPipeModal {
  static name = "ObjectDetection";
  modelPath = [
    "/models/ObjectDetection/model.tflite",
    "/models/ObjectDetection/efficientdet_lite0.tflite",
    "/models/ObjectDetection/efficientdet_lite2.tflite",
  ];
  params = [
    {
      name: "maxResults",
      type: "integer",
      range: [-1, 10],
      default: -1,
    },
    {
      name: "scoreThreshold",
      type: "float",
      range: [0, 1],
      default: 0.2,
    },
    {
      name: "categoryAllowlist",
      type: "unknown",
      range: [0, 1],
      default: ["ball", "rim"],
    },
    // {
    //   name: "categoryDenylist",
    //   type: "integer",
    //   range: [1, 10],
    //   default: 2,
    // },
    {
      name: "modelAssetPath",
      type: "enum",
      range: this.modelPath,
      default: this.modelPath[0],
    },
    {
      name: "runningMode",
      type: "enum",
      range: ["IMAGE", "VIDEO"],
      default: "VIDEO",
    },
  ];
  styleConfig = {
    HAND_CONNECTIONS: {
      color: "#00FF00",
      lineWidth: 5,
    },
    LANDMARKER: {
      color: "#FF0000",
      lineWidth: 1,
    },
  };

  isReady: boolean = false;

  constructor() {
    super();
    this.model = ObjectDetector;
    const storage = localStorage.getItem(ObjectDetection.name);
    this.styleConfig = storage ? JSON.parse(storage) : this.styleConfig;
  }

  async processResults(
    image: HTMLImageElement | HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: ObjectDetectorResult
  ) {
    const ctx = canvas.getContext("2d")!;
    ctx.font = "20px serif";
    ctx.fillStyle = "red";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image!, 0, 0, canvas.width, canvas.height);
    const { detections } = res;
    let rimDetected = false;

    detections.forEach((detection) => {
      const { categories, boundingBox, keypoints } = detection;
      const { width, height, originX, originY, angle } = boundingBox!;
      if (categories[0].categoryName === "rim") {
        if (rimDetected) return;
        rimDetected = true;
        RimDetector.getInstance().fit(boundingBox!);
      }
    });

    // rim
    const rect = RimDetector.getInstance().getBestRim();
    ctx.strokeStyle = "red";
    const { width, height, originX, originY } = rect;
    ctx.strokeRect(originX, originY, width, height);
    ctx.fillText(
      "goal: " + BallDetector2.getInstance().getShoot(),
      originX,
      originY - 20
    );
    // ctx.moveTo(originX + width / 2, originY + height / 2);
    // ctx.arc(originX + width / 2, originY + height / 2, 5, 0, 2 * Math.PI);
    ctx.stroke();

    // 准备3秒
    if (!this.isReady && !timeout) {
      timeout = setTimeout(() => {
        this.isReady = true;
        clearTimeout(timeout);
      }, 10000);
    }

    if (this.isReady) {
      await BallDetector2.getInstance().fit(image!, ctx);
    }
  }

  processVideoResults(
    video: HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: ObjectDetectorResult
  ) {
    this.processResults(video, canvas, res);
  }
}
