export function setupTreeShader(scene) {
  let pipelineApplied = false;
  if (scene.renderer.type === Phaser.WEBGL) {
    const TreeShader = {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform vec2 uResolution;
        uniform float uDivideBy;
        uniform float uCosTheta;
        uniform float uSinTheta;
        uniform float uMaxT;
        uniform vec2 uFrameUV;
        uniform vec2 uFrameSize;
        varying vec2 outTexCoord;
        
        void main() {
          lowp vec4 color = texture2D(uMainSampler, outTexCoord);
          lowp vec4 finalColor = color;
          
          // Early exit for opaque pixels
          if (color.a >= 0.01) {
            gl_FragColor = finalColor;
            return;
          }
          
          // 245px line (y=0.0 at top) in texture coordinates
          const float baseScreenY = 0.51041667; // 245.0 / 480.0
          
          // Skip pixels far from baseScreenY
          if (abs(outTexCoord.y - baseScreenY) * 480.0 > 64.0) {
            gl_FragColor = finalColor;
            return;
          }
          
          // Ray direction
          vec2 rayDir = vec2(uCosTheta / 1440.0, uSinTheta / 480.0);
          
          // Check if ray can hit baseScreenY and avoid division by zero
          if (abs(uSinTheta) > 0.01 && outTexCoord.y < baseScreenY) {
            lowp float t = (baseScreenY - outTexCoord.y) / rayDir.y;
            // Combine distance check, bounds check, and sampling
            if (t >= 0.0 && t <= uMaxT) {
              vec2 samplePos = outTexCoord + t * rayDir;
              samplePos.y -= t * (uDivideBy / 480.0);
              // Adjust samplePos to frame UV space
              vec2 frameCoord = (samplePos - uFrameUV) / uFrameSize;
              if (frameCoord.x >= 0.0 && frameCoord.x <= 1.0 && frameCoord.y >= 0.0 && frameCoord.y <= 1.0) {
                vec2 globalSourceCoord = uFrameUV + frameCoord * uFrameSize;
                if (texture2D(uMainSampler, globalSourceCoord).a > 0.01) {
                  finalColor = vec4(0.0, 0.0, 0.1, 0.3); // Dark blue shadow
                }
              }
            }
          }
          
          gl_FragColor = finalColor;
        }
      `
    };

    // Trunk Pipeline
    class TrunkPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
      constructor(game) {
        super({
          game: game,
          fragShader: TreeShader.fragmentShader,
          uniforms: [
            'uMainSampler',
            'uResolution',
            'uDivideBy',
            'uCosTheta',
            'uSinTheta',
            'uMaxT',
            'uFrameUV',
            'uFrameSize'
          ]
        });
      }

      onPreRender() {
        const uTime = this.game.loop.time / 500.0;
        const angleRad = (uTime / 720.0 - Math.floor(uTime / 720.0)) * 2.0 * Math.PI;
        const sinTheta = Math.sin(angleRad);
        const maxT = Math.abs(sinTheta) > 0.01 ? 500.0 / Math.abs(sinTheta) : Number.MAX_VALUE;
        this.set2f('uResolution', this.game.config.width, this.game.config.height);
        this.set1f('uDivideBy', 1.5); // Perfect size
        this.set1f('uCosTheta', Math.cos(angleRad));
        this.set1f('uSinTheta', sinTheta);
        this.set1f('uMaxT', maxT);
        this.set2f('uFrameUV', 0.0, 0.0);
        this.set2f('uFrameSize', 480.0 / 1440.0, 480.0 / 480.0);
        console.log('TrunkPipeline onPreRender: Shader uniforms set, time:', this.game.loop.time / 1000.0);
      }
    }

    // Leaves Pipeline
    class LeavesPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
      constructor(game) {
        super({
          game: game,
          fragShader: TreeShader.fragmentShader,
          uniforms: [
            'uMainSampler',
            'uResolution',
            'uDivideBy',
            'uCosTheta',
            'uSinTheta',
            'uMaxT',
            'uFrameUV',
            'uFrameSize'
          ]
        });
      }

      onPreRender() {
        const uTime = this.game.loop.time / 500.0;
        const angleRad = (uTime / 720.0 - Math.floor(uTime / 720.0)) * 2.0 * Math.PI;
        const sinTheta = Math.sin(angleRad);
        const maxT = Math.abs(sinTheta) > 0.01 ? 500.0 / Math.abs(sinTheta) : Number.MAX_VALUE;
        this.set2f('uResolution', this.game.config.width, this.game.config.height);
        this.set1f('uDivideBy', 1.5); // Perfect size
        this.set1f('uCosTheta', Math.cos(angleRad));
        this.set1f('uSinTheta', sinTheta);
        this.set1f('uMaxT', maxT);
        this.set2f('uFrameUV', 0.3333, 0.0);
        this.set2f('uFrameSize', 480.0 / 1440.0, 480.0 / 480.0);
        console.log('LeavesPipeline onPreRender: Shader uniforms set, time:', this.game.loop.time / 1000.0);
      }
    }

    try {
      const trunkPipeline = new TrunkPipeline(scene.game);
      const leavesPipeline = new LeavesPipeline(scene.game);
      if (scene.game.renderer.pipelines) {
        scene.game.renderer.pipelines.add('TrunkPipeline', trunkPipeline);
        scene.game.renderer.pipelines.add('LeavesPipeline', leavesPipeline);
        console.log('Tree shadow pipelines successfully added');
        pipelineApplied = true;
      } else {
        console.warn('Renderer pipelines not available');
      }
    } catch (e) {
      console.error('Failed to add tree shadow pipelines:', e);
    }
  } else {
    console.warn('WebGL not available. Tree shadow shader skipped.');
  }

  return pipelineApplied;
}