"""Original wetland flora and insects. Run with Blender --background --python tools/build_ecosystem.py."""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from asset_detail import rope, unwrap_missing
OUT=Path(__file__).resolve().parents[1]/'PetualangAir.Wpf/wwwroot/models'
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name,color,rough=.65):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough
    m.use_backface_culling=False
    return m
leaf=material('Wet leaf',(.075,.30,.10),.38);stem=material('Stems',(.15,.29,.055));pink=material('Lotus petals',(.95,.30,.52));yellow=material('Pollen',(.95,.62,.08));purple=material('Hyacinth flowers',(.52,.27,.85));dark=material('Insect body',(.025,.035,.025));amber=material('Butterfly ochre',(.95,.38,.045));ivory=material('Wing spots',(.95,.89,.67));blue=material('Dragonfly teal',(.025,.42,.45),.3);wing=material('Veined wings',(.53,.75,.72),.28)

def ellipsoid(name,pos,scale,mat,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=pos)
    o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    if parent:o.parent=parent
    return o

def ribbon(name,length,width,mat,angle=0,bend=.3,base=(0,0,0)):
    verts=[]
    for i in range(9):
        t=i/8;w=width*math.sin(math.pi*t)**.7
        for side in [-1,1]:verts.append((side*w+bend*t*t,0.06*math.sin(t*math.pi),length*t))
    faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(8)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.materials.append(mat)
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=base;o.rotation_euler.z=angle
    for p in mesh.polygons:p.use_smooth=True
    return o

def save(name,join=True):
    unwrap_missing()
    if join:
        bpy.ops.object.select_all(action='DESELECT');objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=name
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(name+'.blend')),compress=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_animations=False)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def pad(radius,pos):
    # A radial notch makes the floating leaf readable as a lily pad.
    verts=[(0,0,.015)]+[(radius*math.cos(a),radius*math.sin(a),.015+.025*math.sin(a*3)) for a in [i*math.tau/32 for i in range(1,32)]]
    mesh=bpy.data.meshes.new('Notched pad');mesh.from_pydata(verts,[],[(0,i,i+1) for i in range(1,len(verts)-1)]);mesh.materials.append(leaf)
    o=bpy.data.objects.new('Notched pad',mesh);bpy.context.collection.objects.link(o);o.location=pos
    for i in range(1,8):
        a=i*math.tau/8;rope('Leaf vein',[(pos[0],pos[1],pos[2]+.04),(pos[0]+radius*.8*math.cos(a),pos[1]+radius*.8*math.sin(a),pos[2]+.04)],.006,stem)

for x,y,r in [(0,0,.55),(.6,.25,.36),(-.4,.4,.3)]:pad(r,(x,y,0))
rope('Flower stalk',[(0,0,0),(0,0,.35)],.025,stem)
for ring in range(2):
    for i in range(10):
        a=i*math.tau/10+ring*.3;o=ellipsoid('Lotus petal',(.16*math.cos(a),.16*math.sin(a),.38+ring*.07),(.09,.23,.055),pink);o.rotation_euler=(.25+ring*.3,0,a-math.pi/2)
ellipsoid('Seed head',(0,0,.47),(.10,.10,.07),yellow);save('lotus')
for i in range(7):
    a=i*2.399;x=.32*math.cos(a);y=.32*math.sin(a)
    ellipsoid('Floating petiole',(x,y,.09),(.10,.10,.15),stem)
    ellipsoid('Hyacinth leaf',(x*1.3,y*1.3,.25),(.23,.18,.045),leaf)
rope('Flower stem',[(0,0,0),(0,0,.7)],.02,stem)
for k in range(5):
    for i in range(5):
        a=i*math.tau/5;o=ellipsoid('Hyacinth petal',(.07*math.cos(a),.07*math.sin(a),.40+k*.07),(.07,.035,.025),purple);o.rotation_euler.z=a
save('water-hyacinth')
for name,count,height,width in [('seagrass',12,.95,.055),('seaweed',8,1.7,.15)]:
    for i in range(count):
        a=i*2.399;ribbon(name,height*(.65+.35*(i%4)/3),width,leaf,a,.3 if name=='seagrass' else .55,(.16*math.cos(a),.16*math.sin(a),0))
    save(name)
for name in ['butterfly','dragonfly']:
    insect=ellipsoid('Body',(0,0,0),(.045,.24 if name=='dragonfly' else .14,.045),blue if name=='dragonfly' else dark)
    ellipsoid('Head',(0,-.18,0),(.07,.06,.06),dark)
    if name=='dragonfly':
        for i in range(7):ellipsoid('Abdomen segment',(0,.17+i*.055,0),(.025-i*.002,.04,.025),blue)
    else:
        for side in [-1,1]:rope('Antenna',[(side*.025,-.18,0),(side*.06,-.28,.05),(side*.09,-.30,.06)],.007,dark)
    for side,label in [(-1,'L'),(1,'R')]:
        pivot=bpy.data.objects.new('Wing'+label,None);bpy.context.collection.objects.link(pivot)
        for rear in [False,True]:
            if name=='butterfly':
                o=ellipsoid('Wing lobe',(side*(.20 if rear else .24),.10 if rear else -.10,0),(.21 if rear else .27,.16 if rear else .22,.014),amber,pivot)
                for j in range(5):
                    a=j*math.pi/4;ellipsoid('Wing marking',(side*(.23+.12*math.sin(a)),(-.12 if not rear else .12)+.10*math.cos(a),.018),(.027,.035,.008),dark,pivot)
            else:
                o=ellipsoid('Wing blade',(side*.30,.12 if rear else -.08,.01),(.31,.065,.009),wing,pivot);o.rotation_euler.z=side*(.23 if rear else -.15)
                vein=rope('Wing vein',[(0,.12 if rear else -.08,.025),(side*.55,.20 if rear else -.15,.025)],.004,blue);vein.parent=pivot
    # Consolidate each wing separately while retaining named flap pivots.
    for pivot in [o for o in bpy.context.scene.objects if o.type=='EMPTY']:
        children=list(pivot.children);bpy.ops.object.select_all(action='DESELECT')
        for o in children:o.select_set(True)
        bpy.context.view_layer.objects.active=children[0];bpy.ops.object.join()
    body=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.parent is None]
    bpy.ops.object.select_all(action='DESELECT')
    for o in body:o.select_set(True)
    bpy.context.view_layer.objects.active=body[0];bpy.ops.object.join();bpy.context.object.name='Body'
    save(name,False)
print('ECOSYSTEM_ASSETS_READY')
