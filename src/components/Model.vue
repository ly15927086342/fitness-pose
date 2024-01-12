<template>
  <v-container>
    <v-row>
      <v-file-input
        label="File input"
        accept=".txt"
        @update:model-value="updateFile"
      ></v-file-input>
    </v-row>
    <v-row>
      <v-col cols="12" sm="10">
        <canvas id="chart" class="chart"></canvas>
      </v-col>
      <v-col cols="12" sm="2">
        <!-- <img src="/data/model_param.jpg" class="example" /> -->
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as BABYLON from "babylonjs";

export default {
  name: "Model",
  data() {
    return {};
  },
  mounted() {
    this.test();
  },
  methods: {
    test() {
      // Get the canvas DOM element
      var canvas = document.getElementById("chart");
      // Load the 3D engine
      var engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      // CreateScene function that creates and return the scene
      const createScene = function () {
        // Creates a basic Babylon Scene object
        const scene = new BABYLON.Scene(engine);
        // Creates and positions a free camera
        const camera = new BABYLON.FreeCamera(
          "camera1",
          new BABYLON.Vector3(0, 5, -10),
          scene
        );
        // Targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());
        // Attaches the camera to the canvas
        camera.attachControl(canvas, true);
        // Creates a light, aiming 0,1,0
        const light = new BABYLON.HemisphericLight(
          "light",
          new BABYLON.Vector3(0, 1, 0),
          scene
        );
        // Dim the light a small amount 0 - 1
        light.intensity = 0.7;
        // Built-in 'sphere' shape.
        const sphere = BABYLON.MeshBuilder.CreateSphere(
          "sphere",
          { diameter: 2, segments: 32 },
          scene
        );
        // Move sphere upward 1/2 its height
        sphere.position.y = 1;
        // Built-in 'ground' shape.
        const ground = BABYLON.MeshBuilder.CreateGround(
          "ground",
          { width: 6, height: 6 },
          scene
        );
        return scene;
      };
      // call the createScene function
      var scene = createScene();
      // run the render loop
      engine.runRenderLoop(function () {
        scene.render();
      });
      // the canvas/window resize event handler
      window.addEventListener("resize", function () {
        engine.resize();
      });
    },
  },
};
</script>
<style scoped>
.chart {
  width: 100%;
  height: 400px;
}
</style>