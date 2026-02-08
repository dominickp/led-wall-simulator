/**
 * Canvas sizing and management
 */

export class CanvasManager {
  static resizeCanvas(cols, rows) {
    const aspect = cols / rows;

    // Scale canvas progressively with LED count
    // 64x64 = 600px, 128x128 = 728px, 256x256 = 984px
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

  static toggleFullscreen() {
    const el = document.querySelector("#canvas-container");
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
}
