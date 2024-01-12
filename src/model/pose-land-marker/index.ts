import { MediaPipeModal } from "../base";
import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";

/**
 * @see https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 */
export class PoseLandMarker extends MediaPipeModal {
  static name = "PoseLandMarker";
  modelPath = [
    "/models/PoseLandMarker/pose_landmarker_full.task",
    "/models/PoseLandMarker/pose_landmarker_heavy.task",
    "/models/PoseLandMarker/pose_landmarker_lite.task",
  ];
  params = [
    {
      name: "minPoseDetectionConfidence",
      type: "float",
      range: [0, 1],
      default: 0.5,
    },
    {
      name: "minPosePresenceConfidence",
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
      name: "numPoses",
      type: "integer",
      range: [0, 5],
      default: 1,
    },
    {
      name: "outputSegmentationMasks",
      type: "boolean",
      range: [true, false],
      default: false,
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
    POSE_CONNECTIONS: {
      color: "#FF0000",
    },
  };
  constructor() {
    super();
    this.model = PoseLandmarker;
    const storage = localStorage.getItem(PoseLandMarker.name);
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
    for (const landmark of res.landmarks) {
      drawingUtils.drawLandmarks(landmark, {
        radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1),
        color: "#00FF00",
      });
      drawingUtils.drawConnectors(
        landmark,
        PoseLandmarker.POSE_CONNECTIONS,
        this.styleConfig.POSE_CONNECTIONS
      );
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
