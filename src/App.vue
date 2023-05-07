<script lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
import PoseDetector from "./components/PoseDetector.vue";
import MediaDetector from "./components/MediaDetector.vue";
import ImageDetector from "./components/ImageDetector.vue";
import Download from "./components/Download.vue";
import Analysis from "./components/Analysis.vue";

export default {
  data() {
    return {
      tab: "video",
    };
  },
  components: {
    PoseDetector,
    MediaDetector,
    ImageDetector,
    Download,
    Analysis,
  },
};
</script>

<template>
  <v-theme-provider theme="light">
    <v-card>
      <v-layout>
        <v-main style="min-height: 300px">
          <v-tabs
            v-model="tab"
            color="deep-purple-accent-4"
            align-tabs="center"
          >
            <v-tab value="video">视频</v-tab>
            <v-tab value="image">图片</v-tab>
            <v-tab value="media">录像</v-tab>
            <v-tab value="analysis">分析</v-tab>
          </v-tabs>
          <v-window v-model="tab">
            <v-window-item value="video">
              <PoseDetector />
            </v-window-item>
            <v-window-item value="image">
              <ImageDetector />
            </v-window-item>
            <v-window-item value="media">
              <MediaDetector />
            </v-window-item>
            <v-window-item value="analysis">
              <Analysis />
            </v-window-item>
          </v-window>
          <Download />
          <v-footer>
            <v-col class="text-center mt-4" cols="12">
              {{ new Date().getFullYear() }},
              <strong>Li Yu</strong>
            </v-col>
          </v-footer>
        </v-main>
      </v-layout>
    </v-card>
  </v-theme-provider>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
