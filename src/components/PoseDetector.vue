<script>
// import { LandmarkGrid } from "@mediapipe/control_utils_3d";
// import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { VIDEO_STATUS, MODEL_STATUS } from "../constants";
import { Log, Media } from "../util";

let pose = new Pose({
  locateFile: (file) => {
    // return `https://ly15927086342.github.io/pose-count/pose/${file}`; // 加载本地文件
    // return `http://192.168.1.5:5173/pose/${file}`;
    return `${process.env.NODE_ENV === "production" ? import.meta.env.BASE_URL : "/"
      }pose/${file}`;
  },
});

let grid;

let log;

let rafId = 0;

let start = 0;

export default {
  name: "PoseDetector",
  data() {
    return {
      media: null,
      mediaState: "inactive",
      inputVideo: null,
      videoStatus: VIDEO_STATUS.PAUSE,
      modelStatus: MODEL_STATUS.OPEN,
      threshold: 50,
      btnList: "start",
    };
  },
  watch: {
    modelStatus(v) {
      if (this.videoStatus === VIDEO_STATUS.PLAY) {
        this.run();
      }
    },
  },
  mounted() {
    // this.$nextTick(() => {0
    this.inputVideo = this.$refs.input_video;
    this.addListener();
    // this.addLandMarkGrid();/
    // this.init();
    // });
  },
  beforeUnmount() {
    this.removeListener();
  },
  methods: {
    addLandMarkGrid() {
      const landmarkContainer = document.getElementsByClassName(
        "landmark-grid-container"
      )[0];
      // @ts-ignore
      grid = new LandmarkGrid(landmarkContainer, {
        isRotating: true,
        rotationSpeed: 0.01,
        // fovInDegree: 0.1,
        backgroundColor: 0x000000,
        axesColor: 0xcccccc,
        axesWidth: 1,
        centered: true,
        connectionColor: 0xffffff,
        connectionWidth: 10,
        definedColors: [],
        fitToGrid: true,
        labelPrefix: "",
        labelSuffix: "",
        landmarkSize: 2,
        landmarkColor: 0x00ffff,
        margin: 0,
        minVisibility: 0.65,
        nonvisibleLandmarkColor: 0xcc0000,
        numCellsPerAxis: 3,
        range: 1,
        showHidden: true, // 展示隐藏的connection node
      });
    },
    addListener() {
      this.inputVideo?.addEventListener("play", this.videoPlayCb);
      this.inputVideo?.addEventListener("pause", this.videoPauseCb);
      this.inputVideo?.addEventListener("ended", this.videoEndedCb);
      this.inputVideo?.addEventListener("loadeddata", this.init);
    },
    removeListener() {
      this.inputVideo?.removeEventListener("play", this.videoPlayCb);
      this.inputVideo?.removeEventListener("pause", this.videoPauseCb);
      this.inputVideo?.removeEventListener("ended", this.videoEndedCb);
      this.inputVideo?.removeEventListener("loadeddata", this.init);
    },
    videoPlayCb() {
      this.videoStatus = VIDEO_STATUS.PLAY;
      this.mediaState = this.media?.start();
      log = new Log("default", this.threshold);
      this.run();
    },
    videoPauseCb() {
      this.videoStatus = VIDEO_STATUS.PAUSE;
      this.mediaState = this.media?.pause();
      this.run();
      // log.print();
    },
    videoEndedCb() {
      this.videoStatus = VIDEO_STATUS.PAUSE;
      this.mediaState = this.media?.stop();
      this.media?.ctxClear();
      log.download();
      // grid.updateLandmarks([]);
      this.run();
    },
    init() {
      pose.setOptions({
        modelComplexity: 2,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(this.onResults);

      const video = document.getElementsByClassName("input_video")[0];
      const canvas = document.getElementsByClassName("output_canvas")[0];
      const poseContainer =
        document.getElementsByClassName("pose-container")[0];
      this.media?.ctxClear();
      this.media = new Media(
        { inputHeight: video.videoHeight, inputWidth: video.videoWidth },
        canvas,
        {
          height: poseContainer.clientHeight,
          width: poseContainer.clientWidth,
        }
      );
      // 清空grid
      // grid.updateLandmarks([]);
    },
    onResults(results) {
      if (!results.poseLandmarks) {
        return;
      }

      // 记录数据
      log.add(results.poseWorldLandmarks);
      // 录屏
      this.media?.drawResults(results);
      // 模型绘制
      // grid.updateLandmarks(results.poseWorldLandmarks, POSE_CONNECTIONS);
    },
    updateVideo(files) {
      if (files.length === 0) return;
      this.mediaState = this.media?.stop();
      this.videoStatus = VIDEO_STATUS.PAUSE;
      URL.revokeObjectURL(this.inputVideo.currentSrc);
      const file = files[0];
      this.inputVideo.src = URL.createObjectURL(file);
      this.inputVideo.load();
      this.run();
    },
    identify() {
      this.modelStatus = 1 - this.modelStatus;
    },
    record(type) {
      switch (type) {
        case "start":
          this.mediaState = this.media?.start();
          log = new Log("default", this.threshold);
          break;
        case "resume":
          this.mediaState = this.media?.resume();
          break;
        case "pause":
          this.mediaState = this.media?.pause();
          break;
        case "stop":
          this.mediaState = this.media?.stop();
          log.download();
          break;
        default:
          break;
      }
    },
    async run() {
      await this.runFrame(1000);
    },
    async runFrame(timestamp) {
      if (
        this.modelStatus === MODEL_STATUS.OPEN &&
        this.videoStatus === VIDEO_STATUS.PLAY
      ) {
        const realInterval = timestamp - start;
        if (realInterval > this.threshold) {
          start = timestamp;
          await pose.send({ image: this.inputVideo });
        }
        rafId = requestAnimationFrame(this.runFrame);
      } else {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
    validThreshold(val) {
      const num = Number(val);
      if (isNaN(num) || num < 16 || num > 1000) {
        this.threshold = 50;
        return "请输入16-1000以内的数字";
      }
      return "";
    },
  },
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="6">
        <v-file-input label="File input" accept="video/*" @update:model-value="updateVideo"></v-file-input>
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field v-model="threshold" label="采样间隔" placeholder="(毫秒)" :rules="[validThreshold]" validate-on="blur"
          required :disabled="mediaState !== 'inactive'"></v-text-field>
        <!-- <v-switch
          v-model="modelStatus"
          color="primary"
          :true-value="0"
          :false-value="1"
        ></v-switch> -->
      </v-col>
      <v-col cols="12" sm="3">
        <v-btn-toggle :divided="true" :border="true">
          <v-btn :disabled="mediaState !== 'inactive'" @click="record('start')">
            <v-icon color="red">mdi-circle</v-icon>
          </v-btn>
          <v-btn :disabled="mediaState !== 'recording'" @click="record('pause')">
            <v-icon color="gray">mdi-pause</v-icon>
          </v-btn>
          <v-btn :disabled="mediaState !== 'paused'" @click="record('resume')">
            <v-icon color="gray">mdi-play</v-icon>
          </v-btn>
          <v-btn :disabled="mediaState === 'inactive'" @click="record('stop')">
            <v-icon color="gray">mdi-square</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
    <v-row style="margin-top: 0">
      <v-col cols="12" sm="4" class="pa-2">
        <video ref="input_video" class="input_video" src="" controls></video>
      </v-col>
      <v-col cols="12" sm="8" class="pa-2">
        <div v-show="modelStatus === 0" class="pose-container">
          <canvas class="output_canvas"></canvas>
          <div class="landmark-grid-container"></div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  /* justify-content: center; */
}

.pose-container {
  position: relative;
  width: 100%;
  min-height: 500px;
  border: 2px solid gray;
  /* border-radius: 10px; */
}

.input_video {
  width: 100%;
  height: 100%;
  max-height: 500px;
  /* width: 400px;
  height: 300px; */
  border: 2px solid gray;
  /* border-radius: 10px; */
}

.landmark-grid-container {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 250px;
  height: 250px;
}

.left-bar {
  display: flex;
  flex-direction: column;
}

.media-button {
  display: flex;
  flex-direction: row;
}

.output_canvas {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.viewer-widget-js {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.viewer-widget-js .controls {
  position: absolute;
  bottom: 0;
  left: 0;
  cursor: pointer;
}

/* .viewer-widget-js .landmark-label-js {
  font-size: 50%;
  position: absolute;
  left: 0;
  top: 0;
} */

.viewer-widget-js * {
  user-select: none;
}

.viewer-widget-js:active {
  cursor: grabbing;
}
</style>
