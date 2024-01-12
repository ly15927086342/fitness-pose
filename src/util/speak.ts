/**
 * 语音播报类
 */
export class Speaker {
  static _instance?: Speaker;

  private _synth?: SpeechSynthesis;

  private _voice?: SpeechSynthesisVoice;

  private _utter?: SpeechSynthesisUtterance;

  private _allowUse: boolean = true;

  constructor() {
    if (!speechSynthesis) {
      this._allowUse = false;
      return;
    }
    this._synth = window.speechSynthesis;
    // console.log(this._synth.getVoices())
    // this._voice = this._synth.getVoices().find((s) => s.lang === "zh-CN")!;
    this._utter = new SpeechSynthesisUtterance();
    // this.setVoice();
  }

  setVoice() {
    if (!this._allowUse) return;
    this._utter!.voice = this._voice!;
  }

  speak(text: string) {
    if (!this._allowUse) return;
    this._utter!.text = text;
    this._synth!.speak(this._utter!);
  }

  speaking() {
    return this._allowUse ? this._synth!.speaking : "";
  }

  stop() {
    this._synth?.cancel();
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new Speaker();
    }
    return this._instance;
  }
}
