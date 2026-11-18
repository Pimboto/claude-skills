# Export the Claude model as a .glb (three.js, model-viewer, Blender, any 3D tool).
#   blender -b --factory-startup --python tools/claude_glb.py -- <out.glb> [--eyes sq|happy|line|squeeze|dot|sad|none]
# glTF cannot read our procedural paper nodes, so each material is flattened to its plain colour first; the white
# bevelled edges are kept (modifiers are applied on export). Real size: about 9 cm wide, like in the loops.
import sys, os, argparse
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lib'))
import bpy
import toy
from chars import Claude

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('out')
ap.add_argument('--eyes', default='sq')
a = ap.parse_args(argv)

toy.reset()
claude = Claude('claude', (0, 0, 0))
claude.pose(s=1.0, yaw=0, eyes=a.eyes)

for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    nodes, links = m.node_tree.nodes, m.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    mix = next((n for n in nodes if n.bl_idname == 'ShaderNodeMix'), None)
    if bsdf and mix:
        for l in list(bsdf.inputs['Base Color'].links) + list(bsdf.inputs['Normal'].links):
            links.remove(l)
        bsdf.inputs['Base Color'].default_value = mix.inputs[6].default_value

bpy.ops.object.select_all(action='DESELECT')
for o in [claude.root] + list(claude.root.children_recursive):
    if not o.hide_render:
        o.select_set(True)
bpy.ops.export_scene.gltf(filepath=a.out, export_format='GLB', use_selection=True, export_apply=True)
print('GLB:', a.out, f'{os.path.getsize(a.out) / 1024:.0f} KB')
