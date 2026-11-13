"""Check shipped GLBs without Blender or third-party Python dependencies."""
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'PetualangAir.Wpf/wwwroot/models'
report = {}
for name in ['bang-jopi', 'klotok', 'rumah-adat', 'coral', 'raft-deck']:
    data = (MODELS / f'{name}.glb').read_bytes()
    magic, version, length = struct.unpack_from('<III', data)
    assert magic == 0x46546C67 and version == 2 and length == len(data), name
    json_length = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + json_length])
    primitives = [p for mesh in gltf['meshes'] for p in mesh['primitives']]
    triangles = sum(gltf['accessors'][p['indices']]['count'] // 3 for p in primitives)
    assert len(data) < 12_000_000 and triangles < 60_000 and len(primitives) <= 12, name
    assert all('TEXCOORD_0' in p['attributes'] for p in primitives), name
    assert gltf.get('images') and all('bufferView' in image and 'uri' not in image for image in gltf['images']), name
    assert all('normalTexture' in m and 'baseColorTexture' in m['pbrMetallicRoughness']
               and 'metallicRoughnessTexture' in m['pbrMetallicRoughness'] for m in gltf['materials']), name
    if name == 'bang-jopi':
        assert len(gltf['skins'][0]['joints']) == 13
        assert {clip['name'] for clip in gltf['animations']} == {'Idle', 'Paddle', 'Balance', 'Celebrate'}
        assert all('JOINTS_0' in p['attributes'] and 'WEIGHTS_0' in p['attributes'] for p in primitives)
        assert any(m['name'] == 'Vest' for m in gltf['materials'])
    report[name] = {'bytes': len(data), 'triangles': triangles, 'primitives': len(primitives), 'embeddedImages': len(gltf['images'])}

for name in ['lotus', 'water-hyacinth', 'seagrass', 'seaweed', 'butterfly', 'dragonfly']:
    data = (MODELS / f'{name}.glb').read_bytes()
    assert data[:4] == b'glTF' and struct.unpack_from('<I', data, 8)[0] == len(data), name
    size = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + size])
    primitives = [p for mesh in gltf['meshes'] for p in mesh['primitives']]
    triangles = sum(gltf['accessors'][p['indices']]['count'] // 3 for p in primitives)
    assert len(data) < 1_500_000 and triangles < 12_000 and len(primitives) <= 8, name
    assert all('TEXCOORD_0' in p['attributes'] for p in primitives), name
    assert all('uri' not in buffer for buffer in gltf['buffers']), name
    if name in ('butterfly', 'dragonfly'):
        assert {'WingL', 'WingR', 'Body'} <= {node.get('name') for node in gltf['nodes']}, name
    report[name] = {'bytes': len(data), 'triangles': triangles, 'primitives': len(primitives)}

print(json.dumps(report, indent=2))
print('PASS: asset budgets, offline textures, UVs, PBR materials and character animation contract')
