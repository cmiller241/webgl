export function setupHeroShader(scene) {
  let pipelineApplied = false;
  if (scene.renderer.type === Phaser.WEBGL) {
    const HeroShader = {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform vec2 uResolution;
        uniform float uShadowOffset;
        uniform float uShadowAngle;
        uniform float uShadowOpacity;
        uniform vec2 uFrameUV; // Top-left UV of the frame
        uniform vec2 uFrameSize; // Normalized size of the frame (112/1120)
        varying vec2 outTexCoord;

        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          vec4 finalColor = color;

          // Debug: Show faint red in transparent areas to confirm shader execution
        //   if (color.a < 0.01) {
        //     finalColor = vec4(0.2, 0.0, 0.0, 0.1);
        //   }

          // Normalize outTexCoord to frame's UV space
          vec2 frameCoord = (outTexCoord - uFrameUV) / uFrameSize;

          // Calculate shadow offset in frame's UV space (normalized for 112px frame)
          float offset = uShadowOffset / 112.0; // Normalize offset for 112px frame
          float angleRad = uShadowAngle * 3.14159265359 / 180.0;
          vec2 shadowFrameCoord = frameCoord + vec2(offset * cos(angleRad), offset * sin(angleRad));

          // Convert back to global UV space for sampling
          vec2 shadowCoord = uFrameUV + shadowFrameCoord * uFrameSize;

          // Check if shadowCoord is within frame bounds (relaxed X bounds for angle 0.0)
          if (shadowFrameCoord.y >= 0.0 && shadowFrameCoord.y <= 1.0) {
            vec4 shadowSample = texture2D(uMainSampler, shadowCoord);
            // If source pixel is non-transparent, cast shadow
            if (shadowSample.a > 0.01) {
              // Apply shadow in transparent areas
              if (color.a < 0.01) {
                finalColor = vec4(0.0, 0.0, 0.0, uShadowOpacity);
              }
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
          uniforms: [
            'uMainSampler',
            'uResolution',
            'uShadowOffset',
            'uShadowAngle',
            'uShadowOpacity',
            'uFrameUV',
            'uFrameSize'
          ]
        });
      }

      onPreRender() {
        this.set2f('uResolution', this.game.config.width, this.game.config.height);
        this.set1f('uShadowOffset', 80.0); // 80px offset from sprite top
        this.set1f('uShadowAngle', 360.0); // Straight down
        this.set1f('uShadowOpacity', 0.5); // Shadow darkness

        // Hero frame is leftmost (first column, first row) in 1120x1120 spritesheet
        this.set2f('uFrameUV', 0.0, 0.0); // Top-left of first frame
        this.set2f('uFrameSize', 112.0 / 1120.0, 112.0 / 1120.0); // Frame size in UV space

        console.log('HeroPipeline onPreRender: Shader uniforms set');
      }
    }

    try {
      const pipeline = new HeroPipeline(scene.game);
      if (scene.game.renderer.pipelines) {
        scene.game.renderer.pipelines.add('HeroPipeline', pipeline);
        console.log('Shadow pipeline successfully added');
        pipelineApplied = true;
      } else {
        console.warn('Renderer pipelines not available');
      }
    } catch (e) {
      console.error('Failed to add shadow pipeline:', e);
    }
  } else {
    console.warn('WebGL not available. Shadow shader skipped.');
  }

  return pipelineApplied;
}