export function getGameConfig(sceneFunctions) {
  const tileSize = 32;
  const pixelRatio = window.devicePixelRatio || 1;
  const scaleFactor = .7;
  const width = Math.floor((window.innerWidth * pixelRatio *scaleFactor) / tileSize) * tileSize/2;
  const height = Math.floor((window.innerHeight * pixelRatio *scaleFactor) / tileSize) * tileSize/2;
  return {
    type: Phaser.WEBGL,
    width: width,
    height: height,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
      preload: sceneFunctions.preload,
      create: sceneFunctions.create,
      update: sceneFunctions.update
    },
    pixelArt: true,
    fps: { target: 120 },
    render: {
      antialias: false // Disable antialiasing
    }
  };
}