# LED Wall Simulator

This document outlines the scope and technical specifications for the LED Wall Simulator, a web-based tool designed to help you preview music visualizations with hardware-level accuracy.

1. Project Overview
The LED Wall Simulator is a front-end application that transforms standard video files into a simulated LED matrix display. It allows users to visualize how low-resolution content (e.g., 256x256) looks when rendered on physical diodes, accounting for pixel pitch (the gap between LEDs) and light emission characteristics.

2. Functional Requirements
    - Local Video Playback: Users must be able to load local .mp4, .mov, or .webm files via the browser’s File API without uploading data to a server.
    - Configurable panel size: Allow the user to change different aspect ratios and grid sizes (e.g. 128x256 vs 512x512)
    - Resolution Simulation: The tool must downsample or map video input to specific LED grid sizes (e.g., 64x64, 128x128, or 256x256).
    - Physical Pitch Control: A slider to adjust the "gap" between simulated LEDs to mimic different density panels (e.g., P3 vs. P6).
    - Transport Controls: Basic Play/Pause functionality and audio output from the source video.
    - Visual Fidelity: Real-time rendering of circular diodes and (optional) light bloom/glow to simulate high-brightness emitters.

1. Technical Architecture

The app is built as a Single Page Application (SPA) using a "Web-First" approach to ensure accessibility and zero installation.

A. Core Technologies

    - p5.js (WEBGL Mode): Acts as the primary engine for canvas management and video handling.
    - GLSL (OpenGL Shading Language): Handles the "heavy lifting" by using a Fragment Shader to render thousands of LEDs simultaneously on the GPU.
    - Web File API: Uses URL.createObjectURL to map local disk files to browser memory for instant playback.

B. Rendering Pipeline

    - Input Layer: Video is drawn to a hidden "source" buffer at its native resolution.
    - Processing Layer: The Fragment Shader divides the screen into a grid based on the ledCount variable. It samples a single color from the center of each grid cell to ensure 1:1 pixel accuracy.
    - Output Layer: A mathematical mask is applied to each cell to draw a circle. The area outside the circle is rendered as black to simulate the panel's substrate.


1. Development Roadmap

    Phase 1 (MVP): Basic LED grid, file upload, pitch control. ✅
    Phase 2 (UX): Presets, timeline scrubber, aspect ratios. ✅  
    Phase 3 (Polishing): Bloom shader, fullscreen, anti-aliasing. ✅

## Local Development

### Using Deno (Recommended)

```bash
deno run --allow-net --allow-read server.ts
```

Open: http://localhost:8000

### Using Python 3

```bash
python -m http.server 8000
```

Open: http://localhost:8000

## Project Structure

```
led-sign-visualizer/
├── index.html              # Main HTML
├── server.ts               # Deno dev server (CORS enabled)
├── js/
│   ├── main.js            # App entry point
│   ├── shaders.js         # GLSL shader code
│   ├── ui.js              # UI element management
│   ├── renderEngine.js    # LED rendering engine
│   └── canvas.js          # Canvas utilities
└── README.md              # This file
```

## Deployment to GitHub Pages

1. Push to your GitHub repository
2. Settings → Pages
3. Select `main` branch, root folder
4. Site will be live at: `https://yourusername.github.io/led-sign-visualizer`

## Features

- Local video playback (.mp4, .mov, .webm)
- LED grid: 32×32 to 256×256
- Configurable aspect ratios
- Preset buttons (P3, P6, Tall, Wide)
- LED pitch control (0.02–0.9)
- Bloom/glow effect
- Timeline scrubber & fullscreen
- Anti-aliasing (reduces Moiré)
- Square LED shapes

## Development

To add features, extend the relevant class and wire up in `main.js`:

- **UI controls** → `UIManager` in `ui.js`
- **Rendering effects** → Fragment shader in `shaders.js`
- **Rendering logic** → `RenderEngine` in `renderEngine.js`

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

(Requires WebGL 2.0)

## License

MIT - Use freely for personal or commercial projects
