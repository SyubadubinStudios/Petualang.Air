import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CinematicGraphics } from './graphics.js';
import { InputController } from './input.js';
import { NusantaraAudio } from './audio.js';
import { WeatherSystem } from './weather.js';
import { BiomeWorld, loadAssets, cloneAsset, disposeTree } from './world.js';

const BIOME_CONFIGS = {
    SungaiGunung: {
        waterColor: 0x1b8a7a, skyColor: 0x87ceeb, fogColor: 0xaad8e6,
        waveAmp: 0.22, waveFreq: 0.45, waveSpeed: 2.8, flowZ: 0.08, envColor: 0x2e7d32
    },
    HutanGambut: {
        waterColor: 0x4e3b25, skyColor: 0x5d7a67, fogColor: 0x4a6353,
        waveAmp: 0.08, waveFreq: 0.3, waveSpeed: 1.2, flowZ: 0.02, envColor: 0x1b5e20
    },
    DanauVulkanik: {
        waterColor: 0x1565c0, skyColor: 0x90caf9, fogColor: 0xb3e5fc,
        waveAmp: 0.16, waveFreq: 0.25, waveSpeed: 1.6, flowZ: 0.0, envColor: 0x37474f
    },
    KotaKanal: {
        waterColor: 0x3b6e61, skyColor: 0xffcc80, fogColor: 0xffe0b2,
        waveAmp: 0.10, waveFreq: 0.5, waveSpeed: 1.8, flowZ: 0.03, envColor: 0x546e7a
    },
    LautKarang: {
        waterColor: 0x00acc1, skyColor: 0x4fc3f7, fogColor: 0xb2ebf2,
        waveAmp: 0.28, waveFreq: 0.22, waveSpeed: 2.0, flowZ: 0.01, envColor: 0xffb74d
    },
    SamudraLepas: {
        waterColor: 0x0d2b52, skyColor: 0x37474f, fogColor: 0x455a64,
        waveAmp: 0.85, waveFreq: 0.14, waveSpeed: 2.4, flowZ: 0.02, envColor: 0x263238
    }
};

class PetualangEngineClass {
    constructor() {
        this.health = 100; this.stamina = 100; this.time = 0; this.lastHit = -10; this.staminaTimer = 0;
        this.paused = false; this.disposed = false; this.equipment = {}; this.eventQueue = Promise.resolve();
        this.raftState = { x: 0, z: 0, yaw: 0, speed: 0, angularVel: 0, level: 1 };
        this.particles = []; this.audio = new NusantaraAudio(); this.lastTelemetry = 0;
        this.menuMode = ''; this.focused = true; this.visualTime = 0; this.settings = {}; this.stormExposure = 0; this.dolphinBoost = 0; this.celebration = 0;
    }
    async init(canvasId, dotnetRef) {
        this.dotnetRef = dotnetRef;
        this.assets = await loadAssets();
        const canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x87ceeb); this.scene.fog = new THREE.FogExp2(0xaad8e6, .008);
        this.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 350); this.camera.position.set(0, 6, -11);
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Asset textures are shared by world clones; configure once and release at shutdown.
        this.assetTextures = new Set();
        Object.values(this.assets).forEach(asset => asset.scene.traverse(object => {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.filter(Boolean).forEach(material => Object.values(material).forEach(value => {
                if (value?.isTexture) this.assetTextures.add(value);
            }));
        }));
        this.assetTextures.forEach(texture => { texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); texture.needsUpdate = true; });
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.25;
        this.controls = new OrbitControls(this.camera, canvas); this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2 - .08; this.controls.minDistance = 5; this.controls.maxDistance = 28; this.controls.enablePan = false;
        this.ambientLight = new THREE.HemisphereLight(0xf4f5dd, 0x285754, 1.6); this.scene.add(this.ambientLight);
        this.sunLight = new THREE.DirectionalLight(0xffefd0, 2.2); this.sunLight.position.set(25, 40, -15); this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(1024, 1024); Object.assign(this.sunLight.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35 }); this.sunLight.shadow.bias = -.0002; this.sunLight.shadow.normalBias = .025; this.scene.add(this.sunLight);
        this.graphics = new CinematicGraphics(this.renderer, this.scene, this.camera);
        this.waterMesh = this.graphics.water;
        this.weather = new WeatherSystem(this.scene);
        this.raftGroup = new THREE.Group(); this.scene.add(this.raftGroup);
        this.jopiGroup = this.assets['bang-jopi'].scene;
        this.jopiGroup.position.set(0, .2, -.3); this.jopiGroup.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
        this.raftGroup.add(this.jopiGroup); this.mixer = new THREE.AnimationMixer(this.jopiGroup); this.actions = {};
        this.assets['bang-jopi'].animations.forEach(clip => { this.actions[clip.name] = this.mixer.clipAction(clip); });
        this.playAnimation('Idle'); this.upgradeRaft(1);
        this.setBiome('SungaiGunung');
        this.input = new InputController(canvas, (action, value) => {
            if (action === 'blur') { this.focused = false; this.setPaused(true); this.emit('OnAction', 'blur', ''); }
            else this.emit('OnAction', action, value || '');
        }, () => this.audio.unlock().catch(console.error));
        this.focus = () => { this.focused = true; }; window.addEventListener('focus', this.focus);
        this.resize = () => this.onResize(); window.addEventListener('resize', this.resize);
        this.visibility = () => { if (document.hidden) { this.setPaused(true); this.emit('OnAction', 'blur', ''); } }; document.addEventListener('visibilitychange', this.visibility);
        this.clock = new THREE.Clock(); canvas.focus(); this.animate();
    }
    makeMesh(parent, geometry, color, x, y, z) {
        const obj = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .75 }));
        obj.position.set(x, y, z); obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
    }
    upgradeRaft(level) {
        this.raftState.level = Math.max(1, Math.min(4, level));
        if (this.raftBase) disposeTree(this.raftBase);
        const g = this.raftBase = new THREE.Group(); this.raftGroup.add(g);
        const box = (color, x, y, z, a, b, c) => this.makeMesh(g, new THREE.BoxGeometry(a, b, c), color, x, y, z);
        g.add(cloneAsset(this.assets, 'raft-deck'));
        if (level >= 2) for (const x of [-1.6, 1.6]) {
            const hull = this.makeMesh(g, new THREE.CylinderGeometry(level === 2 ? .38 : .24, .4, level === 2 ? 2.4 : 4.7, 10), level === 2 ? 0x376e79 : level === 3 ? 0x704c36 : 0xddd4b2, x, -.15, 0); hull.rotation.x = Math.PI / 2;
            box(0x8a6a42, x / 2, .15, -.8, 2, .12, .15); box(0x8a6a42, x / 2, .15, .8, 2, .12, .15);
        }
        this.secondPaddle = null;
        if (level >= 2) {
            this.secondPaddle = new THREE.Group(); g.add(this.secondPaddle); this.secondPaddle.position.set(-1.1, 1, 0);
            this.makeMesh(this.secondPaddle, new THREE.CylinderGeometry(.035, .035, 2.2, 8), 0x936b38, 0, -.5, 0);
            this.makeMesh(this.secondPaddle, new THREE.BoxGeometry(.25, .5, .06), 0x293b3c, 0, -1.35, 0);
        }
        if (level >= 3) {
            box(0x303e44, 0, .4, -1.9, .6, .6, .6);
            this.propeller = box(0xb7c1bc, 0, -.35, -2.4, .9, .12, .12);
        }
        if (level === 4) {
            this.makeMesh(g, new THREE.CylinderGeometry(.06, .09, 4.4, 8), 0x8d603c, 0, 2.2, 1.2);
            const sail = box(0xeda85c, .7, 3, 1.2, 1.4, 2.3, .05); sail.rotation.y = .25;
            for (let i = 0; i < 6; i++) box(i % 2 ? 0x427b79 : 0xf1d697, .7, 2 + i * .35, 1.16, 1.4, .08, .02);
            box(0x274c6a, 0, .35, -1.1, 1.5, .1, .7);
        }
        this.refreshEquipment();
    }
    refreshEquipment() {
        if (!this.raftGroup) return;
        if (this.accessories) disposeTree(this.accessories);
        const g = this.accessories = new THREE.Group(); this.raftGroup.add(g);
        if (this.equipment.net) {
            const ring = this.makeMesh(g, new THREE.TorusGeometry(.65, .045, 5, 20), 0xe5d7aa, 1.8, .15, .2); ring.rotation.x = Math.PI / 2;
            const net = this.makeMesh(g, new THREE.ConeGeometry(.65, .6, 12, 4, true), 0xe5d7aa, 1.8, -.15, .2); net.material.wireframe = true;
        }
        if (this.equipment.bumper) for (const x of [-1.5, 1.5]) for (const z of [-1.4, 1.4]) this.makeMesh(g, new THREE.TorusGeometry(.3, .12, 6, 12), 0x253332, x, .1, z);
        if (this.equipment.compass) this.makeMesh(g, new THREE.CylinderGeometry(.2, .2, .1, 12), 0xffdc80, -.65, .35, .8);
        if (this.equipment.lamp) {
            this.makeMesh(g, new THREE.CylinderGeometry(.13, .18, .5, 8), 0xffdf8e, -.9, 1, 1);
            const light = new THREE.PointLight(0xffdf9e, 18, 28, 1.5); light.position.set(-.9, 1.4, 1); g.add(light);
        }
        this.jopiGroup?.traverse(o => {
            if (!o.isMesh) return;
            const materials = Array.isArray(o.material) ? o.material : [o.material];
            materials.filter(m => m.name === 'Vest').forEach(m => m.color.setHex(this.equipment.batik ? 0x236c9a : 0xff650b));
        });
    }
    configure(state) {
        this.health = state.health; this.equipment = state.equipment || {};
        this.settings = state.options || {};
        this.graphics.configure(this.settings);
        const shadowSize = this.graphics.preset.shadows;
        if (this.sunLight.shadow.mapSize.x !== shadowSize) { this.sunLight.shadow.mapSize.set(shadowSize, shadowSize); this.sunLight.shadow.map?.dispose(); this.sunLight.shadow.map = null; }
        this.audio.configure(state.muted, state.volume, this.settings.music, this.settings.effects); this.refreshEquipment();
    }
    setStamina(value) { this.stamina = THREE.MathUtils.clamp(value, 0, 100); }
    setHealth(value) { this.health = value; }
    setPaused(value) {
        this.paused = value;
        if (this.input) this.input.keys = {};
        if (!value) this.renderer?.domElement.focus();
    }
    setMenuMode(name) {
        this.menuMode = name; this.controls.enabled = !['main','welcome','credits'].includes(name);
        document.body.classList.toggle('reduced-motion', !!this.settings.reducedMotion);
    }
    setBiome(key) {
        if (!BIOME_CONFIGS[key]) return;
        this.world?.dispose(); this.clearParticles(); this.biome = key; this.currentBiome = BIOME_CONFIGS[key];
        this.world = new BiomeWorld(this.scene, this.assets, key); this.weather.reset(); this.stormExposure = 0;
        this.returnToDock();
    }
    returnToDock() {
        Object.assign(this.raftState, { x: 0, z: -3, speed: 0, yaw: 0, angularVel: 0 });
        this.lastHit = this.time; this.docked = true; this.stormExposure = 0;
        this.emit('OnDockChanged', true); this.updateTelemetry();
    }
    recover() { this.health = 100; this.setStamina(100); this.returnToDock(); this.setPaused(false); }
    playAnimation(name) {
        if (this.currentAnimation === name || !this.actions[name]) return;
        const next = this.actions[name]; next.reset().fadeIn(.25).play();
        if (this.currentAnimation) this.actions[this.currentAnimation]?.fadeOut(.25);
        this.currentAnimation = name;
    }
    getWaveHeight(x, z, time) {
        const b = this.currentBiome, factor = 1 + this.weather.strength * 1.6;
        return (Math.sin(x * b.waveFreq + time * b.waveSpeed) * b.waveAmp + Math.cos(z * b.waveFreq * .8 + time * b.waveSpeed * .7) * b.waveAmp * .75) * factor;
    }
    animate() {
        if (this.disposed) return;
        this.frameId = requestAnimationFrame(() => this.animate());
        const dt = Math.min(this.clock.getDelta(), .05), input = this.input.update(dt, this.paused || this.health <= 0);
        if (!this.paused && !document.hidden && this.health > 0) this.simulate(dt, input);
        else {
            this.visualTime += dt;
            if (['main','welcome','credits'].includes(this.menuMode)) {
                const r = this.raftState, angle = this.settings.reducedMotion ? .7 : this.visualTime * .045 + .7;
                this.camera.position.set(r.x + Math.sin(angle)*9, 4.3, r.z - Math.cos(angle)*9);
                this.controls.target.set(r.x, 1.2, r.z); this.camera.lookAt(this.controls.target);
                this.mixer.update(dt); this.world.nature.update(this.visualTime);
            }
            this.graphics.update(this.time + this.visualTime*.15, this.raftState, this.weather, this.currentBiome, (x,z) => this.getWaveHeight(x,z,this.time));
        }
        this.audio.setPaused(!this.focused || document.hidden);
        this.audio.update(this.biome, this.weather.strength, this.raftState.speed);
        this.controls.update(); this.graphics.render(dt);
    }
    simulate(dt, input) {
        this.time += dt; const t = this.time, r = this.raftState;
        const status = this.weather.update(dt, this.biome, this.currentBiome, r, this.equipment.lamp);
        this.sunLight.intensity = 2.2 * status.light; this.ambientLight.intensity = .5 + status.light;
        if (status.changed && status.phase === 'Badai') { this.stormExposure = 0; this.audio.effect('thunder'); }
        if (status.phase === 'Badai' && !this.docked) this.stormExposure += dt;
        if (status.stormFinished && this.stormExposure >= 44) this.emit('OnResourceCollected', 'Storm', this.biome);
        this.dolphinBoost = Math.max(0, this.dolphinBoost - dt); this.celebration = Math.max(0, this.celebration - dt);
        const boost = input.boost && input.forward > .1 && this.stamina > 1;
        this.stamina = THREE.MathUtils.clamp(this.stamina + (boost ? -24 : 8) * dt, 0, 100);
        this.staminaTimer += dt;
        if (this.staminaTimer >= .3) { this.staminaTimer = 0; this.emit('OnStaminaChanged', Math.round(this.stamina)); }
        const speedBoost = (1 + (r.level - 1) * .22) * (boost ? 1.8 : 1) * (this.dolphinBoost > 0 ? 1.5 : 1);
        r.speed += input.forward * 27 * speedBoost * dt;
        r.angularVel += input.turn * 3.8 * dt; r.speed *= Math.pow(.965, dt * 60); r.angularVel *= Math.pow(.9, dt * 60); r.yaw += r.angularVel * dt;
        r.x += Math.sin(r.yaw) * r.speed * dt; r.z += Math.cos(r.yaw) * r.speed * dt;
        if (!this.docked || Math.abs(input.forward) > .1) { r.x += this.weather.wind.x * dt; r.z += (this.weather.wind.y - this.currentBiome.flowZ * 30) * dt; }
        const radius = Math.hypot(r.x, r.z);
        if (radius > 76) { r.x *= 76 / radius; r.z *= 76 / radius; r.speed *= .8; }
        const docked = Math.hypot(r.x - this.world.dock.x, r.z - this.world.dock.z) < 9;
        if (docked !== this.docked) { this.docked = docked; this.emit('OnDockChanged', docked); }
        if (this.docked && status.phase === 'Badai') this.stormExposure = 0;
        this.updateWater();
        const sample = (side, forward) => this.getWaveHeight(r.x + Math.cos(r.yaw) * side + Math.sin(r.yaw) * forward, r.z - Math.sin(r.yaw) * side + Math.cos(r.yaw) * forward, t);
        const fl = sample(-1.1, 1.6), fr = sample(1.1, 1.6), bl = sample(-1.1, -1.6), br = sample(1.1, -1.6), h = (fl + fr + bl + br) / 4;
        this.raftGroup.position.set(r.x, h + .1, r.z);
        this.raftGroup.rotation.set(-Math.atan2((fl + fr - bl - br) / 2, 3.2), r.yaw, -Math.atan2((fr + br - fl - bl) / 2, 2.2), 'YXZ');
        this.jopiGroup.rotation.z = -r.angularVel * .09;
        const moving = Math.abs(input.forward) > .1;
        this.playAnimation(this.celebration > 0 ? 'Celebrate' : this.weather.strength > .65 ? 'Balance' : moving ? 'Paddle' : 'Idle');
        this.mixer.update(dt * (boost && moving ? 1.6 : 1));
        if (this.secondPaddle) this.secondPaddle.rotation.x = moving ? Math.sin(t * (boost ? 8 : 5)) * .6 : .25;
        if (this.propeller && r.level >= 3) this.propeller.rotation.z += dt * r.speed * 3;
        if (moving && Math.random() < dt * 22) this.splash(r.x - Math.sin(r.yaw) * 2, h + .1, r.z - Math.cos(r.yaw) * 2);
        this.updateParticles(dt);
        this.world.update(t, dt, (x, z) => this.getWaveHeight(x, z, t));
        for (const c of this.world.collectibles) {
            const type = c.userData.type, reach = this.equipment.net && ['Trash', 'Fish', 'Pearl'].includes(type) ? 4.8 : 2.4;
            if (Math.hypot(c.position.x - r.x, c.position.z - r.z) < reach) {
                this.world.respawn(c, r); this.audio.effect(type);
                if (type === 'Dolphin') { this.dolphinBoost = 8; this.stamina = Math.min(100, this.stamina + 25); }
                if (type === 'Artifact') this.celebration = 3;
                this.emit('OnResourceCollected', type, this.biome);
            }
        }
        for (const o of this.world.obstacles) {
            const d = o.userData, distance = Math.hypot(o.position.x - r.x, o.position.z - r.z);
            if (d.kind === 'whirlpool' && distance < 7 && !this.docked) { r.x += (o.position.x - r.x) * dt * .12; r.z += (o.position.z - r.z) * dt * .12; r.yaw += dt * .15; }
            if (!this.docked && distance < d.radius + 1 && t - this.lastHit > 1.5) {
                // Crocodiles ignore a quiet, slow raft.
                if (d.kind === 'crocodile' && Math.abs(r.speed) < 3 && !boost) continue;
                this.damage(d.damage); r.speed = -Math.abs(r.speed) * .4 - 2;
            }
        }
        // Broadside exposure to storm waves is dangerous; diagonal headings reduce it.
        if (!this.docked && this.weather.strength > .8 && Math.abs(Math.sin(r.yaw * 2)) < .3 && t - this.lastHit > 6) this.damage(8);
        const target = new THREE.Vector3(r.x, h + 1.2, r.z); this.camera.position.add(target.clone().sub(this.controls.target)); this.controls.target.copy(target);
        if (input.cameraX || input.cameraY) {
            const offset = this.camera.position.clone().sub(target), spherical = new THREE.Spherical().setFromVector3(offset);
            spherical.theta -= input.cameraX * dt * 1.8 * (this.settings.sensitivity || 1); spherical.phi = THREE.MathUtils.clamp(spherical.phi + input.cameraY * dt * (this.settings.sensitivity || 1) * (this.settings.invertY ? -1 : 1), .2, Math.PI / 2 - .09);
            this.camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
        }
        this.audio.update(this.biome, this.weather.strength, r.speed);
        if (t - this.lastTelemetry > 1) { this.lastTelemetry = t; this.updateTelemetry(); }
    }
    damage(amount) { this.lastHit = this.time; this.audio.effect('hit'); this.emit('OnObstacleHit', amount); }
    updateWater() {
        const r=this.raftState;
        this.graphics.update(this.time, r, this.weather, this.currentBiome, (x,z)=>this.getWaveHeight(x,z,this.time));
        this.sunLight.position.copy(this.graphics.sun).multiplyScalar(65).add(new THREE.Vector3(r.x,0,r.z));this.sunLight.target.position.set(r.x,0,r.z);this.sunLight.target.updateMatrixWorld();
    }
    updateTelemetry() {
        if (!this.world) return;
        const r = this.raftState, nearest = this.world.collectibles.reduce((a, c) => !a || Math.hypot(c.position.x - r.x, c.position.z - r.z) < Math.hypot(a.position.x - r.x, a.position.z - r.z) ? c : a, null);
        const heading = v => `${Math.round((Math.atan2(v.x, v.y) * 180 / Math.PI + 360) % 360)}°`;
        this.emit('OnTelemetry', this.weather.phase, `${Math.round(Math.hypot(r.x, r.z + 8))} m`, heading(this.weather.wind), this.equipment.compass && nearest ? `${nearest.userData.type} ${heading(new THREE.Vector2(nearest.position.x - r.x, nearest.position.z - r.z))}` : '');
    }
    splash(x, y, z) {
        if (this.particles.length > 50) return;
        const p = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .12), new THREE.MeshBasicMaterial({ color: 0xe0f7fa, transparent: true })); p.position.set(x + Math.random() - .5, y, z); p.userData.life = 1; this.scene.add(p); this.particles.push(p);
    }
    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]; p.userData.life -= dt * 1.8; p.position.y += dt * 1.2; p.material.opacity = Math.max(0, p.userData.life);
            if (p.userData.life <= 0) { disposeTree(p); this.particles.splice(i, 1); }
        }
    }
    clearParticles() { this.particles.forEach(disposeTree); this.particles = []; }
    emit(event, ...values) {
        this.eventQueue = this.eventQueue.then(() => this.disposed ? undefined : this.dotnetRef?.invokeMethodAsync(event, ...values)).catch(error => console.error(event, error));
        return this.eventQueue;
    }
    focusMenu() { document.querySelector(".dialog button:not(:disabled)")?.focus(); }
    onResize() { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.graphics.resize(); }
    async dispose() {
        this.disposed = true; cancelAnimationFrame(this.frameId); this.input?.dispose(); this.controls?.dispose();
        window.removeEventListener('resize', this.resize); window.removeEventListener('focus', this.focus); document.removeEventListener('visibilitychange', this.visibility);
        this.clearParticles(); this.world?.dispose(); this.weather?.dispose(); this.graphics?.dispose(); this.mixer?.stopAllAction();
        if (this.scene) disposeTree(this.scene);
        Object.values(this.assets || {}).forEach(asset => disposeTree(asset.scene));
        this.assetTextures?.forEach(texture => texture.dispose()); this.assetTextures?.clear();
        this.renderer?.dispose(); await this.audio.dispose(); this.dotnetRef = null;
    }
}
window.PetualangEngine = new PetualangEngineClass();
