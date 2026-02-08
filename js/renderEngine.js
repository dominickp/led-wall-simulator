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
  }

  initialize() {
    this.shader = createShader(this.vertexShader, this.fragmentShader);
  }

  loadVideo(file, onVideoReady) {
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (this.video) this.video.remove();

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
}
