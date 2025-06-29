export function setupTreeShader(scene) {
  let pipelineApplied = false;
  if (scene.renderer.type === Phaser.WEBGL) {
    const TreeShader = {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform vec2 uResolution;
        uniform float uShadowOffset;
        uniform float uShadowOpacity;
        uniform float uTime; // Time in seconds for dynamic angle
        uniform vec2 uFrameUV; // Top-left UV of the frame
        uniform vec2 uFrameSize; // Normalized size of the frame (480/1440, 480/480)
        varying vec2 outTexCoord;

        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          vec4 finalColor = color;

          // Preserve opaque sprite pixels
          if (color.a > 0.01) {
            gl_FragColor = finalColor;
            return;
          }

          // Normalize outTexCoord to frame's UV space (0.0 to 1.0 within 480x480px)
          vec2 frameCoord = (outTexCoord - uFrameUV) / uFrameSize;

          // Pixel coordinates in frame (0 to 480)
          vec2 pixelCoord = frameCoord * 480.0;
          float pixelY = pixelCoord.y;
          float baseY = 245.0; // Tree trunk base at y = 245px

          // Shadow projection parameters
          float maxShadowDist = 0.5 * baseY; // Max shadow distance (122.5px)
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
              vec2 sourceCoord = vec2(sourceX, sourceY) / 480.0; // Normalize to frame UV

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

    class TreePipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
      constructor(game) {
        super({
          game: game,
          fragShader: TreeShader.fragmentShader,
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
        this.set1f('uShadowOffset', 245.0); // Offset from sprite top
        this.set1f('uShadowOpacity', 0.3); // Shadow alpha
        this.set1f('uTime', this.game.loop.time / 500.0); // Time in seconds
        this.set2f('uFrameUV', 0.333, 0.0); // Adjusted dynamically in render.js
        this.set2f('uFrameSize', 480.0 / 1440.0, 480.0 / 480.0); // Frame size in UV space
        console.log('TreePipeline onPreRender: Shader uniforms set, time:', this.game.loop.time / 1000.0);
      }
    }

    try {
      const pipeline = new TreePipeline(scene.game);
      if (scene.game.renderer.pipelines) {
        scene.game.renderer.pipelines.add('TreePipeline', pipeline);
        console.log('Tree shadow pipeline successfully added');
        pipelineApplied = true;
      } else {
        console.warn('Renderer pipelines not available');
      }
    } catch (e) {
      console.error('Failed to add tree shadow pipeline:', e);
    }
  } else {
    console.warn('WebGL not available. Tree shadow shader skipped.');
  }

  return pipelineApplied;
}