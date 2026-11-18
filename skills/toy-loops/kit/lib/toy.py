"""toy3d building blocks for Blender 5.2: paper-toy materials, shapes, lights, camera, render settings.

Toy scale: 1 unit = 1 metre and a character is a few centimetres, so the real camera depth of field gives the
miniature look. Every shape is built from code (bmesh), never loaded from a file.
"""
import bpy, bmesh, math
from mathutils import Vector, Matrix

_mats = {}


def reset():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    _mats.clear()


def col():
    return bpy.context.scene.collection


def hexc(h, alpha=1.0):
    """'#RRGGBB' (sRGB) -> linear RGBA."""
    h = h.lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), alpha)


def set_in(node, names, value):
    for n in names if isinstance(names, (list, tuple)) else [names]:
        if n in node.inputs:
            node.inputs[n].default_value = value
            return True
    return False


# ---------------------------------------------------------------- materials
def paper(name, color, rough=0.82, fiber=0.035, metal=0.0, spec=0.25, emit=0.0, tone=0.35):
    """Matte toy surface: flat colour, faint fibre bump, faint soft blotches so it does not read as plastic."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    b = N['Principled BSDF']
    set_in(b, 'Roughness', rough)
    set_in(b, 'Metallic', metal)
    set_in(b, ['Specular IOR Level', 'Specular'], spec)
    tc = N.new('ShaderNodeTexCoord')
    nz = N.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 18.0
    nz.inputs['Detail'].default_value = 2.0
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    mix = N.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    c = hexc(color)
    mix.inputs[6].default_value = c
    mix.inputs[7].default_value = (c[0] * 0.86, c[1] * 0.86, c[2] * 0.86, 1)
    rmp = N.new('ShaderNodeMapRange')
    rmp.inputs['From Min'].default_value = 0.35
    rmp.inputs['From Max'].default_value = 0.75
    rmp.inputs['To Min'].default_value = 0.0
    rmp.inputs['To Max'].default_value = tone
    L.new(nz.outputs['Fac'], rmp.inputs['Value'])
    L.new(rmp.outputs['Result'], mix.inputs['Factor'])
    L.new(mix.outputs[2], b.inputs['Base Color'])
    if fiber > 0:
        fib = N.new('ShaderNodeTexNoise')
        fib.inputs['Scale'].default_value = 900.0
        fib.inputs['Detail'].default_value = 6.0
        L.new(tc.outputs['Object'], fib.inputs['Vector'])
        bump = N.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = fiber
        bump.inputs['Distance'].default_value = 0.0004
        L.new(fib.outputs['Fac'], bump.inputs['Height'])
        L.new(bump.outputs['Normal'], b.inputs['Normal'])
    if emit > 0:
        set_in(b, ['Emission Color', 'Emission'], c)
        set_in(b, 'Emission Strength', emit)
    _mats[name] = m
    return m


def flame_mat(name, color, strength):
    """Light-only material for flames, embers, stars: black base so lights cannot wash it to white."""
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    set_in(b, 'Base Color', (0, 0, 0, 1))
    set_in(b, 'Roughness', 1.0)
    set_in(b, ['Specular IOR Level', 'Specular'], 0.0)
    set_in(b, ['Emission Color', 'Emission'], hexc(color))
    set_in(b, 'Emission Strength', strength)
    _mats[name] = m
    return m


def edge_mat():
    return paper('edge_white', '#FBF6EC', rough=0.9, fiber=0.0, tone=0.0)


def ink_mat():
    return paper('ink', '#1C1B1F', rough=0.6, fiber=0.0, tone=0.0)


# ---------------------------------------------------------------- geometry
def link(name, bm, mats, loc=(0, 0, 0), rot=(0, 0, 0), parent=None, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    col().objects.link(ob)
    for m in mats:
        me.materials.append(m)
    ob.location = loc
    ob.rotation_euler = rot
    if parent:
        ob.parent = parent
    return ob


def bevel(ob, width, edge_index=1, angle=30, segments=1):
    """Bevel the sharp edges; the bevel faces take material slot edge_index (the white paper edge)."""
    md = ob.modifiers.new('bevel', 'BEVEL')
    md.width = width
    md.segments = segments
    md.limit_method = 'ANGLE'
    md.angle_limit = math.radians(angle)
    md.material = edge_index
    return md


def _edge(edge):
    return edge_mat() if edge == 'edge' else edge


def empty(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    ob = bpy.data.objects.new(name, None)
    col().objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    if parent:
        ob.parent = parent
    return ob


def box(name, sx, sy, sz, mat, loc=(0, 0, 0), rot=(0, 0, 0), edge='edge', bw=0.0010, parent=None):
    """Box with its base at z=0, centred in x and y."""
    edge = _edge(edge)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz + sz / 2))
    ob = link(name, bm, [mat] + ([edge] if edge else []), loc, rot, parent)
    if bw:
        bevel(ob, bw, 1 if edge else -1)
    return ob


def prism(name, pts, z0, h, mat, edge='edge', bw=0.0010, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    """2D outline extruded along z (a paper cut-out with thickness). Sides smooth, rims beveled white."""
    edge = _edge(edge)
    bm = bmesh.new()
    bot = [bm.verts.new((x, y, z0)) for x, y in pts]
    top = [bm.verts.new((x, y, z0 + h)) for x, y in pts]
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        f = bm.faces.new((bot[i], bot[j], top[j], top[i]))
        f.smooth = True
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = link(name, bm, [mat] + ([edge] if edge else []), loc, rot, parent)
    if bw:
        bevel(ob, bw, 1 if edge else -1)
    return ob


def circle_pts(r, segs=64, ry=None):
    ry = r if ry is None else ry
    return [(r * math.cos(2 * math.pi * i / segs), ry * math.sin(2 * math.pi * i / segs)) for i in range(segs)]


def disc(name, r, h, mat, loc=(0, 0, 0), rot=(0, 0, 0), edge='edge', bw=0.0008, segs=64, parent=None):
    return prism(name, circle_pts(r, segs), 0, h, mat, edge, bw, loc, rot, parent)


def ring(name, r_in, r_out, h, mat, loc=(0, 0, 0), segs=96, parent=None):
    bm = bmesh.new()
    vs = []
    for z in (0, h):
        vs.append([bm.verts.new((r_in * math.cos(2 * math.pi * i / segs), r_in * math.sin(2 * math.pi * i / segs), z)) for i in range(segs)])
        vs.append([bm.verts.new((r_out * math.cos(2 * math.pi * i / segs), r_out * math.sin(2 * math.pi * i / segs), z)) for i in range(segs)])
    bi, bo, ti, to = vs
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((ti[i], ti[j], to[j], to[i]))
        bm.faces.new((bi[j], bi[i], bo[i], bo[j]))
        bm.faces.new((bo[i], bo[j], to[j], to[i]))
        bm.faces.new((bi[j], bi[i], ti[i], ti[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link(name, bm, [mat], loc, (0, 0, 0), parent)


def lathe(name, prof, mat, segs=64, loc=(0, 0, 0), parent=None):
    """Surface of revolution from a list of (radius, z). Radius 0 closes the end."""
    bm = bmesh.new()
    rings = []
    for r, z in prof:
        if r == 0:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / segs), r * math.sin(2 * math.pi * i / segs), z)) for i in range(segs)])
    for A, B in zip(rings, rings[1:]):
        if len(A) == 1:
            for i in range(segs):
                bm.faces.new((A[0], B[(i + 1) % segs], B[i]))
        elif len(B) == 1:
            for i in range(segs):
                bm.faces.new((A[i], A[(i + 1) % segs], B[0]))
        else:
            for i in range(segs):
                bm.faces.new((A[i], A[(i + 1) % segs], B[(i + 1) % segs], B[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link(name, bm, [mat], loc, (0, 0, 0), parent, smooth=True)


def blob(R, seed, n=72, wob=(0.10, 0.05)):
    """Irregular closed outline around the origin (an island, a puddle)."""
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        r = R * (1 + wob[0] * math.sin(3 * t + seed) + wob[1] * math.sin(5 * t + 2.1 * seed) + 0.02 * math.sin(9 * t + seed * 3.3))
        pts.append((r * math.cos(t), r * math.sin(t)))
    return pts


def backdrop(name, mat, radius=1.2, y=0.2, z0=-0.1, z1=1.4, arc_deg=120):
    """Curved paper sky behind the set (camera looks towards +Y). Far away, so depth of field blurs it."""
    bm = bmesh.new()
    n = 24
    cols = [(radius * math.sin(math.radians(-arc_deg / 2 + arc_deg * i / n)),
             radius * math.cos(math.radians(-arc_deg / 2 + arc_deg * i / n))) for i in range(n + 1)]
    vs = [[bm.verts.new((x, yy + y, z)) for z in (z0, z1)] for x, yy in cols]
    for A, B in zip(vs, vs[1:]):
        bm.faces.new((A[0], B[0], B[1], A[1]))
    return link(name, bm, [mat], smooth=True)


def flame_pts(w, h, n=20):
    """Teardrop flame outline (x right, y up), base at y=0, tip at y=h."""
    r = w / 2
    pts = [(r * math.cos(math.pi + math.pi * i / n), r + r * math.sin(math.pi + math.pi * i / n)) for i in range(n + 1)]
    side = lambda u: r * (1 - u) ** 1.4 * (1 + 0.25 * math.sin(math.pi * u))
    pts += [(side(i / n), r + (h - r) * i / n) for i in range(1, n + 1)]
    pts += [(-side(i / n), r + (h - r) * i / n) for i in range(n - 1, 0, -1)]
    return pts


def heart_pts(size, n=40):
    """Heart outline about `size` wide, centred."""
    k = size / 34.0
    return [(k * 16 * math.sin(t) ** 3, k * (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)))
            for t in [2 * math.pi * i / n for i in range(n)]][::-1]


def no_shadow(ob):
    """Lights and glowing bits must not cast shadows (a flame would block the fire light inside it)."""
    for o in [ob] + list(ob.children_recursive):
        o.visible_shadow = False


def billboard(ob, cam_loc, lean_deg=0.0):
    """Turn a flat cut-out (outline in local XY) to face the camera, staying upright; lean tilts it in view."""
    from mathutils import Quaternion
    fwd = Vector(cam_loc) - ob.location
    fwd.z = 0
    if fwd.length < 1e-9:
        return
    q = fwd.normalized().to_track_quat('Z', 'Y') @ Quaternion((0, 0, 1), math.radians(lean_deg))
    ob.rotation_euler = q.to_euler()


def set_color(mat, color):
    """Change a paper() material's colour (hex or linear RGBA) for this frame."""
    c = hexc(color) if isinstance(color, str) else color
    for nd in mat.node_tree.nodes:
        if nd.bl_idname == 'ShaderNodeMix':
            nd.inputs[6].default_value = c
            nd.inputs[7].default_value = (c[0] * 0.86, c[1] * 0.86, c[2] * 0.86, 1)
        if nd.bl_idname == 'ShaderNodeBsdfPrincipled' and nd.inputs['Emission Strength'].default_value > 0:
            set_in(nd, ['Emission Color', 'Emission'], c)


def mix_color(a, b, u):
    ca, cb = hexc(a), hexc(b)
    u = max(0.0, min(1.0, u))
    return tuple(ca[i] + (cb[i] - ca[i]) * u for i in range(3)) + (1.0,)


def noise(f, T, seed):
    """Flicker in -1..1 made of whole cycles per loop, so it repeats exactly every T frames."""
    s = seed
    return (0.5 * math.sin(2 * math.pi * (13 + s % 5) * f / T + s)
            + 0.3 * math.sin(2 * math.pi * (29 + s % 7) * f / T + 2.1 * s)
            + 0.2 * math.sin(2 * math.pi * (47 + s % 3) * f / T + 0.7 * s))


def point_light(name, loc, power, color, radius=0.01):
    ld = bpy.data.lights.new(name, 'POINT')
    ld.energy = power
    ld.color = hexc(color)[:3]
    ld.shadow_soft_size = radius
    lo = bpy.data.objects.new(name, ld)
    col().objects.link(lo)
    lo.location = loc
    return lo


def set_visible(ob, on):
    for o in [ob] + list(ob.children_recursive):
        o.hide_render = not on
        o.hide_viewport = not on


# ---------------------------------------------------------------- props
def palm(name, loc, h=0.13, lean=8):
    """Paper palm tree. Returns (root, crown): rotate the crown to make the leaves sway."""
    root = empty(name, loc, (0, math.radians(lean), 0))
    trunk = paper(name + '_trunk', '#A8754A', rough=0.85, fiber=0.06)
    leaf = paper(name + '_leaf', '#3FA35B', rough=0.7, fiber=0.02)
    n = 9
    for i in range(n):
        z = h * i / n
        r = 0.0062 - 0.0022 * i / n
        disc(f'{name}_seg{i}', r, h / n * 0.92, trunk, (0.0016 * math.sin(i * 0.5), 0, z), bw=0.0006, parent=root)
    crown = empty(name + '_crown', (0, 0, h), parent=root)
    for k in range(7):
        L, W, m = 0.075, 0.016, 14
        bm = bmesh.new()
        top, bot = [], []
        outline = [(L * i / m, W * math.sin(math.pi * i / m) ** 0.8 * (1 if i < m else 0)) for i in range(m + 1)]
        pts = outline + [(x, -y) for x, y in reversed(outline[1:-1])]
        for x, y in pts:
            zz = -1.2 * x * x - 0.15 * x
            top.append(bm.verts.new((x, y, zz + 0.0006)))
            bot.append(bm.verts.new((x, y, zz)))
        bm.faces.new(top)
        bm.faces.new(list(reversed(bot)))
        nn = len(pts)
        for i in range(nn):
            j = (i + 1) % nn
            bm.faces.new((bot[i], bot[j], top[j], top[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        link(f'{name}_leaf{k}', bm, [leaf], (0, 0, 0), (0, math.radians(-10 + 8 * (k % 2)), 2 * math.pi * k / 7 + 0.3), crown, smooth=True)
    return root, crown


def pebble(name, loc, s, mat):
    prof = [(0, 0)] + [(s * math.sin(math.pi * k / 12), s * 0.55 * (1 - math.cos(math.pi * k / 12))) for k in range(1, 12)] + [(0, s * 1.1)]
    return lathe(name, prof, mat, segs=32, loc=loc)


# ---------------------------------------------------------------- world, light, camera, render
def world(color, strength):
    sc = bpy.context.scene
    w = sc.world or bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = hexc(color)
    bg.inputs['Strength'].default_value = strength


def area_light(name, loc, target, size, power, color):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = 'DISK'
    ld.size = size
    ld.energy = power
    ld.color = hexc(color)[:3]
    lo = bpy.data.objects.new(name, ld)
    col().objects.link(lo)
    lo.location = loc
    lo.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return lo


def camera(target, dist, elev, azim, lens, fstop, sensor_fit='AUTO'):
    """Camera on a sphere around target. azim 0 = in front (-Y); positive azim moves it to +X."""
    target = Vector(target)
    cd = bpy.data.cameras.new('cam')
    cam = bpy.data.objects.new('cam', cd)
    col().objects.link(cam)
    bpy.context.scene.camera = cam
    e, z = math.radians(elev), math.radians(azim)
    cam.location = target + Vector((dist * math.cos(e) * math.sin(z), -dist * math.cos(e) * math.cos(z), dist * math.sin(e)))
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cd.lens = lens
    cd.sensor_fit = sensor_fit
    cd.sensor_width = 36.0
    cd.sensor_height = 36.0
    cd.clip_start = 0.005
    cd.clip_end = 20
    cd.dof.use_dof = True
    cd.dof.focus_distance = (target - cam.location).length
    cd.dof.aperture_fstop = fstop
    return cam


def render_settings(w, h, fps=25, engine='eevee', samples=64, exposure=-1.0, look='AgX - Punchy'):
    sc = bpy.context.scene
    r = sc.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, 100
    r.fps = fps
    r.image_settings.file_format = 'PNG'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = look
    sc.view_settings.exposure = exposure
    if engine == 'cycles':
        r.engine = 'CYCLES'
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'HIP'
        prefs.get_devices()
        for dv in prefs.devices:
            dv.use = (dv.type == 'HIP')
        sc.cycles.device = 'GPU'
        sc.cycles.samples = samples
        sc.cycles.use_denoising = True
        sc.cycles.max_bounces = 8
    else:
        for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
            try:
                r.engine = eng
                break
            except Exception:
                continue
        ee = sc.eevee
        for k, v in [('taa_render_samples', samples), ('use_raytracing', True), ('use_shadows', True),
                     ('shadow_ray_count', 2), ('shadow_step_count', 8), ('use_fast_gi', True)]:
            try:
                setattr(ee, k, v)
            except Exception as ex:
                print('eevee setting skipped', k, ex)
