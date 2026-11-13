"""Compose original seamless background cues. Rebuild requires numpy and ffmpeg."""
from pathlib import Path
import numpy as np, wave, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'PetualangAir.Wpf/wwwroot/audio';OUT.mkdir(parents=True,exist_ok=True)
RATE=22050;DURATION=32;N=RATE*DURATION
rng=np.random.default_rng(2301)
def note(track,at,freq,length,volume,kind,pan=0):
    t=np.arange(int(length*RATE))/RATE
    envelope=np.minimum(t/.045,1)*np.exp(-t/(length*.4))*np.minimum((length-t)/.15,1)
    if kind=='flute': sound=np.sin(2*np.pi*freq*t+.015*np.sin(t*31))+ .15*np.sin(4*np.pi*freq*t)
    elif kind=='bell': sound=np.sin(2*np.pi*freq*t)+.35*np.sin(2*np.pi*freq*2.76*t)*np.exp(-t*6)+.12*np.sin(2*np.pi*freq*4.07*t)*np.exp(-t*8)
    elif kind=='drum': sound=np.sin(2*np.pi*(freq*t+freq*.04*(1-np.exp(-t*30))))*np.exp(-t*15)+rng.normal(0,.06,len(t))*np.exp(-t*30)
    else: sound=(np.sin(2*np.pi*freq*t)+.25*np.sin(4*np.pi*freq*t))*.5
    signal=sound*envelope*volume; indices=(np.arange(len(t))+int(at*RATE))%N
    track[indices,0]+=signal*np.sqrt((1-pan)/2);track[indices,1]+=signal*np.sqrt((1+pan)/2)
for name,root,energy in [('jejak-air',220,.65),('senja-danau',196,.3),('layar-samudra',164.81,1)]:
    track=np.zeros((N,2));scale=[0,2,4,7,9,12,9,7,4,2,7,4,2,0,4,7]
    for beat in range(64):
        step=scale[(beat//2)%len(scale)];freq=root*2**(step/12)
        if beat%2==0:note(track,beat*.5,freq*2,1.4,.13,'flute',np.sin(beat)*.25)
        note(track,beat*.5,root*2**(scale[(beat+4)%len(scale)]/12),1,.065,'bell',(-1 if beat%2 else 1)*.5)
        if beat%4==0:note(track,beat*.5,root/2,3.4,.12,'pad')
        if beat%2==0:note(track,beat*.5,65 if beat%4==0 else 110,.3,.16*energy,'drum',.15)
    # Circular delays keep the loop seamless, with a small stereo room tail.
    dry=track.copy()
    for delay,gain in [(0.18,.18),(.37,.12),(.61,.08)]:track+=np.roll(dry,int(delay*RATE),axis=0)[:,::-1]*gain
    track=np.tanh(track)*.8
    path=OUT/(name+'.wav')
    with wave.open(str(path),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((track*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(path),'-c:a','libvorbis','-q:a','4',str(OUT/(name+'.ogg'))],check=True)
    path.unlink() # generated intermediate only, never a user asset
    print(name)
