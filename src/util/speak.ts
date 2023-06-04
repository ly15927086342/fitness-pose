/**
 * 语音播报类
 */
export class Speaker {
  static _instance?: Speaker;

  private _synth: SpeechSynthesis;

  private _voice: SpeechSynthesisVoice;

  private _utter: SpeechSynthesisUtterance;

  constructor() {
    this._synth = speechSynthesis;
    this._voice = this._synth.getVoices().find((s) => s.lang === "zh-CN")!;
    this._utter = new SpeechSynthesisUtterance();
    this.setVoice();
  }

  setVoice() {
    this._utter.voice = this._voice;
  }

  speak(text: string) {
    this._utter.text = text;
    this._synth.speak(this._utter);
  }

  speaking() {
    return this._synth.speaking;
  }

  stop() {
    this._synth.cancel();
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new Speaker();
    }
    return this._instance;
  }
}
