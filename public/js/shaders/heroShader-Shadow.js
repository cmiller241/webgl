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
        uniform float uTime;
        uniform vec2 uFrameUV;
        uniform vec2 uFrameSize;
        varying vec2 outTexCoord;

        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          vec4 finalColor = color;

          if (color.a > 0.01) {
            gl_FragColor = finalColor;
            return;
          }

          vec2 frameCoord = (outTexCoord - uFrameUV) / uFrameSize;
          vec2 pixelCoord = frameCoord * 112.0;
          float pixelY = pixelCoord.y;
          float baseY = 80.0;

          float maxShadowDist = 0.5 * baseY;
          float angleRad = fract(uTime / 720.0) * 2.0 * 3.14159265359;
          float cosTheta = cos(angleRad);
          float sinTheta = sin(angleRad);

          if (abs(sinTheta) >= 0.01) {
            float dy = pixelY - baseY;
            float dPrime = dy / sinTheta;
            if (abs(dPrime) < maxShadowDist) {
              float sourceX = pixelCoord.x - dPrime * cosTheta;
              float sourceY = baseY - 2.0 * dPrime;
              vec2 sourceCoord = vec2(sourceX, sourceY) / 112.0;

              if (sourceCoord.x >= 0.0 && sourceCoord.x <= 1.0 &&
                  sourceCoord.y >= 0.0 && sourceCoord.y <= 1.0) {
                vec2 globalSourceCoord = uFrameUV + sourceCoord * uFrameSize;
                vec4 sourceSample = texture2D(uMainSampler, globalSourceCoord);
                if (sourceSample.a > 0.01) {
                  finalColor = vec4(0.0, 0.0, 0.05, uShadowOpacity);
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
        this.set1f('uShadowOffset', 80.0);
        this.set1f('uShadowOpacity', 0.3);
        this.set1f('uTime', this.game.loop.time / 1000.0);
        this.set2f('uFrameUV', 0.0, 0.0);
        this.set2f('uFrameSize', 112.0 / 1680.0, 112.0 / 1120.0); // Updated for 1680x1120
      }

      onBind(gameObject) {
        super.onBind(gameObject);
        let uFrameUV = [0.0, 0.0];
        let uFrameSize = [112.0 / 1680.0, 112.0 / 1120.0];

        if (gameObject && gameObject.frame && gameObject.frame.uvs) {
          const uvs = gameObject.frame.uvs;
          uFrameUV = [uvs.x0, uvs.y0];
          uFrameSize = [uvs.x1 - uvs.x0, uvs.y1 - uvs.y0];
          if (scene.DEBUG) {
            console.log(`HeroPipeline onBind: Frame ${gameObject.frame.name}, UVs: (${uvs.x0}, ${uvs.y0}), Size: (${uvs.x1 - uvs.x0}, ${uvs.y1 - uvs.y0})`);
          }
        } else {
          if (scene.DEBUG) {
            console.warn(`HeroPipeline onBind: Invalid frame data`, {
              hasGameObject: !!gameObject,
              hasFrame: !!(gameObject && gameObject.frame),
              hasUvs: !!(gameObject && gameObject.frame && gameObject.frame.uvs)
            });
          }
        }

        this.set2f('uFrameUV', uFrameUV[0], uFrameUV[1]);
        this.set2f('uFrameSize', uFrameSize[0], uFrameSize[1]);
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