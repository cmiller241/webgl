const DEBUG = false; // Set to true to enable console logging

export function render(cameraX, cameraY) {
  let activeGrassSprites = this.activeGrassSprites || [];
  this.activeGrassSprites = activeGrassSprites; // Persist across calls
  const spriteWidth = 32;
  const spriteHeight = 32;
  const canvasWidth = this.game.config.width;
  const canvasHeight = this.game.config.height;
  
  activeGrassSprites.forEach(sprite => this.grassGroup.killAndHide(sprite)); // Deactivate and hide grass sprites
  activeGrassSprites = [];
  this.trunkGroup.getChildren().forEach(sprite => {
    sprite.active = false;
    sprite.visible = false;
    sprite.setPosition(0, 0);
  });
  this.leavesGroup.getChildren().forEach(sprite => {
    sprite.active = false;
    sprite.visible = false;
    sprite.setPosition(0, 0);
  });
  this.heroGroup.getChildren().forEach(sprite => {
    sprite.active = false;
    sprite.visible = false;
    sprite.setPosition(0, 0);
    sprite.resetPipeline();
  });

  // Tighter culling bounds with extra buffer for right edge
  const bufferTiles = 5; // Increased from 5 to 7
  const startCol = Math.max(0, Math.floor(cameraX / spriteWidth) - bufferTiles);
  const startRow = Math.max(0, Math.floor(cameraY / spriteHeight) - bufferTiles);
  const endCol = Math.min(this.mapData[0].length, Math.ceil((cameraX + canvasWidth + spriteWidth) / spriteWidth) + bufferTiles);
  const endRow = Math.min(this.mapData.length, Math.ceil((cameraY + canvasHeight + spriteHeight) / spriteHeight) + bufferTiles);

  // Debug culling bounds
  if (DEBUG) {
    console.log(`Culling bounds: cols ${startCol} to ${endCol-1}, rows ${startRow} to ${endRow-1}, cameraX: ${cameraX}, canvasWidth: ${canvasWidth}`);
  }

  let grassCount = 0;
  let treeCount = 0;
  let heroCount = 0;
  let mountainCount = 0;

  // Debug sprite pool availability
  const availableGrassSprites = this.grassGroup.getTotalFree();
  if (DEBUG) {
    console.log(`Available grass sprites: ${availableGrassSprites}`);
  }

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tileValue = this.mapData[row][col][0];
      const elevation = this.mapData[row][col][1]; // Elevation value
      const tile = tileValue - 1;

      if (tile < 511 || tile === 511) {
        const grassX = col * spriteWidth;
        const grassY = row * spriteHeight + elevation; // Apply elevation offset
        const grassSprite = this.grassGroup.get(grassX, grassY);
        let tempTile = tile === 511 ? 0 : tile;

        // Adjust tempTile based on neighboring elevations
        // Check top edge
        if (row > 0 && this.mapData[row - 1][col][1] <= elevation) {
          tempTile += 1;
        }
        // Check right edge
        if (col < this.mapData[row].length - 1 && this.mapData[row][col + 1][1] <= elevation) {
          tempTile += 2;
        }
        // Check left edge
        if (col > 0 && this.mapData[row][col - 1][1] <= elevation) {
          tempTile += 4;
        }

        if (grassSprite) {
          grassSprite.setTexture('grass', tempTile); // Use adjusted tile as frame index
          grassSprite.setDepth(elevation !== 0 ? row * 10 + 3 : 0); // Elevated grass above trees/heroes
          grassSprite.setActive(true);
          grassSprite.setVisible(true);
          activeGrassSprites.push(grassSprite);
          grassCount++;
        } else if (DEBUG) {
          console.warn(`No grass sprite at (${grassX}, ${grassY}), tile: ${tempTile}, available: ${this.grassGroup.getTotalFree()}`);
        }

        // Add mountain face sprites for elevated tiles
        if (elevation !== 0) {
          const zHeight = elevation / spriteHeight; // Number of mountain faces (e.g., -32 → -1, -64 → -2)
          for (let i = 0; i >= zHeight+1; i--) {
            let mSprite = 32;

            // Bitwise adjustments for mountain face sprite
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
              mountainSprite.setDepth(row * 10 + 2.5); // Below grass, above trees/heroes
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

      // Add at top of render function
      const PI = Math.PI;
      const DEG_TO_RAD = 180 / PI;

      // Inside tree rendering (tile === 511)
      if (tile === 511) {
        const amplitude = (3 * PI) / 180;
        const rotation = amplitude * Math.sin(2 * (this.updateData?.time || 0) + 0.5 * col);
        const rotationDeg = rotation * DEG_TO_RAD; // Cache rotation in degrees

        const centerX = Math.floor(col * spriteWidth - 240 + 16) + 240;
        const baseY = Math.floor(row * spriteHeight - 240 + 16) + 480;

        const trunkSprite = this.trunkGroup.get(centerX, baseY);
        if (trunkSprite) {
          trunkSprite.setTexture('tree', 0)
            .setDepth(row * 10 + 1)
            .setAngle(rotationDeg)
            .setY(baseY - 240)
            .setActive(true)
            .setVisible(true);
          treeCount++;
        } else if (DEBUG) {
          console.warn(`No trunk sprite at (${centerX}, ${baseY}), tile: ${tile}`);
        }

        const leavesSprite = this.leavesGroup.get(centerX, baseY - 1);
        if (leavesSprite) {
          leavesSprite.setTexture('tree', 1)
            .setDepth(row * 10 + 2)
            .setAngle(rotationDeg)
            .setY(baseY - 240)
            .setActive(true)
            .setVisible(true)
            .setTint((0x80 + Math.floor((col % 10) * 25) << 16) | (0x80 + Math.floor((row % 10) * 8) << 8) | 0x10);
          treeCount++;
        } else if (DEBUG) {
          console.warn(`No leaves sprite at (${centerX}, ${baseY - 1}), tile: ${tile}`);
        }
      }
    }
  }

  this.heroPositions.forEach(({ x, y }) => {
    if (x >= cameraX - 112 && x <= cameraX + canvasWidth + 112 &&
        y >= cameraY - 112 && y <= cameraY + canvasHeight + 112) {
      const heroSprite = this.heroGroup.get(x, y);
      if (heroSprite) {
        heroSprite.setTexture('hero'); // Frame already set in hero.js
        heroSprite.setDepth((y / spriteHeight) * 10 + 1.5);
        heroSprite.setActive(true);
        heroSprite.setVisible(true);
        if (this.game.renderer.pipelines && this.game.renderer.pipelines.get('HeroPipeline')) {
          heroSprite.setPipeline('HeroPipeline');
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