const DEBUG = false;

export function render(cameraX, cameraY) {
  let activeGrassSprites = this.activeGrassSprites || [];
  this.activeGrassSprites = activeGrassSprites;
  const spriteWidth = 32;
  const spriteHeight = 32;
  const canvasWidth = this.game.config.width;
  const canvasHeight = this.game.config.height;
  
  activeGrassSprites.forEach(sprite => this.grassGroup.killAndHide(sprite));
  activeGrassSprites = [];
  this.trunkGroup.getChildren().forEach(sprite => {
    sprite.active = false;
    sprite.visible = false;
    sprite.setPosition(0, 0);
    sprite.resetPipeline();
  });
  this.leavesGroup.getChildren().forEach(sprite => {
    sprite.active = false;
    sprite.visible = false;
    sprite.setPosition(0, 0);
    sprite.resetPipeline();
  });
  this.heroGroup.getChildren().forEach(sprite => {
    sprite.active = false;
    sprite.visible = false;
    sprite.setPosition(0, 0);
    sprite.resetPipeline();
  });

  const bufferTiles = 5;
  const startCol = Math.max(0, Math.floor(cameraX / spriteWidth) - bufferTiles);
  const startRow = Math.max(0, Math.floor(cameraY / spriteHeight) - bufferTiles);
  const endCol = Math.min(this.mapData[0].length, Math.ceil((cameraX + canvasWidth + spriteWidth) / spriteWidth) + bufferTiles);
  const endRow = Math.min(this.mapData.length, Math.ceil((cameraY + canvasHeight + spriteHeight) / spriteHeight) + bufferTiles);

  if (DEBUG) {
    console.log(`Culling bounds: cols ${startCol} to ${endCol-1}, rows ${startRow} to ${endRow-1}, cameraX: ${cameraX}, canvasWidth: ${canvasWidth}`);
  }

  let grassCount = 0;
  let treeCount = 0;
  let heroCount = 0;
  let mountainCount = 0;

  const availableGrassSprites = this.grassGroup.getTotalFree();
  if (DEBUG) {
    console.log(`Available grass sprites: ${availableGrassSprites}`);
  }

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tileValue = this.mapData[row][col][0];
      const elevation = this.mapData[row][col][1];
      const tile = tileValue - 1;

      if (tile < 511 || tile === 511) {
        const grassX = col * spriteWidth;
        const grassY = row * spriteHeight + elevation;
        const grassSprite = this.grassGroup.get(grassX, grassY);
        let tempTile = (tile === 511 || tile === 9) ? 0 : tile;

        if (row > 0 && this.mapData[row - 1][col][1] <= elevation) {
          tempTile += 1;
        }
        if (col < this.mapData[row].length - 1 && this.mapData[row][col + 1][1] <= elevation) {
          tempTile += 2;
        }
        if (col > 0 && this.mapData[row][col - 1][1] <= elevation) {
          tempTile += 4;
        }

        if (grassSprite) {
          grassSprite.setTexture('grass', tempTile);
          grassSprite.setDepth(elevation !== 0 ? row * 10 + 3 : 0);
          grassSprite.setActive(true);
          grassSprite.setVisible(true);
          activeGrassSprites.push(grassSprite);
          grassCount++;
        } else if (DEBUG) {
          console.warn(`No grass sprite at (${grassX}, ${grassY}), tile: ${tempTile}, available: ${this.grassGroup.getTotalFree()}`);
        }

        if (elevation !== 0) {
          const zHeight = elevation / spriteHeight;
          for (let i = 0; i >= zHeight+1; i--) {
            let mSprite = 32;

            if (this.mapData[row][col + 1][1] / spriteHeight < i) {
              mSprite += 1;
            }
            if (this.mapData[row][col - 1][1] / spriteHeight < i) {
              mSprite += 2;
            }
            if (zHeight < -1) {
              mSprite += 4;
            }
            if (i !== 0 && i !== zHeight) {
              mSprite += 4;
            }
            if (i === zHeight + 1 && i !== 0) {
              mSprite += 4;
            }

            const mountainY = row * spriteHeight + i * spriteHeight;
            const mountainSprite = this.grassGroup.get(grassX, mountainY);
            if (mountainSprite) {
              mountainSprite.setTexture('grass', mSprite);
              mountainSprite.setDepth(row * 10 + 2.5);
              mountainSprite.setActive(true);
              mountainSprite.setVisible(true);
              activeGrassSprites.push(mountainSprite);
              mountainCount++;
            } else if (DEBUG) {
              console.warn(`No mountain sprite at (${grassX}, ${mountainY}), tile: ${mSprite}, available: ${this.grassGroup.getTotalFree()}`);
            }
          }
        }
      }

      if (treeCount >= 500) continue;

      const PI = Math.PI;
      const DEG_TO_RAD = 180 / PI;

      if (tile === 511) {
        const amplitude = (3 * PI) / 180;
        const rotation = amplitude * Math.sin(2 * (this.updateData?.time || 0) + 0.5 * col);
        const rotationDeg = rotation * DEG_TO_RAD;

        const centerX = Math.floor(col * spriteWidth - 240 + 16) + 240;
        const baseY = Math.floor(row * spriteHeight - 240 + 16) + 480;

        const trunkSprite = this.trunkGroup.get(centerX, baseY);
        if (trunkSprite) {
          trunkSprite.setTexture('tree', 0)
            .setDepth(row * 10 + 5)
            .setAngle(rotationDeg)
            .setY(baseY - 240)
            .setActive(true)
            .setVisible(true);
          if (this.game.renderer.pipelines && this.game.renderer.pipelines.get('TrunkPipeline')) {
            trunkSprite.setPipeline('TrunkPipeline');
            if (DEBUG) console.log(`TrunkPipeline applied at (${centerX}, ${baseY})`);
            if (DEBUG) console.log('Trunk frame data:', {
              textureKey: trunkSprite.texture.key,
              textureWidth: trunkSprite.texture.width,
              textureHeight: trunkSprite.texture.height,
              frameWidth: trunkSprite.frame.width,
              frameHeight: trunkSprite.frame.height,
              uvs: trunkSprite.frame.uvs,
              frameName: trunkSprite.frame.name
            });
          }
          treeCount++;
        } else if (DEBUG) {
          console.warn(`No trunk sprite at (${centerX}, ${baseY}), tile: ${tile}`);
        }

        // const leavesSprite = this.leavesGroup.get(centerX, baseY - 1);
        // if (leavesSprite) {
        //   leavesSprite.setTexture('tree', 1)
        //     .setDepth(row * 10 + 20)
        //     .setAngle(rotationDeg)
        //     .setY(baseY - 240)
        //     .setActive(true)
        //     .setVisible(true)
        //     .setTint((0x80 + Math.floor((col % 10) * 25) << 16) | (0x80 + Math.floor((row % 10) * 8) << 8) | 0x10);
        //   if (this.game.renderer.pipelines && this.game.renderer.pipelines.get('LeavesPipeline')) {
        //     //leavesSprite.setPipeline('LeavesPipeline');
        //     if (DEBUG) console.log(`LeavesPipeline applied at (${centerX}, ${baseY - 1})`);
        //     if (DEBUG) console.log('Leaves frame data:', {
        //       textureKey: leavesSprite.texture.key,
        //       textureWidth: leavesSprite.texture.width,
        //       textureHeight: leavesSprite.texture.height,
        //       frameWidth: leavesSprite.frame.width,
        //       frameHeight: leavesSprite.frame.height,
        //       uvs: leavesSprite.frame.uvs,
        //       frameName: leavesSprite.frame.name
        //     });
        //   }
        //   treeCount++;
        // } else if (DEBUG) {
        //   console.warn(`No leaves sprite at (${centerX}, ${baseY - 1}), tile: ${tile}`);
        // }
      }
    }
  }

  this.heroGroup.getChildren().forEach(sprite => {
    sprite.active = false;
    sprite.visible = false;
    sprite.setPosition(0, 0);
    sprite.resetPipeline();
  });

  this.heroPositions.forEach(({ x, y, frame }) => {
    if (x >= cameraX - 112 && x <= cameraX + canvasWidth + 112 &&
        y >= cameraY - 112 && y <= cameraY + canvasHeight + 112) {
      const heroSprite = this.heroGroup.get(x, y);
      if (heroSprite) {
        heroSprite.setTexture('hero', frame);
        heroSprite.setDepth((y / spriteHeight) * 10 + 1.5);
        heroSprite.setActive(true);
        heroSprite.setVisible(true);
        if (this.game.renderer.pipelines && this.game.renderer.pipelines.get('HeroPipeline')) {
          heroSprite.setPipeline('HeroPipeline');
          if (DEBUG) console.log(`HeroPipeline applied at (${x}, ${y})`);
        }
        heroCount++;
      } else if (DEBUG) {
        console.warn(`No hero sprite at (${x}, ${y})`);
      }
    }
  });

  if (DEBUG) {
    console.log(`Rendered ${grassCount} grass sprites, ${treeCount} tree sprites, ${heroCount} heroes, ${mountainCount} mountain sprites`);
  }

  this.activeGrassSprites = activeGrassSprites;
}