import { MediaPipeModal } from "../base";
import { DrawingUtils, GestureRecognizer } from "@mediapipe/tasks-vision";

/**
 * @see https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer
 */
export class GestureRecognition extends MediaPipeModal {
  static name = "GestureRecognition";
  modelPath = ["/models/GestureRecognition/gesture_recognizer.task"];
  params = [
    {
      name: "min_hand_detection_confidence",
      type: "float",
      range: [0, 1],
      default: 0.5,
    },
    {
      name: "min_hand_presence_confidence",
      type: "float",
      range: [0, 1],
      default: 0.5,
    },
    {
      name: "min_tracking_confidence",
      type: "float",
      range: [0, 1],
      default: 0.5,
    },
    {
      name: "num_hands",
      type: "integer",
      range: [1, 10],
      default: 2,
    },
    // {
    //   name: "outputFaceBlendshapes",
    //   type: "boolean",
    //   range: [true, false],
    //   default: false,
    // },
    // {
    //   name: "outputFacialTransformationMatrixes",
    //   type: "boolean",
    //   range: [true, false],
    //   default: false,
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
  constructor() {
    super();
    this.model = GestureRecognizer;
  }

  detect(image: HTMLImageElement) {
    return this._modelInstance.recognize(image);
  }

  detectForVideo(video: HTMLVideoElement, timestamp: number) {
    return this._modelInstance.recognizeForVideo(video, timestamp);
  }

  processResults(
    image: HTMLImageElement | undefined,
    canvas: HTMLCanvasElement,
    res: any
  ) {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawingUtils = new DrawingUtils(ctx);
    for (const landmarks of res.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 1,
      });
    }
  }

  processVideoResults(
    video: HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: any
  ) {
    this.processResults(undefined, canvas, res);
  }
}
