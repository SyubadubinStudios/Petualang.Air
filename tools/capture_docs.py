"""Capture genuine WebView2 screenshots and test cinematic controls using an isolated QA save."""
import base64,json,time,urllib.request
from pathlib import Path
import websocket
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/screenshots';OUT.mkdir(parents=True,exist_ok=True)
page=next(p for p in json.load(urllib.request.urlopen('http://localhost:9228/json')) if p['type']=='page')
ws=websocket.create_connection(page['webSocketDebuggerUrl'],suppress_origin=True,timeout=60);seq=0;errors=[]
def call(method,params={}):
    global seq
    seq+=1;ws.send(json.dumps({'id':seq,'method':method,'params':params}))
    while True:
        r=json.loads(ws.recv())
        if r.get('method')=='Runtime.exceptionThrown':errors.append(r['params'])
        if r.get('id')==seq:
            if 'error' in r:raise RuntimeError(r['error'])
            return r.get('result',{})
def ev(js):
    r=call('Runtime.evaluate',{'expression':js,'awaitPromise':True,'returnByValue':True,'userGesture':True})
    if 'exceptionDetails'in r:raise RuntimeError(r['exceptionDetails'])
    return r.get('result',{}).get('value')
def shot(name):
    time.sleep(.7);r=call('Page.captureScreenshot',{'format':'png'});(OUT/name).write_bytes(base64.b64decode(r['data']));print('Captured',name,flush=True)
def click(selector):ev(f'document.querySelector({json.dumps(selector)}).click()');time.sleep(.5)
call('Runtime.enable');call('Log.enable')
# Resume from any dialog back to main menu through real UI controls.
if not ev('!!document.querySelector(".main-menu")'):
    if ev('!!document.querySelector(".dialog-footer button")'):click('.dialog-footer button')
    else:
        ev("PetualangEngine.emit('OnAction','pause','')");time.sleep(.3);click('.dialog-footer button')
ev('PetualangEngine.visualTime=8');shot('main-menu.png')
click('.title-navigation button:nth-child(3)');shot('options.png')
# Every graphics preset must render without shader compilation errors.
for preset in ['low','medium','ultra','high']:
    ev(f'''{{const select=document.querySelector('.option-section select');select.value='{preset}';select.dispatchEvent(new Event('change',{{bubbles:true}}));}}''')
    time.sleep(.7)
    assert ev(f'PetualangEngine.graphics.quality==="{preset}"'),preset
    assert ev('PetualangEngine.renderer.getContext().getError()===0'),preset
# Check persistent audio controls and decoded original tracks.
ev('PetualangEngine.audio.unlock()');ev('PetualangEngine.audio.loadingTracks')
assert ev('PetualangEngine.audio.tracksReady && Object.keys(PetualangEngine.audio.tracks).length===3')
click('.dialog-footer button');click('.title-navigation button:nth-child(5)')
ev("document.querySelector('.credits-roll').style.animationDelay='-12s'");shot('credits.png')
click('.dialog-content .secondary-button')
assert ev('getComputedStyle(document.querySelector(".credits-roll")).animationPlayState==="paused"')
click('.dialog-footer button');click('.title-primary')
# Reposition the QA raft for an unobstructed camera shot without changing art or the screenshot.
ev('''{const e=PetualangEngine;e.setPaused(true);e.raftState.x=9;e.raftState.z=18;e.simulate(.016,{forward:0,turn:0,boost:false,cameraX:0,cameraY:0});e.camera.position.set(15,5,7);e.controls.target.copy(e.raftGroup.position).add({x:0,y:1,z:0});e.controls.update();}''')
shot('gameplay.png')
ev("PetualangEngine.returnToDock();PetualangEngine.emit('OnAction','market','')");time.sleep(.4);shot('market.png')
assert ev('PetualangEngine.renderer.info.programs.every(p=>!p.diagnostics || p.diagnostics.runnable!==false)')
if errors:raise AssertionError(errors)
(ROOT/'artifacts/cinematic-report.json').write_text(json.dumps({'graphicsPresets':['low','medium','high','ultra'],'musicTracks':3,'creditsPause':True,'exceptions':errors},indent=2),encoding='utf-8')
ws.close();print('Cinematic runtime checks passed')
