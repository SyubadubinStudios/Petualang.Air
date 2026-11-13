"""Check a running isolated WPF QA session using its local CDP endpoint."""
import base64, json, time, urllib.request
from pathlib import Path
import websocket

ROOT = Path(__file__).resolve().parents[1]
page = next(p for p in json.load(urllib.request.urlopen('http://localhost:9228/json')) if p['type'] == 'page')
ws = websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=60)
seq = 0
errors = []
results = []

def call(method, params=None):
    global seq
    seq += 1
    ws.send(json.dumps({'id': seq, 'method': method, 'params': params or {}}))
    while True:
        response = json.loads(ws.recv())
        if response.get('method') == 'Runtime.exceptionThrown':
            errors.append(response['params'])
        if response.get('id') == seq:
            if 'error' in response:
                raise RuntimeError(response['error'])
            return response.get('result', {})

def ev(expression):
    result = call('Runtime.evaluate', {'expression': expression, 'awaitPromise': True, 'returnByValue': True, 'userGesture': True})
    if 'exceptionDetails' in result:
        raise RuntimeError(result['exceptionDetails'])
    return result.get('result', {}).get('value')

call('Runtime.enable')
ev('PetualangEngine.setPaused(true)')
for biome in ['SungaiGunung', 'HutanGambut', 'DanauVulkanik', 'KotaKanal', 'LautKarang', 'SamudraLepas']:
    ev(f"PetualangEngine.setBiome('{biome}')")
    time.sleep(.4)
    result = ev('''(() => {
        const e = PetualangEngine, eco = e.world.ecosystem;
        eco.update(1, () => 0);
        const before = eco.plants.map(g => g.batches[0].mesh.instanceMatrix.array[13]);
        eco.update(1, () => .5);
        const buoyancy = eco.plants.every((g,i) => Math.abs(g.batches[0].mesh.instanceMatrix.array[13] - before[i] - (g.floating ? .5 : 0)) < .001);
        return { biome: e.biome, plants: eco.plants.map(g => ({species:g.species, count:g.patches.length})), insects:eco.insects.length,
            pivots:eco.insects.every(i => i.left && i.right && Math.abs(i.left.rotation.z + i.right.rotation.z) < .001), buoyancy,
            noCollisions:e.world.obstacles.every(o => !eco.root.children.includes(o)), error:e.renderer.getContext().getError() };
    })()''')
    assert result['pivots'] and result['buoyancy'] and result['noCollisions'] and result['error'] == 0, result
    ev('''{const e=PetualangEngine;e.camera.position.set(17,2.4,-9);e.controls.target.set(14,.35,-3);e.controls.update();}''')
    time.sleep(.2)
    picture=call('Page.captureScreenshot', {'format':'png'})
    (ROOT / 'artifacts' / f'ecosystem-{biome}.png').write_bytes(base64.b64decode(picture['data']))
    results.append(result)
    print('PASS habitat, animation, buoyancy:', biome, flush=True)

memory = []
for cycle in range(3):
    ev("PetualangEngine.setBiome('LautKarang')")
    time.sleep(.3)
    ev("PetualangEngine.setBiome('HutanGambut')")
    time.sleep(.3)
    memory.append(ev('({...PetualangEngine.renderer.info.memory})'))
assert memory[-1]['geometries'] <= memory[0]['geometries'] + 2, memory
assert memory[-1]['textures'] <= memory[0]['textures'] + 2, memory

ev("PetualangEngine.setBiome('SungaiGunung')")
if ev('!!document.querySelector(".title-primary")'):
    ev('document.querySelector(".title-primary").click()')
time.sleep(.5)
ev('''{const e=PetualangEngine;e.setPaused(true);e.camera.position.set(17,2.4,-9);e.controls.target.set(14,.35,-3);e.controls.update();}''')
time.sleep(.5)
result = call('Page.captureScreenshot', {'format': 'png'})
(ROOT / 'docs/screenshots/ecosystem.png').write_bytes(base64.b64decode(result['data']))
assert not errors, errors
(ROOT / 'artifacts/ecosystem-report.json').write_text(json.dumps({'habitats': results, 'memory': memory, 'exceptions': errors}, indent=2))
ws.close()
print('PASS ecosystem runtime and repeated-biome memory checks')
