import test from 'node:test';
import assert from 'node:assert/strict';
import { deadzone, mapGamepad } from '../PetualangAir.Wpf/wwwroot/js/input.js';
// Weather phase is kept dependency-free for deterministic cycle checks.
test('deadzone eliminates drift and rescales travel', () => {
    assert.equal(deadzone(.1), 0); assert.equal(deadzone(-.16), 0); assert.equal(deadzone(1), 1); assert.equal(deadzone(-1), -1); assert.equal(deadzone(undefined), 0);
});
test('standard gamepad supports analog movement, camera, boost and triggers', () => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
    buttons[0] = { pressed: true, value: 1 }; buttons[7].value = .5;
    const input = mapGamepad({ connected: true, mapping: 'standard', axes: [-1, 0, 1, -.5], buttons });
    assert.equal(input.forward, .5); assert.equal(input.turn, 1); assert.equal(input.boost, true); assert.equal(input.cameraX, 1); assert.ok(input.cameraY < 0); assert.deepEqual(input.buttons, [0]);
});
test('disconnect and unsupported mapping cannot leave movement stuck', () => {
    for (const pad of [null, { connected: false }, { connected: true, mapping: '' }]) {
        const input = mapGamepad(pad); assert.equal(input.forward, 0); assert.equal(input.turn, 0); assert.equal(input.boost, false);
    }
});
