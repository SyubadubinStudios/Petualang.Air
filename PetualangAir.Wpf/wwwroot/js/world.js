import * as THREE from 'three';
import { NaturalDetails } from './nature.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function disposeTree(root) {
    const geometries = new Set(), materials = new Set();
    root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    root.removeFromParent();
}
export async function loadAssets() {
    const loader = new GLTFLoader(), assets = {};
    await Promise.all(['bang-jopi', 'klotok', 'rumah-adat', 'coral'].map(async name => { assets[name] = await loader.loadAsync(`models/${name}.glb`); }));
    return assets;
}
function mesh(parent, geometry, color, x = 0, y = 0, z = 0) {
    const item = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .82, flatShading: false }));
    item.position.set(x, y, z); item.castShadow = true; item.receiveShadow = true; parent.add(item); return item;
}
function box(parent, color, x, y, z, sx, sy, sz) { return mesh(parent, new THREE.BoxGeometry(sx, sy, sz), color, x, y, z); }
function sphere(parent, color, x, y, z, sx, sy = sx, sz = sx) { const o = mesh(parent, new THREE.IcosahedronGeometry(1, 3), color, x, y, z); o.scale.set(sx, sy, sz); return o; }
function cylinder(parent, color, x, y, z, r, h) { return mesh(parent, new THREE.CylinderGeometry(r, r * 1.1, h, 7), color, x, y, z); }
function cloneAsset(assets, name) {
    const clone = assets[name].scene.clone(true);
    clone.traverse(o => { if (o.isMesh) { o.geometry = o.geometry.clone(); o.material = o.material.clone(); o.castShadow = true; o.receiveShadow = true; } });
    return clone;
}
function island(parent, x, z, width, height, color) {
    const geometry = new THREE.PlaneGeometry(width * 2, width * 2, 32, 32); geometry.rotateX(-Math.PI/2);
    const p=geometry.attributes.position, colors=[];
    for(let i=0;i<p.count;i++) {
        const px=p.getX(i),pz=p.getZ(i),radius=Math.hypot(px/width,pz/width);
        const falloff=Math.pow(Math.max(0,1-radius*radius),1.7);
        const ridge=1+.22*Math.sin(px*.6+pz*.35)+.12*Math.cos(pz*1.1-px*.25)+.06*Math.sin(px*2.7);
        const y=falloff*height*ridge-.7;p.setY(i,y);
        const c=new THREE.Color(y<.6?0xb4a07b:color);
        c.multiplyScalar(.75+.25*Math.sin(px*.5+pz*.6)**2);
        if(y>height*.55)c.lerp(new THREE.Color(0x707568),.4);
        colors.push(c.r,c.g,c.b);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
    const terrain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98}));terrain.position.set(x,0,z);terrain.castShadow=true;terrain.receiveShadow=true;parent.add(terrain);return terrain;
}
function tree(parent, x, z, mangrove = false) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
    cylinder(g, 0x765334, 0, 3, 0, .3, 6);
    for (let j = 0; j < 9; j++) {
        const a = j * 2.399, r = 1.2 + j % 2 * .6;
        sphere(g, mangrove ? 0x355b35 : 0x4e7437, Math.cos(a)*r, 5.4 + j%3*.5, Math.sin(a)*r, 1.3, .8, 1.1);
        const branch = cylinder(g, 0x765334, Math.cos(a)*.65, 4.4, Math.sin(a)*.65, .10, 2.2); branch.rotation.z=Math.cos(a)*.7;branch.rotation.x=Math.sin(a)*.7;
    }
    if (mangrove) for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * .4, root = cylinder(g, 0x624733, Math.cos(a), .7, Math.sin(a), .12, 2.8);
        root.rotation.z = Math.cos(a) * .6; root.rotation.x = Math.sin(a) * .6;
    }
    return g;
}
function fish(parent, color, dolphin = false) {
    const g = new THREE.Group(); parent.add(g);
    sphere(g, color, 0, 0, 0, dolphin ? .4 : .18, dolphin ? .32 : .25, dolphin ? 1.25 : .5);
    const tail = mesh(g, new THREE.ConeGeometry(dolphin ? .5 : .3, .5, 3), color, 0, 0, -.65 * (dolphin ? 2 : 1)); tail.rotation.x = Math.PI / 2;
    const fin = mesh(g, new THREE.ConeGeometry(.22, .6, 3), color, 0, .28, -.1); fin.rotation.z = .15;
    return g;
}
export class BiomeWorld {
    constructor(scene, assets, biome) {
        this.scene = scene; this.assets = assets; this.biome = biome;
        this.root = new THREE.Group(); scene.add(this.root);
        this.collectibles = []; this.obstacles = []; this.animated = [];
        this.dock = new THREE.Vector3(0, 0, -8);
        this.buildDock(); this.buildEnvironment(); this.buildPickups(); this.nature = new NaturalDetails(this.root, biome);
    }
    addAsset(name, x, z, scale = 1) {
        const g = cloneAsset(this.assets, name); g.position.set(x, 0, z); g.scale.setScalar(scale); this.root.add(g); return g;
    }
    buildDock() {
        box(this.root, 0x93633e, 0, .4, -12, 10, .5, 7);
        for (const x of [-4, 4]) for (const z of [-9, -15]) cylinder(this.root, 0x523b2b, x, .5, z, .18, 3);
        this.addAsset('rumah-adat', 0, -15, 1.3);
        for (let i = 0; i < 3; i++) box(this.root, [0xe9ac51, 0x648749, 0xcd6949][i], -3 + i * 3, 1.2, -10, 1.7, 1, 1);
        this.beacon = cylinder(this.root, 0xf5cf74, 5.5, 3, -12, .12, 3);
        const ring = mesh(this.root, new THREE.TorusGeometry(4.5, .08, 4, 48), 0xf5cf74, 0, .25, -5);
        ring.rotation.x = Math.PI / 2;
    }
    obstacle(kind, x, z, radius = 1.7) {
        const g = new THREE.Group(); g.position.set(x, 0, z); this.root.add(g);
        g.userData = { kind, radius, baseX: x, baseZ: z, phase: Math.random() * 6, damage: 10 };
        if (kind === 'log') { const o = cylinder(g, 0x7e5b36, 0, .35, 0, .35, 5); o.rotation.z = Math.PI / 2; }
        else if (kind === 'root') { for (let i = 0; i < 3; i++) { const o = cylinder(g, 0x584730, i - 1, .4, 0, .18, 3); o.rotation.z = (i - 1) * .5; } }
        else if (kind === 'crocodile') {
            sphere(g, 0x456a3b, 0, .2, 0, .5, .25, 1.7); box(g, 0x5d7d45, 0, .2, 1.7, .65, .25, 1.1);
            for (const x of [-.25, .25]) sphere(g, 0xf4d067, x, .4, 1.6, .09);
            for (let i = 0; i < 5; i++) mesh(g, new THREE.ConeGeometry(.15, .25, 3), 0x314e29, 0, .5, i * .4 - .8);
            g.userData.damage = 18;
        } else if (kind === 'klotok') {
            g.add(cloneAsset(this.assets, 'klotok')); g.userData.damage = 16;
        } else if (kind === 'coral') { g.add(cloneAsset(this.assets, 'coral')); }
        else if (kind === 'jellyfish') {
            sphere(g, 0xe9a3d6, 0, .25, 0, .8, .4, .8);
            for (let i = 0; i < 5; i++) cylinder(g, 0xba87bd, (i - 2) * .2, -.3, 0, .025, 1);
            g.userData.damage = 14;
        } else if (kind === 'whirlpool') {
            for (let i = 1; i <= 4; i++) { const o = mesh(g, new THREE.TorusGeometry(i * .65, .06, 4, 32), 0xcce5db, 0, .1, 0); o.rotation.x = Math.PI / 2; }
        } else if (kind === 'pillar') { cylinder(g, 0x76878a, 0, 3, 0, 1.1, 8); }
        else sphere(g, 0x697c79, 0, .2, 0, 1.5, 1.1, 1.3);
        this.obstacles.push(g); return g;
    }
    buildEnvironment() {
        const b = this.biome;
        for (let i = 0; i < 18; i++) {
            const a = i / 18 * Math.PI * 2, x = Math.sin(a) * 83, z = Math.cos(a) * 83;
            if (b === 'SungaiGunung') {
                island(this.root, x, z, 17, 12 + i % 3 * 5, 0x52674b); tree(this.root, x, z);
                if (i % 2 === 0) this.obstacle(i % 4 ? 'log' : 'rock', Math.sin(a) * 37, Math.cos(a) * 37);
            } else if (b === 'HutanGambut') {
                tree(this.root, x * .7, z * .7, true); tree(this.root, x, z, true);
                if (i % 3 === 0) this.obstacle('root', x * .5, z * .5);
                if (i % 6 === 0) this.obstacle('crocodile', x * .35, z * .35, 2);
            } else if (b === 'DanauVulkanik') {
                island(this.root, x * 1.2, z * 1.2, 25, 30 + i % 4 * 5, 0x606d5a);
                if (i % 4 === 0) this.addAsset('rumah-adat', x * .7, z * .7, 1.7);
                if (i % 6 === 0) this.obstacle('whirlpool', x * .4, z * .4, 2.7);
            } else if (b === 'KotaKanal') {
                const h = 6 + i % 5 * 3;
                box(this.root, [0xab9d85, 0x788c85, 0xb58d6b][i % 3], x * .8, h / 2, z * .8, 8, h, 9);
                for (let j = 1; j < h; j += 2) box(this.root, 0xffd48a, x * .8, j, z * .8 - 4.55, 5, .65, .1);
                if (i % 4 === 0) this.obstacle('klotok', x * .3, z * .3, 2.5);
            } else if (b === 'LautKarang') {
                island(this.root, x, z, 12, 15, 0x6b8058); tree(this.root, x, z);
                if (i % 2 === 0) this.obstacle('coral', x * .35, z * .35, 1.5);
                if (i % 6 === 0) this.obstacle('jellyfish', x * .55, z * .55, 1.6);
                const school = fish(this.root, [0xffc85b, 0x4ae0d0, 0xff875d][i % 3]); school.position.set(x * .45, -.2, z * .45); school.userData = { kind: 'fish', phase: a }; this.animated.push(school);
            } else if (i % 5 === 0) { this.obstacle('rock', x * .65, z * .65); }
        }
        if (b === 'KotaKanal') {
            box(this.root, 0x8b9997, 0, 7, 42, 100, 1, 6);
            for (let x = -40; x <= 40; x += 16) this.obstacle('pillar', x, 42, 2);
            for (let i = 0; i < 5; i++) this.addAsset('klotok', -24 + i * 12, -30, .8);
        }
        if (b === 'HutanGambut') {
            const points = new Float32Array(120 * 3);
            for (let i = 0; i < points.length; i += 3) { points[i] = (Math.random() - .5) * 100; points[i + 1] = 1 + Math.random() * 5; points[i + 2] = (Math.random() - .5) * 100; }
            this.fireflies = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(points, 3)), new THREE.PointsMaterial({ color: 0xe5fa94, size: .16, transparent: true })); this.root.add(this.fireflies);
        }
    }
    buildPickups() {
        const b = this.biome;
        const types = ['Coin', 'Trash', 'Fish', 'Artifact'];
        if (b === 'LautKarang' || b === 'SamudraLepas') types.push('Pearl');
        if (b === 'SamudraLepas') types.push('Dolphin');
        types.forEach((type, groupIndex) => {
            const count = type === 'Artifact' ? 3 : type === 'Dolphin' ? 3 : 10;
            for (let i = 0; i < count; i++) {
                let item;
                if (type === 'Coin') { item = mesh(this.root, new THREE.CylinderGeometry(.38, .38, .12, 12), 0xffd160); item.rotation.x = Math.PI / 2; }
                else if (type === 'Trash') { item = new THREE.Group(); this.root.add(item); cylinder(item, 0x83c8c8, 0, 0, 0, .2, .7); cylinder(item, 0xe15b52, 0, .4, 0, .12, .12); item.rotation.z = .7; }
                else if (type === 'Fish' || type === 'Dolphin') item = fish(this.root, type === 'Fish' ? 0xf2b352 : 0x86adba, type === 'Dolphin');
                else if (type === 'Pearl') item = sphere(this.root, 0xffedd9, 0, 0, 0, .4);
                else item = mesh(this.root, new THREE.OctahedronGeometry(.6), 0xc99eff);
                const angle = i / count * Math.PI * 2 + groupIndex * .35;
                const radius = 12 + groupIndex * 7 + i % 3 * 5;
                item.position.set(Math.sin(angle) * radius, .5, Math.cos(angle) * radius);
                item.userData = { type, phase: i * .8 }; this.collectibles.push(item);
            }
        });
        // Visible coin trail leads a new player forward from the dock.
        this.collectibles.filter(c => c.userData.type === 'Coin').slice(0, 6).forEach((c, i) => c.position.set(Math.sin(i * .6) * 2, .5, 5 + i * 5));
    }
    respawn(item, raft) {
        for (let attempt = 0; attempt < 20; attempt++) {
            const a = Math.random() * Math.PI * 2, r = 18 + Math.random() * 50;
            item.position.set(Math.cos(a) * r, .5, Math.sin(a) * r);
            if (Math.hypot(item.position.x - raft.x, item.position.z - raft.z) > 12) break;
        }
    }
    update(time, dt, wave) {
        this.beacon.rotation.y += dt;
        this.nature.update(time);
        this.collectibles.forEach(c => {
            c.position.y = wave(c.position.x, c.position.z) + (c.userData.type === 'Dolphin' ? .5 + Math.sin(time * 2 + c.userData.phase) * .4 : .75);
            if (c.userData.type === 'Fish' || c.userData.type === 'Dolphin') c.rotation.y = Math.sin(time * .6 + c.userData.phase);
            else c.rotation.y += dt;
        });
        this.obstacles.forEach(o => {
            const d = o.userData;
            if (d.kind === 'klotok') { o.position.x = d.baseX + Math.sin(time * .12 + d.phase) * 12; o.rotation.y = Math.cos(time * .12 + d.phase) > 0 ? Math.PI / 2 : -Math.PI / 2; }
            if (d.kind === 'crocodile') { o.position.z = d.baseZ + Math.sin(time * .2 + d.phase) * 5; o.rotation.y = Math.cos(time * .2 + d.phase) > 0 ? 0 : Math.PI; }
            if (d.kind === 'whirlpool') o.rotation.y += dt * 2;
            if (d.kind !== 'pillar') o.position.y = wave(o.position.x, o.position.z) * .35;
        });
        this.animated.forEach(o => { o.rotation.y = time * .4 + o.userData.phase; o.position.y = -.15 + Math.sin(time + o.userData.phase) * .1; });
        if (this.fireflies) this.fireflies.material.opacity = .5 + Math.sin(time * 2) * .4;
    }
    dispose() { disposeTree(this.root); }
}
