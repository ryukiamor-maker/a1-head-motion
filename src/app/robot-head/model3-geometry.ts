import * as THREE from "three";

// Source-space scarf lip sampled around +X (face), +Z (side), -X (back), -Z.
// It rises behind the head; a horizontal threshold cuts through the face/scarf.
const SCARF_LIP = [0.192, 0.192, 0.194, 0.198, 0.2, 0.202, 0.204, 0.207,
  0.21, 0.213, 0.214, 0.214, 0.214, 0.214, 0.213, 0.211,
  0.208, 0.205, 0.202, 0.2, 0.198, 0.196, 0.193, 0.192];
const SCALE = 0.35;
const Z_OFFSET = 0.0145;
type Vertex = { p: THREE.Vector3; n: THREE.Vector3; uv: THREE.Vector2; d: number };

export function head3ScarfLip(x: number, z: number): number {
  const t = ((Math.atan2(z, x) / (2 * Math.PI) + 1) % 1) * SCARF_LIP.length;
  const i = Math.floor(t);
  return THREE.MathUtils.lerp(SCARF_LIP[i], SCARF_LIP[(i + 1) % SCARF_LIP.length], t - i);
}

function geometryFromTriangles(vertices: Vertex[]): THREE.BufferGeometry {
  const p: number[] = [], n: number[] = [], uv: number[] = [];
  for (const v of vertices) {
    // Rotate +90 degrees about X, preserving handedness, normals and winding.
    p.push(v.p.x * SCALE, -v.p.z * SCALE, v.p.y * SCALE + Z_OFFSET);
    n.push(v.n.x, -v.n.z, v.n.y);
    uv.push(v.uv.x, v.uv.y);
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  result.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
  result.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  result.computeBoundingSphere();
  return result;
}

function clip(vertices: Vertex[], keepHead: boolean): Vertex[] {
  const polygon: Vertex[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    const insideA = keepHead ? a.d >= 0 : a.d <= 0;
    const insideB = keepHead ? b.d >= 0 : b.d <= 0;
    if (insideA) polygon.push(a);
    if (insideA !== insideB) {
      const t = a.d / (a.d - b.d);
      polygon.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize(), uv: a.uv.clone().lerp(b.uv, t), d: 0 });
    }
  }
  return polygon;
}

function clipHiddenLowerHead(vertices: Vertex[], keepLowerHead: boolean): Vertex[] {
  // The source asset contains lower face/head shells underneath the scarf lip.
  // Leaving those triangles in the static body makes a faceted mask and
  // stretched-fur shards appear when the rigid head pitches upward.  Scarf and
  // body surfaces sit outside this inner cylinder (or much farther down).
  const result: Vertex[] = [];
  const distance = ({ p }: Vertex) => Math.max(0.1 - p.y, Math.hypot(p.x, p.z) - 0.17);
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    const da = distance(a), db = distance(b);
    const insideA = keepLowerHead ? da <= 0 : da >= 0;
    const insideB = keepLowerHead ? db <= 0 : db >= 0;
    if (insideA) result.push(a);
    if (insideA !== insideB) {
      const t = da / (da - db);
      result.push({
        p: a.p.clone().lerp(b.p, t),
        n: a.n.clone().lerp(b.n, t).normalize(),
        uv: a.uv.clone().lerp(b.uv, t),
        d: 0,
      });
    }
  }
  return result;
}

export function splitHead3Geometry(binary: ArrayBuffer): {
  body: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  lowerHead: THREE.BufferGeometry;
  neck: THREE.BufferGeometry;
} {
  if (binary.byteLength !== 684546) throw new Error("Head3 几何资源不完整。");
  const p = new Float32Array(binary, 0, 52173);
  const n = new Float32Array(binary, 208692, 52173);
  const uv = new Float32Array(binary, 417384, 34782);
  const indices = new Uint16Array(binary, 556512, 64017);
  const vertices: Vertex[] = Array.from({ length: 17391 }, (_, i) => ({
    p: new THREE.Vector3().fromArray(p, i * 3), n: new THREE.Vector3().fromArray(n, i * 3),
    uv: new THREE.Vector2().fromArray(uv, i * 2), d: p[i * 3 + 1] - head3ScarfLip(p[i * 3], p[i * 3 + 2]),
  }));
  const body: Vertex[] = [], head: Vertex[] = [], lowerHead: Vertex[] = [], neck: Vertex[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = [vertices[indices[i]], vertices[indices[i + 1]], vertices[indices[i + 2]]];
    const clippedBody = clip(triangle, false);
    const bodyPolygon = clipHiddenLowerHead(clippedBody, false);
    for (let j = 1; j < bodyPolygon.length - 1; j++) {
      body.push(bodyPolygon[0], bodyPolygon[j], bodyPolygon[j + 1]);
    }
    const lowerHeadPolygon = clipHiddenLowerHead(clippedBody, true);
    for (let j = 1; j < lowerHeadPolygon.length - 1; j++) {
      lowerHead.push(lowerHeadPolygon[0], lowerHeadPolygon[j], lowerHeadPolygon[j + 1]);
    }
    const headPolygon = clip(triangle, true);
    for (let j = 1; j < headPolygon.length - 1; j++) {
      head.push(headPolygon[0], headPolygon[j], headPolygon[j + 1]);
    }
  }
  return {
    body: geometryFromTriangles(body),
    head: geometryFromTriangles(head),
    lowerHead: geometryFromTriangles(lowerHead),
    neck: geometryFromTriangles(neck),
  };
}
