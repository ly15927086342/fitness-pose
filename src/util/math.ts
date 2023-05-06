// import { NormalizedLandmark } from "@mediapipe/pose";
import { Point } from "./type";

export function genVector(a: Point, b: Point) {
  return [b.x - a.x, b.y - a.y, b.z - a.z];
}

export function lenVector(vecA: number[]) {
  return Math.sqrt(vecA.reduce((prev, curr) => prev + Math.pow(curr, 2), 0));
}

export function dotVector(vecA: number[], vecB: number[]) {
  return vecA.reduce((prev, curr, i) => prev + curr * vecB[i], 0);
}

export function angVector(vecA: number[], vecB: number[]) {
  const dot = dotVector(vecA, vecB);
  const lenA = lenVector(vecA);
  const lenB = lenVector(vecB);
  const angle = Math.acos(dot / (lenA * lenB));
  return angle;
}
