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
if ev('!!document.querySelector(".dialog-footer button")'):
    ev('document.querySelector(".dialog-footer button").click()')
    time.sleep(.8)
if ev('!!document.querySelector(".title-primary")'):
    ev('document.querySelector(".title-primary").click()')
    time.sleep(.8)
# Use unlocked QA progress and the real biome buttons so HUD and world agree.
shots=[
    (0,'river-wetlands',(17,2.4,-9),(14,.35,-3)),
    (1,'peat-wetlands',(20,3,-7),(15,.5,1)),
    (2,'volcanic-lake',(9,5,-5),(0,1,-15)),
    (3,'canal-city',(17,6,15),(0,2,35)),
    (4,'coral-shallows',(18,2.4,-8),(15,.3,1)),
    (5,'open-ocean',(15,5,7),(9,1,18))
]
for index,name,camera,target in shots:
    ev(f'document.querySelectorAll(".btn-biome")[{index}].click()')
    time.sleep(.7)
    ev('PetualangEngine.setPaused(true)')
    if index == 5:ev('PetualangEngine.raftState.x=9;PetualangEngine.raftState.z=18')
    assert ev(f'!document.querySelectorAll(".btn-biome")[{index}].textContent.includes("Kunci")'),name
    ev(f'PetualangEngine.camera.position.set({",".join(map(str,camera))});PetualangEngine.controls.target.set({",".join(map(str,target))});PetualangEngine.controls.update()')
    time.sleep(.8)
    assert ev('!document.querySelector(".main-menu")'), 'Expected gameplay HUD, not title menu'
    ev('PetualangEngine.simulate(.016,{forward:0,turn:0,boost:false,cameraX:0,cameraY:0})')
    picture=call('Page.captureScreenshot',{'format':'png'})
    (ROOT/'docs/screenshots'/f'{name}.png').write_bytes(base64.b64decode(picture['data']))
    print('Captured',name,flush=True)
assert not errors,errors
ws.close()
