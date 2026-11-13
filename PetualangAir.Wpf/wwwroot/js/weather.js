import * as THREE from 'three';
import { weatherPhase } from './weatherRules.js';
export class WeatherSystem {
    constructor(scene) {
        this.scene = scene; this.time = 0; this.strength = 0; this.phase = 'Cerah'; this.wind = new THREE.Vector2();
        const positions = new Float32Array(600 * 3);
        for (let i = 0; i < positions.length; i += 3) { positions[i] = (Math.random() - .5) * 80; positions[i + 1] = Math.random() * 35; positions[i + 2] = (Math.random() - .5) * 80; }
        this.rain = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)), new THREE.PointsMaterial({ color: 0xc7eaf4, size: .12, transparent: true, opacity: .65 }));
        scene.add(this.rain);
        this.rainbow = new THREE.Group();
        [0xed6b6b, 0xf3af58, 0xf9df78, 0x79bd87, 0x71b6cf, 0x998bc8].forEach((color, i) => {
            const arc = new THREE.Mesh(new THREE.TorusGeometry(28 - i * .5, .23, 4, 64, Math.PI), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .55, depthWrite: false }));
            this.rainbow.add(arc);
        });
        scene.add(this.rainbow);
    }
    reset() { this.time = 0; this.strength = 0; this.phase = 'Cerah'; }
    update(dt, biome, config, raft, lamp) {
        const previous = this.phase; this.time += dt; this.phase = weatherPhase(this.time, biome);
        const target = this.phase === 'Badai' ? 1 : this.phase === 'Hujan' ? .35 : 0;
        this.strength += (target - this.strength) * Math.min(1, dt * .5);
        const night = this.phase === 'Malam';
        const darkness = night ? .22 : 1 - this.strength * .66;
        const color = new THREE.Color(config.skyColor).multiplyScalar(darkness);
        this.scene.background.lerp(color, Math.min(1, dt));
        this.scene.fog.color.copy(this.scene.background);
        this.scene.fog.density = this.phase === 'Kabut' ? (lamp ? .018 : .038) : night ? (lamp ? .012 : .025) : .008 + this.strength * .009;
        this.wind.set(Math.sin(this.time * .08), Math.cos(this.time * .06)).multiplyScalar(biome === 'DanauVulkanik' ? 1.2 : .2 + this.strength * 2.3);
        this.rain.visible = this.strength > .08;
        this.rain.position.set(raft.x, 0, raft.z);
        if (this.rain.visible) {
            const p = this.rain.geometry.attributes.position;
            for (let i = 0; i < p.count; i++) { p.setY(i, (p.getY(i) - dt * 24 + 35) % 35); p.setX(i, ((p.getX(i) + this.wind.x * dt + 40) % 80) - 40); }
            p.needsUpdate = true;
        }
        this.rainbow.visible = this.phase === 'Pelangi'; this.rainbow.position.set(raft.x, 0, raft.z + 65);
        return { changed: previous !== this.phase, stormFinished: previous === 'Badai' && this.phase === 'Pelangi', light: darkness, phase: this.phase };
    }
    dispose() {
        this.scene.remove(this.rain, this.rainbow); this.rain.geometry.dispose(); this.rain.material.dispose();
        this.rainbow.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
    }
}
