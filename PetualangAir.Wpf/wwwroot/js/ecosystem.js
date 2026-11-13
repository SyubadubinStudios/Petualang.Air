import * as THREE from 'three';
import { HABITATS, habitatPosition } from './habitats.js';

// Each plant primitive is one instanced draw; each insect preserves its flap pivots.
export class AquaticEcosystem {
    constructor(parent, assets, biome) {
        this.root = new THREE.Group(); this.root.name = 'AquaticEcosystem'; parent.add(this.root);
        this.plants = []; this.insects = []; this.dummy = new THREE.Object3D(); this.matrix = new THREE.Matrix4();
        Object.entries(HABITATS[biome] || {}).forEach(([species, count], speciesIndex) => {
            const source = assets[species].scene;
            if (species === 'butterfly' || species === 'dragonfly') {
                for (let i = 0; i < count; i++) {
                    const object = source.clone(true);
                    object.traverse(mesh => {
                        if (!mesh.isMesh) return;
                        mesh.geometry = mesh.geometry.clone(); mesh.material = mesh.material.clone();
                    });
                    const base = habitatPosition(i, speciesIndex);
                    object.scale.setScalar(species === 'butterfly' ? .8 : .9);
                    this.root.add(object);
                    this.insects.push({ object, species, base, phase: i * 2.399, left: object.getObjectByName('WingL'), right: object.getObjectByName('WingR') });
                }
                return;
            }
            source.updateMatrixWorld(true);
            const patches = Array.from({ length: count }, (_, i) => ({ ...habitatPosition(i, speciesIndex), phase: i * 2.399, scale: .7 + i % 4 * .14 }));
            const batches = [];
            source.traverse(mesh => {
                if (!mesh.isMesh) return;
                const batch = new THREE.InstancedMesh(mesh.geometry.clone(), mesh.material.clone(), count);
                batch.name = species; batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                // Small moving batches: avoid stale instance bounds when waves change.
                batch.frustumCulled = false; batch.receiveShadow = true;
                this.root.add(batch); batches.push({ mesh: batch, local: mesh.matrixWorld.clone() });
            });
            this.plants.push({ species, patches, batches, floating: species === 'lotus' || species === 'water-hyacinth' });
        });
        this.update(0, () => 0);
    }
    update(time, wave) {
        for (const group of this.plants) {
            group.patches.forEach((patch, i) => {
                const height = group.floating ? wave(patch.x, patch.z) + .045 : group.species === 'seaweed' ? -.65 : -.28;
                this.dummy.position.set(patch.x, height, patch.z);
                this.dummy.rotation.set(Math.sin(time * .8 + patch.phase) * .055, patch.phase, Math.sin(time * 1.2 + patch.phase) * (group.floating ? .035 : .14));
                this.dummy.scale.setScalar(patch.scale); this.dummy.updateMatrix();
                for (const batch of group.batches) {
                    this.matrix.multiplyMatrices(this.dummy.matrix, batch.local);
                    batch.mesh.setMatrixAt(i, this.matrix);
                }
            });
            group.batches.forEach(batch => { batch.mesh.instanceMatrix.needsUpdate = true; });
        }
        for (const insect of this.insects) {
            const { object, base, phase, species, left, right } = insect;
            const a = time * (species === 'dragonfly' ? .85 : .38) + phase;
            const radius = species === 'dragonfly' ? 2.2 : 1.3;
            object.position.set(base.x + Math.sin(a) * radius, 1.2 + .35 * Math.sin(a * 1.7) + wave(base.x, base.z) * .15, base.z + Math.cos(a) * radius);
            object.rotation.y = a - Math.PI / 2;
            object.rotation.z = Math.sin(a) * .12;
            const flap = Math.sin(time * (species === 'dragonfly' ? 48 : 14) + phase) * (species === 'dragonfly' ? .35 : 1.0);
            if (left) left.rotation.z = flap;
            if (right) right.rotation.z = -flap;
        }
    }
}
