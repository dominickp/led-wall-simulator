/**
 * LED rendering engine - handles shaders and rendering
 */

export class RenderEngine {
  constructor(vertexShader, fragmentShader) {
    this.shader = null;
    this.video = null;
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.isVideoLoaded = false;
    this.videoFileName = "";
    this.recorder = null;
    this.recordedChunks = [];
    this.recordingActive = false;
    this.recordingMimeType = "";
    this.lastRecordingError = null;
    this._recordingStopPromise = null;
    this._recordingStopResolver = null;
    this.audioContext = null;
    this.audioSource = null;
    this.audioDestination = null;
  }

  initialize() {
    this.shader = createShader(this.vertexShader, this.fragmentShader);
  }

  loadVideo(file, onVideoReady) {
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (this.video) this.video.remove();
    this.videoFileName = file.name || "";
    this.audioSource = null;
    this.audioDestination = null;

    console.log("Creating video element from:", file.name);
    this.video = createVideo(url, () => {
      console.log("Video ready callback triggered");
      this.video.volume(1);
      this.video.loop();
      this.video.hide();
      this.isVideoLoaded = true;
      console.log("Video is now loaded and ready to render");
      if (onVideoReady) onVideoReady();
    });
  }

  render(cols, rows, pitch, bloom) {
    if (!this.isVideoLoaded) {
      background(0);
      return;
    }

    background(0);
    shader(this.shader);

    // Pass uniforms to shader
    this.shader.setUniform("tex0", this.video);
    this.shader.setUniform("resolution", [width, height]);
    this.shader.setUniform("ledCount", [cols, rows]);
    this.shader.setUniform("pitch", pitch);
    this.shader.setUniform("bloom", bloom);

    rect(0, 0, width, height);
    resetShader();
  }

  togglePlayPause() {
    if (!this.video || !this.isVideoLoaded) return;
    if (this.video.elt.paused) this.video.play();
    else this.video.pause();
  }

  play() {
    if (!this.video || !this.isVideoLoaded) return;
    this.video.play();
  }

  pause() {
    if (!this.video || !this.isVideoLoaded) return;
    this.video.pause();
  }

  setPlaybackTime(seconds) {
    if (!this.video || !this.isVideoLoaded) return;
    this.video.elt.currentTime = seconds;
  }

  getCurrentTime() {
    return this.video ? this.video.elt.currentTime : 0;
  }

  getDuration() {
    return this.video ? this.video.elt.duration : 0;
  }

  getVideoFileName() {
    return this.videoFileName || "";
  }

  getRecordingSupport() {
    const support = { ok: true, reasons: [] };
    if (typeof MediaRecorder === "undefined") {
      support.ok = false;
      support.reasons.push("MediaRecorder is not available");
    }
    const canvas =
      document.querySelector("#canvas-container canvas") ||
      document.querySelector("canvas");
    if (!canvas) {
      support.ok = false;
      support.reasons.push("Canvas element not found");
    } else if (!canvas.captureStream) {
      support.ok = false;
      support.reasons.push("Canvas captureStream is not supported");
    }
    return support;
  }

  getAudioTracks() {
    const videoEl = this.video?.elt;
    if (!videoEl) return [];

    if (videoEl.captureStream) {
      const audioTracks = videoEl.captureStream().getAudioTracks();
      if (audioTracks.length > 0) return audioTracks;
    }

    if (
      typeof AudioContext === "undefined" &&
      typeof webkitAudioContext === "undefined"
    ) {
      return [];
    }

    if (!this.audioContext) {
      const Ctor = AudioContext || webkitAudioContext;
      this.audioContext = new Ctor();
    }

    if (!this.audioSource) {
      this.audioSource = this.audioContext.createMediaElementSource(videoEl);
    }

    if (!this.audioDestination) {
      this.audioDestination = this.audioContext.createMediaStreamDestination();
      this.audioSource.connect(this.audioDestination);
      this.audioSource.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }

    return this.audioDestination.stream.getAudioTracks();
  }

  waitForPlaybackStart(timeoutMs = 2000) {
    return new Promise((resolve) => {
      const videoEl = this.video?.elt;
      if (!videoEl) {
        resolve(false);
        return;
      }

      if (!videoEl.paused && videoEl.readyState >= 2) {
        resolve(true);
        return;
      }

      let resolved = false;
      const startTime = performance.now();
      const startPosition = videoEl.currentTime || 0;

      const finalize = (result) => {
        if (resolved) return;
        resolved = true;
        resolve(result);
      };

      const poll = () => {
        if (resolved) return;
        const elapsed = performance.now() - startTime;
        const progressed = videoEl.currentTime > startPosition + 0.03;
        const playing = !videoEl.paused && videoEl.readyState >= 2;

        if (progressed || (playing && elapsed > 250)) {
          finalize(true);
          return;
        }

        if (elapsed >= timeoutMs) {
          finalize(false);
          return;
        }

        requestAnimationFrame(poll);
      };

      requestAnimationFrame(poll);
    });
  }

  startRecording({
    includeAudio = true,
    mimeType,
    fps = 30,
    videoBitsPerSecond,
    audioBitsPerSecond,
    timesliceMs = 1000,
  } = {}) {
    if (!this.video || !this.isVideoLoaded || this.recordingActive)
      return false;

    this.lastRecordingError = null;
    const support = this.getRecordingSupport();
    if (!support.ok) {
      this.lastRecordingError = support.reasons.join("; ");
      return false;
    }

    const canvas =
      document.querySelector("#canvas-container canvas") ||
      document.querySelector("canvas");
    if (!canvas || !canvas.captureStream) {
      this.lastRecordingError = "Canvas captureStream is not supported";
      return false;
    }

    const canvasStream = canvas.captureStream(fps);
    const tracks = [...canvasStream.getVideoTracks()];

    if (includeAudio) {
      const audioTracks = this.getAudioTracks();
      if (audioTracks.length > 0) tracks.push(...audioTracks);
    }

    const audioPreferredTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
    ];

    let selectedType =
      mimeType && MediaRecorder.isTypeSupported(mimeType) ? mimeType : null;

    if (!selectedType && includeAudio) {
      selectedType = audioPreferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
    }

    if (!selectedType) {
      selectedType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";
    }

    this.recordingMimeType = selectedType;
    this.recordedChunks = [];
    this.recordingActive = true;

    const recorderOptions = { mimeType: selectedType };
    if (typeof videoBitsPerSecond === "number") {
      recorderOptions.videoBitsPerSecond = videoBitsPerSecond;
    }
    if (typeof audioBitsPerSecond === "number") {
      recorderOptions.audioBitsPerSecond = audioBitsPerSecond;
    }

    this.recorder = new MediaRecorder(new MediaStream(tracks), recorderOptions);

    this.recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.recorder.onerror = (event) => {
      this.lastRecordingError = event?.error || event;
    };

    this._recordingStopPromise = new Promise((resolve) => {
      this._recordingStopResolver = resolve;
    });

    this.recorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, {
        type: this.recordingMimeType,
      });
      this.recordingActive = false;
      this.recorder = null;
      if (this._recordingStopResolver) this._recordingStopResolver(blob);
      this._recordingStopResolver = null;
    };

    this.video.noLoop();
    this.recorder.start(timesliceMs);
    return true;
  }

  async stopRecording() {
    if (!this.recorder || !this.recordingActive) return null;
    this.recorder.stop();
    this.video.loop();
    const blob = await this._recordingStopPromise;
    this._recordingStopPromise = null;
    return blob;
  }

  getRecordingError() {
    return this.lastRecordingError;
  }
}
