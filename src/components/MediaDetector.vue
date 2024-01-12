<script>
// import { Camera } from "@mediapipe/camera_utils";
// import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { VIDEO_STATUS, MODEL_STATUS } from "../constants";
import { Log, Media, Speaker } from "../util";

let pose = new Pose({
  locateFile: (file) => {
    return `${
      process.env.NODE_ENV === "production" ? import.meta.env.BASE_URL : "/"
    }pose/${file}`; // 加载本地文件
    // return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  },
});

let camera;

let log;

export default {
  name: "MediaDetector",
  data() {
    return {
      media: null,
      mediaState: "inactive",
      inputVideo: null,
      videoStatus: VIDEO_STATUS.PAUSE,
      modelStatus: MODEL_STATUS.OPEN,
      threshold: 50,
      btnList: "start",
      countDown: 5,
    };
  },
  beforeUnmount() {
    this.removeListener();
  },
  mounted() {
    this.inputVideo = this.$refs.input_video_2;
    this.addCamera();
    this.addListener();
  },
  methods: {
    addListener() {
      this.inputVideo?.addEventListener("loadeddata", this.init);
    },
    removeListener() {
      this.inputVideo?.removeEventListener("loadeddata", this.init);
    },
    readyLog(t) {
      if (t === 0) {
        log = new Log("default", this.threshold, true);
      } else {
        Speaker.getInstance().stop();
        Speaker.getInstance()?.speak(t);
        setTimeout(() => {
          this.readyLog(t - 1);
        }, 1000);
      }
    },
    init() {
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(this.onResults);

      Speaker.getInstance()?.speak("请确保身体在镜头以内，倒计时");
      setTimeout(() => {
        this.readyLog(this.countDown);
      }, 3000);

      const video = document.getElementsByClassName("input_video_2")[0];
      const canvas = document.getElementsByClassName("output_canvas_2")[0];
      const poseContainer =
        document.getElementsByClassName("pose-container_2")[0];
      this.media?.ctxClear();
      this.media = new Media(
        { inputHeight: video.videoHeight, inputWidth: video.videoWidth },
        canvas,
        {
          height: poseContainer.clientHeight,
          width: poseContainer.clientWidth,
        }
      );
      this.mediaState = this.media?.start();
    },
    addCamera() {
      camera = new Camera(this.inputVideo, {
        onFrame: async () => {
          await pose.send({ image: this.inputVideo });
        },
        width: 800,
        height: 500,
      });
    },
    onResults(results) {
      if (!results.poseLandmarks) {
        return;
      }
      // 记录数据
      log?.add(results.poseWorldLandmarks);
      // 录屏
      this.media?.drawResults(results);
    },
    record(type) {
      switch (type) {
        case "start":
          camera.start();
          break;
        case "resume":
          this.mediaState = this.media?.resume();
          break;
        case "pause":
          this.mediaState = this.media?.pause();
          break;
        case "stop":
          this.mediaState = this.media?.stop();
          this.media?.ctxClear();
          camera.stop();
          Speaker.getInstance().stop();
          log?.download();
          break;
        default:
          break;
      }
    },
    validThreshold(val) {
      const num = Number(val);
      if (isNaN(num) || num < 30 || num > 1000) {
        this.threshold = 50;
        return "请输入30-1000以内的数字";
      }
      return "";
    },
  },
};
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="5">
        <v-btn-toggle :divided="true" :border="true">
          <v-btn :disabled="mediaState !== 'inactive'" @click="record('start')">
            <v-icon color="red">mdi-circle</v-icon>
          </v-btn>
          <v-btn
            :disabled="mediaState !== 'recording'"
            @click="record('pause')"
          >
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
      <v-col cols="12" sm="3">
        <v-text-field
          v-model="countDown"
          label="倒计时"
          placeholder="(秒)"
          required
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          v-model="threshold"
          label="采样间隔"
          placeholder="(毫秒)"
          :rules="[validThreshold]"
          validate-on="blur"
          required
          :disabled="mediaState !== 'inactive'"
        ></v-text-field>
        <!-- <v-switch
          v-model="modelStatus"
          color="primary"
          :true-value="0"
          :false-value="1"
        ></v-switch> -->
      </v-col>
      <v-col cols="12" sm="4"> </v-col>
    </v-row>
    <v-row style="margin-top: 0">
      <v-col cols="12" sm="4" class="pa-2">
        <video ref="input_video_2" class="input_video_2"></video>
      </v-col>
      <v-col cols="12" sm="8" class="pa-2">
        <div v-show="modelStatus === 0" class="pose-container_2">
          <canvas class="output_canvas_2"></canvas>
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
.pose-container_2 {
  position: relative;
  width: 100%;
  height: 500px;
  border: 2px solid gray;
  /* border-radius: 10px; */
}
.input_video_2 {
  width: 100%;
  height: 500px;
  /* width: 400px;
  height: 300px; */
  border: 2px solid gray;
  /* border-radius: 10px; */
}
.left-bar {
  display: flex;
  flex-direction: column;
}
.media-button {
  display: flex;
  flex-direction: row;
}
.output_canvas_2 {
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

.viewer-widget-js .landmark-label-js {
  font-size: 50%;
  position: absolute;
  left: 0;
  top: 0;
}

.viewer-widget-js * {
  user-select: none;
}

.viewer-widget-js:active {
  cursor: grabbing;
}
</style>
