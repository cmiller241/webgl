let app;
let mapData;
let grassTexture, treeTexture;
let cameraX = 0, cameraY = 0, cameraSpeed = 5;
let keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
let sprites = [];
let uiContainer, fpsText, fpsBox;
let time = 0;
let frameTimes = [];
const maxFrameTimes = 60;

async function init() {
  app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0,
    resolution: window.devicePixelRatio || 1,
  });
  document.getElementById('game-container').appendChild(app.view);
  app.stage.sortableChildren = true;
  app.stage.scale.set(0.8, 0.8);

    // UI Layer
    uiContainer = new PIXI.Container();
    uiContainer.sortableChildren = true;
    uiContainer.zIndex = 1000;
    app.stage.addChild(uiContainer);

    // Counteract stage scaling for UI
    uiContainer.scale.set(1 / 0.8, 1 / 0.8);

    // FPS Box
    fpsBox = new PIXI.Graphics();
    fpsBox.beginFill(0x000000, 1); // Opaque for visibility
    fpsBox.drawRoundedRect(0, 0, 90, 22, 4);
    fpsBox.endFill();
    fpsBox.position.set(100, 150);
    fpsBox.zIndex = 0;
    uiContainer.addChild(fpsBox);

    // FPS Text
    fpsText = new PIXI.Text('FPS: 0', {
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    fill: 0xffffff,
    });
    fpsText.position.set(105, 153);
    fpsText.zIndex = 1;
    uiContainer.addChild(fpsText);

  // Load map
  try {
    const res = await fetch('/js/map.json');
    if (!res.ok) throw new Error(`Failed to load map.json: ${res.statusText}`);
    mapData = await res.json();
    console.log('Map loaded:', mapData[0].length, 'x', mapData.length);
  } catch (err) {
    console.error('Map load error:', err);
    return;
  }

  // Load textures
  try {
    await PIXI.Assets.load([
      { alias: 'grass', src: '/assets/sprites2.png' },
      { alias: 'tree', src: '/assets/tree3.png' },
    ]);
    grassTexture = PIXI.Assets.get('grass');
    treeTexture = PIXI.Assets.get('tree');
    grassTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

    app.ticker.add((delta) => {
      update(delta);
      render();
    });
  } catch (err) {
    console.error('Texture load error:', err);
    return;
  }

  // Keyboard input
  window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
  });

  // Socket
  const socket = io();
  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
  });

  console.log('Init complete');
}

function update(delta) {
  const scale = 0.8;
  const canvasWidth = app.renderer.width / scale;
  const canvasHeight = app.renderer.height / scale;

  if (keys.ArrowLeft) cameraX -= cameraSpeed;
  if (keys.ArrowRight) cameraX += cameraSpeed;
  if (keys.ArrowUp) cameraY -= cameraSpeed;
  if (keys.ArrowDown) cameraY += cameraSpeed;

  const mapWidth = mapData[0].length * 32;
  const mapHeight = mapData.length * 32;

  cameraX = Math.round(cameraX);
  cameraY = Math.round(cameraY);

  let maxX = Math.max(0, mapWidth - canvasWidth);
  let maxY = Math.max(0, mapHeight - canvasHeight);

  cameraX = Math.max(-canvasWidth / 2, Math.min(cameraX, maxX + canvasWidth / 2));
  cameraY = Math.max(-canvasHeight / 2, Math.min(cameraY, maxY + canvasHeight / 2));

  const fps = delta > 0 ? 1000 / app.ticker.deltaMS : 0;
  frameTimes.push(fps);
  if (frameTimes.length > maxFrameTimes) frameTimes.shift();
  const avgFps = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  fpsText.text = `FPS: ${Math.round(avgFps)}`;

  time += delta / 60;
}

function render() {
  const spriteWidth = 32;
  const spriteHeight = 32;
  const canvasWidth = app.renderer.width;
  const canvasHeight = app.renderer.height;

  sprites.forEach(sprite => app.stage.removeChild(sprite));
  sprites = [];

  const startCol = Math.floor(cameraX / spriteWidth) - 5;
  const startRow = Math.floor(cameraY / spriteHeight) - 5;
  const maxCols = Math.ceil(canvasWidth / spriteWidth) + 10;
  const maxRows = Math.ceil(canvasHeight / spriteHeight) + 10;

  for (let row = -15; row <= maxRows + 5; row++) {
    for (let col = -5; col <= maxCols + 5; col++) {
      const mapRow = startRow + row;
      const mapCol = startCol + col;
      if (mapRow < 0 || mapRow >= mapData.length || mapCol < 0 || mapCol >= mapData[0].length) continue;

      const tileValue = mapData[mapRow][mapCol][0];
      const tile = tileValue - 1;
      const x = Math.round(mapCol * spriteWidth - cameraX);
      const y = Math.round(mapRow * spriteHeight - cameraY);

      if (tile <= 511) {
        const grassSprite = new PIXI.Sprite(grassTexture);
        grassSprite.texture.frame = new PIXI.Rectangle(225, 1, 30, 30);
        grassSprite.x = x;
        grassSprite.y = y;
        grassSprite.width = spriteWidth;
        grassSprite.height = spriteHeight;
        grassSprite.zIndex = 0;
        app.stage.addChild(grassSprite);
        sprites.push(grassSprite);
      }

      if (tile === 511) {
        const amplitude = (0.2 * Math.PI) / 180;
        const rotation = amplitude * Math.sin(2 * time + 0.5 * mapCol);

        const trunkTexture = new PIXI.Texture(treeTexture.baseTexture, new PIXI.Rectangle(0, 0, 480, 480));
        const trunkSprite = new PIXI.Sprite(trunkTexture);
        trunkSprite.setTransform(x - 240 + 16, y - 240 + 16, 1, 1, 0);
        trunkSprite.width = 480;
        trunkSprite.height = 480;
        trunkSprite.zIndex = 1;
        app.stage.addChild(trunkSprite);
        sprites.push(trunkSprite);

        const leavesTexture = new PIXI.Texture(treeTexture.baseTexture, new PIXI.Rectangle(480, 0, 480, 480));
        const leavesSprite = new PIXI.Sprite(leavesTexture);
        leavesSprite.setTransform(x - 240 + 16, y - 240 + 16, 1, 1, rotation);
        leavesSprite.width = 480;
        leavesSprite.height = 480;
        leavesSprite.zIndex = 2;
        app.stage.addChild(leavesSprite);
        sprites.push(leavesSprite);
      }
    }
  }

  sprites.sort((a, b) => a.y - b.y || b.zIndex - a.zIndex);
  app.stage.setChildIndex(uiContainer, app.stage.children.length - 1);
}

init();
