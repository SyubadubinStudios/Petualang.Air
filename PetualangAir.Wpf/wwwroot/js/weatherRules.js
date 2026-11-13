export const WEATHER_CYCLE = 180;
export function weatherPhase(time, biome) {
    const t = ((time % WEATHER_CYCLE) + WEATHER_CYCLE) % WEATHER_CYCLE;
    if (biome === 'SamudraLepas') return t < 35 ? 'Cerah' : t < 55 ? 'Mendung' : t < 105 ? 'Badai' : t < 135 ? 'Pelangi' : 'Cerah';
    if (biome === 'HutanGambut') return t < 60 ? 'Kabut' : t < 130 ? 'Malam' : 'Hujan';
    return t < 65 ? 'Cerah' : t < 105 ? 'Hujan' : t < 140 ? 'Pelangi' : 'Kabut';
}
