import { FilesetResolver } from "@mediapipe/tasks-vision";
import _cloneDeep from "lodash-es/cloneDeep";
import { getModelName } from ".";

/**
 * 封装模型基类
 */
export abstract class MediaPipeModal {
  public _modelInstance: any;

  public params: any[] = [];

  public config: Record<string, unknown> = {};

  public styleConfig: Record<string, unknown> = {};

  public model: any;

  constructor() {}

  /**
   * 初始化及加载模型
   */
  async init() {
    this.initConfig();
    const vision = await FilesetResolver.forVisionTasks("/wasm");
    this._modelInstance = await this.model.createFromOptions(
      vision,
      this.config
    );
  }

  getOptions() {
    return _cloneDeep(this.config);
  }

  getStyle() {
    return _cloneDeep(this.styleConfig);
  }

  /**
   * 参数初始化
   */
  initConfig() {
    this.params.forEach((item) => {
      if (item.name === "modelAssetPath") {
        this.config.baseOptions = {
          [item.name]: item.default,
        };
      } else {
        this.config[item.name] = item.default;
      }
    });
  }

  /**
   * 参数修改
   * @param config
   */
  async setOptions(config: any) {
    this.config = { ...this.config, ...config };
    await this._modelInstance.setOptions(this.config);
  }

  setStyle(config: any) {
    this.styleConfig = _cloneDeep(config);
    localStorage.setItem(getModelName(), JSON.stringify(this.styleConfig));
  }

  detect(image: HTMLImageElement) {
    return this._modelInstance.detect(image);
  }

  detectForVideo(video: HTMLVideoElement, timestamp: number) {
    return this._modelInstance.detectForVideo(video, timestamp);
  }

  /**
   * 子类实现各自模型的输出处理
   */
  abstract processResults(
    image: HTMLImageElement | undefined,
    canvas: HTMLCanvasElement,
    res: any
  ): void;

  abstract processVideoResults(
    video: HTMLVideoElement | undefined,
    canvas: HTMLCanvasElement,
    res: any
  ): void;
}
