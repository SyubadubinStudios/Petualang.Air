// Narrow bridge between the game page and the Electron main process. Save access is synchronous
// because the C# domain layer persists through ordinary synchronous file calls.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petualangHost', {
    platform: process.platform,
    readSave: name => ipcRenderer.sendSync('save:read', name),
    writeSave: (name, text) => ipcRenderer.sendSync('save:write', name, text),
    quit: () => ipcRenderer.send('shell:quit'),
    toggleFullscreen: () => ipcRenderer.send('shell:fullscreen')
});
