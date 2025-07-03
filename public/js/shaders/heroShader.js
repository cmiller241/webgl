export function setupHeroShader(scene) {
  let pipelineApplied = false;
  if (scene.renderer.type === Phaser.WEBGL) {
    const HeroShader = {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform vec2 uResolution;
        uniform float uDivideBy;
        uniform float uCosTheta;
        uniform float uSinTheta;
        uniform float uMaxT;
        varying vec2 outTexCoord;
        
        void main() {
          lowp vec4 color = texture2D(uMainSampler, outTexCoord);
          lowp vec4 finalColor = color;
          
          // Early exit for opaque pixels
          if (color.a >= 0.01) {
            gl_FragColor = finalColor;
            return;
          }
          
          // 80px line (y=0.0 at top) in texture coordinates
          const float baseScreenY = 0.07142857; // 80.0 / 1120.0
          
          // Skip pixels far from baseScreenY
          if (abs(outTexCoord.y - baseScreenY) * 1120.0 > 64.0) {
            gl_FragColor = finalColor;
            return;
          }
          
          // Ray direction
          vec2 rayDir = vec2(uCosTheta / 1680.0, uSinTheta / 1120.0);
          
          // Check if ray can hit baseScreenY and avoid division by zero
          if (abs(uSinTheta) > 0.01 && outTexCoord.y < baseScreenY) {
            lowp float t = (baseScreenY - outTexCoord.y) / rayDir.y;
            // Combine distance check, bounds check, and sampling
            if (t >= 0.0 && t <= uMaxT) {
              vec2 samplePos = outTexCoord + t * rayDir;
              samplePos.y -= t * (uDivideBy / 1120.0);
              if (samplePos.x >= 0.0 && samplePos.x <= 1.0 && samplePos.y >= 0.0 && samplePos.y <= 1.0 && texture2D(uMainSampler, samplePos).a > 0.01) {
                finalColor = vec4(0.0, 0.0, 0.1, 0.3); // Dark blue shadow
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
          uniforms: ['uMainSampler', 'uResolution', 'uDivideBy', 'uCosTheta', 'uSinTheta', 'uMaxT']
        });
      }

      onPreRender() {
        // Set uniforms
        const uTime = this.game.loop.time / 500.0;
        const angleRad = (uTime / 720.0 - Math.floor(uTime / 720.0)) * 2.0 * Math.PI;
        const sinTheta = Math.sin(angleRad);
        const maxT = Math.abs(sinTheta) > 0.01 ? 64.0 / Math.abs(sinTheta) : Number.MAX_VALUE;
        this.set2f('uResolution', this.game.config.width, this.game.config.height);
        this.set1f('uDivideBy', 1.5); // Perfect size
        this.set1f('uCosTheta', Math.cos(angleRad));
        this.set1f('uSinTheta', sinTheta);
        this.set1f('uMaxT', maxT);
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