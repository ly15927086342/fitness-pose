import { MediaPipeModal } from "../base";
import { HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

/**
 * @see https://developers.google.com/mediapipe/solutions/vision/face_landmarker
 */
export class HandLandMarker extends MediaPipeModal {
  static name = "HandLandMarker";
  modelPath = ["/models/HandLandMarker/hand_landmarker.task"];
  params = [
    {
      name: "minHandDetectionConfidence",
      type: "float",
      range: [0, 1],
      default: 0.5,
    },
    {
      name: "minHandPresenceConfidence",
      type: "float",
      range: [0, 1],
      default: 0.5,
    },
    {
      name: "minTrackingConfidence",
      type: "float",
      range: [0, 1],
      default: 0.5,
    },
    {
      name: "numHands",
      type: "integer",
      range: [1, 10],
      default: 2,
    },
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
    this.model = HandLandmarker;
    const storage = localStorage.getItem(HandLandMarker.name);
    this.styleConfig = storage ? JSON.parse(storage) : this.styleConfig;
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
        HandLandmarker.HAND_CONNECTIONS,
        this.styleConfig.HAND_CONNECTIONS
      );
      drawingUtils.drawLandmarks(landmarks, this.styleConfig.LANDMARKER);
    }
    // drawBlendShapes(imageBlendShapes, HandLandMarkerResult.faceBlendshapes);
  }

  processVideoResults(
    video: HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: any
  ) {
    this.processResults(undefined, canvas, res);
  }
}
