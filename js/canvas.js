/**
 * Canvas sizing and management
 */

export class CanvasManager {
  static initialize() {
    // Listen for fullscreen changes and resize appropriately
    document.addEventListener("fullscreenchange", () => {
      const cols = parseFloat(
        document.querySelector("#ledColsSelect").value || 256,
      );
      const rows = parseFloat(
        document.querySelector("#ledRowsSelect").value || 256,
      );
      this.resizeCanvas(cols, rows);
    });
  }

  static resizeCanvas(cols, rows) {
    const aspect = cols / rows;

    // Check if in fullscreen
    const isFullscreen = document.fullscreenElement !== null;
    let newW, newH;

    if (isFullscreen) {
      // Calculate based on available screen space
      const availWidth = window.innerWidth;
      const availHeight = window.innerHeight;
      const availAspect = availWidth / availHeight;

      if (aspect > availAspect) {
        // Canvas is wider - fit to width
        newW = availWidth;
        newH = Math.round(availWidth / aspect);
      } else {
        // Canvas is taller - fit to height
        newW = Math.round(availHeight * aspect);
        newH = availHeight;
      }
    } else {
      // Normal windowed mode
      // Scale canvas progressively with LED count
      // 64x64 = 600px, 128x128 = 728px, 256x256 = 984px
      const maxDim = Math.max(cols, rows);
      const baseSize = 600 + (maxDim - 64) * 2;

      newW = baseSize;
      newH = baseSize;

      if (aspect > 1) {
        // wider than tall
        newW = baseSize;
        newH = Math.round(baseSize / aspect);
      } else {
        // taller than wide
        newW = Math.round(baseSize * aspect);
        newH = baseSize;
      }
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
