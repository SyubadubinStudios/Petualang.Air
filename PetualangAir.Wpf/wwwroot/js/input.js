// Standard Gamepad API mapping. Keep input math separate for deterministic tests.
export function deadzone(value, threshold = 0.16) {
    if (!Number.isFinite(value) || Math.abs(value) <= threshold) return 0;
    return Math.sign(value) * Math.min(1, (Math.abs(value) - threshold) / (1 - threshold));
}
export function mapGamepad(pad) {
    if (!pad || pad.connected === false || pad.mapping !== 'standard') return { forward: 0, turn: 0, cameraX: 0, cameraY: 0, boost: false, buttons: [] };
    const down = i => !!pad.buttons?.[i]?.pressed;
    return {
        forward: Math.max(-1, Math.min(1, -deadzone(pad.axes?.[1]) + (pad.buttons?.[7]?.value || 0) - (pad.buttons?.[6]?.value || 0))),
        turn: -deadzone(pad.axes?.[0]), cameraX: deadzone(pad.axes?.[2]), cameraY: deadzone(pad.axes?.[3]),
        boost: down(0), buttons: [0, 1, 2, 3, 4, 5, 9, 12, 13, 14, 15].filter(down)
    };
}
export class InputController {
    constructor(canvas, action, wakeAudio) {
        this.canvas = canvas; this.action = action; this.wakeAudio = wakeAudio;
        this.keys = {}; this.previous = new Set(); this.padName = ''; this.paused = false;
        this.down = e => {
            if (e.code === 'Tab' && this.paused) {
                const controls = Array.from(document.querySelectorAll('.dialog button:not(:disabled), .dialog input, .dialog select')).filter(c => c.offsetParent !== null);
                if (controls.length) {
                    const index = controls.indexOf(document.activeElement);
                    if (index < 0 || (!e.shiftKey && index === controls.length - 1) || (e.shiftKey && index === 0)) {
                        e.preventDefault(); controls[e.shiftKey ? controls.length - 1 : 0].focus();
                    }
                }
            }
            if (e.code === 'F11') { e.preventDefault(); if (!e.repeat) action('fullscreen'); return; }
            if (e.code === 'Escape') { e.preventDefault(); if (!e.repeat) action('pause'); return; }
            if (e.target !== canvas && e.target !== document.body) return;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
            this.keys[e.code] = true; wakeAudio();
            const actions = { KeyE: 'market', KeyJ: 'journal', KeyM: 'missions', Digit1: 'coconut', Digit2: 'coffee' };
            if (!e.repeat && actions[e.code]) action(actions[e.code]);
        };
        this.up = e => { this.keys[e.code] = false; };
        this.blur = () => { this.keys = {}; this.previous.clear(); action('blur'); };
        this.wake = () => wakeAudio(); window.addEventListener("pointerdown", this.wake);
        this.pointer = () => { canvas.focus(); wakeAudio(); };
        window.addEventListener('keydown', this.down); window.addEventListener('keyup', this.up);
        window.addEventListener('blur', this.blur); canvas.addEventListener('pointerdown', this.pointer);
        canvas.tabIndex = 0;
    }
    update(dt, paused) {
        this.paused = paused;
        const pads = typeof navigator.getGamepads === 'function' ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
        const pad = pads.find(p => p.connected && p.mapping === 'standard');
        const name = pad ? pad.id : (pads.length ? 'Pemetaan gamepad tidak didukung' : 'Keyboard / mouse');
        if (name !== this.padName) { this.padName = name; this.action('controller', name); }
        const mapped = mapGamepad(pad), pressed = new Set(mapped.buttons);
        const edge = i => pressed.has(i) && !this.previous.has(i);
        if (pressed.size) this.wakeAudio();
        if (edge(9)) this.action('pause');
        if (paused) {
            if (edge(1)) this.action('close');
            const controls = Array.from(document.querySelectorAll('.dialog button:not(:disabled), .dialog input, .dialog select')).filter(e => e.offsetParent !== null);
            let index = controls.indexOf(document.activeElement);
            const range = document.activeElement?.matches('input[type="range"]');
            const selectFocused = document.activeElement?.tagName === 'SELECT';
            if (range && (edge(14) || edge(15))) {
                const slider = document.activeElement;
                slider.value = Math.max(Number(slider.min), Math.min(Number(slider.max), Number(slider.value) + (edge(15) ? 1 : -1) * Number(slider.step)));
                slider.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (edge(12) || (!range && !selectFocused && edge(14))) controls[(index - 1 + controls.length) % controls.length]?.focus();
            if (edge(13) || (!range && !selectFocused && edge(15))) controls[(index + 1) % controls.length]?.focus();
            if (document.activeElement?.tagName === 'SELECT' && (edge(14) || edge(15))) {
                const select = document.activeElement; select.selectedIndex = Math.max(0, Math.min(select.options.length - 1, select.selectedIndex + (edge(15) ? 1 : -1))); select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (edge(0)) document.activeElement?.click();
        } else {
            if (edge(1)) this.action('coconut');
            if (edge(2)) this.action('market');
            if (edge(3)) this.action('journal');
            if (edge(4)) this.action('previousBiome');
            if (edge(5)) this.action('nextBiome');
        }
        this.previous = pressed;
        const key = (...names) => names.some(n => this.keys[n]) ? 1 : 0;
        return {
            forward: Math.max(-1, Math.min(1, mapped.forward + key('KeyW', 'ArrowUp') - key('KeyS', 'ArrowDown'))),
            turn: Math.max(-1, Math.min(1, mapped.turn + key('KeyA', 'ArrowLeft') - key('KeyD', 'ArrowRight'))),
            boost: mapped.boost || !!this.keys.Space, cameraX: mapped.cameraX, cameraY: mapped.cameraY
        };
    }
    dispose() {
        window.removeEventListener('keydown', this.down); window.removeEventListener('keyup', this.up);
        window.removeEventListener('blur', this.blur); window.removeEventListener('pointerdown', this.wake); this.canvas.removeEventListener('pointerdown', this.pointer);
    }
}
