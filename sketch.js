let ledShader;
let img;
let video;
let pitchSlider;
let isVideoLoaded = false;
let ledColsSelect;
let ledRowsSelect;
let timeline;
let timeDisplay;
let fullscreenBtn;
let bloomSlider;

// The Shader Code (Vertex & Fragment)
const vs = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main() {
        // flip Y to correct upside-down video in WEBGL mode
        vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
        gl_Position = positionVec4;
    }
`;

const fs = `
    precision highp float;
    varying vec2 vTexCoord;
    uniform sampler2D tex0;
    uniform vec2 resolution;
    uniform vec2 ledCount; // cols, rows
    uniform float pitch;    // size of the "dot"
    uniform float bloom;    // bloom intensity (0-1)

    void main() {
        // 1. Create the grid coordinates (support non-square grids)
        vec2 grid = fract(vTexCoord * ledCount);
        vec2 cell = floor(vTexCoord * ledCount) / ledCount;

        // 2. Sample the video with anti-aliasing (4 sub-samples to reduce Moiré)
        vec2 cellSize = vec2(1.0) / ledCount;
        vec4 col = vec4(0.0);
        
        // Sample 4 points within the LED cell and average to smooth aliasing
        for (int i = 0; i < 2; i++) {
            for (int j = 0; j < 2; j++) {
                vec2 offset = (vec2(float(i), float(j)) + 0.25) / (2.0 * ledCount);
                col += texture2D(tex0, cell + offset);
            }
        }
        col /= 4.0;

        // 3. Create the square LED shape
        vec2 d = abs(grid - 0.5);
        float edge = pitch * 0.5;
        float softness = 0.03;
        vec2 mask2d = smoothstep(edge + softness, edge - softness, d);
        float ledMask = mask2d.x * mask2d.y;

        // 4. Add glow based on LED brightness
        float brightness = (col.r + col.g + col.b) / 3.0;
        float distFromCenter = max(d.x, d.y);
        
        // Use squared bloom for more dramatic effect at upper end of slider
        float bloomIntensity = bloom * bloom;
        
        // Glow extends from the LED edge outward, fading with distance
        float glowRange = (0.5 - edge) * bloomIntensity * 2.0;
        float glowMask = smoothstep(edge + glowRange, edge, distFromCenter) * brightness * bloomIntensity * 2.0;

        // Add glow on top of LED for brightness effect
        float finalMask = ledMask + glowMask;

        gl_FragColor = col * finalMask;
    }
`;

function setup() {
  let canvas = createCanvas(600, 600, WEBGL);
  canvas.parent("canvas-container");

  ledShader = createShader(vs, fs);

  // UI Elements
  pitchSlider = select("#pitchSlider");
  ledColsSelect = select("#ledColsSelect");
  ledRowsSelect = select("#ledRowsSelect");
  timeline = select("#timeline");
  timeDisplay = select("#timeDisplay");
  fullscreenBtn = select("#fullscreenBtn");
  bloomSlider = select("#bloomSlider");

  // File Handling
  select("#videoInput").elt.onchange = handleFile;
  select("#playBtn").mousePressed(toggleVideo);

  // Preset handlers
  select("#presetP3").mousePressed(() => {
    ledColsSelect.elt.value = "128";
    ledRowsSelect.elt.value = "128";
    pitchSlider.elt.value = 0.18;
    updateCanvasSize();
  });
  select("#presetP6").mousePressed(() => {
    ledColsSelect.elt.value = "256";
    ledRowsSelect.elt.value = "256";
    pitchSlider.elt.value = 0.18;
    updateCanvasSize();
  });
  select("#presetTall").mousePressed(() => {
    ledColsSelect.elt.value = "128";
    ledRowsSelect.elt.value = "256";
    pitchSlider.elt.value = 0.18;
    updateCanvasSize();
  });
  select("#presetWide").mousePressed(() => {
    ledColsSelect.elt.value = "256";
    ledRowsSelect.elt.value = "128";
    pitchSlider.elt.value = 0.18;
    updateCanvasSize();
  });

  timeline.input(handleTimelineInput);
  fullscreenBtn.mousePressed(toggleFullscreen);

  // Canvas resize listeners for aspect ratio changes
  ledColsSelect.input(updateCanvasSize);
  ledRowsSelect.input(updateCanvasSize);

  // Initial canvas size
  updateCanvasSize();
}

function updateCanvasSize() {
  const cols = parseFloat(ledColsSelect.elt.value || 256);
  const rows = parseFloat(ledRowsSelect.elt.value || 256);
  const aspect = cols / rows;

  // Scale canvas progressively with LED count
  // 64x64 = 600px, 128x128 = 800px, 256x256 = 1000px
  const maxDim = Math.max(cols, rows);
  const baseSize = 600 + (maxDim - 64) * 2;

  let newW = baseSize;
  let newH = baseSize;

  if (aspect > 1) {
    // wider than tall
    newW = baseSize;
    newH = Math.round(baseSize / aspect);
  } else {
    // taller than wide
    newW = Math.round(baseSize * aspect);
    newH = baseSize;
  }

  resizeCanvas(newW, newH);
}

function handleFile(event) {
  const file = event.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    if (video) video.remove(); // Clean up previous

    video = createVideo(url, () => {
      video.volume(1);
      video.loop();
      video.hide();
      isVideoLoaded = true;
    });
  }
}

function toggleVideo() {
  if (!video) return;
  if (isVideoLoaded) {
    if (video.elt.paused) video.play();
    else video.pause();
  }
}

function handleTimelineInput() {
  if (!video || !isVideoLoaded) return;
  const t = parseFloat(timeline.elt.value);
  video.elt.currentTime = t;
}

function toggleFullscreen() {
  const el = document.querySelector("#canvas-container");
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
}

function draw() {
  background(0);

  if (isVideoLoaded) {
    shader(ledShader);

    // Pass variables to the shader
    ledShader.setUniform("tex0", video);
    ledShader.setUniform("resolution", [width, height]);
    const cols = parseFloat(ledColsSelect.elt.value || 256);
    const rows = parseFloat(ledRowsSelect.elt.value || 256);
    ledShader.setUniform("ledCount", [cols, rows]);
    ledShader.setUniform("pitch", parseFloat(pitchSlider.elt.value));
    ledShader.setUniform("bloom", parseFloat(bloomSlider.elt.value || 0.5));

    rect(0, 0, width, height);

    // Update timeline UI
    if (video.elt.duration && !isNaN(video.elt.duration)) {
      timeline.elt.max = video.elt.duration;
      timeline.elt.value = video.elt.currentTime;
      timeDisplay.html(
        formatTime(video.elt.currentTime) +
          " / " +
          formatTime(video.elt.duration),
      );
    }
  }
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  const m = Math.floor(seconds / 60);
  return m + ":" + s;
}
