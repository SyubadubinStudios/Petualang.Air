import test from 'node:test';
import assert from 'node:assert/strict';
import { HABITATS, ECOSYSTEM_ASSETS, habitatPosition } from '../PetualangAir.Wpf/wwwroot/js/habitats.js';

test('freshwater plants and flying insects stay out of marine biomes', () => {
    assert.deepEqual(Object.keys(HABITATS.LautKarang).sort(), ['seagrass', 'seaweed']);
    assert.deepEqual(HABITATS.SamudraLepas, {});
    for (const biome of ['SungaiGunung', 'HutanGambut', 'DanauVulkanik', 'KotaKanal']) {
        assert.equal(HABITATS[biome].seagrass, undefined);
        assert.equal(HABITATS[biome].seaweed, undefined);
    }
});
test('all six species have a habitat and density stays bounded', () => {
    assert.deepEqual([...new Set(Object.values(HABITATS).flatMap(Object.keys))].sort(), [...ECOSYSTEM_ASSETS].sort());
    for (const species of Object.values(HABITATS)) {
        assert.ok(Object.values(species).reduce((sum, count) => sum + count, 0) <= 64);
        for (const count of Object.values(species)) assert.ok(Number.isInteger(count) && count > 0);
    }
});
test('patches and insect flight radii clear the dock and starter channel', () => {
    for (let species = 0; species < 6; species++) for (let i = 0; i < 32; i++) {
        const p = habitatPosition(i, species);
        assert.ok(Math.abs(p.x) - 2.2 > 9);
        assert.ok(Math.hypot(p.x, p.z) < 75);
        assert.deepEqual(p, habitatPosition(i, species));
    }
});
