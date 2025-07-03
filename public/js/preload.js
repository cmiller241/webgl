export function preload() {
  this.load.json('map', 'assets/map.json');
  this.load.image('grass', 'assets/sprites2.png');
  this.load.image('tree', 'assets/tree4.png');
  this.load.image('hero', 'assets/sprites-fixedgrid.png');

  this.load.on('filecomplete', (key) => console.log(`Loaded ${key}`));
  this.load.on('loaderror', (file) => console.error(`Failed to load ${file.key} from ${file.src}`));
}
