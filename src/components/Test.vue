<script >
// import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { MODEL_STATUS } from "../constants";
import { Log, Media } from "../util";

let pose = new Pose({
  locateFile: (file) => {
    return `${
      process.env.NODE_ENV === "production" ? import.meta.env.BASE_URL : "/"
    }pose/${file}`; // 加载本地文件
    // return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  },
});

let log;

export default {
  name: "MediaDetector",
  data() {
    return {
      media: null,
      mediaState: "inactive",
      inputImage: null,
      modelStatus: MODEL_STATUS.OPEN,
      threshold: 50,
      btnList: "start",
    };
  },
  watch: {},
  mounted() {
    this.inputImage = this.$refs.input_image;
    this.addListener();
  },
  beforeUnmount() {
    this.removeListener();
  },
  methods: {
    addListener() {
      this.inputImage?.addEventListener("load", this.init);
    },
    removeListener() {
      this.inputImage?.removeEventListener("load", this.init);
    },
    init() {
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.7,
      });
      pose.onResults(this.onResults);

      log = new Log("default");

      const image = document.getElementsByClassName("input_image")[0];
      const canvas = document.getElementsByClassName("output_canvas_3")[0];
      const poseContainer =
        document.getElementsByClassName("pose-container_3")[0];
      this.media?.ctxClear();
      this.media = new Media(
        { inputHeight: image.height, inputWidth: image.width },
        canvas,
        {
          height: poseContainer.clientHeight,
          width: poseContainer.clientWidth,
        }
      );
      pose.send({ image: this.inputImage });
      // console.log(this.inputImage);
    },
    onResults(results) {
      if (!results.poseLandmarks) {
        return;
      }
      // 记录数据
      log.add(results.poseWorldLandmarks);
      // 录屏
      this.media?.drawResults(results);
    },
    updateImage(files) {
      if (files.length === 0) return;
      const file = files[0];
      this.inputImage.src = URL.createObjectURL(file);
    },
  },
};
</script>

<template>
  <v-container>
    <v-row>
      <v-file-input
        label="File input"
        accept="image/*"
        @update:model-value="updateImage"
      ></v-file-input>
    </v-row>
    <v-row style="margin-top: 0">
      <v-col cols="12" sm="4" class="pa-2">
        <div class="img-container">
          <img ref="input_image" class="input_image" src="" />
        </div>
      </v-col>
      <v-col cols="12" sm="8" class="pa-2">
        <div v-show="modelStatus === 0" class="pose-container_3">
          <canvas class="output_canvas_3"></canvas>
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
.pose-container_3 {
  position: relative;
  width: 100%;
  height: 500px;
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
.output_canvas_3 {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.img-container {
  width: 100%;
  height: 100%;
  max-height: 500px;
  /* width: 400px;
  height: 300px; */
  border: 2px solid gray;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.input_image {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}
</style>
