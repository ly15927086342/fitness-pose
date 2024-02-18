<script lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
// import PoseDetector from "./components/PoseDetector.vue";
// import MediaDetector from "./components/MediaDetector.vue";
// import ImageDetector from "./components/ImageDetector.vue";
// import Download from "./components/Download.vue";
// import Analysis from "./components/Analysis.vue";
import Model from "./components/Model.vue";
import ModelConfigBar from './components/modelConfigBar.vue';
import File from './components/File.vue';
import { getModelIns } from './model';
// import { useTheme } from 'vuetify'

// const theme = useTheme();
// import Test from "./components/Test.vue";

export default {
  data() {
    return {
      tab: "video",
      modelName: ''
    };
  },
  components: {
    // PoseDetector,
    // MediaDetector,
    // ImageDetector,
    // Download,
    // Analysis,
    Model,
    ModelConfigBar,
    File
  },
  methods: {
    async modelChange() {
      const model = await getModelIns();
      console.log(model.getOptions());
      (this.$refs.file as any).update();
    },
    toggleTheme() {
      // theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
    }
  }
};
</script>

<template>
  <v-theme-provider theme="light">
    <!-- <v-btn @click="toggleTheme">toggle theme</v-btn> -->
    <v-card>
      <v-layout>
        <v-main style="min-height: 300px">
          <v-container>
            <v-row>
              <ModelConfigBar @modelChange="modelChange"></ModelConfigBar>
              <File ref="file"></File>
            </v-row>
          </v-container>

          <!-- <v-tabs
            v-model="tab"
            color="deep-purple-accent-4"
            align-tabs="center"
          >
            <v-tab value="video">视频</v-tab>
            <v-tab value="image">图片</v-tab>
            <v-tab value="media">录像</v-tab>
            <v-tab value="analysis">分析</v-tab>
            <v-tab value="model">建模</v-tab>
            <v-tab value="test">测试</v-tab>
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
            <v-window-item value="model">
              <Model />
            </v-window-item>
            <v-window-item value="test">
              <Test />
            </v-window-item>
          </v-window>
          <Download /> -->
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
