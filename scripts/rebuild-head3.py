"""Rebuild Head3's lower cranium with authored UVs and packed materials.

Usage:
  node scripts/prepare-head3.mjs
  blender --background --python scripts/rebuild-head3.py

The runtime completion format is little-endian and begins with:
  magic[4] = H3UV, version, float stride, vertex count,
  fur vertex count, smooth-face vertex count (six 32-bit fields).
Each non-indexed vertex then stores position3 / normal3 / uv2 / linear tint3.
Fur triangles are first, followed by the smooth face-mask/chin triangles.
"""
from __future__ import annotations

import json
import math
import os
import struct

import bmesh
import bpy
from mathutils import Vector


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PARTS_PATH = os.path.join(ROOT, ".toolcraft/browser-artifacts/head3-parts.json")
ORIGINAL_TEXTURE_PATH = os.path.join(ROOT, "public/head3/model3-texture.jpg")
FUR_TEXTURE_PATH = os.path.join(ROOT, "public/head3/model3-completion-fur.png")
COMPLETION_PATH = os.path.join(ROOT, "public/head3/model3-completion.bin")
BLEND_PATH = os.path.join(ROOT, "public/head3/head3-completed.blend")
MAGIC = b"H3UV"
VERSION = 2
STRIDE = 11


with open(PARTS_PATH, encoding="utf-8") as source_file:
    data = json.load(source_file)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

original_texture = bpy.data.images.load(ORIGINAL_TEXTURE_PATH)
original_texture.colorspace_settings.name = "sRGB"
fur_texture = bpy.data.images.load(FUR_TEXTURE_PATH)
fur_texture.colorspace_settings.name = "sRGB"


def image_material(name: str, image: bpy.types.Image, roughness: float) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    shader = nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = roughness
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.image = image
    image_node.interpolation = "Linear"
    image_node.extension = "REPEAT"
    material.node_tree.links.new(image_node.outputs["Color"], shader.inputs["Base Color"])
    return material


original_material = image_material("Original Tripo material", original_texture, 0.9)


def make_mesh(name: str, source: dict[str, list[float]]) -> bpy.types.Object:
    positions = source["position"]
    uvs = source["uv"]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(
        [positions[i : i + 3] for i in range(0, len(positions), 3)],
        [],
        [(i, i + 1, i + 2) for i in range(0, len(positions) // 3, 3)],
    )
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop in mesh.loops:
        vertex_index = loop.vertex_index
        uv_layer.data[loop.index].uv = (uvs[vertex_index * 2], 1 - uvs[vertex_index * 2 + 1])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(original_material)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.000001)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj


body = make_mesh("Body and scarf - fixed", data["body"])
head = make_mesh("Head - rigid source shell", data["head"])
lower_head = make_mesh("Original lower face and chin - rigid", data["lowerHead"])

bm = bmesh.new()
bm.from_mesh(head.data)
bm.verts.ensure_lookup_table()
bm.edges.ensure_lookup_table()
bm.normal_update()

boundary_edges = [edge for edge in bm.edges if edge.is_boundary]
groups = []
unseen = set(boundary_edges)
while unseen:
    edge = unseen.pop()
    component = {edge}
    pending = list(edge.verts)
    while pending:
        vertex = pending.pop()
        for linked in vertex.link_edges:
            if linked in unseen:
                unseen.remove(linked)
                component.add(linked)
                pending.extend(linked.verts)
    groups.append(component)

for group_index, group in enumerate(sorted(groups, key=len, reverse=True)):
    vertices = {vertex for edge in group for vertex in edge.verts}
    minimum = Vector((
        min(vertex.co.x for vertex in vertices),
        min(vertex.co.y for vertex in vertices),
        min(vertex.co.z for vertex in vertices),
    ))
    maximum = Vector((
        max(vertex.co.x for vertex in vertices),
        max(vertex.co.y for vertex in vertices),
        max(vertex.co.z for vertex in vertices),
    ))
    print(
        "Boundary group",
        group_index,
        "edges",
        len(group),
        "bounds",
        tuple(round(value, 5) for value in minimum),
        tuple(round(value, 5) for value in maximum),
    )

opening = max(groups, key=len)
adjacency = {}
for edge in opening:
    a, b = edge.verts
    adjacency.setdefault(a, []).append(b)
    adjacency.setdefault(b, []).append(a)

start = max(adjacency, key=lambda vertex: (vertex.co.x, -abs(vertex.co.y), vertex.co.z))
start_angle = math.atan2(start.co.y, start.co.x)


def positive_angle_delta(vertex) -> float:
    return (math.atan2(vertex.co.y, vertex.co.x) - start_angle) % (2 * math.pi)


current = min(adjacency[start], key=positive_angle_delta)
ordered = [start]
previous = start
while current != start:
    ordered.append(current)
    next_vertices = [vertex for vertex in adjacency[current] if vertex != previous]
    if not next_vertices:
        raise RuntimeError("Unclosed Head3 lower-cranium boundary")
    previous, current = current, next_vertices[0]

print("Anatomical opening vertices", len(ordered), "boundary groups", len(groups))

original_pixels = list(original_texture.pixels)
original_width, original_height = original_texture.size
fur_pixels = list(fur_texture.pixels)


def sample_original(uv: Vector) -> tuple[float, float, float]:
    x = min(original_width - 1, max(0, int(uv.x * original_width)))
    y = min(original_height - 1, max(0, int(uv.y * original_height)))
    offset = (y * original_width + x) * 4
    return tuple(original_pixels[offset : offset + 3])


def image_linear_mean(pixels: list[float]) -> tuple[float, float, float]:
    step = max(1, (len(pixels) // 4) // 65536)
    totals = [0.0, 0.0, 0.0]
    count = 0
    for pixel_index in range(0, len(pixels) // 4, step):
        offset = pixel_index * 4
        for channel in range(3):
            totals[channel] += pixels[offset + channel]
        count += 1
    return tuple(total / count for total in totals)


uv_layer = bm.loops.layers.uv.active
source = data["head"]
authored_normals = {}
for index in range(len(source["position"]) // 3):
    key = tuple(round(value, 6) for value in source["position"][index * 3 : index * 3 + 3])
    authored_normals[key] = Vector(source["normal"][index * 3 : index * 3 + 3])

rim = [vertex.co.copy() for vertex in ordered]
rim_normals = [
    authored_normals.get(tuple(round(value, 6) for value in vertex.co), vertex.normal).normalized()
    for vertex in ordered
]
rim_colors = []
for vertex in ordered:
    samples = [sample_original(loop[uv_layer].uv) for loop in vertex.link_loops]
    rim_colors.append(tuple(sum(color[channel] for color in samples) / len(samples) for channel in range(3)))

rim_luminance = [sum(color) / 3 for color in rim_colors]
bright_rim = [
    (round(math.atan2(point.y, point.x), 3), round(luminance, 3))
    for point, luminance in zip(rim, rim_luminance)
    if luminance > 0.6
]
print(
    "Rim luminance",
    round(min(rim_luminance), 3),
    round(max(rim_luminance), 3),
    "bright angles",
    bright_rim,
)

count = len(rim)
fur_mean = image_linear_mean(fur_pixels)
face_candidates = [
    color
    for point, color in zip(rim, rim_colors)
    if abs(math.atan2(point.y, point.x)) < 0.92 and sum(color) / 3 > 0.35
]
if not face_candidates:
    face_candidates = [color for point, color in zip(rim, rim_colors) if abs(math.atan2(point.y, point.x)) < 0.92]
face_mean = tuple(sum(color[channel] for color in face_candidates) / len(face_candidates) for channel in range(3))

# Keep enough rounded volume below the scarf lip that large pitch/roll poses do
# not reveal the empty interior.  The broader second control ring avoids the
# pinched, plug-like silhouette of the earlier shallow closure.
center = Vector((0, 0, 0.045))
rows = 40
coords = []
parameters = []
for row in range(rows):
    t = row / rows
    for rim_index, point in enumerate(rim):
        depth = point.z - center.z
        radial_direction = Vector((point.x, point.y, 0)).normalized()
        boundary_normal = rim_normals[rim_index]
        slope = boundary_normal.z / max(0.25, boundary_normal.dot(radial_direction))
        slope = max(-1.4, min(0.3, slope))
        tangent = radial_direction * (depth * 1.5 * slope) + Vector((0, 0, -depth * 1.5))
        control1 = point + tangent / 3
        control2 = Vector((point.x * 0.62, point.y * 0.62, center.z))
        q = (
            point * (1 - t) ** 3
            + control1 * (3 * (1 - t) ** 2 * t)
            + control2 * (3 * (1 - t) * t * t)
            + center * t**3
        )
        coords.append(q)
        parameters.append((t, rim_index))

pole = len(coords)
coords.append(center)
parameters.append((1.0, 0))

faces = []
for row in range(rows - 1):
    for rim_index in range(count):
        a = row * count + rim_index
        b = row * count + (rim_index + 1) % count
        c = (row + 1) * count + (rim_index + 1) % count
        d = (row + 1) * count + rim_index
        faces.extend(((a, b, c), (a, c, d)))
for rim_index in range(count):
    faces.append(((rows - 1) * count + rim_index, (rows - 1) * count + (rim_index + 1) % count, pole))

# Derive smooth surface normals, then lock the first four rows to the authored
# boundary normal field so moving light never exposes the reconstruction seam.
normals = [Vector() for _ in coords]
for face_index, face in enumerate(faces):
    a, b, c = (coords[index] for index in face)
    face_normal = (b - a).cross(c - a)
    average_position = (a + b + c) / 3
    if face_normal.dot(average_position - Vector((0, 0, center.z))) < 0:
        face = (face[0], face[2], face[1])
        faces[face_index] = face
        a, b, c = (coords[index] for index in face)
        face_normal = (b - a).cross(c - a)
    for index in face:
        normals[index] += face_normal
for index, normal in enumerate(normals):
    normal.normalize()
    t, rim_index = parameters[index]
    if t < 4 / rows:
        normals[index] = rim_normals[rim_index].lerp(normal, t / (4 / rows)).normalized()


def wrapped_angle(value: float) -> float:
    return (value + math.pi) % (2 * math.pi) - math.pi


def is_smooth_face(face) -> bool:
    # The source model's original smooth white lower face/chin is now retained
    # as a separate rigid head shell.  The reconstructed cap therefore only
    # continues the surrounding fur and cannot create an artificial white fan.
    return False


def smoothed_rim_color(rim_index: int) -> tuple[float, float, float]:
    neighbors = [rim_colors[(rim_index + offset) % count] for offset in range(-2, 3)]
    return tuple(sum(color[channel] for color in neighbors) / len(neighbors) for channel in range(3))


def seam_tint(index: int, smooth_face: bool) -> tuple[float, float, float]:
    t, rim_index = parameters[index]
    boundary = smoothed_rim_color(rim_index)
    if smooth_face:
        blend = min(1.0, t / 0.05)
        blend = blend * blend * (3 - 2 * blend)
        return tuple((1 - blend) * boundary[channel] + blend * face_mean[channel] for channel in range(3))
    blend = min(1.0, t / 0.05)
    blend = blend * blend * (3 - 2 * blend)
    ratio = tuple(max(0.7, min(1.3, boundary[channel] / max(fur_mean[channel], 1e-5))) for channel in range(3))
    return tuple((1 - blend) * ratio[channel] + blend for channel in range(3))


def fur_uvs(face) -> list[tuple[float, float]]:
    average_t = sum(parameters[index][0] for index in face) / 3
    if average_t < 0.64:
        angles = [math.atan2(coords[index].y, coords[index].x) for index in face]
        reference = angles[0]
        unwrapped = [reference]
        for angle in angles[1:]:
            while angle - reference > math.pi:
                angle -= 2 * math.pi
            while angle - reference < -math.pi:
                angle += 2 * math.pi
            unwrapped.append(angle)
        return [
            (angle / (2 * math.pi) + 0.5, 0.06 + parameters[index][0] * 0.34)
            for angle, index in zip(unwrapped, face)
        ]
    # A planar underside chart avoids the single-pole radial distortion that a
    # latitude/longitude unwrap would create beneath the head.
    return [
        (0.5 + coords[index].x / 0.11 * 0.55, 0.5 + coords[index].y / 0.11 * 0.55)
        for index in face
    ]


fur_faces = [face for face in faces if not is_smooth_face(face)]
smooth_faces = [face for face in faces if is_smooth_face(face)]
ordered_faces = [(face, False) for face in fur_faces] + [(face, True) for face in smooth_faces]

packed = []
positions = []
export_normals = []
export_uvs = []
export_tints = []
for face, smooth_face in ordered_faces:
    face_uvs = [(0.0, 0.0)] * 3 if smooth_face else fur_uvs(face)
    for index, uv in zip(face, face_uvs):
        position = tuple(coords[index])
        normal = tuple(normals[index])
        tint = seam_tint(index, smooth_face)
        positions.append(position)
        export_normals.append(normal)
        export_uvs.append(uv)
        export_tints.append(tint)
        packed.extend((*position, *normal, *uv, *tint))

fur_vertex_count = len(fur_faces) * 3
smooth_vertex_count = len(smooth_faces) * 3
header = struct.pack(
    "<4sIIIII",
    MAGIC,
    VERSION,
    STRIDE,
    len(positions),
    fur_vertex_count,
    smooth_vertex_count,
)
with open(COMPLETION_PATH, "wb") as completion_file:
    completion_file.write(header)
    completion_file.write(struct.pack(f"<{len(packed)}f", *packed))

# Build the editable Blender representation from the exact runtime triangle
# stream, including its UV seams, material split, tint, and custom normals.
mesh = bpy.data.meshes.new("Rounded lower cranium with production UVs")
mesh.from_pydata(positions, [], [(index, index + 1, index + 2) for index in range(0, len(positions), 3)])
mesh.update()
patch = bpy.data.objects.new("Reconstructed lower head - textured", mesh)
bpy.context.collection.objects.link(patch)

uv_map = mesh.uv_layers.new(name="CompletionUV")
for loop in mesh.loops:
    u, v = export_uvs[loop.vertex_index]
    uv_map.data[loop.index].uv = (u, 1 - v)

tint_attribute = mesh.color_attributes.new(name="SeamTint", type="FLOAT_COLOR", domain="POINT")
for index, tint in enumerate(export_tints):
    tint_attribute.data[index].color = (*tint, 1)

fur_material = bpy.data.materials.new("ImageGen matched short fur")
fur_material.use_nodes = True
fur_nodes = fur_material.node_tree.nodes
fur_shader = fur_nodes.get("Principled BSDF")
fur_shader.inputs["Roughness"].default_value = 0.92
fur_image = fur_nodes.new("ShaderNodeTexImage")
fur_image.image = fur_texture
fur_image.interpolation = "Linear"
fur_image.extension = "REPEAT"
fur_tint = fur_nodes.new("ShaderNodeVertexColor")
fur_tint.layer_name = "SeamTint"
fur_multiply = fur_nodes.new("ShaderNodeMixRGB")
fur_multiply.blend_type = "MULTIPLY"
fur_multiply.inputs[0].default_value = 1.0
fur_material.node_tree.links.new(fur_image.outputs["Color"], fur_multiply.inputs[1])
fur_material.node_tree.links.new(fur_tint.outputs["Color"], fur_multiply.inputs[2])
fur_material.node_tree.links.new(fur_multiply.outputs["Color"], fur_shader.inputs["Base Color"])

face_material = bpy.data.materials.new("Original smooth face continuation")
face_material.use_nodes = True
face_nodes = face_material.node_tree.nodes
face_shader = face_nodes.get("Principled BSDF")
face_shader.inputs["Roughness"].default_value = 0.82
face_tint = face_nodes.new("ShaderNodeVertexColor")
face_tint.layer_name = "SeamTint"
face_material.node_tree.links.new(face_tint.outputs["Color"], face_shader.inputs["Base Color"])

mesh.materials.append(fur_material)
mesh.materials.append(face_material)
for polygon_index, polygon in enumerate(mesh.polygons):
    polygon.material_index = 0 if polygon_index < len(fur_faces) else 1
    polygon.use_smooth = True

if hasattr(mesh, "normals_split_custom_set_from_vertices"):
    mesh.normals_split_custom_set_from_vertices([Vector(normal) for normal in export_normals])

original_texture.pack()
fur_texture.pack()
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
bm.free()

print("Completion triangles", len(ordered_faces))
print("Fur / smooth triangles", len(fur_faces), len(smooth_faces))
print("Completion texture linear mean", fur_mean)
print("Smooth face linear mean", face_mean)
print("Wrote", COMPLETION_PATH)
print("Saved packed Blender project", BLEND_PATH)
