// Decorative species only: these patches never enter the collision or pickup lists.
export const HABITATS = {
    SungaiGunung: { lotus: 14, butterfly: 8, dragonfly: 6 },
    HutanGambut: { lotus: 12, 'water-hyacinth': 20, butterfly: 6, dragonfly: 10 },
    DanauVulkanik: { lotus: 24, 'water-hyacinth': 10, butterfly: 8, dragonfly: 8 },
    KotaKanal: { 'water-hyacinth': 12, dragonfly: 6 },
    LautKarang: { seagrass: 32, seaweed: 20 },
    SamudraLepas: {}
};
export const ECOSYSTEM_ASSETS = ['lotus', 'water-hyacinth', 'seagrass', 'seaweed', 'butterfly', 'dragonfly'];
export function habitatPosition(index, speciesIndex = 0) {
    const side = index % 2 ? -1 : 1;
    return { x: side * (12 + index % 4 * 2.8 + speciesIndex * .8), z: -5 + Math.floor(index / 2) * 3.2 + speciesIndex * 1.4 };
}
