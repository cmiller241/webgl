export function createTreeGroups(scene) {
  const treeTexture = scene.textures.get('tree');
  const spriteWidth = 480;
  const spriteHeight = 480;
  const sheetWidth = 960; // Assumed spritesheet width
  const sheetHeight = 480; // Assumed spritesheet height
  let frameIndex = 0;

  // Iterate through spritesheet to add frames
  for (let y = 0; y < sheetHeight; y += spriteHeight) {
    for (let x = 0; x < sheetWidth; x += spriteWidth) {
      treeTexture.add(frameIndex, 0, x, y, spriteWidth, spriteHeight);
      frameIndex++;
    }
  }

  const trunkGroup = scene.add.group({
    maxSize: 500,
    createCallback: (sprite) => {
      sprite.setOrigin(0.5, 0.5);
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.setDepth(0);
      sprite.setAngle(0);
      sprite.setPosition(0, 0);
      sprite.setTexture('tree', 0); // Use frame 0 for trunk
      sprite.setDisplaySize(480, 480);
    }
  });

  const leavesGroup = scene.add.group({
    maxSize: 500,
    createCallback: (sprite) => {
      sprite.setOrigin(0.5, 0.5);
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.setDepth(0);
      sprite.setAngle(0);
      sprite.setPosition(0, 0);
      sprite.setTexture('tree', 1); // Use frame 1 for leaves
      sprite.setDisplaySize(480, 480);
    }
  });

  trunkGroup.createMultiple({ key: 'tree', frame: 0, repeat: 499 });
  leavesGroup.createMultiple({ key: 'tree', frame: 1, repeat: 499 });

  if (scene.DEBUG) {
    console.log(`Created ${trunkGroup.getLength()} trunk sprites, ${leavesGroup.getLength()} leaves sprites`);
  }

  return { trunkGroup, leavesGroup };
}

export function getTreeFrames(scene) {
  const treeTexture = scene.textures.get('tree');
  return {
    trunkFrame: treeTexture.frames[0],
    leavesFrame: treeTexture.frames[1]
  };
}