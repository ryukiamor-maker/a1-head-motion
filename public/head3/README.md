# Head 3

Source: user-supplied `tripo_convert_981cb370-d46a-4c67-978b-5a4b36140263.glb`.

`model3-geometry.bin` retains the original position, normal, UV and index buffers.
`model3-texture.jpg` is its original embedded texture.
`model3-completion-fur.png` is the ImageGen-produced, reference-color-matched fine-fur albedo used by the completion mesh.
`model3-completion.bin` contains Blender-authored, non-indexed lower-head triangles. Its 24-byte `H3UV` v2 header records the 11-float vertex stride and fur/smooth-face group counts; vertices store position / normal / UV / linear seam tint.
`head3-completed.blend` is the editable Blender 4.5 project with both source and completion textures packed, production UVs, the fur material, and the separate smooth face/chin material.

Rebuild from the repository root:

1. Generate the raw fur swatch with the prompt in `output/imagegen/head3-fur-prompt.txt`, saving it as `output/imagegen/head3-completion-fur-raw.png`.
2. `python scripts/match-head3-fur.py` (requires Pillow)
3. `node scripts/prepare-head3.mjs`
4. `blender --background --python scripts/rebuild-head3.py`

The preview retains the complete original surface, divides it at a model-specific curved scarf lip, and attaches the head and reconstructed underside to the same rigid joint chain. The scarf/body remain fixed. The completion uses a cylindrical side chart plus a planar underside chart to maintain texel density without a polar fur whorl. Boundary normals are copied/blended from the source shell, while a narrow multiplicative tint band matches the generated fur to the authored pixels without replacing the actual strand texture.
