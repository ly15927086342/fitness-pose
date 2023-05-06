// import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
// import { POSE_CONNECTIONS } from "@mediapipe/pose";
import { eventEmitter } from "./eventEmitter";
import { DOWNLOAD_URL } from "../constants/event";

export class Media {
  canvas;

  ctx;

  mediaRecorder;

  ctxClear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  constructor(
    input,
    canvas,
    option
  ) {
    this.canvas = canvas;
    const { height, width } = option;
    const { inputHeight, inputWidth } = input;
    const canvasWidth = width;
    const canvasHeight = height;
    const inputRatio = inputWidth / inputHeight;
    const canvasRatio = width / height;

    if (inputHeight > 0 && inputWidth > 0) {
      if (inputRatio < canvasRatio) {
        this.canvas.width = (canvasHeight / inputHeight) * inputWidth;
        this.canvas.height = canvasHeight;
      } else {
        this.canvas.height = (canvasWidth / inputWidth) * inputHeight;
        this.canvas.width = canvasWidth;
      }
    } else {
      this.canvas.height = height;
      this.canvas.width = width;
    }
    this.ctx = this.canvas.getContext("2d");
    const stream = this.canvas.captureStream();
    const options = { mimeType: "video/webm; codecs=vp9" };
    this.mediaRecorder = new MediaRecorder(stream, options);
    this.handleDataAvailable = this.handleDataAvailable.bind(this);
    this.mediaRecorder.ondataavailable = this.handleDataAvailable;
  }

  drawResults(results) {
    const canvasElement = this.canvas;
    const canvasCtx = this.ctx;

    canvasCtx.save();
    this.ctxClear();

    // canvasCtx.drawImage(
    //   results.segmentationMask,
    //   0,
    //   0,
    //   canvasElement.width,
    //   canvasElement.height
    // );

    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = "source-in";
    canvasCtx.fillStyle = "#00FF00";
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = "destination-atop";
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    canvasCtx.globalCompositeOperation = "source-over";
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#FFFFFF",
      radius: 1,
    });
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: "#00FFFF",
      lineWidth: 1,
    });
    // console.log(results.poseLandmarks)
    canvasCtx.restore();
  }

  start() {
    if (this.mediaRecorder.state === "inactive") {
      this.mediaRecorder.start();
    }
    return this.mediaRecorder.state;
  }

  stop() {
    if (this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    return this.mediaRecorder.state;
  }

  pause() {
    if (this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
    }
    return this.mediaRecorder.state;
  }

  resume() {
    if (this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
    }
    return this.mediaRecorder.state;
  }

  state() {
    return this.mediaRecorder.state;
  }

  handleDataAvailable(event) {
    if (event.data.size > 0) {
      const recordedChunks = [event.data];
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      eventEmitter.emit(DOWNLOAD_URL, url);
      // window.URL.revokeObjectURL(url);
    }
  }
}
