export function setupInput(scene) {
  const keys = scene.input.keyboard.addKeys({
    ArrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
    ArrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ArrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
    ArrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN
  });

  return keys;
}