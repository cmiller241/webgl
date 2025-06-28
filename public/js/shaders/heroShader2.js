export function setupHeroShader(scene) {
  let pipelineApplied = false;
  if (scene.renderer.type === Phaser.WEBGL) {
    const HeroShader = {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform float uTime;
        varying vec2 outTexCoord;
        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
          color.rgb += vec3(0.0, 0.3 * pulse, 0.5 * pulse);
          gl_FragColor = vec4(color.rgb, color.a);
        }
      `
    };

    class HeroPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
      constructor(game) {
        super({
          game: game,
          fragShader: HeroShader.fragmentShader,
          uniforms: ['uMainSampler', 'uTime']
        });
      }

      onPreRender() {
        this.set1f('uTime', scene.updateData?.time || 0);
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