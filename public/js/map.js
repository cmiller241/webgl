import { createGrassGroup, getGrassFrame } from './sprites/grass.js';
import { createTreeGroups, getTreeFrames } from './sprites/tree.js';
import { createHeroGroup, getHeroFrame } from './sprites/hero.js';
import { setupHeroShader } from './shaders/heroShader.js';

export function create() {
  this.DEBUG = false; // Set debug flag
  this.mapData = this.cache.json.get('map');

  function checkMapDimensions(map, expectedCols = null) {
    if (!Array.isArray(map) || !map.length || !Array.isArray(map[0])) {
      if (this.DEBUG) console.error("Map data is not a valid 2D array.");
      return false;
    }

    const numRows = map.length;
    const referenceCols = expectedCols !== null ? expectedCols : map[0].length;
    
    if (this.DEBUG) console.log(`Checking map: ${map[0].length}x${numRows}, expecting ${referenceCols} columns`);

    let isValid = true;
    for (let row = 0; row < numRows; row++) {
      if (!Array.isArray(map[row]) || map[row].length !== referenceCols) {
        if (this.DEBUG) console.error(`Row ${row} has ${map[row]?.length || 0} columns, expected ${referenceCols}`);
        isValid = false;
      }
    }

    if (isValid) {
      if (this.DEBUG) console.log("Map dimensions valid.");
    } else {
      if (this.DEBUG) console.error("Map validation failed!");
    }
    return isValid;
  }

  if (!checkMapDimensions.call(this, this.mapData)) {
    if (this.DEBUG) console.error("Stopping game initialization due to invalid map.");
    return;
  }

  if (this.DEBUG) {
    console.log('Map loaded:', this.mapData[0].length, 'x', this.mapData.length);
    console.log(`Canvas size: ${window.innerWidth}x${window.innerHeight}`);
    console.log('Renderer type:', this.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas');
    console.log('Pipeline manager:', !!this.game.renderer.pipelines);
  }

  this.pipelineApplied = setupHeroShader(this);

  this.grassGroup = createGrassGroup(this);
  this.grassFrame = getGrassFrame(this);
  const { trunkGroup, leavesGroup } = createTreeGroups(this);
  this.trunkGroup = trunkGroup;
  this.leavesGroup = leavesGroup;
  const { trunkFrame, leavesFrame } = getTreeFrames(this);
  this.trunkFrame = trunkFrame;
  this.leavesFrame = leavesFrame;
  const { heroGroup, heroPositions } = createHeroGroup(this, this.mapData);
  this.heroGroup = heroGroup;
  this.heroPositions = heroPositions;
  this.heroFrame = getHeroFrame(this);

  if (!this.fpsBox) {
    this.fpsBox = this.add.rectangle(10, 10, 180, 60, 0x000000).setOrigin(0).setAlpha(0.5);
    this.fpsBox.setScrollFactor(0);
    this.fpsBox.setDepth(1000);
  }
  if (!this.fpsText) {
    this.fpsText = this.add.text(20, 20, 'FPS: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#ffffff'
    }).setOrigin(0);
    this.fpsText.setScrollFactor(0);
    this.fpsText.setDepth(1001);
  }

  this.cameras.main.setZoom(1);
  this.cameras.main.setBounds(
    0, 0,
    this.mapData[0].length * 32,
    this.mapData.length * 32
  );
  this.cameras.main.scrollX = 0;
  this.cameras.main.scrollY = 0;
  this.cameras.main.roundPixels = true;

  if (this.DEBUG) console.log('Map sample (5x5):', JSON.stringify(this.mapData.slice(0, 5).map(row => row.slice(0, 5))));

  if (this.DEBUG) console.log('Init complete');
}