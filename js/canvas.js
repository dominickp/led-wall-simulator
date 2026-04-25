/**
 * Canvas sizing and management
 */

export class CanvasManager {
  static currentDims = { cols: 64, rows: 64 };
  static _resizeQueued = false;
  static _resizeObserver = null;
  static _scheduleResize = null;
  static _fixedSize = null;

  static initialize() {
    // Listen for fullscreen changes and resize appropriately
    document.addEventListener("fullscreenchange", () => {
      // Map slider index to actual grid size (matches UI GRID_POWERS)
      const GRID_POWERS = [8, 16, 32, 64, 96, 128, 192, 256];
      const colsIdx =
        parseInt(document.querySelector("#ledColsSelect").value, 10) || 4;
      const rowsIdx =
        parseInt(document.querySelector("#ledRowsSelect").value, 10) || 4;
      const cols = GRID_POWERS[colsIdx] || GRID_POWERS[4];
      const rows = GRID_POWERS[rowsIdx] || GRID_POWERS[4];
      this.resizeCanvas(cols, rows);
    });

    this.setupAutoResize();
  }

  static setupAutoResize() {
    this._scheduleResize = () => {
      if (this._resizeQueued) return;
      this._resizeQueued = true;
      requestAnimationFrame(() => {
        this._resizeQueued = false;
        this.applyResize();
      });
    };

    window.addEventListener("resize", this._scheduleResize);

    const wrapper = document.querySelector(".canvas-wrapper");
    if (wrapper && "ResizeObserver" in window) {
      this._resizeObserver = new ResizeObserver(this._scheduleResize);
      this._resizeObserver.observe(wrapper);
    }
  }

  static resizeCanvas(cols, rows) {
    this.currentDims = { cols, rows };
    this.applyResize();
  }

  static setFixedCanvasSize(width, height) {
    if (!width || !height) return;
    this._fixedSize = {
      width: Math.round(width),
      height: Math.round(height),
    };
    this.applyResize();
  }

  static clearFixedCanvasSize() {
    this._fixedSize = null;
    this.applyResize();
  }

  static applyResize() {
    const dims = this.currentDims || { cols: 64, rows: 64 };
    const fixed = this._fixedSize;
    const aspect = fixed ? fixed.width / fixed.height : dims.cols / dims.rows;

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
      const wrapper = document.querySelector(".canvas-wrapper");
      let availWidth = wrapper ? wrapper.clientWidth : window.innerWidth;
      let availHeight = wrapper ? wrapper.clientHeight : window.innerHeight;

      if (!availWidth || !availHeight) {
        availWidth = window.innerWidth;
        availHeight = window.innerHeight;
      }

      if (aspect > availWidth / availHeight) {
        newW = availWidth;
        newH = Math.round(availWidth / aspect);
      } else {
        newW = Math.round(availHeight * aspect);
        newH = availHeight;
      }
    }

    if (fixed) {
      window.resizeCanvas(fixed.width, fixed.height);
      const canvas = document.querySelector("canvas");
      if (canvas) {
        canvas.style.width = `${newW}px`;
        canvas.style.height = `${newH}px`;
      }
    } else {
      window.resizeCanvas(newW, newH);
      const canvas = document.querySelector("canvas");
      if (canvas) {
        canvas.style.width = "";
        canvas.style.height = "";
      }
    }

    const wrapper = document.querySelector(".canvas-wrapper");
    const container = document.querySelector("#canvas-container");
    if (wrapper) {
      wrapper.style.setProperty("--canvas-aspect", String(aspect));
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "center";
      wrapper.style.alignItems = "center";
    }
    if (container) {
      container.style.height = "100%";
      container.style.width = "100%";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      container.style.alignItems = "center";
    }
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
