import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

export const PRESETS = {
    low: { ratio: .75, shadows: 512, bloom: false, ao: false, reflection: 4 },
    medium: { ratio: 1, shadows: 1024, bloom: true, ao: false, reflection: 2 },
    high: { ratio: 1.25, shadows: 2048, bloom: true, ao: false, reflection: 1 },
    ultra: { ratio: 1.5, shadows: 2048, bloom: true, ao: true, reflection: 1 }
};
function normalTexture(size = 256) {
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
        const dx = Math.cos(u * 7 + Math.sin(v * 3)) * .18 + Math.cos(u * 13 - v * 9) * .10;
        const dy = Math.sin(v * 9 + Math.cos(u * 5)) * .18 + Math.sin(v * 17 + u * 11) * .10;
        const n = new THREE.Vector3(dx, dy, 1).normalize(), i = (y * size + x) * 4;
        data[i] = (n.x * .5 + .5) * 255; data[i + 1] = (n.y * .5 + .5) * 255; data[i + 2] = n.z * 255; data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true; return texture;
}
export class CinematicGraphics {
    constructor(renderer, scene, camera) {
        this.renderer = renderer; this.scene = scene; this.camera = camera; this.frame = 0; this.visualTime = 0;
        this.sky = new Sky(); this.sky.scale.setScalar(10000); scene.add(this.sky);
        this.sun = new THREE.Vector3(); this.sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(76), THREE.MathUtils.degToRad(155));
        const u = this.sky.material.uniforms; u.turbidity.value = 5; u.rayleigh.value = 2.2; u.mieCoefficient.value = .007; u.mieDirectionalG.value = .85; u.sunPosition.value.copy(this.sun);
        this.pmrem = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene(); envScene.add(this.sky);
        this.environment = this.pmrem.fromScene(envScene, .035); scene.add(this.sky); scene.environment = this.environment.texture; scene.environmentIntensity = .55;
        this.normal = normalTexture();
        this.waterGeometry = new THREE.PlaneGeometry(300, 300, 96, 96);
        this.water = new Water(this.waterGeometry, { textureWidth: 512, textureHeight: 512, waterNormals: this.normal, sunDirection: this.sun, sunColor: 0xffe1ae, waterColor: 0x126f69, distortionScale: 2.5, fog: true });
        this.water.rotation.x = -Math.PI / 2; scene.add(this.water);
        this.waterBase = this.waterGeometry.attributes.position.array.slice();
        // Fine foam follows wave-normal crests instead of using particle sheets.
        this.water.material.fragmentShader = this.water.material.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, alpha );', `
            float ridge = abs(noise.x + noise.z) * 0.5;
            float foam = smoothstep(0.6, 0.95, ridge) * (0.5 + 0.5 * sin(worldPosition.x * 0.8 + time));
            outgoingLight = mix(outgoingLight, vec3(0.79, 0.90, 0.85), foam * 0.22);
            gl_FragColor = vec4(outgoingLight, alpha);`);
        const reflect = this.water.onBeforeRender.bind(this.water);
        this.water.onBeforeRender = (...args) => {
            if (scene.overrideMaterial || this.lastReflection === this.frame || this.frame % (this.preset?.reflection || 1)) return;
            this.lastReflection = this.frame; reflect(...args);
        };
        this.composer = new EffectComposer(renderer); this.composer.addPass(new RenderPass(scene, camera));
        this.ao = new SSAOPass(scene, camera, innerWidth, innerHeight); this.ao.kernelRadius = 10; this.ao.minDistance = .003; this.ao.maxDistance = .16; this.composer.addPass(this.ao);
        this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .18, .5, 1.2); this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());
        this.fxaa = new ShaderPass(FXAAShader); this.composer.addPass(this.fxaa);
        this.grade = new ShaderPass({
            uniforms: { tDiffuse: { value: null }, vignette: { value: .18 }, grainTime: { value: 0 } },
            vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: `uniform sampler2D tDiffuse;uniform float vignette;uniform float grainTime;varying vec2 vUv;
            void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float d=distance(vUv,vec2(.5));c*=1.0-vignette*smoothstep(.2,.72,d);c=pow(c,vec3(.98,1.0,1.015));float n=fract(sin(dot(vUv+grainTime,vec2(12.9898,78.233)))*43758.5453);c+=(n-.5)*.006;gl_FragColor=vec4(c,1.0);}`
        }); this.composer.addPass(this.grade);
        this.clouds = new THREE.Group(); scene.add(this.clouds); this.buildClouds(); this.setQuality('high');
    }
    buildClouds() {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128; const ctx = canvas.getContext('2d');
        for (let i = 0; i < 25; i++) {
            const x = 25 + Math.random() * 78, y = 35 + Math.random() * 58, radius = 12 + Math.random() * 25;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius); grad.addColorStop(0, '#fffffff0'); grad.addColorStop(.5, '#ffffff90'); grad.addColorStop(1, '#ffffff00'); ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
        }
        this.cloudTexture = new THREE.CanvasTexture(canvas);
        for (let i = 0; i < 20; i++) {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.cloudTexture, color: 0xfff3dc, transparent: true, opacity: .62, depthWrite: false, fog: true }));
            const a = i * 2.399; sprite.position.set(Math.sin(a) * 170, 55 + i % 5 * 9, Math.cos(a) * 170); sprite.scale.set(70 + i % 3 * 20, 24 + i % 4 * 8, 1); this.clouds.add(sprite);
        }
    }
    setQuality(name) {
        this.quality = PRESETS[name] ? name : 'high'; this.preset = PRESETS[this.quality];
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.preset.ratio));
        this.renderer.shadowMap.enabled = this.quality !== 'low'; this.bloom.enabled = this.preset.bloom; this.ao.enabled = this.preset.ao;
        this.resize();
    }
    configure(settings) {
        if (settings.quality !== this.quality) this.setQuality(settings.quality);
        this.camera.fov = settings.fov || 58; this.camera.updateProjectionMatrix();
        this.renderer.toneMappingExposure = settings.exposure || 1.1; this.grade.uniforms.vignette.value = settings.reducedMotion ? .08 : .18;
    }
    update(time, raft, weather, config, wave) {
        this.water.position.set(raft.x, 0, raft.z); const pos = this.waterGeometry.attributes.position;
        for (let i = 0; i < pos.count; i++) pos.setZ(i, wave(this.waterBase[i * 3] + raft.x, -this.waterBase[i * 3 + 1] + raft.z));
        pos.needsUpdate = true;
        const u = this.water.material.uniforms; u.time.value = time * .65; u.size.value = 5; u.distortionScale.value = .8 + weather.strength * 2;
        u.waterColor.value.setHex(config.waterColor).multiplyScalar(weather.phase === 'Malam' ? .25 : 1);
        u.sunColor.value.setHex(weather.phase === 'Malam' ? 0x759abe : 0xffe1ae).multiplyScalar(1 - weather.strength * .65);
        this.sky.material.uniforms.turbidity.value = 5 + weather.strength * 15;
        this.sky.material.uniforms.mieCoefficient.value = .007 + weather.strength * .04;
        this.sky.material.uniforms.rayleigh.value = weather.phase === 'Malam' ? .15 : 2.2;
        this.sky.material.uniforms.sunPosition.value.copy(this.sun).multiplyScalar(weather.phase === 'Malam' ? -1 : 1);
        this.clouds.rotation.y = time * .001; this.clouds.position.set(raft.x * .3, 0, raft.z * .3);
        this.clouds.children.forEach(c => { c.material.color.setHex(weather.phase === 'Malam' ? 0x324b64 : weather.strength > .5 ? 0x687c87 : 0xfff3dc); c.material.opacity = .55 + weather.strength * .3; });
    }
    render(dt) { this.frame++; this.visualTime += dt; this.grade.uniforms.grainTime.value = this.visualTime % 100; this.composer.render(dt); }
    resize() {
        this.renderer.setSize(innerWidth, innerHeight); this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(innerWidth, innerHeight);
        const ratio = this.renderer.getPixelRatio(); this.fxaa.material.uniforms.resolution.value.set(1 / (innerWidth * ratio), 1 / (innerHeight * ratio));
    }
    dispose() {
        this.composer.passes.forEach(p => p.dispose?.()); this.composer.dispose(); this.environment.dispose(); this.pmrem.dispose(); this.normal.dispose(); this.cloudTexture.dispose();
        this.clouds.children.forEach(c => c.material.dispose()); this.sky.geometry.dispose(); this.sky.material.dispose(); this.waterGeometry.dispose(); this.water.dispose?.();
    }
}
