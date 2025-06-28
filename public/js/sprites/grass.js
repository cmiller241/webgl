export function createGrassGroup(scene) {
  const grassTexture = scene.textures.get('grass');
  const spriteWidth = 32;
  const spriteHeight = 32;
  const sheetWidth = 512; // Assumed spritesheet width
  const sheetHeight = 512; // Assumed spritesheet height
  let frameIndex = 0;

  // Iterate through spritesheet to add frames
  for (let y = 0; y < sheetHeight; y += spriteHeight) {
    for (let x = 0; x < sheetWidth; x += spriteWidth) {
      grassTexture.add(frameIndex, 0, x, y, spriteWidth, spriteHeight);
      frameIndex++;
    }
  }

  const grassGroup = scene.add.group({
    maxSize: 1500,
    createCallback: (sprite) => {
      sprite.setOrigin(0);
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.setDepth(0);
      sprite.setAngle(0);
      sprite.setPosition(0, 0);
      sprite.setTexture('grass', 0); // Default to frame 0
      sprite.setDisplaySize(32, 32);
    }
  });

  grassGroup.createMultiple({ key: 'grass', frame: 0, repeat: 4999 });
  if (scene.DEBUG) {
    console.log(`Created ${grassGroup.getLength()} grass sprites`);
  }

  return grassGroup;
}

export function getGrassFrame(scene, frameIndex) {
  return scene.textures.get('grass').frames[frameIndex];
}