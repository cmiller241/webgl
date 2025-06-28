export function createHeroGroup(scene, mapData) {
  const heroTexture = scene.textures.get('hero');
  const spriteWidth = 112;
  const spriteHeight = 112;
  const sheetWidth = 672;
  const sheetHeight = 672;
  let frameIndex = 0;

  for (let y = 0; y < sheetHeight; y += spriteHeight) {
    for (let x = 0; x < sheetWidth; x += spriteWidth) {
      heroTexture.add(frameIndex, 0, x, y, spriteWidth, spriteHeight);
      frameIndex++;
    }
  }

  const heroGroup = scene.add.group({
    maxSize: 500,
    createCallback: (sprite) => {
      sprite.setOrigin(0.5, 0.5);
      sprite.setActive(false);
      sprite.setVisible(false);
      sprite.setDepth(0);
      sprite.setAngle(0);
      sprite.setPosition(0, 0);
      sprite.setTexture('hero', Math.floor(Math.random() * frameIndex));
      sprite.setDisplaySize(112, 112);
    }
  });

  heroGroup.createMultiple({ key: 'hero', frame: 0, repeat: 1000 });

  const heroPositions = [];
  const numHeroes = 500;
  const mapWidth = mapData[0].length * 32;
  const mapHeight = mapData.length * 32;

  for (let i = 0; i < numHeroes; i++) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    while (!placed && attempts < maxAttempts) {
      const x = Math.round(Math.random() * mapWidth); // Round to integer
      const y = Math.round(Math.random() * mapHeight); // Round to integer
      const mapCol = Math.floor(x / 32);
      const mapRow = Math.floor(y / 32);
      if (mapRow >= 0 && mapRow < mapData.length && mapCol >= 0 && mapCol < mapData[0].length) {
        const tileValue = mapData[mapRow][mapCol][0];
        const tile = tileValue - 1;
        if (tile <= 512 && tile !== 511) {
          heroPositions.push({ x, y });
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
  return scene.textures.get('hero').frames[frameIndex];
}