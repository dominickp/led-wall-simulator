# LED Sign Simulator

**[🔗 Live Demo](http://led.dominick.cc/)**

This is a front-end application that transforms standard video files into a simulated LED matrix display. It allows users to visualize how low-resolution content (e.g., 256x256) looks when rendered on physical diodes, accounting for pixel pitch (the gap between LEDs) and light emission characteristics.

<video src="https://github.com/user-attachments/assets/f91caadb-07ee-4732-916c-77a1e181669c" autoplay muted loop controls></video>

### Functional Requirements
 - Local Video Playback: Users must be able to load local .mp4, .mov, or .webm files via the browser’s File API without uploading data to a server.
 - Configurable panel size: Allow the user to change different aspect ratios and grid sizes (e.g. 128x256 vs 512x512)
 - Resolution Simulation: The tool must downsample or map video input to specific LED grid sizes (e.g., 64x64, 128x128, or 256x256).
 - Physical Pitch Control: A slider to adjust the "gap" between simulated LEDs to mimic different density panels (e.g., P3 vs. P6).
 - Transport Controls: Basic Play/Pause functionality and audio output from the source video.
 - Visual Fidelity: Real-time rendering of circular diodes and light bloom/glow to simulate high-brightness emitters.

### Technical Architecture
#### Core Technologies
- p5.js (WEBGL Mode): Acts as the primary engine for canvas management and video handling.
- GLSL (OpenGL Shading Language): Handles the "heavy lifting" by using a Fragment Shader to render thousands of LEDs simultaneously on the GPU.
- Web File API: Uses URL.createObjectURL to map local disk files to browser memory for instant playback.

#### Rendering Pipeline
  - Input Layer: Video is drawn to a hidden "source" buffer at its native resolution.
  - Processing Layer: The Fragment Shader divides the screen into a grid. It samples a single color from the center of each grid cell to ensure 1:1 pixel accuracy.
  - Output Layer: A mathematical mask is applied to each cell to draw a square. The area outside the square is rendered as black to simulate the panel's substrate.

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
