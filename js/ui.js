/**
 * UI element management and preset handling
 */

// Define all presets with their configuration (cols, rows, pitch, bloom)
export const PRESETS = [
  { name: "64x32", cols: 64, rows: 32, pitch: 0.61, bloom: 0.4 },
  { name: "64x64", cols: 64, rows: 64, pitch: 0.61, bloom: 0.4 },
  { name: "128x64", cols: 128, rows: 64, pitch: 0.65, bloom: 0.5 },
  { name: "128x128", cols: 128, rows: 128, pitch: 0.65, bloom: 0.5 },
];

// Allowed grid sizes (indexes on sliders map to these values)
export const GRID_POWERS = [8, 16, 32, 64, 96, 128, 192, 256];

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
    this.controlsToggleBtn = select("#controlsToggleBtn");
    this.exportBtn = select("#exportBtn");
    this.presets = PRESETS;
  }

  setupVideoHandlers(onFileSelect, onTogglePlay, onVideoPresetSelect) {
    select("#videoInput").elt.onchange = onFileSelect;
    select("#playBtn").mousePressed(onTogglePlay);
    if (this.videoPresetSelect) {
      this.videoPresetSelect.elt.onchange = onVideoPresetSelect;
    }
  }

  setupExportListener(onExport) {
    if (this.exportBtn) {
      this.exportBtn.mousePressed(onExport);
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
    const updateColsDisplay = () => {
      const idx = parseInt(this.ledColsSelect.elt.value, 10);
      const val = GRID_POWERS[idx] || GRID_POWERS[4];
      const el = document.querySelector("#ledColsValue");
      if (el) el.textContent = String(val);
    };
    const updateRowsDisplay = () => {
      const idx = parseInt(this.ledRowsSelect.elt.value, 10);
      const val = GRID_POWERS[idx] || GRID_POWERS[4];
      const el = document.querySelector("#ledRowsValue");
      if (el) el.textContent = String(val);
    };

    this.ledColsSelect.input(() => {
      updateColsDisplay();
      onGridChange();
    });
    this.ledRowsSelect.input(() => {
      updateRowsDisplay();
      onGridChange();
    });

    // initialize displays
    updateColsDisplay();
    updateRowsDisplay();
  }

  setupTimelineListener(onTimelineChange) {
    this.timeline.input(onTimelineChange);
  }

  setupFullscreenListener(onFullscreen) {
    this.fullscreenBtn.mousePressed(onFullscreen);
  }

  setupControlsToggle() {
    const storageKey = "ledControlsCollapsed";
    const applyState = (isCollapsed) => {
      document.body.classList.toggle("controls-collapsed", isCollapsed);
      if (this.controlsToggleBtn) {
        this.controlsToggleBtn.elt.textContent = isCollapsed
          ? "Show controls"
          : "Hide controls";
        this.controlsToggleBtn.elt.setAttribute(
          "aria-expanded",
          String(!isCollapsed),
        );
      }
    };

    const initialState = localStorage.getItem(storageKey) === "true";
    applyState(initialState);

    if (this.controlsToggleBtn) {
      this.controlsToggleBtn.mousePressed(() => {
        const nextState =
          !document.body.classList.contains("controls-collapsed");
        applyState(nextState);
        localStorage.setItem(storageKey, String(nextState));
      });
    }
  }

  setExportState(isRecording) {
    if (!this.exportBtn) return;
    this.exportBtn.elt.disabled = isRecording;
    this.exportBtn.elt.textContent = isRecording
      ? "Recording..."
      : "Download LED Video";
  }

  setupSliderValueDisplays() {
    const updatePitchDisplay = () => {
      const value = this.getPitch();
      document.querySelector("#pitchValue").textContent = value.toFixed(2);
    };
    const updateBloomDisplay = () => {
      const value = this.getBloom();
      document.querySelector("#bloomValue").textContent = value.toFixed(2);
    };

    this.pitchSlider.elt.addEventListener("input", updatePitchDisplay);
    this.bloomSlider.elt.addEventListener("input", updateBloomDisplay);

    // Initial display
    updatePitchDisplay();
    updateBloomDisplay();
  }

  getGridDimensions() {
    const colsIdx = parseInt(this.ledColsSelect.elt.value, 10);
    const rowsIdx = parseInt(this.ledRowsSelect.elt.value, 10);
    return {
      cols: GRID_POWERS[colsIdx] || GRID_POWERS[4],
      rows: GRID_POWERS[rowsIdx] || GRID_POWERS[4],
    };
  }

  setGridDimensions(cols, rows) {
    const colsIdx = GRID_POWERS.indexOf(Number(cols));
    const rowsIdx = GRID_POWERS.indexOf(Number(rows));
    if (colsIdx >= 0) this.ledColsSelect.elt.value = String(colsIdx);
    if (rowsIdx >= 0) this.ledRowsSelect.elt.value = String(rowsIdx);
    // trigger input so displays and listeners update
    this.ledColsSelect.elt.dispatchEvent(new Event("input", { bubbles: true }));
    this.ledRowsSelect.elt.dispatchEvent(new Event("input", { bubbles: true }));
  }

  getPitch() {
    return parseFloat(this.pitchSlider.elt.value);
  }

  setPitch(value) {
    this.pitchSlider.elt.value = value;
    this.pitchSlider.elt.dispatchEvent(new Event("input", { bubbles: true }));
  }

  getBloom() {
    return parseFloat(this.bloomSlider.elt.value || 0.5);
  }

  setBloom(value) {
    this.bloomSlider.elt.value = value;
    this.bloomSlider.elt.dispatchEvent(new Event("input", { bubbles: true }));
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
