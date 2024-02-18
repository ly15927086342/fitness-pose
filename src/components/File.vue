<template>
  <v-progress-linear :active="loading" :indeterminate="loading" absolute bottom
    color="deep-purple-accent-4"></v-progress-linear>
  <v-col cols="12" sm="8">
    <div style="display: flex;flex-direction: row;">
      <v-file-input label="File input" :accept="type === 'VIDEO' ? 'video/*' : 'image/*'" :multiple="false"
        @update:model-value="updateFile"></v-file-input>
      <v-btn style="margin-left: 10px;" icon="mdi-video" @click="webcam"></v-btn>
    </div>
    <video ref="input_video" class="input_video" src="" controls playsinline></video>
    <img ref="input_image" class="input_image" src="" />
    <v-row>
      <v-col v-show="type === 'VIDEO'" cols="12" sm="6">
        <v-radio-group v-model="loadType" inline>
          <v-radio v-for="item in loadTypeList" :key="item" :label="item" :value="item"></v-radio>
        </v-radio-group>
      </v-col>
      <v-col v-show="type === 'VIDEO'" cols="12" sm="2">
        <v-text-field v-model="ratio" label="速率"></v-text-field>
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn block @click="beginOrEndDetect">{{ isWorking ? '结束识别' : '开始识别' }}</v-btn>
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn v-show="type === 'IMAGE'" @click="downloadImg" :disabled="!allowDownload">下载图片</v-btn>
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn v-show="type === 'VIDEO' && loadType === 'GIF'" @click="downloadGif"
          :disabled="!allowDownload">下载GIF</v-btn>
        <v-btn v-show="type === 'VIDEO' && loadType === 'WEBM'" @click="downloadWebm"
          :disabled="!allowDownload">下载视频</v-btn>
      </v-col>
    </v-row>
    <canvas ref="output_canvas" class="output_canvas"></canvas>
  </v-col>
</template>

<script>
import { getModelIns } from '../model';

let lastVideoTime = -1;

export default {
  name: 'File',
  data() {
    return {
      type: 'VIDEO',
      loading: false,
      allowDownload: false,
      isWorking: false,
      mediaStream: null,
      gif: null,
      mediaRecorder: null,
      loadTypeList: ['GIF', 'WEBM'],
      loadType: 'WEBM',
      webm: '',
      ratio: 1,
    }
  },
  mounted() {
    this.$refs.input_video.addEventListener("loadeddata", () => {
      const canvas = this.$refs.output_canvas;
      canvas.setAttribute("width", this.$refs.input_video.videoWidth + "px");
      canvas.setAttribute("height", this.$refs.input_video.videoHeight + "px");
    });
    this.$refs.input_image.addEventListener("load", () => {
      const canvas = this.$refs.output_canvas;
      canvas.setAttribute("width", this.$refs.input_image.naturalWidth + "px");
      canvas.setAttribute("height", this.$refs.input_image.naturalHeight + "px");
    });
  },
  methods: {
    async update() {
      const model = await getModelIns();
      const config = model.getOptions();
      this.type = config.runningMode;
    },
    updateFile(files) {
      if (files.length === 0) return;
      const file = files[0];
      const src = URL.createObjectURL(file);
      if (this.type === 'VIDEO') {
        this.$refs.input_video.src = src;
        this.$refs.input_video.load();
      } else if (this.type === 'IMAGE') {
        this.$refs.input_image.src = src;
      }
    },
    isReady() {
      if (this.type === 'VIDEO') {
        return this.$refs.input_video.readyState !== 0;
      } else if (this.type === 'IMAGE') {
        return this.$refs.input_image.complete;
      } else {
        return false;
      }
    },
    webcam() {
      const video = this.$refs.input_video;
      if (this.mediaStream?.active) {
        this.mediaStream.getTracks()[0].stop();
      } else {
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          video.srcObject = stream;
          this.mediaStream = stream;
        });
      }
    },
    async beginOrEndDetect() {
      if (!this.isReady()) return;
      this.isWorking = !this.isWorking;
      if (!this.isWorking) {
        this.allowDownload = true;
        lastVideoTime = -1;
        if (this.mediaRecorder?.state !== "inactive") {
          this.mediaRecorder?.stop();
        }
        return;
      }
      const model = await getModelIns();
      if (this.type === 'VIDEO') {
        this.$refs.input_video.playbackRate = this.ratio;
        this.$refs.input_video.play();
        if (this.loadType === 'GIF') {
          this.gif = new GIF({
            workers: 4,
            quality: 10,
            repeat: -1,
            transparent: 'black'
          });
          this.gif.on('finished', function (blob) {
            const gifImg = URL.createObjectURL(blob);
            const aLink = document.createElement('a');
            aLink.setAttribute('download', '识别结果');
            aLink.setAttribute('href', gifImg);
            aLink.click();
          });
        } else if (this.loadType === 'WEBM') {
          const stream = this.$refs.output_canvas.captureStream();
          const options = { mimeType: "video/webm; codecs=vp9" };
          this.mediaRecorder = new MediaRecorder(stream, options);
          this.mediaRecorder.ondataavailable = this.handleDataAvailable;
          this.mediaRecorder.start();
        }
        await this.loop();
      } else if (this.type === 'IMAGE') {
        const res = model.detect(this.$refs.input_image);
        await model.processResults(this.$refs.input_image, this.$refs.output_canvas, res);
        this.allowDownload = true;
      }
    },
    async loop() {
      if (!this.isWorking) return;
      const model = await getModelIns();
      const video = this.$refs.input_video;
      const canvas = this.$refs.output_canvas;
      let startTimeMs = performance.now();
      let videoTime = video.currentTime;
      if (lastVideoTime !== videoTime) {
        const res = model.detectForVideo(video, startTimeMs);
        await model.processVideoResults(video, canvas, res);
        if (this.loadType === 'GIF') {
          this.gif.addFrame(canvas, { copy: true, delay: lastVideoTime === -1 ? 0 : (videoTime - lastVideoTime) * 1000 });
        }
        lastVideoTime = videoTime;
      }
      requestAnimationFrame(() => {
        this.loop()
      });
    },
    downloadImg() {
      const el = document.createElement('a');
      // 设置 href 为图片经过 base64 编码后的字符串，默认为 png 格式
      el.href = this.$refs.output_canvas.toDataURL();
      el.download = '识别结果.png';

      // 创建一个点击事件并对 a 标签进行触发
      const event = new MouseEvent('click');
      el.dispatchEvent(event);
    },
    downloadGif() {
      this.gif.render();
    },
    downloadWebm() {
      const el = document.createElement('a');
      // 设置 href 为图片经过 base64 编码后的字符串，默认为 png 格式
      el.href = this.webm;
      el.download = '识别结果.webm';

      // 创建一个点击事件并对 a 标签进行触发
      const event = new MouseEvent('click');
      el.dispatchEvent(event);
      window.URL.revokeObjectURL(this.webm);
      this.webm = '';
    },
    handleDataAvailable(event) {
      if (event.data.size > 0) {
        const recordedChunks = [event.data];
        const blob = new Blob(recordedChunks, { type: "video/webm; codecs=vp9" });
        const url = URL.createObjectURL(blob);
        this.webm = url;
      }
    }
  }
}
</script>

<style scoped>
.input_video {
  display: none;
  /* width: 100%;
  height: 100%;
  max-height: 500px;
  border: 2px solid gray; */
}

.input_image {
  display: none;
}

.output_canvas {
  width: 100%;
  height: 100%;
  max-height: 500px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  margin-top: 10px;
}
</style>