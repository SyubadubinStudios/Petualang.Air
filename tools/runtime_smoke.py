"""Smoke-test the running WebView2 via CDP (port 9228); use an isolated PETUALANG_AIR_SAVE_PATH.
Requires Python websocket-client. Screenshots/reports are written to artifacts/.
"""
import base64, json, time, urllib.request
from pathlib import Path
import websocket
OUT = Path(__file__).resolve().parents[1] / 'artifacts'
OUT.mkdir(exist_ok=True)
pages=json.load(urllib.request.urlopen('http://localhost:9228/json'))
page=next(p for p in pages if p['type']=='page')
ws=websocket.create_connection(page['webSocketDebuggerUrl'], suppress_origin=True, timeout=40)
sequence=0; errors=[]; checks=[]
def call(method,params={}):
    global sequence
    sequence+=1; ws.send(json.dumps({'id':sequence,'method':method,'params':params}))
    while True:
        data=json.loads(ws.recv())
        if data.get('method')=='Runtime.exceptionThrown': errors.append(data['params'])
        if data.get('id')==sequence:
            if 'error' in data: raise RuntimeError(data['error'])
            return data.get('result',{})
def evaluate(expression):
    result=call('Runtime.evaluate',{'expression':expression,'awaitPromise':True,'returnByValue':True,'userGesture':True})
    if 'exceptionDetails' in result: raise RuntimeError(result['exceptionDetails'])
    return result.get('result',{}).get('value')
def check(name,expression):
    actual=evaluate(expression)
    if not actual: raise AssertionError(f'{name}: {actual}')
    checks.append(name);print('PASS',name,flush=True)
def click(text):
    evaluate(f'''Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim() === {json.dumps(text)})?.click()''')
    time.sleep(.35)
def screenshot(name):
    data=call('Page.captureScreenshot',{'format':'png'});(OUT/name).write_bytes(base64.b64decode(data['data']))
call('Runtime.enable');call('Log.enable')
check('GLB skeleton and all four clips loaded', 'Object.keys(PetualangEngine.actions).length===4 && PetualangEngine.jopiGroup.getObjectByProperty("isSkinnedMesh",true)!==undefined')
click('Mulai berlayar')
evaluate('PetualangEngine.setPaused(true)')
check('new save locks later biomes','document.querySelectorAll(".btn-biome")[1].innerText.includes("Kunci")')
# Exercise the real collision/pickup path and the .NET mission callback.
evaluate('''(async()=>{const e=PetualangEngine;const c=e.world.collectibles.find(c=>c.userData.type==='Coin');e.raftState.x=c.position.x;e.raftState.z=c.position.z;e.simulate(.016,{forward:0,turn:0,boost:false,cameraX:0,cameraY:0});await e.eventQueue;})()''')
check('coin pickup updates HUD','document.querySelector(".coin-display").innerText.includes("175")')
evaluate('''(async()=>{for(let i=0;i<5;i++) await PetualangEngine.emit('OnResourceCollected','Coin','SungaiGunung');})()''')
check('first mission unlocks swamp','!document.querySelectorAll(".btn-biome")[1].innerText.includes("Kunci")')
# Complete the remaining campaign through the same JS -> .NET event boundary; unit tests validate rules separately.
biomes=['SungaiGunung','HutanGambut','DanauVulkanik','KotaKanal','LautKarang','SamudraLepas']
missions=[[('Trash',6)],[('Fish',5),('Artifact',1)],[('Artifact',2),('Trash',8)],[('Trash',12),('Artifact',2)],[('Pearl',5),('Trash',10)],[('Dolphin',3)]]
for index,biome in enumerate(biomes):
    if index:
        evaluate(f'document.querySelectorAll(".btn-biome")[{index}].click()');time.sleep(.5)
    evaluate('PetualangEngine.setPaused(true)')
    check(f'{biome} loads matching world',f'PetualangEngine.biome==="{biome}" && PetualangEngine.world.biome==="{biome}"')
    for resource,count in missions[index]:
        evaluate(f'''(async()=>{{for(let i=0;i<{count};i++) await PetualangEngine.emit('OnResourceCollected','{resource}','{biome}');}})()''')
    # Collect one artifact per biome for the complete journal.
    evaluate(f"PetualangEngine.emit('OnResourceCollected','Artifact','{biome}')")
    if index in [0,2,3]:
        evaluate("PetualangEngine.emit('OnAction','market','')");time.sleep(.2)
        evaluate('document.querySelector(".raft-upgrade button").click()');time.sleep(.3)
        click('Lanjutkan [Esc]');evaluate('PetualangEngine.setPaused(true)')
    evaluate('PetualangEngine.updateWater();PetualangEngine.renderer.render(PetualangEngine.scene,PetualangEngine.camera)')
    screenshot(f'biome-{biome}.png')
# Complete the storm mission through the actual weather transition.
evaluate('''(async()=>{const e=PetualangEngine;e.raftState.x=55;e.raftState.z=10;e.docked=false;e.weather.time=104.99;e.weather.phase='Badai';e.stormExposure=49;e.simulate(.03,{forward:0,turn:0,boost:false,cameraX:0,cameraY:0});await e.eventQueue;})()''')
check('storm completion awards final mission','document.querySelector(".mission-tracker .eyebrow").innerText.includes("12/12")')
check('rainbow appears after storm','PetualangEngine.weather.rainbow.visible')
evaluate("PetualangEngine.returnToDock();PetualangEngine.emit('OnAction','market','')");time.sleep(.3)
for name in ['Jaring pengumpul','Lampu petromaks','Bumper ban bekas','Kompas angin','Rompi Batik Lestari','Es Kelapa Muda','Kopi Tubruk']:
    evaluate(f'''Array.from(document.querySelectorAll('.catalog-card')).find(c=>c.querySelector('h3')?.textContent==={json.dumps(name)})?.querySelector('button').click()''');time.sleep(.2)
check('all accessories installed', 'Object.values(PetualangEngine.equipment).every(Boolean)')
screenshot('market-complete.png')
click('Lanjutkan [Esc]');evaluate('PetualangEngine.setPaused(true);PetualangEngine.setStamina(10)')
evaluate("PetualangEngine.emit('OnStaminaChanged',10)");evaluate("PetualangEngine.emit('OnAction','coconut','')")
check('drink restores actual simulation stamina','PetualangEngine.stamina===65')
# Standard controller sample exercises the real polling path without physical hardware.
evaluate('''window.testPad={connected:true,mapping:'standard',id:'QA virtual standard pad',axes:[.6,-.8,.3,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.testPad]})''')
check('controller polling maps axes','PetualangEngine.input.update(.016,false).forward>.7 && PetualangEngine.input.update(.016,false).turn<0')
evaluate('window.testPad=null')
check('controller disconnect clears movement','PetualangEngine.input.update(.016,false).forward===0')
evaluate('delete navigator.getGamepads')
evaluate('PetualangEngine.audio.setPaused(false);PetualangEngine.audio.unlock()')
check('audio context can run after user gesture','PetualangEngine.audio.context.state==="running"')
evaluate("PetualangEngine.audio.update('DanauVulkanik',0,2);PetualangEngine.audio.update('SamudraLepas',1,8);PetualangEngine.audio.configure(true,.3)")
check('mute setting reaches audio mixer','PetualangEngine.audio.muted===true')
evaluate("PetualangEngine.emit('OnAction','missions','')");time.sleep(.3)
check('campaign completion is visible','document.querySelector(".completion")!==null')
screenshot('expedition-complete.png')
check('no WebGL error','PetualangEngine.renderer.getContext().getError()===0')
check('no uncaught runtime exceptions', 'true')
if errors: raise AssertionError(errors)
(OUT/'runtime-report.json').write_text(json.dumps({'checks':checks,'exceptions':errors},indent=2),encoding='utf-8')
ws.close();print(f'{len(checks)} runtime checks passed')
