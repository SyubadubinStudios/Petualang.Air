"""Rebuild original Petualang Air models with Blender --background --python tools/build_assets.py."""
import bpy, math, random, sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from asset_detail import finish_materials, unwrap_missing, rope
from pathlib import Path
from mathutils import Vector
random.seed(42)
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'PetualangAir.Wpf/wwwroot/models'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name, color):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=.8
    if name == 'Skin':
        bs.inputs['Subsurface Weight'].default_value=.08
        bs.inputs['Roughness'].default_value=.5
    return m
skin=mat('Skin',(0.64,.34,.17)); orange=mat('Vest',(1,.22,.025)); cream=mat('Cotton',(.93,.90,.76)); brown=mat('Hat',(.22,.10,.035)); dark=mat('Charcoal',(.035,.055,.06)); gold=mat('BatikGold',(.95,.65,.12)); blue=mat('Cargo',(.08,.21,.22)); wood=mat('Wood',(.34,.14,.055)); green=mat('Leaf',(.08,.34,.18))
parts=[]
def piece(name, pos, scale, material, kind='cube', bone=None):
    if kind=='sphere': bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=pos)
    elif kind=='cylinder': bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=1,depth=2,location=pos)
    elif kind=='cone': bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=1,radius2=.25,depth=2,location=pos)
    else: bpy.ops.mesh.primitive_cube_add(size=2,location=pos)
    ob=bpy.context.object; ob.name=name; ob.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); ob.data.materials.append(material)
    if bone:
        vg=ob.vertex_groups.new(name=bone); vg.add(list(range(len(ob.data.vertices))),1,'REPLACE')
    if kind == 'cube':
        bevel=ob.modifiers.new('Soft manufactured edges','BEVEL');bevel.width=min(scale)*.18;bevel.segments=3
        bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=bevel.name)
    else:
        for polygon in ob.data.polygons: polygon.use_smooth=True
    parts.append(ob); return ob
# Forward in Blender is -Y; glTF conversion makes it +Z.
piece('VestBody',(0,0,1.16),(.33,.20,.36),orange,bone='Spine')
piece('Shirt',(0,.01,1.1),(.30,.175,.30),cream,bone='Spine')
for side in [-1,1]:
    piece('LifeJacketPanel',(side*.19,-.16,1.18),(.16,.09,.32),orange,bone='Spine')
    for z in [1.03,1.27]: piece('Buckle',(side*.12,-.26,z),(.09,.025,.025),dark,bone='Spine')
    for j in range(4):
        o=piece('ParangMotif',(side*.24,-.255,1.30+j*.045),(.035,.008,.012),gold,bone='Spine');o.rotation_euler.y=.65
    arm='ArmL' if side<0 else 'ArmR'; leg='LegL' if side<0 else 'LegR'
    piece('Sleeve',(side*.43,0,1.34),(.14,.16,.18),cream,'sphere',arm)
    piece('Forearm',(side*.45,-.025,1.04),(.105,.115,.23),skin,'sphere',arm)
    piece('Hand',(side*.45,-.04,.83),(.12,.10,.13),skin,'sphere',arm)
    piece('Shorts',(side*.17,0,.66),(.15,.19,.21),blue,bone=leg)
    piece('CargoPocket',(side*.31,-.01,.68),(.035,.13,.10),green,bone=leg)
    piece('Shin',(side*.17,0,.32),(.09,.10,.17),skin,'cylinder',leg)
    piece('Sandal',(side*.17,-.07,.13),(.12,.21,.055),brown,bone=leg)
    piece('SandalStrap',(side*.17,-.09,.19),(.12,.035,.02),dark,bone=leg)
piece('Neck',(0,0,1.54),(.11,.11,.10),skin,'cylinder','Head')
piece('Face',(0,-.01,1.76),(.25,.22,.27),skin,'sphere','Head')
piece('Hair',(0,.025,1.91),(.25,.22,.15),dark,'sphere','Head')
for side in [-1,1]:
    piece('Ear',(side*.25,0,1.76),(.06,.04,.09),skin,'sphere','Head')
    piece('EyeWhite',(side*.09,-.205,1.80),(.052,.025,.041),cream,'sphere','Head')
    piece('Eye',(side*.09,-.23,1.80),(.023,.012,.028),dark,'sphere','Head')
    piece('Eyebrow',(side*.09,-.216,1.86),(.06,.016,.012),brown,bone='Head')
piece('Nose',(0,-.24,1.73),(.045,.055,.065),skin,'sphere','Head')
piece('Smile',(0,-.215,1.65),(.07,.017,.014),cream,bone='Head')
piece('CapingBrim',(0,0,2.015),(.43,.40,.035),brown,'cylinder','Head')
piece('CapingCrown',(0,0,2.13),(.27,.25,.13),brown,'cone','Head')
piece('HatBand',(0,0,2.04),(.28,.26,.028),gold,'cylinder','Head')
piece('NusantaraPin',(.13,-.245,2.11),(.045,.015,.045),gold,'sphere','Head')
piece('PaddleShaft',(.47,-.10,.65),(.025,.025,.82),wood,'cylinder','ArmR')
piece('CarbonBlade',(.47,-.10,-.08),(.12,.035,.28),dark,'sphere','ArmR')
# Tailoring and woven bamboo ribs remain attached to their original animation bones.
for side in [-1, 1]:
    for z in [.94, 1.42]:
        parts.append(rope('Vest piping', [(side*.04,-.257,z),(side*.22,-.257,z),(side*.32,-.20,z)], .008, cream, 'Spine'))
    piece('Reflective shoulder tape',(side*.21,-.255,1.39),(.07,.008,.024),cream,bone='Spine')
    piece('Webbing strap',(side*.23,-.262,1.12),(.018,.009,.22),dark,bone='Spine')
    piece('Vest pocket',(side*.14,-.268,1.09),(.09,.022,.075),orange,bone='Spine')
    for finger in range(4):
        piece('Finger',(side*(.40+finger*.028),-.075,.76),(.018,.032,.065),skin,'sphere','ArmL' if side<0 else 'ArmR')
for i in range(36):
    a=i*math.tau/36
    parts.append(rope('Caping woven rib',[(math.cos(a)*r,math.sin(a)*r*.93,2.25-r*.53) for r in [.03,.1,.2,.3,.41]],.0045,gold,'Head'))
for r in [.12,.19,.26,.33,.40]:
    parts.append(rope('Caping concentric weave',[(math.cos(a)*r,math.sin(a)*r*.93,2.25-r*.53) for a in [j*math.tau/72 for j in range(73)]],.003,brown,'Head'))
# Reduce the oversized cartoon head while preserving facial feature alignment.
for ob in parts:
    if 'Head' in ob.vertex_groups:
        pivot=Vector((0,0,1.52))
        ob.location=pivot+(ob.location-pivot)*.84
        ob.scale*=.84
# Articulated elbows, wrists and knees keep hands/paddle together during strokes.
for ob in parts:
    side='L' if ob.location.x<0 else 'R'
    target=None
    if ob.name.startswith('Forearm'):target='Forearm'+side
    elif ob.name.startswith(('Hand','Finger')):target='Hand'+side
    elif ob.name.startswith(('PaddleShaft','CarbonBlade')):target='HandR'
    elif ob.name.startswith(('Shin','Sandal')):target='Calf'+side
    if target:
        ob.vertex_groups.clear()
        ob.vertex_groups.new(name=target).add(list(range(len(ob.data.vertices))),1,'REPLACE')
finish_materials()
unwrap_missing()
# Join geometry while retaining rigid skin weights, then bind the skeleton.
bpy.ops.object.select_all(action='DESELECT')
for ob in parts: ob.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join(); mesh=bpy.context.object;mesh.name='BangJopiMesh'
bpy.ops.object.armature_add(); rig=bpy.context.object;rig.name='BangJopiRig';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
bones=[('Root',(0,0,0),(0,0,.4),None),('Spine',(0,0,.8),(0,0,1.5),'Root'),('Head',(0,0,1.5),(0,0,2),'Spine'),('ArmL',(-.4,0,1.45),(-.4,0,.85),'Spine'),('ArmR',(.4,0,1.45),(.4,0,.85),'Spine'),('LegL',(-.17,0,.85),(-.17,0,.18),'Root'),('LegR',(.17,0,.85),(.17,0,.18),'Root')]
for side,sign in [('L',-1),('R',1)]:
    bones.extend([
        ('Forearm'+side,(sign*.45,0,1.16),(sign*.45,-.025,.86),'Arm'+side),
        ('Hand'+side,(sign*.45,-.025,.86),(sign*.45,-.04,.74),'Forearm'+side),
        ('Calf'+side,(sign*.17,0,.47),(sign*.17,0,.15),'Leg'+side)])
for name,head,tail,parent in bones:
    b=rig.data.edit_bones.new(name);b.head=head;b.tail=tail
    if parent:b.parent=rig.data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');mesh.parent=rig;mod=mesh.modifiers.new('Skeleton','ARMATURE');mod.object=rig
rig.animation_data_create()
for clip in ['Idle','Paddle','Balance','Celebrate']:
    action=bpy.data.actions.new(clip);rig.animation_data.action=action
    for frame in range(1,50,4):
        phase=(frame-1)/48*math.tau
        for b in rig.pose.bones: b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0)
        if clip=='Idle':
            rig.pose.bones['Root'].location.z=-.16
            for name in ['LegL','LegR']:rig.pose.bones[name].rotation_euler.x=-.65
            rig.pose.bones['Spine'].rotation_euler.x=.035*math.sin(phase)
        elif clip=='Paddle':
            rig.pose.bones['ArmR'].rotation_euler.x=.65*math.sin(phase)
            rig.pose.bones['ArmL'].rotation_euler.x=.4*math.sin(phase+.4)
            rig.pose.bones['Spine'].rotation_euler.x=.09*math.sin(phase)
        elif clip=='Balance':
            rig.pose.bones['ArmL'].rotation_euler.z=-.55;rig.pose.bones['ArmR'].rotation_euler.z=.55
            rig.pose.bones['Spine'].rotation_euler.y=.12*math.sin(phase)
        else:
            rig.pose.bones['ArmL'].rotation_euler.z=-2.4;rig.pose.bones['ArmR'].rotation_euler.z=2.4
            rig.pose.bones['Root'].location.z=abs(math.sin(phase))*.16
        for side in ['L','R']:
            rig.pose.bones['Forearm'+side].rotation_euler.x=.18+(.24*(1+math.sin(phase)) if clip=='Paddle' else .04*math.sin(phase))
            if clip=='Idle':rig.pose.bones['Calf'+side].rotation_euler.x=.6
        for b in rig.pose.bones:
            b.keyframe_insert(data_path='rotation_euler',frame=frame);b.keyframe_insert(data_path='location',frame=frame)
    track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action)
rig.animation_data.action=None
bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bang-jopi.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'bang-jopi.glb'),export_format='GLB',export_animation_mode='NLA_TRACKS',export_force_sampling=True)

def clear():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);parts.clear()
def export(name):
    finish_materials();unwrap_missing()
    # Static props share one mesh with material groups instead of hundreds of draw calls.
    bpy.ops.object.select_all(action='DESELECT')
    meshes=[ob for ob in bpy.context.scene.objects if ob.type=='MESH']
    for ob in meshes:ob.select_set(True)
    if meshes:
        bpy.context.view_layer.objects.active=meshes[0]
        bpy.ops.object.join()
        bpy.context.object.name=Path(name).stem
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/Path(name).with_suffix('.blend')))
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',export_animations=False)
clear()
# Klotok: colored hull, cabin, awning, engine and cargo.
piece('Hull',(0,0,.4),(1,2.7,.35),wood)
for side in [-1,1]:piece('Gunwale',(side*.95,0,.8),(.08,2.7,.18),gold)
piece('Cabin',(0,.6,1.3),(.75,.9,.6),green)
piece('Roof',(0,.6,2),(1,1.15,.09),orange)
for x in [-.5,.5]:piece('Window',(x,-.32,1.5),(.18,.02,.2),cream)
piece('Engine',(0,2.5,.9),(.3,.3,.3),dark)
for i in range(3):piece('Cargo',(0,-1.4+i*.35,1),(.5,.15,.25),gold)
# Separate deck boards, cabin battens, window frames and outboard details.
for i in range(17):
    piece('Deck board',(0,-2.5+i*.30,.77),(.87,.143,.035),wood)
for side in [-1,1]:
    for i in range(12):
        piece('Hull rib',(side*.94,-2.5+i*.44,.47),(.035,.028,.23),brown)
    for i in range(9):
        piece('Cabin siding',(side*.761,-.2+i*.20,1.30),(.015,.09,.55),wood)
    for z in [1.27,1.73]:
        piece('Window lintel',(side*.5,-.35,z),(.23,.04,.025),wood)
    for x in [side*.5-.21,side*.5+.21]:
        piece('Window jamb',(x,-.35,1.5),(.025,.04,.23),wood)
    for y in [-1.9,1.9]:
        bpy.ops.mesh.primitive_torus_add(major_radius=.23,minor_radius=.065,location=(side*1.07,y,.55),rotation=(0,math.pi/2,0))
        bpy.context.object.data.materials.append(dark)
piece('Propeller shaft',(0,2.64,.35),(.045,.045,.43),dark,'cylinder')
for i in range(6):
    piece('Engine cooling fin',(0,2.82,.75+i*.055),(.23,.025,.012),cream)
parts.append(rope('Mooring rope',[(.72*math.cos(t),-1.65+.32*math.sin(t),.85+.002*t) for t in [i*.12 for i in range(160)]],.025,brown))
export('klotok.glb');clear()
# Rumah panggung with curved upturned roof inspired by Minangkabau silhouettes.
for x in [-1.3,1.3]:
    for y in [-1,1]:piece('Stilt',(x,y,.8),(.09,.09,.9),wood)
piece('Floor',(0,0,1.4),(1.6,1.3,.12),wood);piece('Walls',(0,0,2.1),(1.35,1.1,.65),cream)
for x in [-.8,0,.8]:piece('Window',(x,-1.11,2.15),(.18,.025,.28),brown)
vertices=[]
for x in [-1.9,-1.3,-.6,0,.6,1.3,1.9]:
    high=3.15+.65*(abs(x)/1.9)**2
    vertices.extend([(x,-1.5,high-.6),(x,0,high),(x,1.5,high-.6)])
faces=[]
for i in range(6):
    for j in range(2):a=i*3+j;faces.append((a,a+1,a+4,a+3))
data=bpy.data.meshes.new('RoofMesh');data.from_pydata(vertices,[],faces);data.materials.append(brown);ob=bpy.data.objects.new('CurvedRoof',data);bpy.context.collection.objects.link(ob)
for side in [-1,1]:
    for i in range(13):
        piece('Wall timber board',(-1.26+i*.21,side*1.115,2.10),(.098,.018,.61),wood)
    for x in [-.8,0,.8]:
        piece('Recessed window',(x,side*1.15,2.15),(.18,.025,.28),dark)
        for z in [1.85,2.45]:piece('Window frame',(x,side*1.18,z),(.22,.025,.025),gold)
        piece('Window mullion',(x,side*1.18,2.15),(.018,.025,.28),wood)
# Individual roof courses follow the curved silhouette, giving readable highlights.
for i in range(32):
    x=-1.88+i*3.76/31
    high=3.15+.65*(abs(x)/1.9)**2
    parts.append(rope('Roof bamboo batten',[(x,-1.5,high-.59),(x,0,high+.015),(x,1.5,high-.59)],.022,brown))
for step in range(5):
    piece('Entry stair',(0,-2.25+step*.22,.18+step*.24),(.50,.18,.07),wood)
for x in [-1.45,1.45]:
    for y in [-1,-.5,0,.5,1]:piece('Veranda spindle',(x,y,1.80),(.025,.025,.30),wood)
    piece('Veranda handrail',(x,0,2.1),(.045,1.22,.045),gold)
export('rumah-adat.glb');clear()
coral=mat('Coral',(.96,.25,.32));teal=mat('SeaFan',(.09,.67,.6))
for i in range(12):
    a=i*2.4;r=.2+i*.06
    piece('CoralBranch',(math.cos(a)*r,math.sin(a)*r,.45+i*.035),(.10,.10,.45+i*.035),coral if i%2 else teal,'cone')
    piece('CoralTip',(math.cos(a)*r,math.sin(a)*r,.9+i*.07),(.20,.20,.12),coral,'sphere')
export('coral.glb')
clear()
# Hero raft deck: rounded bamboo, growth nodes and individual rope turns.
for i in range(-3,4):
    log=piece('Bamboo culm',(i*.36,0,0),(.17,.17,2.15),wood,'cylinder')
    log.rotation_euler.x=math.pi/2
    for y in [-1.8,-.9,0,.9,1.8]:
        bpy.ops.mesh.primitive_torus_add(major_radius=.172,minor_radius=.012,major_segments=24,minor_segments=6,location=(i*.36,y,0),rotation=(math.pi/2,0,0))
        bpy.context.object.data.materials.append(gold)
    for y in [-1.4,1.4]:
        for turn in range(3):
            parts.append(rope('Hemp lashing',[(i*.36+.185*math.cos(a),y+turn*.025,.185*math.sin(a)) for a in [j*math.tau/32 for j in range(33)]],.012,brown))
for y in [-1.4,1.4]:
    piece('Cross brace',(0,y,.13),(1.35,.09,.07),wood)
export('raft-deck.glb')
print('ASSETS_READY',sorted(p.name for p in OUT.iterdir()))
