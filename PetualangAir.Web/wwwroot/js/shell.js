// Host bridge for the WebAssembly build. Inside Electron, preload.cjs provides window.petualangHost
// (real save files and window control); in a plain browser the same calls fall back to web APIs.
window.petualangShell = (() => {
    const host = window.petualangHost;
    const key = name => `petualang-air:${name}`;
    const editions = { linux: 'LINUX EDITION', darwin: 'MACOS EDITION', win32: 'WINDOWS EDITION' };
    return {
        edition: () => host ? editions[host.platform] ?? 'DESKTOP EDITION' : 'WEB EDITION',
        readSave: name => host ? host.readSave(name) : localStorage.getItem(key(name)),
        writeSave: (name, text) => {
            try {
                if (host) return host.writeSave(name, text);
                localStorage.setItem(key(name), text);
                return true;
            } catch (error) { console.error('writeSave', error); return false; }
        },
        quit: () => host ? host.quit() : window.close(),
        toggleFullscreen: () => {
            if (host) host.toggleFullscreen();
            else if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
        }
    };
})();
