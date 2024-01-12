<template>
  <v-progress-linear :active="loading" :indeterminate="loading" absolute bottom
    color="deep-purple-accent-4"></v-progress-linear>
  <v-col cols="12" md="4">
    <v-card>
      <v-form ref="form">
        <v-select label="Select" :items="modelList" v-model="modelName">
        </v-select>
        <v-expansion-panels v-model="modelPanel" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>模型参数</v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-for="item in params" :key="item.name">
                <v-card-text>{{ item.name }}</v-card-text>
                <v-slider v-if="item.type === 'float'" class="align-center" v-model="config[item.name]"
                  :max="item.range[1]" :min="item.range[0]" hide-details>
                  <template v-slot:append>
                    <v-text-field v-model="config[item.name]" hide-details single-line density="compact" type="number"
                      style="width: 70px"></v-text-field>
                  </template>
                </v-slider>
                <v-slider v-if="item.type === 'integer'" v-model="config[item.name]" :max="item.range[1]"
                  :min="item.range[0]" step="1" show-ticks>
                  <template v-slot:append>
                    <v-text-field v-model="config[item.name]" hide-details single-line density="compact" type="number"
                      style="width: 70px"></v-text-field>
                  </template>
                </v-slider>
                <v-select v-if="item.type === 'enum' && item.name === 'modelAssetPath'"
                  v-model="config.baseOptions[item.name]" :items="item.range" required></v-select>
                <v-select v-if="item.type === 'enum' && item.name !== 'modelAssetPath'" v-model="config[item.name]"
                  :items="item.range" required></v-select>
                <v-radio-group v-if="item.type === 'boolean'" v-model="config[item.name]" inline>
                  <v-radio label="true" :value="true"></v-radio>
                  <v-radio label="false" :value="false"></v-radio>
                </v-radio-group>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <div>
          <v-card-text>样式配置</v-card-text>
          <v-expansion-panels v-model="stylePanel" multiple>
            <v-expansion-panel v-for="(item, key) in style" :key="key">
              <v-expansion-panel-title>{{ key }}</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-card-text>color</v-card-text>
                <v-color-picker v-model="item.color"></v-color-picker>
                <v-card-text>fillColor</v-card-text>
                <v-color-picker v-model="item.fillColor"></v-color-picker>
                <v-card-text>lineWidth</v-card-text>
                <v-slider class="align-center" v-model="item.lineWidth" :max="10" :min="1" step="1" show-ticks>
                  <template v-slot:append>
                    <v-text-field v-model="item.lineWidth" hide-details single-line density="compact" type="number"
                      style="width: 70px"></v-text-field>
                  </template>
                </v-slider>
                <v-card-text>radius</v-card-text>
                <v-slider class="align-center" v-model="item.radius" :max="10" :min="1" hide-details>
                  <template v-slot:append>
                    <v-text-field v-model="item.radius" hide-details single-line density="compact" type="number"
                      style="width: 70px"></v-text-field>
                  </template>
                </v-slider>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-form>
      <v-btn block @click="confirm">确定</v-btn>
    </v-card>
  </v-col>
</template>

<script>
import { getModelIns, ModelList, setModelName } from '../model';

export default {
  name: 'ModelConfigBar',
  data() {
    const modelList = Object.entries(ModelList).map(entry => entry[0])
    return {
      loading: false,
      params: [],
      config: {},
      style: {},
      modelList,
      modelName: modelList[0],
      stylePanel: [],
      modelPanel: []
    }
  },
  watch: {
    modelName: {
      handler(v) {
        setModelName(v);
        this.updateBar();
      },
      immediate: true
    }
  },
  methods: {
    async updateBar() {
      this.loading = true;
      const model = await getModelIns();
      this.params = model.params;
      this.config = model.getOptions();
      this.style = model.getStyle();
      this.loading = false;
    },
    async confirm() {
      const model = await getModelIns();
      await model.setOptions(this.config);
      model.setStyle(this.style);
      this.$emit('modelChange');
    }
  }
}
</script>
