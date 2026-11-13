// Launches the packaged-layout Electron app against a throwaway save and checks, through the Chromium
// debugging protocol, that the WebAssembly host, engine, audio decoding, and save persistence work.
// Usage: npm run build:web && npm run smoke        (set SMOKE_SOFTWARE_GL=1 on machines without a GPU)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electronPath from 'electron';

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.SMOKE_PORT ?? 9333);
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'petualang-smoke-'));
const savePath = path.join(workDir, 'save.json');
const outDir = process.env.SMOKE_OUT ?? path.join(here, '..', 'artifacts');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const editions = { linux: 'LINUX EDITION', darwin: 'MACOS EDITION', win32: 'WINDOWS EDITION' };

async function launch() {
    const args = ['.', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(workDir, 'profile')}`];
    if (process.platform === 'linux' && process.env.CI) args.push('--no-sandbox');
    if (process.env.SMOKE_SOFTWARE_GL) args.push('--enable-unsafe-swiftshader', '--ignore-gpu-blocklist');
    const child = spawn(electronPath, args, { cwd: here, env: { ...process.env, PETUALANG_AIR_SAVE_PATH: savePath }, stdio: 'inherit' });
    const exited = new Promise(resolve => child.once('exit', resolve));
    let page;
    for (let attempt = 0; attempt < 120 && !page; attempt++) {
        await sleep(500);
        try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(p => p.type === 'page'); } catch { /* not listening yet */ }
    }
    if (!page) { child.kill(); throw new Error('Electron did not expose a debuggable page'); }
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    const pending = new Map(); const exceptions = []; let sequence = 0;
    socket.onmessage = message => {
        const data = JSON.parse(message.data);
        if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails?.exception?.description ?? JSON.stringify(data.params));
        if (data.id && pending.has(data.id)) { const { resolve, reject } = pending.get(data.id); pending.delete(data.id); data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result); }
    };
    const call = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++sequence, { resolve, reject }); socket.send(JSON.stringify({ id: sequence, method, params })); });
    const evaluate = async expression => {
        const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
        return result.result.value;
    };
    const waitFor = async (expression, label, seconds = 90) => {
        for (let elapsed = 0; elapsed < seconds * 2; elapsed++) { if (await evaluate(expression)) return; await sleep(500); }
        throw new Error(`Timed out waiting for ${label}; page says: ${await evaluate('document.body.innerText.slice(0, 400)')}`);
    };
    await call('Runtime.enable');
    return { child, exited, call, evaluate, waitFor, exceptions, close: () => socket.close() };
}

function check(condition, label) {
    if (!condition) throw new Error(`Check failed: ${label}`);
    console.log(`ok - ${label}`);
}

let app;
try {
    app = await launch();
    await app.waitFor('!!document.querySelector(".main-menu")', 'main menu');
    check(await app.evaluate('document.querySelector(".title-footer").innerText.toUpperCase()').then(text => text.includes(editions[process.platform])), `edition label is ${editions[process.platform]}`);
    check(await app.evaluate('PetualangEngine.renderer.capabilities.isWebGL2 && !PetualangEngine.renderer.getContext().isContextLost()'), 'WebGL2 context is live');
    check(await app.evaluate('PetualangEngine.renderer.info.programs.every(p => !p.diagnostics || p.diagnostics.runnable !== false)'), 'shaders compiled');
    check(await app.evaluate('(async () => { PetualangEngine.audio.unlock(); await PetualangEngine.audio.loadingTracks; return PetualangEngine.audio.tracksReady && Object.keys(PetualangEngine.audio.tracks).length === 3; })()'), 'three Ogg soundtracks decoded');
    await sleep(1500);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `desktop-smoke-${process.platform}.png`), Buffer.from((await app.call('Page.captureScreenshot', { format: 'png' })).data, 'base64'));

    await app.evaluate('document.querySelector(".title-primary").click()');
    await app.waitFor('!document.querySelector(".main-menu")', 'gameplay after continuing', 20);
    await app.evaluate('PetualangEngine.emit("OnResourceCollected", "Coin", "SungaiGunung")');
    for (let attempt = 0; attempt < 20 && !(fs.existsSync(savePath) && fs.readFileSync(savePath, 'utf8').includes('"SungaiGunung:Coin":1')); attempt++) await sleep(250);
    check(fs.readFileSync(savePath, 'utf8').includes('"SungaiGunung:Coin":1'), 'collected coin reached the save file on disk');
    check(!fs.existsSync(`${savePath}.tmp`), 'save was replaced atomically');
    check(app.exceptions.length === 0, `no uncaught page exceptions ${app.exceptions.join(' | ')}`);

    await app.evaluate('petualangShell.quit()').catch(() => { });
    await Promise.race([app.exited, sleep(15000).then(() => { throw new Error('App did not quit through the shell bridge'); })]);
    console.log('ok - quit through the shell bridge');

    app = await launch();
    await app.waitFor('!!document.querySelector(".main-menu")', 'main menu after restart');
    await app.evaluate('document.querySelector(".title-primary").click()');
    await app.waitFor('document.body.innerText.includes("1/6")', 'restored mission progress 1/6', 20);
    console.log('ok - progress restored after restart');
    console.log('Desktop smoke test passed');
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    app?.close();
    app?.child.kill();
    await sleep(500);
    fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
