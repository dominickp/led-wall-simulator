/**
 * UI element management and preset handling
 */

export class UIManager {
  constructor() {
    this.pitchSlider = select("#pitchSlider");
    this.ledColsSelect = select("#ledColsSelect");
    this.ledRowsSelect = select("#ledRowsSelect");
    this.timeline = select("#timeline");
    this.timeDisplay = select("#timeDisplay");
    this.fullscreenBtn = select("#fullscreenBtn");
    this.bloomSlider = select("#bloomSlider");
  }

  setupVideoHandlers(onFileSelect, onTogglePlay) {
    select("#videoInput").elt.onchange = onFileSelect;
    select("#playBtn").mousePressed(onTogglePlay);
  }

  setupPresets(onPreset) {
    select("#presetP3").mousePressed(() => {
      onPreset({ cols: 128, rows: 128, pitch: 0.18 });
    });
    select("#presetP6").mousePressed(() => {
      onPreset({ cols: 256, rows: 256, pitch: 0.18 });
    });
    select("#presetTall").mousePressed(() => {
      onPreset({ cols: 128, rows: 256, pitch: 0.18 });
    });
    select("#presetWide").mousePressed(() => {
      onPreset({ cols: 256, rows: 128, pitch: 0.18 });
    });
  }

  setupGridListeners(onGridChange) {
    this.ledColsSelect.input(onGridChange);
    this.ledRowsSelect.input(onGridChange);
  }

  setupTimelineListener(onTimelineChange) {
    this.timeline.input(onTimelineChange);
  }

  setupFullscreenListener(onFullscreen) {
    this.fullscreenBtn.mousePressed(onFullscreen);
  }

  getGridDimensions() {
    return {
      cols: parseFloat(this.ledColsSelect.elt.value || 256),
      rows: parseFloat(this.ledRowsSelect.elt.value || 256),
    };
  }

  setGridDimensions(cols, rows) {
    this.ledColsSelect.elt.value = String(cols);
    this.ledRowsSelect.elt.value = String(rows);
  }

  getPitch() {
    return parseFloat(this.pitchSlider.elt.value);
  }

  setPitch(value) {
    this.pitchSlider.elt.value = value;
  }

  getBloom() {
    return parseFloat(this.bloomSlider.elt.value || 0.5);
  }

  setTimelineMax(duration) {
    this.timeline.elt.max = duration;
  }

  setTimelineValue(value) {
    this.timeline.elt.value = value;
  }

  getTimelineValue() {
    return parseFloat(this.timeline.elt.value);
  }

  updateTimeDisplay(currentTime, duration) {
    this.timeDisplay.html(
      `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`,
    );
  }

  formatTime(seconds) {
    if (!isFinite(seconds)) return "0:00";
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    const m = Math.floor(seconds / 60);
    return m + ":" + s;
  }
}
