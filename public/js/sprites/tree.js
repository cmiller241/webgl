export function createTreeGroups(scene) {
  const treeTexture = scene.textures.get('tree');
  const spriteWidth = 480;
  const spriteHeight = 480;
  const sheetWidth = 1440;
  const sheetHeight = 480;

  // Clear existing frames to avoid duplicates
  Object.keys(treeTexture.frames).forEach(key => {
    if (key !== '__BASE') treeTexture.remove(key);
  });

  // Define only two frames for 1440x480px spritesheet
  treeTexture.add(0, 0, 0, 0, spriteWidth, spriteHeight); // Frame 0: trunk
  treeTexture.add(1, 0, 480, 0, spriteWidth, spriteHeight); // Frame 1: leaves

  const trunkGroup = scene.add.group({
    classType: Phaser.GameObjects.Sprite,
    maxSize: 500,
    createCallback: (sprite) => {
      sprite.setOrigin(0.5, 0.5);
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.setDepth(0);
      sprite.setAngle(0);
      sprite.setPosition(0, 0);
      sprite.setTexture('tree', 0);
      sprite.setDisplaySize(480, 480);
    }
  });

  const leavesGroup = scene.add.group({
    classType: Phaser.GameObjects.Sprite,
    maxSize: 500,
    createCallback: (sprite) => {
      sprite.setOrigin(0.5, 0.5);
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.setDepth(0);
      sprite.setAngle(0);
      sprite.setPosition(0, 0);
      sprite.setTexture('tree', 1);
      sprite.setDisplaySize(480, 480);
    }
  });

  trunkGroup.createMultiple({ key: 'tree', frame: 0, repeat: 499 });
  leavesGroup.createMultiple({ key: 'tree', frame: 1, repeat: 499 });

  if (scene.DEBUG) {
    console.log(`Created ${trunkGroup.getLength()} trunk sprites, ${leavesGroup.getLength()} leaves sprites`);
    console.log('Tree texture frames:', Object.keys(treeTexture.frames));
  }

  return { trunkGroup, leavesGroup };
}

export function getTreeFrames(scene) {
  const treeTexture = scene.textures.get('tree');
  const trunkFrame = treeTexture.get(0);
  const leavesFrame = treeTexture.get(1);

  if (scene.DEBUG) {
    console.log('Tree frames defined:', {
      trunkFrame: {
        width: trunkFrame?.width,
        height: trunkFrame?.height,
        uvs: trunkFrame?.uvs,
        name: trunkFrame?.name
      },
      leavesFrame: {
        width: leavesFrame?.width,
        height: leavesFrame?.height,
        uvs: leavesFrame?.uvs,
        name: leavesFrame?.name
      }
    });
  }

  return { trunkFrame, leavesFrame };
}