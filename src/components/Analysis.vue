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
        <div id="chart" class="chart"></div>
      </v-col>
      <v-col cols="12" sm="2">
        <!-- <img src="/data/model_param.jpg" class="example" /> -->
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// @ts-ignore
// 引入 echarts 核心模块，核心模块提供了 echarts 使用必须要的接口。
import * as echarts from "echarts/core";
// 引入柱状图图表，图表后缀都为 Chart
import { LineChart } from "echarts/charts";
// 引入提示框，标题，直角坐标系，数据集，内置数据转换器组件，组件后缀都为 Component
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  DataZoomInsideComponent,
  MarkLineComponent,
} from "echarts/components";
// 标签自动布局、全局过渡动画等特性
import { LabelLayout, UniversalTransition } from "echarts/features";
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import { CanvasRenderer } from "echarts/renderers";
import { MODEL_LEFT_KEY_PARAM, MODEL_RIGHT_KEY_PARAM } from "../constants";
import {
  calSlopeCurve,
  curveFitting,
  extremeValueDetect,
  getKeyParam,
  percentile,
  quantiles,
  sinFunction,
} from "../util";

// 注册必须的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  DataZoomInsideComponent,
  LineChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  MarkLineComponent,
]);

export default {
  name: "Analysis",

  data() {
    return {
      rawData: [],
      keyParams: [],
      threshold: 50,
      curveParam: {},
      quantiles: {},
      percentile: {},
    };
  },

  methods: {
    updateFile(files) {
      if (files.length === 0) return;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        const { t, data } = JSON.parse(text);
        this.rawData = data;
        this.threshold = Number(t);
        this.updateChart();
      };
      reader.readAsText(file);
    },

    updateChart() {
      this.pickCharacter();
      this.curveFit();
      this.calQuantiles();
      this.calPercentile();
      this.calExtremeVals();
      const myChart = echarts.init(document.getElementById("chart"));
      const series = [];
      this.keyParams.forEach((key) => {
        // const [a, b, c] = this.quantiles[key];
        // const [a,b, c] = this.percentile[key];
        series.push({
          data: this.rawData.map((d) => d[key]),
          type: "line",
          name: key,
          markLine: {
            data: [
              {
                yAxis: this.extremeValues[key].maxAvg,
              },
              {
                yAxis: this.extremeValues[key].minAvg,
              },
              ...this.extremeValues[key].extremes.map((i) => {
                return {
                  xAxis: i,
                };
              }),
            ],
            lineStyle: {
              width: 2,
            },
            silent: true,
          },
        });
        const data = this.rawData.map((d) => d[key]);
        const k = calSlopeCurve(data);
        series.push({
          data: k,
          type: "line",
          name: `${key}_k`,
        });
        // series.push({
        //   data: this.rawData.map((d, i) => {
        //     return sinFunction(this.curveParam[key].parameterValues)(
        //       ((i + 1) * this.threshold) / 1000
        //     );
        //   }),
        //   type: "line",
        //   name: `${key}_cur`,
        // });
      });
      const option = {
        legend: {
          // Try 'horizontal'
          orient: "vertical",
          right: 10,
          top: "center",
        },
        tooltip: {
          show: true,
        },
        xAxis: {
          type: "category",
          data: this.rawData.map((t, i) => (i * this.threshold) / 1000),
        },
        yAxis: {
          type: "value",
        },
        dataZoom: [
          {
            id: "dataZoomX",
            type: "inside",
            filterMode: "filter",
          },
        ],
        series,
      };
      myChart.setOption(option);
    },

    pickCharacter() {
      const k = getKeyParam(this.rawData, [
        ...MODEL_LEFT_KEY_PARAM,
        ...MODEL_RIGHT_KEY_PARAM,
      ]);
      // const rK = getKeyParam(this.rawData, MODEL_RIGHT_KEY_PARAM);
      this.keyParams = [k];
    },

    curveFit() {
      this.curveParam = {};
      this.keyParams.forEach((key) => {
        const y = this.rawData.map((d) => d[key]);
        const x = this.rawData.map((d, i) => (i * this.threshold) / 1000);
        this.curveParam[key] = curveFitting(x, y);
      });
    },

    calQuantiles() {
      this.quantiles = {};
      this.keyParams.forEach((key) => {
        const data = this.rawData.map((d) => d[key]);
        this.quantiles[key] = quantiles(data, [0.1, 0.5, 0.75]);
      });
    },

    calPercentile() {
      this.percentile = {};
      this.keyParams.forEach((key) => {
        const data = this.rawData.map((d) => d[key]);
        this.percentile[key] = [
          percentile(data, 0.25),
          percentile(data, 0.5),
          percentile(data, 0.75),
        ];
      });
    },

    calExtremeVals() {
      this.extremeValues = {};
      this.keyParams.forEach((key) => {
        const data = this.rawData.map((d) => d[key]);
        const res = extremeValueDetect(data, 0.1);
        this.extremeValues[key] = res;
        console.log(res.count, (res.period * this.threshold) / 1000);
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
.example {
  width: 100%;
  height: auto;
}
</style>