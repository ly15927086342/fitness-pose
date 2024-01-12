import { MediaPipeModal } from "../base";
import {
  ObjectDetector,
  ObjectDetectorResult,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

/**
 * @see https://developers.google.com/mediapipe/solutions/vision/object_detector/web_js
 */
export class ObjectDetection extends MediaPipeModal {
  static name = "ObjectDetection";
  modelPath = [
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
      default: 0.1,
    },
    {
      name: "categoryAllowlist",
      type: "unknown",
      range: [0, 1],
      default: ["sports ball"],
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

  constructor() {
    super();
    this.model = ObjectDetector;
    const storage = localStorage.getItem(ObjectDetection.name);
    this.styleConfig = storage ? JSON.parse(storage) : this.styleConfig;
  }

  processResults(
    image: HTMLImageElement | HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: ObjectDetectorResult
  ) {
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "red";
    ctx.font = "30px serif";
    ctx.fillStyle = "red";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image!, 0, 0, canvas.width, canvas.height);
    const { detections } = res;
    detections.forEach((detection, index) => {
      const { categories, boundingBox, keypoints } = detection;
      const { width, height, originX, originY, angle } = boundingBox!;
      ctx.strokeRect(originX, originY, width, height);
      ctx.fillText(categories[0].categoryName, originX, originY + height);
    });
  }

  processVideoResults(
    video: HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: ObjectDetectorResult
  ) {
    this.processResults(video, canvas, res);
  }
}
