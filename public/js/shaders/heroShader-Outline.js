export function setupHeroShader(scene) {
  let pipelineApplied = false;
  if (scene.renderer.type === Phaser.WEBGL) {
    const HeroShader = {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform vec2 uResolution;
        varying vec2 outTexCoord;
        
        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          vec4 finalColor = color;
          
          // Define outline thickness (adjust as needed)
          vec2 pixelSize = 1.0 / uResolution;
          float outlineThickness = 0.5; // Number of pixels for outline
          
          // If current pixel is transparent, check neighbors for outline
          if (color.a < 0.01) {
            // Sample neighboring pixels
            vec4 left = texture2D(uMainSampler, outTexCoord + vec2(-pixelSize.x * outlineThickness, 0.0));
            vec4 right = texture2D(uMainSampler, outTexCoord + vec2(pixelSize.x * outlineThickness, 0.0));
            vec4 up = texture2D(uMainSampler, outTexCoord + vec2(0.0, pixelSize.y * outlineThickness));
            vec4 down = texture2D(uMainSampler, outTexCoord + vec2(0.0, -pixelSize.y * outlineThickness));
            
            // If any neighbor is non-transparent, draw white outline
            if (left.a > 0.01 || right.a > 0.01 || up.a > 0.01 || down.a > 0.01) {
              finalColor = vec4(1.0, 1.0, 1.0, 1.0); // White outline
            }
          }
          
          gl_FragColor = finalColor;
        }
      `
    };

    class HeroPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
      constructor(game) {
        super({
          game: game,
          fragShader: HeroShader.fragmentShader,
          uniforms: ['uMainSampler', 'uResolution']
        });
      }

      onPreRender() {
        // Set resolution uniform based on game canvas size
        this.set2f('uResolution', this.game.config.width, this.game.config.height);
      }
    }

    try {
      const pipeline = new HeroPipeline(scene.game);
      if (scene.game.renderer.pipelines) {
        scene.game.renderer.pipelines.add('HeroPipeline', pipeline);
        console.log('Pipeline successfully added');
        pipelineApplied = true;
      } else {
        console.warn('Renderer pipelines not available');
      }
    } catch (e) {
      console.error('Failed to add pipeline:', e);
    }
  } else {
    console.warn('WebGL not available. Shader skipped.');
  }

  return pipelineApplied;
}