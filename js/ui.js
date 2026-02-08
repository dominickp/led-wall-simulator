/**
 * UI element management and preset handling
 */

// Define all presets with their configuration (cols, rows, pitch, bloom)
const PRESETS = [
  { name: "P3 128x128", cols: 128, rows: 128, pitch: 0.18, bloom: 0.5 },
  { name: "P6 256x256", cols: 256, rows: 256, pitch: 0.18, bloom: 0.5 },
  { name: "Tall 128x256", cols: 128, rows: 256, pitch: 0.18, bloom: 0.5 },
  { name: "Wide 256x128", cols: 256, rows: 128, pitch: 0.18, bloom: 0.5 },
];

export class UIManager {
  constructor() {
    this.pitchSlider = select("#pitchSlider");
    this.ledColsSelect = select("#ledColsSelect");
    this.ledRowsSelect = select("#ledRowsSelect");
    this.timeline = select("#timeline");
    this.timeDisplay = select("#timeDisplay");
    this.fullscreenBtn = select("#fullscreenBtn");
    this.bloomSlider = select("#bloomSlider");
    this.videoPresetSelect = select("#videoPresetSelect");
    this.presetsContainer = select("#presetsContainer");
    this.presets = PRESETS;
  }

  setupVideoHandlers(onFileSelect, onTogglePlay, onVideoPresetSelect) {
    select("#videoInput").elt.onchange = onFileSelect;
    select("#playBtn").mousePressed(onTogglePlay);
    if (this.videoPresetSelect) {
      this.videoPresetSelect.elt.onchange = onVideoPresetSelect;
    }
  }

  renderPresets(onPreset) {
    // Clear existing preset buttons
    this.presetsContainer.elt.innerHTML = "";

    // Create buttons for each preset
    this.presets.forEach((preset) => {
      const btn = document.createElement("button");
      btn.className = "preset-btn";
      btn.textContent = preset.name;
      btn.addEventListener("click", () => {
        onPreset(preset);
      });
      this.presetsContainer.elt.appendChild(btn);
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

  setBloom(value) {
    this.bloomSlider.elt.value = value;
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

  // Add and remove presets dynamically
  addPreset(preset) {
    this.presets.push(preset);
  }

  removePreset(name) {
    this.presets = this.presets.filter((p) => p.name !== name);
  }

  updatePreset(name, updates) {
    const preset = this.presets.find((p) => p.name === name);
    if (preset) {
      Object.assign(preset, updates);
    }
  }
}
