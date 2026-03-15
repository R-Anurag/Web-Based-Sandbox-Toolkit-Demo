// generate-models.mjs  —  node generate-models.mjs
import { Document, NodeIO } from '@gltf-transform/core';
import { writeFileSync }    from 'fs';

const io = new NodeIO();

// ── helpers ────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function buildDoc(name, primitives) {
  const doc   = new Document();
  const buf   = doc.createBuffer();
  const scene = doc.createScene(name);
  const mat   = doc.createMaterial(name)
    .setBaseColorFactor([...hexToRgb(primitives[0].color), 1])
    .setRoughnessFactor(0.4)
    .setMetallicFactor(0.3);

  primitives.forEach(({ positions, indices, color }, i) => {
    const m = i === 0 ? mat : doc.createMaterial(`${name}_${i}`)
      .setBaseColorFactor([...hexToRgb(color), 1])
      .setRoughnessFactor(0.4)
      .setMetallicFactor(0.3);

    const posAcc = doc.createAccessor()
      .setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buf);
    const idxAcc = doc.createAccessor()
      .setType('SCALAR').setArray(new Uint16Array(indices)).setBuffer(buf);

    const normals = computeNormals(positions, indices);
    const nrmAcc  = doc.createAccessor()
      .setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buf);

    const prim = doc.createPrimitive()
      .setAttribute('POSITION', posAcc)
      .setAttribute('NORMAL',   nrmAcc)
      .setIndices(idxAcc)
      .setMaterial(m);

    const mesh = doc.createMesh(`${name}_mesh_${i}`).addPrimitive(prim);
    const node = doc.createNode(`${name}_node_${i}`).setMesh(mesh);
    scene.addChild(node);
  });

  return doc;
}

function computeNormals(positions, indices) {
  const normals = new Array(positions.length).fill(0);
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i]*3, indices[i+1]*3, indices[i+2]*3];
    const ax = positions[b]-positions[a], ay = positions[b+1]-positions[a+1], az = positions[b+2]-positions[a+2];
    const bx = positions[c]-positions[a], by = positions[c+1]-positions[a+1], bz = positions[c+2]-positions[a+2];
    const nx = ay*bz-az*by, ny = az*bx-ax*bz, nz = ax*by-ay*bx;
    [a,b,c].forEach(v => { normals[v]+=nx; normals[v+1]+=ny; normals[v+2]+=nz; });
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i+1], normals[i+2]) || 1;
    normals[i]/=len; normals[i+1]/=len; normals[i+2]/=len;
  }
  return normals;
}

// ── geometry builders ──────────────────────────────────────────────────────

function box(sx=1, sy=1, sz=1, ox=0, oy=0, oz=0) {
  const hx=sx/2, hy=sy/2, hz=sz/2;
  const positions = [
    ox-hx,oy-hy,oz+hz, ox+hx,oy-hy,oz+hz, ox+hx,oy+hy,oz+hz, ox-hx,oy+hy,oz+hz, // front
    ox+hx,oy-hy,oz-hz, ox-hx,oy-hy,oz-hz, ox-hx,oy+hy,oz-hz, ox+hx,oy+hy,oz-hz, // back
    ox-hx,oy-hy,oz-hz, ox-hx,oy-hy,oz+hz, ox-hx,oy+hy,oz+hz, ox-hx,oy+hy,oz-hz, // left
    ox+hx,oy-hy,oz+hz, ox+hx,oy-hy,oz-hz, ox+hx,oy+hy,oz-hz, ox+hx,oy+hy,oz+hz, // right
    ox-hx,oy+hy,oz+hz, ox+hx,oy+hy,oz+hz, ox+hx,oy+hy,oz-hz, ox-hx,oy+hy,oz-hz, // top
    ox-hx,oy-hy,oz-hz, ox+hx,oy-hy,oz-hz, ox+hx,oy-hy,oz+hz, ox-hx,oy-hy,oz+hz, // bottom
  ];
  const indices = [];
  for (let f = 0; f < 6; f++) {
    const b = f*4;
    indices.push(b,b+1,b+2, b,b+2,b+3);
  }
  return { positions, indices };
}

function sphere(r=0.6, stacks=12, slices=16, ox=0, oy=0, oz=0) {
  const positions=[], indices=[];
  for (let i=0; i<=stacks; i++) {
    const phi = Math.PI*i/stacks;
    for (let j=0; j<=slices; j++) {
      const theta = 2*Math.PI*j/slices;
      positions.push(ox+r*Math.sin(phi)*Math.cos(theta), oy+r*Math.cos(phi), oz+r*Math.sin(phi)*Math.sin(theta));
    }
  }
  for (let i=0; i<stacks; i++) for (let j=0; j<slices; j++) {
    const a=i*(slices+1)+j, b=a+slices+1;
    indices.push(a,b,a+1, b,b+1,a+1);
  }
  return { positions, indices };
}

function cylinder(rt=0.1, rb=0.1, h=1, segs=12, ox=0, oy=0, oz=0) {
  const positions=[], indices=[];
  const half=h/2;
  for (let i=0; i<=segs; i++) {
    const a=2*Math.PI*i/segs;
    positions.push(ox+rt*Math.cos(a), oy+half, oz+rt*Math.sin(a));
    positions.push(ox+rb*Math.cos(a), oy-half, oz+rb*Math.sin(a));
  }
  for (let i=0; i<segs; i++) {
    const b=i*2;
    indices.push(b,b+2,b+1, b+1,b+2,b+3);
  }
  return { positions, indices };
}

function cone(r=0.35, h=0.6, segs=12, ox=0, oy=0, oz=0) {
  return cylinder(0, r, h, segs, ox, oy, oz);
}

// ── write each model ───────────────────────────────────────────────────────

async function write(filename, primitives) {
  const doc   = buildDoc(filename, primitives);
  const bytes = await io.writeBinary(doc);
  writeFileSync(filename, bytes);
  console.log('wrote', filename);
}

await write('models/cube.glb',   [{ ...box(1,1,1),                    color:'#f59e0b' }]);
await write('models/sphere.glb', [{ ...sphere(0.6),                   color:'#3b82f6' }]);
await write('models/light.glb',  [
  { ...cone(0.35, 0.6, 12, 0, 0.6, 0),      color:'#facc15' },
  { ...cylinder(0.08, 0.08, 0.8, 10),        color:'#888888' },
]);
await write('models/camera.glb', [
  { ...box(1, 0.65, 0.5),                    color:'#22d3ee' },
  { ...cylinder(0.18, 0.18, 0.3, 14, 0, 0, 0.38), color:'#111827' },
]);
await write('models/marker.glb', [
  { ...sphere(0.35, 10, 14, 0, 0.5, 0),      color:'#f43f5e' },
  { ...cone(0.2, 0.7, 12, 0, -0.15, 0),      color:'#f43f5e' },
]);

console.log('All models generated.');
