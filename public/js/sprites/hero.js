export function createHeroGroup(scene, mapData) {
  const heroTexture = scene.textures.get('hero');
  if (!heroTexture) {
    console.error('Hero texture not found');
    return { heroGroup: null, heroPositions: [] };
  }

  const spriteWidth = 112;
  const spriteHeight = 112;
  const sheetWidth = 1680; // Updated to 1680
  const sheetHeight = 1120; // Updated to 1120
  let frameIndex = 0;

  // Clear existing frames to avoid duplicates
  heroTexture.frames = {};

  // Add frames to the hero texture
  for (let y = 0; y < sheetHeight; y += spriteHeight) {
    for (let x = 0; x < sheetWidth; x += spriteWidth) {
      heroTexture.add(frameIndex, 0, x, y, spriteWidth, spriteHeight);
      frameIndex++;
    }
  }

  if (scene.DEBUG) {
    console.log(`Created ${frameIndex} frames for hero texture`); // Should log 150
  }

  const heroGroup = scene.add.group({
    maxSize: 10,
    createCallback: (sprite) => {
      sprite.setOrigin(0.5, 0.5);
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.setDepth(0);
      sprite.setAngle(0);
      sprite.setPosition(0, 0);
      sprite.setTexture('hero');
      sprite.setDisplaySize(112, 112);
    }
  });

  heroGroup.createMultiple({ key: 'hero', repeat: 499 });

  const heroPositions = [];
  const numHeroes = 10;
  const mapWidth = mapData[0].length * 32;
  const mapHeight = mapData.length * 32;

  for (let i = 0; i < numHeroes; i++) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    while (!placed && attempts < maxAttempts) {
      const x = Math.round(Math.random() * mapWidth);
      const y = Math.round(Math.random() * mapHeight);
      const mapCol = Math.floor(x / 32);
      const mapRow = Math.floor(y / 32);
      if (mapRow >= 0 && mapRow < mapData.length && mapCol >= 0 && mapCol < mapData[0].length) {
        const tileValue = mapData[mapRow][mapCol][0];
        const tile = tileValue - 1;
        if (tile <= 512 && tile !== 511) {
          const frame = 4; // 0 to 149
          heroPositions.push({ x, y, frame });
          placed = true;
        }
      }
      attempts++;
    }
  }

  if (scene.DEBUG) {
    console.log(`Created ${heroGroup.getLength()} hero sprites`);
    console.log(`Placed ${heroPositions.length} heroes`);
  }

  return { heroGroup, heroPositions };
}

export function getHeroFrame(scene, frameIndex) {
  const frame = scene.textures.get('hero').frames[frameIndex];
  if (!frame) {
    console.warn(`Frame ${frameIndex} not found in hero texture`);
  }
  return frame;
}