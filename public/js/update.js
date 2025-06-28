import { render } from './render.js';
import { setupInput } from './input.js';

export function update(gameTime, delta) {
  // Initialize persistent variables on first update
  if (!this.updateData) {
    this.updateData = {
      time: 0,
      frameTimes: [],
      lastFpsUpdate: 0,
      keys: setupInput(this)
    };
  }

  const { time, frameTimes, lastFpsUpdate, keys } = this.updateData;
  const maxFrameTimes = 60;
  const fpsUpdateInterval = 0.1;
  const cameraSpeed = 5;

    let cameraX = Math.round(this.cameras.main.scrollX);
    let cameraY = Math.round(this.cameras.main.scrollY);
    let newCameraX = cameraX;
    let newCameraY = cameraY;

    if (keys.ArrowLeft?.isDown) newCameraX -= cameraSpeed;
    if (keys.ArrowRight?.isDown) newCameraX += cameraSpeed;
    if (keys.ArrowUp?.isDown) newCameraY -= cameraSpeed;
    if (keys.ArrowDown?.isDown) newCameraY += cameraSpeed;

    newCameraX = Math.round(newCameraX);
    newCameraY = Math.round(newCameraY);

    if (newCameraX !== cameraX || newCameraY !== cameraY) {
        this.cameras.main.scrollX = newCameraX;
        this.cameras.main.scrollY = newCameraY;
        render.call(this, newCameraX, newCameraY);
    } else {
        render.call(this, cameraX, cameraY);
    }

  const fps = delta > 0 ? 1000 / delta : 0;
  frameTimes.push(fps);
  if (frameTimes.length > maxFrameTimes) frameTimes.shift();
  const avgFps = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

  if (this.fpsText && time - lastFpsUpdate >= fpsUpdateInterval) {
    this.fpsText.setText(`FPS: ${Math.round(avgFps)}`);
    this.updateData.lastFpsUpdate = time;
  }

  render.call(this, cameraX, cameraY);

  this.updateData.time += delta / 1000;
}