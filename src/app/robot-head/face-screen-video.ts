import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";

/** Video pixels occupy the original curved screen; authored UVs are restored on clear. */
export function createFaceScreenVideoUvs(
  geometry: THREE.BufferGeometry,
  modelVariant: unknown,
): THREE.Float32BufferAttribute {
  const position = geometry.getAttribute("position");
  let minY = 0.373, height = 0.371, minZ = -0.292, width = 0.584;
  if (modelVariant === "cockpitRobot") {
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    minY = bounds.min.y;
    minZ = bounds.min.z;
    height = Math.max(bounds.max.y - minY, 1e-6);
    width = Math.max(bounds.max.z - minZ, 1e-6);
  }
  const uv = new Float32Array(position.count * 2);
  for (let index = 0; index < position.count; index += 1) {
    // Front faces +X; after Y-up -> Z-up, the viewer's right is local -Z.
    // VideoTexture with flipY=false uses V=0 at the top of the source video.
    uv[index * 2] = 1 - THREE.MathUtils.clamp((position.getZ(index) - minZ) / width, 0, 1);
    uv[index * 2 + 1] = 1 - THREE.MathUtils.clamp((position.getY(index) - minY) / height, 0, 1);
  }
  return new THREE.Float32BufferAttribute(uv, 2);
}

export function attachFaceScreenVideo(
  robot: URDFRobot,
  url: string,
  modelVariant: unknown,
): () => void {
  const screen = robot.userData.videoScreen as THREE.Object3D | undefined;
  if (!screen) return () => undefined;
  screen.visible = true;
  if (!url) return () => undefined;

  const video = document.createElement("video");
  video.src = url;
  video.autoplay = true;
  video.preload = "auto";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  const play = () => { void video.play().catch(() => undefined); };
  video.addEventListener("loadedmetadata", play);
  video.addEventListener("canplay", play);
  const texture = new THREE.VideoTexture(video);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  const originals: Array<{
    mesh: THREE.Mesh;
    material: THREE.Material | THREE.Material[];
    uv: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined;
    videoMaterial: THREE.MeshBasicMaterial;
  }> = [];
  screen.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = new THREE.MeshBasicMaterial({
      color: 0xd9d9d9, map: texture, side: THREE.DoubleSide, toneMapped: false,
    });
    originals.push({ mesh: object, material: object.material, uv: object.geometry.getAttribute("uv"), videoMaterial: material });
    object.geometry.setAttribute("uv", createFaceScreenVideoUvs(object.geometry, modelVariant));
    object.material = material;
  });
  video.load();
  play();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    video.removeEventListener("loadedmetadata", play);
    video.removeEventListener("canplay", play);
    video.pause();
    video.removeAttribute("src");
    video.load();
    originals.forEach(({ mesh, material, uv, videoMaterial }) => {
      mesh.material = material;
      if (uv) mesh.geometry.setAttribute("uv", uv);
      else mesh.geometry.deleteAttribute("uv");
      videoMaterial.dispose();
    });
    texture.dispose();
  };
}
