import { FaceLandMarker } from "./face-land-marker";
import { GestureRecognition } from "./gesture-recognition";
import { PoseLandMarker } from "./pose-land-marker";
import { HandLandMarker } from "./hand-land-marker";
import { ObjectDetection } from "./object-detection";

type ValueOf<T> = T[keyof T];

export const ModelList = {
  [ObjectDetection.name]: ObjectDetection,
  [FaceLandMarker.name]: FaceLandMarker,
  [PoseLandMarker.name]: PoseLandMarker,
  [HandLandMarker.name]: HandLandMarker,
};

const modelInstance: Record<
  string,
  PoseLandMarker | FaceLandMarker | HandLandMarker | ObjectDetection
> = {};

let modelName: string = PoseLandMarker.name;

export async function getModelIns() {
  if (!modelInstance[modelName]) {
    modelInstance[modelName] = new ModelList[modelName]();
    await modelInstance[modelName].init();
  }
  return modelInstance[modelName];
}

export function getModelName() {
  return modelName;
}

export function setModelName(name: string) {
  if (Object.keys(ModelList).includes(name)) {
    modelName = name;
  } else {
    console.error("未知模型名");
  }
}
