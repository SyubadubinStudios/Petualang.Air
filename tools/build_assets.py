"""Rebuild original Petualang Air models with Blender --background --python tools/build_assets.py."""
import bpy, math, random
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
piece('Shirt',(0,.01,1.1),(.34,.19,.32),cream,bone='Spine')
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
# Join geometry while retaining rigid skin weights, then bind the skeleton.
bpy.ops.object.select_all(action='DESELECT')
for ob in parts: ob.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join(); mesh=bpy.context.object;mesh.name='BangJopiMesh'
bpy.ops.object.armature_add(); rig=bpy.context.object;rig.name='BangJopiRig';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
bones=[('Root',(0,0,0),(0,0,.4),None),('Spine',(0,0,.8),(0,0,1.5),'Root'),('Head',(0,0,1.5),(0,0,2),'Spine'),('ArmL',(-.4,0,1.45),(-.4,0,.85),'Spine'),('ArmR',(.4,0,1.45),(.4,0,.85),'Spine'),('LegL',(-.17,0,.85),(-.17,0,.18),'Root'),('LegR',(.17,0,.85),(.17,0,.18),'Root')]
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
export('rumah-adat.glb');clear()
coral=mat('Coral',(.96,.25,.32));teal=mat('SeaFan',(.09,.67,.6))
for i in range(12):
    a=i*2.4;r=.2+i*.06
    piece('CoralBranch',(math.cos(a)*r,math.sin(a)*r,.45+i*.035),(.10,.10,.45+i*.035),coral if i%2 else teal,'cone')
    piece('CoralTip',(math.cos(a)*r,math.sin(a)*r,.9+i*.07),(.20,.20,.12),coral,'sphere')
export('coral.glb')
print('ASSETS_READY',sorted(p.name for p in OUT.iterdir()))
