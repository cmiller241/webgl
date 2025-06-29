export function setupHeroShader(scene) {
  let pipelineApplied = false;
  if (scene.renderer.type === Phaser.WEBGL) {
    const HeroShader = {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform vec2 uResolution;
        uniform float uShadowOffset;
        uniform float uShadowOpacity;
        uniform float uTime; // Time in seconds for dynamic angle
        uniform vec2 uFrameUV; // Top-left UV of the frame
        uniform vec2 uFrameSize; // Normalized size of the frame (112/1120)
        varying vec2 outTexCoord;

        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          vec4 finalColor = color;

          // Debug: Faint red in transparent areas to confirm shader execution
        //   if (color.a < 0.01) {
        //     finalColor = vec4(0.2, 0.0, 0.0, 0.1);
        //   }

          // Preserve opaque sprite pixels
          if (color.a > 0.01) {
            gl_FragColor = finalColor;
            return;
          }

          // Normalize outTexCoord to frame's UV space (0.0 to 1.0 within 112x112px)
          vec2 frameCoord = (outTexCoord - uFrameUV) / uFrameSize;

          // Pixel coordinates in frame (0 to 112)
          vec2 pixelCoord = frameCoord * 112.0;
          float pixelY = pixelCoord.y;
          float baseY = 80.0; // Sprite's feet at y = 80px

          // Shadow projection parameters
          float maxShadowDist = 0.5 * baseY; // Max shadow distance (40px)
          float angleRad = fract(uTime / 720.0) * 2.0 * 3.14159265359; // 0 to 2π over 720s
          float cosTheta = cos(angleRad);
          float sinTheta = sin(angleRad);

          // Shadow calculation (project along angle)
          if (abs(sinTheta) >= 0.01) { // Avoid division by zero
            float dy = pixelY - baseY;
            float dPrime = dy / sinTheta; // Distance along projection
            if (abs(dPrime) < maxShadowDist) {
              // Calculate source pixel that casts the shadow
              float sourceX = pixelCoord.x - dPrime * cosTheta;
              float sourceY = baseY - 2.0 * dPrime; // sourceY = baseY - 2 * dPrime
              vec2 sourceCoord = vec2(sourceX, sourceY) / 112.0; // Normalize to frame UV

              // Check if source is within frame bounds
              if (sourceCoord.x >= 0.0 && sourceCoord.x <= 1.0 &&
                  sourceCoord.y >= 0.0 && sourceCoord.y <= 1.0) {
                // Convert sourceCoord to global UV space
                vec2 globalSourceCoord = uFrameUV + sourceCoord * uFrameSize;
                vec4 sourceSample = texture2D(uMainSampler, globalSourceCoord);
                if (sourceSample.a > 0.01) {
                  finalColor = vec4(0.0, 0.0, 0.05, uShadowOpacity); // Black shadow
                }
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
            'uShadowOpacity',
            'uTime',
            'uFrameUV',
            'uFrameSize'
          ]
        });
      }

      onPreRender() {
        this.set2f('uResolution', this.game.config.width, this.game.config.height);
        this.set1f('uShadowOffset', 80.0); // 80px offset from sprite top
        this.set1f('uShadowOpacity', 0.3); // Shadow alpha
        this.set1f('uTime', this.game.loop.time / 500.0); // Time in seconds
        this.set2f('uFrameUV', 0.0, 0.0); // Leftmost frame
        this.set2f('uFrameSize', 112.0 / 1120.0, 112.0 / 1120.0); // Frame size in UV space
        console.log('HeroPipeline onPreRender: Shader uniforms set, time:', this.game.loop.time / 1000.0);
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