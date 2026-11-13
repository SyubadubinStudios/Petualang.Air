// Original synthesized soundscape: filtered water noise, flute, metallophone and hand drums.
export class NusantaraAudio {
    constructor() { this.volume = .35; this.muted = false; this.paused = false; this.step = 0; this.nextNote = 0; this.biome = 'SungaiGunung'; this.musicVolume = .65; this.effectsVolume = .8; }
    async unlock() {
        if (!this.context) {
            this.context = new AudioContext();
            this.master = this.context.createGain(); this.master.connect(this.context.destination);
            this.musicBus = this.context.createGain(); this.musicBus.connect(this.master);
            this.effectsBus = this.context.createGain(); this.effectsBus.connect(this.master);
            this.musicBus.gain.value = this.musicVolume; this.effectsBus.gain.value = this.effectsVolume;
            this.loadingTracks = this.loadTracks().catch(error => { this.trackError = String(error); console.warn('Soundtrack fallback', error); });
            this.waterGain = this.context.createGain(); this.waterGain.gain.value = .06; this.waterGain.connect(this.effectsBus);
            const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
            const data = buffer.getChannelData(0); let last = 0;
            for (let i = 0; i < data.length; i++) { last = (last + Math.random() * .04 - .02) / 1.02; data[i] = last * 5; }
            this.noise = this.context.createBufferSource(); this.noise.buffer = buffer; this.noise.loop = true;
            this.filter = this.context.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 700;
            this.noise.connect(this.filter); this.filter.connect(this.waterGain); this.noise.start();
            this.nextNote = this.context.currentTime;
        }
        this.applyVolume();
        if (!this.paused && this.context.state === 'suspended') await this.context.resume();
    }
    configure(muted, volume, music = .65, effects = .8) {
        this.muted = muted; this.volume = Math.max(0, Math.min(1, volume)); this.musicVolume = music; this.effectsVolume = effects;
        if (this.musicBus) this.musicBus.gain.setTargetAtTime(music, this.context.currentTime, .1);
        if (this.effectsBus) this.effectsBus.gain.setTargetAtTime(effects, this.context.currentTime, .1);
        this.applyVolume();
    }
    async loadTracks() {
        const names = ['jejak-air', 'senja-danau', 'layar-samudra']; this.tracks = {};
        const buffers = await Promise.all(names.map(async name => {
            const response = await fetch(`audio/${name}.ogg`); if (!response.ok) throw new Error(`Music ${name}: ${response.status}`);
            return this.context.decodeAudioData(await response.arrayBuffer());
        }));
        if (this.context.state === 'closed') return;
        names.forEach((name, i) => {
            const source = this.context.createBufferSource(), gain = this.context.createGain();
            source.buffer = buffers[i]; source.loop = true; gain.gain.value = 0; source.connect(gain); gain.connect(this.musicBus); source.start(); this.tracks[name] = { source, gain };
        });
        this.tracksReady = true;
    }
    applyVolume() { if (this.master) this.master.gain.setTargetAtTime(this.muted || this.paused ? 0 : this.volume, this.context.currentTime, .08); }
    setPaused(paused) { if (this.paused !== paused) { this.paused = paused; this.applyVolume(); } }
    tone(frequency, duration, type, gain, at = this.context.currentTime, music = false) {
        const osc = this.context.createOscillator(), envelope = this.context.createGain();
        osc.type = type; osc.frequency.value = frequency;
        envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(gain, at + .025);
        envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
        osc.connect(envelope); envelope.connect(music ? this.musicBus : this.effectsBus); osc.start(at); osc.stop(at + duration + .02);
        osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
    }
    effect(kind) {
        if (!this.context || this.context.state !== 'running' || this.paused) return;
        if (kind === 'hit') { this.tone(75, .2, 'triangle', .25); return; }
        if (kind === 'thunder') { this.tone(38, 1.4, 'sawtooth', .12); return; }
        const notes = kind === 'Artifact' ? [440, 550, 660, 880] : [660, 880];
        notes.forEach((n, i) => this.tone(n, .3, 'sine', .08, this.context.currentTime + i * .09));
    }
    update(biome, intensity, speed) {
        this.biome = biome;
        if (!this.context || this.context.state !== 'running' || this.paused) return;
        const now = this.context.currentTime;
        this.waterGain.gain.setTargetAtTime(.04 + intensity * .08 + Math.min(.05, Math.abs(speed) * .004), now, .5);
        this.filter.frequency.setTargetAtTime(biome === 'SamudraLepas' ? 400 : 1100, now, .5);
        if (this.tracksReady) {
            const name = biome === 'SamudraLepas' ? 'layar-samudra' : ['DanauVulkanik','HutanGambut'].includes(biome) ? 'senja-danau' : 'jejak-air';
            if (name !== this.currentTrack) {
                this.currentTrack = name;
                Object.entries(this.tracks).forEach(([key, track]) => track.gain.gain.setTargetAtTime(key === name ? .85 : 0, now, 1.5));
            }
            return;
        }
        if (this.nextNote < now - .5) this.nextNote = now;
        const calm = biome === 'DanauVulkanik' || biome === 'HutanGambut';
        const scale = calm ? [0, 3, 5, 7, 10, 7, 5, 3] : [0, 2, 7, 9, 12, 9, 7, 2];
        while (this.nextNote < now + .15) {
            const freq = 220 * Math.pow(2, scale[this.step % scale.length] / 12);
            this.tone(freq * (calm ? 2 : 1), calm ? .85 : .4, 'sine', .045, this.nextNote, true);
            if (!calm) this.tone(freq * 2.76, .22, 'sine', .018, this.nextNote, true); // inharmonic gamelan-like overtone
            if (this.step % 2 === 0 && !calm) this.tone(this.step % 4 ? 115 : 65, .15, 'triangle', .10 + intensity * .03, this.nextNote, true);
            this.nextNote += calm ? .65 : Math.max(.22, .42 - intensity * .08); this.step++;
        }
    }
    async dispose() { Object.values(this.tracks || {}).forEach(track => track.source.stop()); this.noise?.stop(); if (this.context && this.context.state !== 'closed') await this.context.close(); }
}
