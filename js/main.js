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
  ui.renderPresets(handlePreset);
  ui.setupGridListeners(handleGridChange);
  ui.setupTimelineListener(handleTimelineChange);
  ui.setupFullscreenListener(handleFullscreen);
  ui.setupControlsToggle();

  // Initialize canvas manager for fullscreen handling
  CanvasManager.initialize();

  // Setup slider value displays
  ui.setupSliderValueDisplays();

  // Apply default preset (first preset from PRESETS array)
  handlePreset(PRESETS[0]);

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

function handleTimelineChange() {
  const time = ui.getTimelineValue();
  engine.setPlaybackTime(time);
}

function handleFullscreen() {
  CanvasManager.toggleFullscreen();
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
