import test from 'node:test';
import assert from 'node:assert/strict';
import { weatherPhase, WEATHER_CYCLE } from '../PetualangAir.Wpf/wwwroot/js/weatherRules.js';
test('ocean transitions through a 50-second storm into rainbow', () => {
    assert.equal(weatherPhase(0, 'SamudraLepas'), 'Cerah');
    assert.equal(weatherPhase(35, 'SamudraLepas'), 'Mendung');
    assert.equal(weatherPhase(55, 'SamudraLepas'), 'Badai');
    assert.equal(weatherPhase(104.99, 'SamudraLepas'), 'Badai');
    assert.equal(weatherPhase(105, 'SamudraLepas'), 'Pelangi');
    assert.equal(weatherPhase(WEATHER_CYCLE, 'SamudraLepas'), 'Cerah');
});
test('swamp has fog and night while lake receives rain and rainbow', () => {
    assert.equal(weatherPhase(0, 'HutanGambut'), 'Kabut');
    assert.equal(weatherPhase(70, 'HutanGambut'), 'Malam');
    assert.equal(weatherPhase(135, 'HutanGambut'), 'Hujan');
    assert.equal(weatherPhase(70, 'DanauVulkanik'), 'Hujan');
    assert.equal(weatherPhase(120, 'DanauVulkanik'), 'Pelangi');
});
