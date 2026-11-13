// Electron host for Linux and macOS. It serves the published Blazor WebAssembly build from a private
// app:// origin (no network, no local HTTP port) and owns the save files and the window.
const { app, BrowserWindow, Menu, ipcMain, protocol, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const webRoot = path.join(__dirname, 'build', 'web', 'wwwroot');
const origin = 'app://petualang';
const contentTypes = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm',
    '.glb': 'model/gltf-binary', '.ogg': 'audio/ogg', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.dat': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8'
};
const saveNames = new Set(['save.json', 'save.json.previous']);
let savePath;
let mainWindow;

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, codeCache: true } }
]);

function saveFile(name) {
    if (!saveNames.has(name)) throw new Error(`Unknown save file: ${name}`);
    return name === 'save.json' ? savePath : `${savePath}.previous`;
}

async function serve(request) {
    const url = new URL(request.url);
    if (url.host !== 'petualang') return new Response('Not found', { status: 404 });
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.normalize(path.join(webRoot, relative));
    if (file !== webRoot && !file.startsWith(webRoot + path.sep)) return new Response('Forbidden', { status: 403 });
    try {
        const body = await fs.promises.readFile(file);
        return new Response(body, { headers: { 'content-type': contentTypes[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-cache' } });
    } catch {
        return new Response('Not found', { status: 404 });
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366, height: 800, minWidth: 900, minHeight: 600,
        title: 'Petualang Air - Ekspedisi Bang Jopi',
        backgroundColor: '#0B192C',
        autoHideMenuBar: true,
        webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false }
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://')) shell.openExternal(url);
        return { action: 'deny' };
    });
    mainWindow.webContents.on('will-navigate', (event, url) => { if (!url.startsWith(origin + '/')) event.preventDefault(); });
    mainWindow.on('page-title-updated', event => event.preventDefault());
    mainWindow.on('closed', () => { mainWindow = undefined; });
    mainWindow.loadURL(`${origin}/index.html`);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
    app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });

    ipcMain.on('save:read', (event, name) => {
        try { event.returnValue = fs.readFileSync(saveFile(name), 'utf8'); }
        catch { event.returnValue = null; }
    });
    ipcMain.on('save:write', (event, name, text) => {
        try {
            const target = saveFile(name);
            if (typeof text !== 'string') throw new TypeError('Save content must be text');
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(`${target}.tmp`, text, 'utf8');
            fs.renameSync(`${target}.tmp`, target);
            event.returnValue = true;
        } catch (error) {
            console.error('save:write', error);
            event.returnValue = false;
        }
    });
    ipcMain.on('shell:quit', () => app.quit());
    ipcMain.on('shell:fullscreen', () => { if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen()); });

    app.whenReady().then(() => {
        // Same location and format as the Windows build: <appData>/PetualangAir/save.json.
        savePath = path.resolve(process.env.PETUALANG_AIR_SAVE_PATH ?? path.join(app.getPath('appData'), 'PetualangAir', 'save.json'));
        protocol.handle('app', serve);
        // macOS keeps its standard application menu (Cmd+Q, Cmd+H); elsewhere the game has no menu bar.
        if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
        createWindow();
    });
    app.on('window-all-closed', () => app.quit());
}
