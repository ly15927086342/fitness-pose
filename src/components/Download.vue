<script>
import { eventEmitter } from "../util";
import { DOWNLOAD_URL, DOWNLOAD_TXT_URL } from "../constants";

export default {
  name: "Download",
  data() {
    return {
      downloads: [],
      txtDownloads: [],
    };
  },
  mounted() {
    eventEmitter.on(DOWNLOAD_URL, this.downloadCb);
    eventEmitter.on(DOWNLOAD_TXT_URL, this.downloadTxtCb);
  },
  beforeDestroy() {
    eventEmitter.off(DOWNLOAD_URL, this.downloadCb);
    eventEmitter.off(DOWNLOAD_TXT_URL, this.downloadTxtCb);
  },
  methods: {
    downloadCb(url) {
      this.downloads.push(url);
    },
    downloadTxtCb(url) {
      this.txtDownloads.push(url);
    },
  },
};
</script>

<template>
  <v-navigation-drawer location="right">
    <v-list>
      <v-list-item title="视频下载列表">
        <a
          v-for="(url, index) in downloads"
          :key="index"
          :href="url"
          download="pose.webm"
          >视频{{ index + 1 }}</a
        >
        <div v-show="downloads.length === 0">空</div>
      </v-list-item>
      <v-list-item title="数据下载列表">
        <a
          v-for="(url, index) in txtDownloads"
          :key="index"
          :href="url"
          download="result.txt"
          >数据{{ index + 1 }}
        </a>
        <div v-show="downloads.length === 0">空</div>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
</style>