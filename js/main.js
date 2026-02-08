/**
 * LED Wall Simulator - Main Application
 */

import { vertexShader, fragmentShader } from "./shaders.js";
import { UIManager } from "./ui.js";
import { RenderEngine } from "./renderEngine.js";
import { CanvasManager } from "./canvas.js";

let ui;
let engine;

// Make setup and draw global for p5.js to find them
window.setup = setup;
window.draw = draw;

function setup() {
  let canvas = createCanvas(600, 600, WEBGL);
  canvas.parent("canvas-container");

  // Initialize engine and UI
  engine = new RenderEngine(vertexShader, fragmentShader);
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

  // Initialize canvas manager for fullscreen handling
  CanvasManager.initialize();

  // Initial canvas size
  const dims = ui.getGridDimensions();
  CanvasManager.resizeCanvas(dims.cols, dims.rows);
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
  const dims = ui.getGridDimensions();
  const pitch = ui.getPitch();
  const bloom = ui.getBloom();

  // Render the LED wall
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
