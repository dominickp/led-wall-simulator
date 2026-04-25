/**
 * LED Sign Simulator - Main Application
 */

import { loadShaders } from "./shaders.js";
import { UIManager, PRESETS } from "./ui.js";
import { RenderEngine } from "./renderEngine.js";
import { CanvasManager } from "./canvas.js";

let ui;
let engine;
let shaders = null;
let setupComplete = false;
let recordingInProgress = false;
let exportTimer = null;
const SETTINGS_KEY = "ledSimulatorSettings";
const DEFAULT_SETTINGS = {
  colsIdx: 3,
  rowsIdx: 3,
  pitch: PRESETS[0].pitch,
  bloom: PRESETS[0].bloom,
  bitrate: "auto",
};

// Make setup and draw global for p5.js to find them
window.setup = setup;
window.draw = draw;

async function setup() {
  let canvas = createCanvas(600, 600, WEBGL);
  canvas.parent("canvas-container");

  // Load shaders if not already loaded
  if (!shaders) {
    try {
      shaders = await loadShaders();
      console.log("Shaders loaded successfully");
    } catch (error) {
      console.error("Failed to load shaders:", error);
      return;
    }
  }

  // Initialize engine and UI
  engine = new RenderEngine(shaders.vertexShader, shaders.fragmentShader);
  engine.initialize();

  ui = new UIManager();

  // Setup all event handlers
  ui.setupVideoHandlers(
    handleFileSelect,
    handleTogglePlay,
    handleVideoPresetSelect,
  );
  ui.setupExportListener(handleExport);
  ui.renderPresets(handlePreset);
  ui.setupGridListeners(handleGridChange);
  ui.setupTimelineListener(handleTimelineChange);
  ui.setupFullscreenListener(handleFullscreen);
  ui.setupControlsToggle();
  ui.setupResetListener(handleResetDefaults);

  // Initialize canvas manager for fullscreen handling
  CanvasManager.initialize();

  // Setup slider value displays
  ui.setupSliderValueDisplays();
  ui.setExportState(false);

  // Apply saved settings or default preset
  const saved = loadSettings();
  if (saved) {
    applySettings(saved);
  } else {
    handlePreset(PRESETS[0]);
    ui.setExportBitrateMbps(DEFAULT_SETTINGS.bitrate);
  }

  setupSettingsPersistence();

  // Load default video (preset a.mp4) with a small delay to ensure engine is ready
  setTimeout(() => {
    loadPresetVideo("./videos/a_x264.mp4");
  }, 100);

  // Initial canvas size
  const dims = ui.getGridDimensions();
  CanvasManager.resizeCanvas(dims.cols, dims.rows);

  setupComplete = true;
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    console.log("Loading video:", file.name);
    engine.loadVideo(file, () => {
      console.log("Video loaded successfully");
    });
  }
}

function handleTogglePlay() {
  engine.togglePlayPause();
}

async function handleExport() {
  if (!engine?.isVideoLoaded || recordingInProgress) return;

  const duration = engine.getDuration();
  if (!isFinite(duration) || duration <= 0) {
    alert("Video metadata is not ready yet. Try again in a moment.");
    return;
  }

  const sourceDims = engine.getVideoDimensions();
  if (sourceDims) {
    CanvasManager.setFixedCanvasSize(sourceDims.width, sourceDims.height);
  }

  engine.setPlaybackTime(0);
  engine.play();

  const warmedUp = await engine.waitForPlaybackStart(2000);
  if (!warmedUp) {
    alert("Video playback failed to start. Try again or reload the video.");
    return;
  }

  const estimatedFps = await engine.estimateSourceFps({
    sampleFrames: 24,
    timeoutMs: 1500,
  });
  const fps =
    estimatedFps && estimatedFps >= 12 && estimatedFps <= 120
      ? Math.round(estimatedFps * 100) / 100
      : 30;

  const mimeType = getBestRecordingMimeType();
  const captureDims = sourceDims || {
    width: width || 0,
    height: height || 0,
  };
  const bitrate = getExportVideoBitrate(
    ui.getExportBitrateMbps(),
    captureDims.width,
    captureDims.height,
  );
  const bitrateLabel = bitrate ? `${Math.round(bitrate / 1_000_000)} Mbps` : "";
  setExportDebug(
    `Export: ${captureDims.width}x${captureDims.height} @ ${fps} FPS ${bitrateLabel}`,
  );
  const started = engine.startRecording({
    includeAudio: true,
    mimeType,
    fps,
    videoBitsPerSecond: bitrate,
    audioBitsPerSecond: 192_000,
    timesliceMs: 1000,
  });

  if (!started) {
    const reason = engine.getRecordingError();
    const detail = reason ? ` (${reason})` : "";
    CanvasManager.clearFixedCanvasSize();
    setExportDebug("");
    alert(`Recording is not supported in this browser${detail}.`);
    return;
  }

  recordingInProgress = true;
  ui.setExportState(true);

  if (exportTimer) {
    clearTimeout(exportTimer);
    exportTimer = null;
  }

  const stopAfterMs = Math.ceil(duration * 1000) + 200;
  exportTimer = setTimeout(async () => {
    const blob = await engine.stopRecording();
    if (blob) {
      const recordingError = engine.getRecordingError();
      if (recordingError) {
        console.warn("Recording error:", recordingError);
        alert("Recording failed. Please try again with another format.");
        recordingInProgress = false;
        ui.setExportState(false);
        CanvasManager.clearFixedCanvasSize();
        setExportDebug("");
        engine.pause();
        return;
      }

      if (blob.size < 1024) {
        alert(
          "Recording produced an empty file. Try again or use a different format.",
        );
        recordingInProgress = false;
        ui.setExportState(false);
        CanvasManager.clearFixedCanvasSize();
        setExportDebug("");
        engine.pause();
        return;
      }

      const isMp4 = mimeType && mimeType.includes("mp4");
      const fixedBlob = isMp4
        ? null
        : await fixWebmDuration(blob, duration * 1000);
      const extension = isMp4 ? "mp4" : "webm";
      const fileName = buildDownloadName(engine.getVideoFileName(), extension);
      downloadBlob(fixedBlob || blob, fileName);
    }
    recordingInProgress = false;
    ui.setExportState(false);
    CanvasManager.clearFixedCanvasSize();
    setExportDebug("");
    engine.pause();
  }, stopAfterMs);
}

function handleVideoPresetSelect(event) {
  const videoPath = event.target.value;
  if (videoPath) {
    console.log("Loading preset video:", videoPath);
    // Load video from the specified path
    fetch(videoPath)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a File object from the blob
        const file = new File([blob], videoPath.split("/").pop(), {
          type: blob.type,
        });
        engine.loadVideo(file, () => {
          console.log("Preset video loaded successfully");
        });
      })
      .catch((error) => console.error("Error loading preset video:", error));
  }
}

function loadPresetVideo(videoPath) {
  console.log("Loading preset video:", videoPath);
  fetch(videoPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => {
      console.log("Video blob loaded successfully, size:", blob.size);
      const file = new File([blob], videoPath.split("/").pop(), {
        type: blob.type,
      });
      engine.loadVideo(file, () => {
        console.log("Preset video loaded successfully");
      });
    })
    .catch((error) => console.error("Error loading preset video:", error));
}

function handlePreset(preset) {
  ui.setGridDimensions(preset.cols, preset.rows);
  ui.setPitch(preset.pitch);
  ui.setBloom(preset.bloom);
  handleGridChange();
}

function handleGridChange() {
  const dims = ui.getGridDimensions();
  CanvasManager.resizeCanvas(dims.cols, dims.rows);
}

function handleResetDefaults() {
  applySettings(DEFAULT_SETTINGS);
  saveSettings(DEFAULT_SETTINGS);
}

function handleTimelineChange() {
  const time = ui.getTimelineValue();
  engine.setPlaybackTime(time);
}

function handleFullscreen() {
  CanvasManager.toggleFullscreen();
}

function buildDownloadName(originalName, extension) {
  if (!originalName) return `led-output.${extension}`;
  const base = originalName.replace(/\.[^/.]+$/, "");
  return `${base}-led.${extension}`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getBestRecordingMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
  ];

  if (typeof MediaRecorder === "undefined") return "";
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function getExportVideoBitrate(selection, width, height) {
  if (selection && selection !== "auto") {
    const numeric = Number.parseFloat(selection);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.round(numeric * 1_000_000);
    }
  }

  if (!width || !height) return 8_000_000;
  const base = 16_000_000;
  const scale = (width * height) / (1920 * 1080);
  const unclamped = Math.round(base * scale);
  return Math.min(Math.max(unclamped, 8_000_000), 40_000_000);
}

function setupSettingsPersistence() {
  const save = () => saveSettings(collectSettings());

  ui.ledColsSelect?.elt?.addEventListener("input", save);
  ui.ledRowsSelect?.elt?.addEventListener("input", save);
  ui.pitchSlider?.elt?.addEventListener("input", save);
  ui.bloomSlider?.elt?.addEventListener("input", save);
  ui.exportBitrateSelect?.elt?.addEventListener("change", save);
}

function collectSettings() {
  const grid = ui.getGridIndices();
  return {
    colsIdx: Number.isFinite(grid.colsIdx) ? grid.colsIdx : DEFAULT_SETTINGS.colsIdx,
    rowsIdx: Number.isFinite(grid.rowsIdx) ? grid.rowsIdx : DEFAULT_SETTINGS.rowsIdx,
    pitch: ui.getPitch(),
    bloom: ui.getBloom(),
    bitrate: ui.getExportBitrateMbps(),
  };
}

function applySettings(settings) {
  if (!settings) return;
  const colsIdx =
    Number.isFinite(settings.colsIdx) && settings.colsIdx >= 0
      ? settings.colsIdx
      : DEFAULT_SETTINGS.colsIdx;
  const rowsIdx =
    Number.isFinite(settings.rowsIdx) && settings.rowsIdx >= 0
      ? settings.rowsIdx
      : DEFAULT_SETTINGS.rowsIdx;
  ui.setGridIndices(colsIdx, rowsIdx);

  const pitch = Number.isFinite(settings.pitch)
    ? settings.pitch
    : DEFAULT_SETTINGS.pitch;
  const bloom = Number.isFinite(settings.bloom)
    ? settings.bloom
    : DEFAULT_SETTINGS.bloom;
  ui.setPitch(pitch);
  ui.setBloom(bloom);

  ui.setExportBitrateMbps(settings.bitrate || DEFAULT_SETTINGS.bitrate);
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to read saved settings:", error);
    return null;
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to save settings:", error);
  }
}

function setExportDebug(message) {
  const el = document.querySelector("#exportDebug");
  if (!el) return;
  const text = (message || "").trim();
  if (!text) {
    el.textContent = "";
    el.style.display = "none";
    return;
  }
  el.textContent = text;
  el.style.display = "block";
}

async function fixWebmDuration(blob, durationMs) {
  try {
    if (isAndroidDevice()) {
      return null;
    }
    const globalFixer = window.fixWebmDuration || window.ysFixWebmDuration;
    if (typeof globalFixer === "function") {
      return await globalFixer(blob, durationMs);
    }
    console.warn("WebM duration fix is not available.");
    return null;
  } catch (error) {
    console.warn("WebM duration fix failed:", error);
    return null;
  }
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || "");
}

function draw() {
  // Wait for setup to complete before drawing
  if (!setupComplete) return;

  const dims = ui.getGridDimensions();
  const pitch = ui.getPitch();
  const bloom = ui.getBloom();

  // Render the LED sign
  engine.render(dims.cols, dims.rows, pitch, bloom);

  // Update timeline display
  if (
    engine.isVideoLoaded &&
    engine.getDuration() &&
    !isNaN(engine.getDuration())
  ) {
    ui.setTimelineMax(engine.getDuration());
    ui.setTimelineValue(engine.getCurrentTime());
    ui.updateTimeDisplay(engine.getCurrentTime(), engine.getDuration());
  }
}
