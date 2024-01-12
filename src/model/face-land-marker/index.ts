import { MediaPipeModal } from "../base";
import { FaceLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

/**
 * @see https://developers.google.com/mediapipe/solutions/vision/face_landmarker
 */
export class FaceLandMarker extends MediaPipeModal {
  // 模型名
  static name = "FaceLandMarker";
  // 模型列表
  modelPath = ["/models/FaceLandMarker/face_landmarker.task"];
  // 模型参数
  params = [
    {
      name: "minFaceDetectionConfidence",
      type: "float",
      range: [0, 1],
      default: 0.5,
    },
    {
      name: "minFacePresenceConfidence",
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
      name: "numFaces",
      type: "integer",
      range: [0, 5],
      default: 1,
    },
    {
      name: "outputFaceBlendshapes",
      type: "boolean",
      range: [true, false],
      default: false,
    },
    {
      name: "outputFacialTransformationMatrixes",
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
  // 识别结果样式
  styleConfig = {
    FACE_LANDMARKS_TESSELATION: { color: "#C0C0C070", lineWidth: 1 },
    FACE_LANDMARKS_RIGHT_EYE: { color: "#FF3030" },
    FACE_LANDMARKS_RIGHT_EYEBROW: { color: "#FF3030" },
    FACE_LANDMARKS_LEFT_EYE: { color: "#30FF30" },
    FACE_LANDMARKS_LEFT_EYEBROW: { color: "#30FF30" },
    FACE_LANDMARKS_FACE_OVAL: { color: "#E0E0E0" },
    FACE_LANDMARKS_LIPS: { color: "#E0E0E0" },
    FACE_LANDMARKS_RIGHT_IRIS: { color: "#FF3030" },
    FACE_LANDMARKS_LEFT_IRIS: { color: "#30FF30" },
  };

  constructor() {
    super();
    this.model = FaceLandmarker;
    const storage = localStorage.getItem(FaceLandMarker.name);
    this.styleConfig = storage ? JSON.parse(storage) : this.styleConfig;
  }

  processResults(
    image: HTMLImageElement | HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: any
  ) {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image!, 0, 0, canvas.width, canvas.height);
    const drawingUtils = new DrawingUtils(ctx);
    for (const landmarks of res.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        this.styleConfig.FACE_LANDMARKS_TESSELATION
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        this.styleConfig.FACE_LANDMARKS_RIGHT_EYE
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        this.styleConfig.FACE_LANDMARKS_RIGHT_EYEBROW
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        this.styleConfig.FACE_LANDMARKS_LEFT_EYE
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        this.styleConfig.FACE_LANDMARKS_LEFT_EYEBROW
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        this.styleConfig.FACE_LANDMARKS_FACE_OVAL
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        this.styleConfig.FACE_LANDMARKS_LIPS
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        this.styleConfig.FACE_LANDMARKS_RIGHT_IRIS
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        this.styleConfig.FACE_LANDMARKS_LEFT_IRIS
      );
    }
    // drawBlendShapes(imageBlendShapes, faceLandmarkerResult.faceBlendshapes);
  }

  processVideoResults(
    video: HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: any
  ) {
    this.processResults(video, canvas, res);
  }
}
