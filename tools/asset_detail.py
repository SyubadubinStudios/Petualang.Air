"""Deterministic Blender-only surface authoring; images are embedded in GLB exports."""
import bpy
import math
import numpy as np


def finish_materials():
    size = 512
    y, x = np.mgrid[0:size, 0:size] / size
    rng = np.random.default_rng(42)
    noise = rng.random((size, size))
    for material in bpy.data.materials:
        if not material.use_nodes or material.get('authored_surface'):
            continue
        shader = material.node_tree.nodes.get('Principled BSDF')
        if shader is None:
            continue
        name = material.name
        organic = name in ('Wood', 'Hat')
        fabric = name in ('Vest', 'Cotton', 'Cargo', 'Leaf')
        if organic:
            height = .5 + .22 * np.sin(x * math.tau * 32 + 2 * np.sin(y * math.tau * 3)) + .08 * noise
        elif fabric:
            height = .5 + .14 * np.sin(x * math.tau * 128) * np.sin(y * math.tau * 128) + .04 * noise
        else:
            height = .5 + .045 * noise
        base = np.ones(3) if name == 'Vest' else np.array(shader.inputs['Base Color'].default_value[:3])
        color = np.ones((size, size, 4), dtype=np.float32)
        color[:, :, :3] = np.clip(base[None, None, :] * (.82 + .30 * height[:, :, None]), 0, 1)
        # Blender image pixels are scene-linear; PNG export performs color conversion.
        def image_node(suffix, pixels, colorspace):
            image = bpy.data.images.new(name + suffix, width=size, height=size)
            image.colorspace_settings.name = colorspace
            image.pixels.foreach_set(pixels.ravel())
            image.pack()
            node = material.node_tree.nodes.new('ShaderNodeTexImage')
            node.image = image
            return node
        color_node = image_node('_albedo', color, 'sRGB')
        material.node_tree.links.new(color_node.outputs['Color'], shader.inputs['Base Color'])
        normal = np.ones_like(color)
        strength = 1.4 if organic else .65 if fabric else .12
        nx = (np.roll(height, 1, 1) - np.roll(height, -1, 1)) * strength
        ny = (np.roll(height, 1, 0) - np.roll(height, -1, 0)) * strength
        length = np.sqrt(nx * nx + ny * ny + 1)
        normal[:, :, 0] = nx / length * .5 + .5
        normal[:, :, 1] = ny / length * .5 + .5
        normal[:, :, 2] = 1 / length * .5 + .5
        normal_node = image_node('_normal', normal, 'Non-Color')
        decode = material.node_tree.nodes.new('ShaderNodeNormalMap')
        material.node_tree.links.new(normal_node.outputs['Color'], decode.inputs['Color'])
        material.node_tree.links.new(decode.outputs['Normal'], shader.inputs['Normal'])
        rough = np.ones_like(color)
        rough[:, :, :3] = (.58 + height[:, :, None] * .25) if organic or fabric else .48 + height[:, :, None] * .15
        rough_node = image_node('_roughness', rough, 'Non-Color')
        material.node_tree.links.new(rough_node.outputs['Color'], shader.inputs['Roughness'])
        material['authored_surface'] = True


def unwrap_missing():
    for ob in list(bpy.context.scene.objects):
        if ob.type != 'MESH' or ob.data.uv_layers:
            continue
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(island_margin=.025)
        bpy.ops.object.mode_set(mode='OBJECT')


def rope(name, points, radius, material, bone=None):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    if bone:
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    return obj
