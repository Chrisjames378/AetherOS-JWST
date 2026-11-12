import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CelestialSpec,
  CELESTIAL_OBJECTS,
  CELESTIAL_MAP,
  CelestialCategory,
} from '../data/celestialCatalog';
import {
  computeCelestialPosition,
  generateOrbitPath,
  Vector3D,
  computeSolarGalacticState,
  SolarGalacticState,
} from '../utils/orbitalMath';
import { createJWST3DModel } from './JWSTModel';

interface CosmicCanvasProps {
  currentTimeMs: number;
  showOrbits: boolean;
  activeCategories: Record<CelestialCategory, boolean>;
  selectedId: string | null;
  followingId: string | null;
  onPickObject: (id: string) => void;
  onSampleFrameMs: (ms: number) => void;
  targetFlyId?: string | null;
}

// Initial Sun & Solar System location computed from real-time Milky Way kinematics
const initialGalactic = computeSolarGalacticState(Date.now());
export const SOLAR_GALACTIC_OFFSET = new THREE.Vector3(
  initialGalactic.worldPosition.x,
  initialGalactic.worldPosition.y,
  initialGalactic.worldPosition.z
);

// Asterism stick figure connections for constellations
export const CONSTELLATION_LINES: [string, string][] = [
  // 1. ORION (The Hunter) & ORION'S BELT
  ['betelgeuse', 'meissa'],
  ['meissa', 'bellatrix'],
  ['betelgeuse', 'alnitak'],
  ['bellatrix', 'mintaka'],
  ['alnitak', 'alnilam'],   // Orion's Belt
  ['alnilam', 'mintaka'],   // Orion's Belt
  ['alnitak', 'saiph'],
  ['mintaka', 'rigel'],
  ['saiph', 'rigel'],
  ['alnilam', 'm42'],       // Orion's Sword to M42

  // 2. URSA MAJOR (Big Dipper)
  ['dubhe', 'merak'],
  ['merak', 'alioth'],
  ['alioth', 'mizar'],
  ['dubhe', 'alioth'],
  ['merak', 'dubhe'],

  // 3. CASSIOPEIA
  ['schedar', 'gammacas'],

  // 4. CANIS MAJOR & WINTER TRIANGLE
  ['sirius', 'betelgeuse'],

  // 5. CYGNUS
  ['deneb', 'albireo'],

  // 6. TAURUS & PLEIADES
  ['aldebaran', 'pleiades'],

  // 7. SUMMER TRIANGLE
  ['vega', 'deneb'],
];

// --- WEBGL SHADERS FOR DARK MATTER HALOS & COSMIC FILAMENTS ---
const DarkMatterHaloShader = {
  uniforms: {
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uColorCore: { value: new THREE.Color('#6366f1') }, // Indigo
    uColorOuter: { value: new THREE.Color('#38bdf8') }, // Cyan
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    uniform float uTime;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      
      // Gravitational wave perturbation
      vec3 pos = position + normal * (sin(uTime * 1.5 + position.x * 0.03 + position.z * 0.03) * 0.4);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColorCore;
    uniform vec3 uColorOuter;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - clamp(abs(dot(viewDir, vNormal)), 0.0, 1.0), 2.2);
      
      // Dynamic gravitational pulse
      float pulse = 0.85 + 0.15 * sin(uTime * 2.2 + vWorldPosition.y * 0.015);
      
      vec3 color = mix(uColorCore, uColorOuter, fresnel * pulse);
      float alpha = fresnel * 0.75 * uIntensity;
      
      gl_FragColor = vec4(color, alpha);
    }
  `,
};

const CosmicFilamentShader = {
  uniforms: {
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uColorStream: { value: new THREE.Color('#38bdf8') }, // Cyan
    uColorGlow: { value: new THREE.Color('#a855f7') },   // Purple
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    uniform float uTime;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      
      // Cosmic wave wiggle along filament length
      vec3 pos = position;
      pos.x += sin(uTime * 2.0 + position.z * 0.01) * 0.6;
      pos.y += cos(uTime * 1.8 + position.x * 0.01) * 0.6;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColorStream;
    uniform vec3 uColorGlow;

    void main() {
      // Flowing gravitational energy wave along filament (Uv.x)
      float wave = sin(vUv.x * 35.0 - uTime * 4.0) * 0.5 + 0.5;
      float edgeGlow = sin(vUv.y * 3.14159);
      
      vec3 color = mix(uColorGlow, uColorStream, wave);
      float alpha = edgeGlow * (0.35 + wave * 0.45) * uIntensity;

      gl_FragColor = vec4(color, alpha);
    }
  `,
};

function createDarkMatterHaloMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(DarkMatterHaloShader.uniforms),
    vertexShader: DarkMatterHaloShader.vertexShader,
    fragmentShader: DarkMatterHaloShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function createCosmicFilamentMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(CosmicFilamentShader.uniforms),
    vertexShader: CosmicFilamentShader.vertexShader,
    fragmentShader: CosmicFilamentShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function createSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#ff4500');
  grad.addColorStop(0.2, '#ffaa00');
  grad.addColorStop(0.5, '#ffd700');
  grad.addColorStop(0.8, '#ff8c00');
  grad.addColorStop(1, '#ff3300');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = 1.2 + Math.random() * 3.8;
    ctx.fillStyle = Math.random() > 0.45 ? 'rgba(255, 245, 200, 0.4)' : 'rgba(180, 40, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const sunspots = [
    { x: 320, y: 220, r: 18 },
    { x: 350, y: 235, r: 12 },
    { x: 680, y: 280, r: 22 },
    { x: 710, y: 265, r: 14 },
    { x: 490, y: 190, r: 10 },
  ];

  sunspots.forEach((spot) => {
    const facGrad = ctx.createRadialGradient(spot.x, spot.y, spot.r * 0.4, spot.x, spot.y, spot.r * 2.8);
    facGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    facGrad.addColorStop(0.4, 'rgba(255, 200, 80, 0.55)');
    facGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = facGrad;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, spot.r * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#883300';
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, spot.r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#110200';
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, spot.r * 0.75, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c4f86';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#2f7a45';
  const continents = [
    [96, 92, 60, 32],
    [200, 116, 44, 28],
    [300, 84, 36, 24],
    [376, 140, 52, 24],
    [140, 180, 32, 16],
  ];
  for (const [x, y, rx, ry] of continents) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#e7eef6';
  ctx.fillRect(0, 0, 512, 16);
  ctx.fillRect(0, 240, 512, 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBandedTexture(colors: string[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const bandH = 256 / colors.length;
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * bandH, 512, bandH + 1);
  });

  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, 12 + Math.random() * 24, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(7, 9, 14, 0.85)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 48, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.8, 0.95, 1);
  return sprite;
}

function createStarSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.18, 'rgba(235, 245, 255, 0.95)');
  grad.addColorStop(0.45, 'rgba(180, 215, 255, 0.4)');
  grad.addColorStop(0.8, 'rgba(120, 160, 255, 0.1)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createMultiLayeredStarfield(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'multi_layered_starfield';

  const starTexture = createStarSpriteTexture();

  const spectralColors = [
    new THREE.Color('#60a5fa'),
    new THREE.Color('#93c5fd'),
    new THREE.Color('#f8fafc'),
    new THREE.Color('#fef08a'),
    new THREE.Color('#f97316'),
    new THREE.Color('#ef4444'),
  ];

  // 1. LAYER 1: Near Solar Neighborhood Stars
  const layer1Count = 5000;
  const pos1 = new Float32Array(layer1Count * 3);
  const col1 = new Float32Array(layer1Count * 3);

  for (let i = 0; i < layer1Count; i++) {
    const r = 15 + Math.pow(Math.random(), 1.2) * 480;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    pos1[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos1[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos1[i * 3 + 2] = r * Math.cos(phi);

    const c = spectralColors[Math.floor(Math.random() * spectralColors.length)];
    col1[i * 3] = c.r;
    col1[i * 3 + 1] = c.g;
    col1[i * 3 + 2] = c.b;
  }

  const geo1 = new THREE.BufferGeometry();
  geo1.setAttribute('position', new THREE.BufferAttribute(pos1, 3));
  geo1.setAttribute('color', new THREE.BufferAttribute(col1, 3));

  const mat1 = new THREE.PointsMaterial({
    map: starTexture,
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  group.add(new THREE.Points(geo1, mat1));

  // 2. LAYER 2: Milky Way Galactic Disk Stars
  const layer2Count = 18000;
  const pos2 = new Float32Array(layer2Count * 3);
  const col2 = new Float32Array(layer2Count * 3);

  for (let i = 0; i < layer2Count; i++) {
    const r = 500 + Math.pow(Math.random(), 0.8) * 1400;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.PI / 2) + (Math.random() - 0.5) * (i % 3 === 0 ? 1.4 : 0.45);

    pos2[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos2[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos2[i * 3 + 2] = r * Math.cos(phi);

    const c = spectralColors[Math.floor(Math.random() * spectralColors.length)];
    col2[i * 3] = c.r * 0.9;
    col2[i * 3 + 1] = c.g * 0.9;
    col2[i * 3 + 2] = c.b * 0.9;
  }

  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  geo2.setAttribute('color', new THREE.BufferAttribute(col2, 3));

  const mat2 = new THREE.PointsMaterial({
    map: starTexture,
    size: 1.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  group.add(new THREE.Points(geo2, mat2));

  // 3. LAYER 3: Deep Intergalactic Cosmic Shell
  const layer3Count = 24000;
  const pos3 = new Float32Array(layer3Count * 3);
  const col3 = new Float32Array(layer3Count * 3);

  for (let i = 0; i < layer3Count; i++) {
    const r = 2500 + Math.random() * 5500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    pos3[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos3[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos3[i * 3 + 2] = r * Math.cos(phi);

    const c = spectralColors[Math.floor(Math.random() * spectralColors.length)];
    col3[i * 3] = c.r * 0.75;
    col3[i * 3 + 1] = c.g * 0.75;
    col3[i * 3 + 2] = c.b * 0.75;
  }

  const geo3 = new THREE.BufferGeometry();
  geo3.setAttribute('position', new THREE.BufferAttribute(pos3, 3));
  geo3.setAttribute('color', new THREE.BufferAttribute(col3, 3));

  const mat3 = new THREE.PointsMaterial({
    map: starTexture,
    size: 1.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  group.add(new THREE.Points(geo3, mat3));

  return group;
}

/**
 * Creates the 3D Milky Way Spiral Galaxy model
 */
function create3DMilkyWayGalaxy(): { group: THREE.Group; haloMaterial: THREE.ShaderMaterial } {
  const group = new THREE.Group();
  group.name = 'milkyway_3d_structure';

  // Sagittarius A* Black Hole
  const sgrBhGeo = new THREE.SphereGeometry(6, 32, 32);
  const sgrBhMat = new THREE.MeshBasicMaterial({ color: '#000000' });
  const sgrBh = new THREE.Mesh(sgrBhGeo, sgrBhMat);
  group.add(sgrBh);

  const ringGeo = new THREE.RingGeometry(8, 24, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2.2;
  group.add(ringMesh);

  const haloGeo = new THREE.SphereGeometry(38, 32, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Mesh(haloGeo, haloMat));

  // Volumetric Dark Matter Halo Mesh (NFW WebGL Shader)
  const dmHaloGeo = new THREE.SphereGeometry(260, 36, 36);
  const dmHaloMat = createDarkMatterHaloMaterial();
  const dmHaloMesh = new THREE.Mesh(dmHaloGeo, dmHaloMat);
  group.add(dmHaloMesh);

  // Core & Stars
  const coreGeo = new THREE.SphereGeometry(18, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: '#fff5d6',
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Mesh(coreGeo, coreMat));

  const particleCount = 15000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const numArms = 4;
  const armColors = [
    new THREE.Color('#38bdf8'),
    new THREE.Color('#f43f5e'),
    new THREE.Color('#fbbf24'),
    new THREE.Color('#a855f7'),
  ];
  const coreColor = new THREE.Color('#fff7ed');

  for (let i = 0; i < particleCount; i++) {
    const armIndex = i % numArms;
    const rNorm = Math.pow(Math.random(), 1.4);
    const radius = 12 + rNorm * 220;

    const spiralAngle = (rNorm * 9.5) + (armIndex * (Math.PI * 2 / numArms));
    const angleSpread = (Math.random() - 0.5) * (0.35 + rNorm * 0.4);
    const angle = spiralAngle + angleSpread;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * (18 * Math.exp(-rNorm * 1.8));

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const mixedColor = coreColor.clone().lerp(armColors[armIndex], rNorm);
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  group.add(new THREE.Points(starGeo, starMat));

  // 1. Solar Galactic Orbit Ring (230 Myr Sun Orbit Circle around Sagittarius A*)
  const solarOrbitGeo = new THREE.RingGeometry(108.2, 109.4, 128);
  const solarOrbitMat = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  const solarOrbitMesh = new THREE.Mesh(solarOrbitGeo, solarOrbitMat);
  solarOrbitMesh.name = 'solar_galactic_orbit_ring';
  solarOrbitMesh.rotation.x = Math.PI / 2;
  group.add(solarOrbitMesh);

  // 2. Orion Spur Beacon Group (Disk coordinates, dynamically tracked)
  const spurBeaconGroup = new THREE.Group();
  spurBeaconGroup.name = 'orion_spur_beacon_group';

  const spurBeaconGeo = new THREE.RingGeometry(1.6, 4.4, 32);
  const spurBeaconMat = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const spurBeacon = new THREE.Mesh(spurBeaconGeo, spurBeaconMat);
  spurBeacon.rotation.x = Math.PI / 2;
  spurBeaconGroup.add(spurBeacon);

  const innerBeaconGeo = new THREE.RingGeometry(0.3, 1.3, 24);
  const innerBeaconMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });
  const innerBeacon = new THREE.Mesh(innerBeaconGeo, innerBeaconMat);
  innerBeacon.rotation.x = Math.PI / 2;
  spurBeaconGroup.add(innerBeacon);

  spurBeaconGroup.position.set(initialGalactic.diskPosition.x, initialGalactic.diskPosition.y, initialGalactic.diskPosition.z);
  group.add(spurBeaconGroup);

  group.rotation.x = Math.PI / 6;
  group.rotation.z = Math.PI / 12;

  return { group, haloMaterial: dmHaloMat };
}

function create3DGalaxyModel(id: string, colorHex: string, size: number, phase: number): { group: THREE.Group; haloMaterial: THREE.ShaderMaterial } {
  const group = new THREE.Group();
  group.rotation.set(0.8 + phase * 0.2, phase * 1.5, 0.3);

  // Volumetric Dark Matter Halo Sphere Mesh around Galaxy
  const dmHaloGeo = new THREE.SphereGeometry(size * 4.2, 28, 28);
  const dmHaloMat = createDarkMatterHaloMaterial();
  const dmHaloMesh = new THREE.Mesh(dmHaloGeo, dmHaloMat);
  group.add(dmHaloMesh);

  if (id === 'm87') {
    const bhGeo = new THREE.SphereGeometry(size * 0.6, 24, 24);
    const bhMat = new THREE.MeshBasicMaterial({ color: '#030508' });
    group.add(new THREE.Mesh(bhGeo, bhMat));

    const ringGeo = new THREE.RingGeometry(size * 0.8, size * 2.8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#f59e0b',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.2;
    group.add(ringMesh);

    const jetGeo = new THREE.ConeGeometry(size * 1.2, size * 8, 16);
    const jetMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const jetMesh = new THREE.Mesh(jetGeo, jetMat);
    jetMesh.position.set(0, size * 4, 0);
    group.add(jetMesh);
    return { group, haloMaterial: dmHaloMat };
  }

  if (id === 'ton618') {
    const bhGeo = new THREE.SphereGeometry(size * 0.8, 28, 28);
    const bhMat = new THREE.MeshBasicMaterial({ color: '#000000' });
    group.add(new THREE.Mesh(bhGeo, bhMat));

    const ringGeo = new THREE.RingGeometry(size * 1.1, size * 4.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.1;
    group.add(ringMesh);

    const jet1Geo = new THREE.ConeGeometry(size * 1.8, size * 12, 16);
    const jet1Mat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const jet1 = new THREE.Mesh(jet1Geo, jet1Mat);
    jet1.position.set(0, size * 6, 0);
    group.add(jet1);

    const jet2 = jet1.clone();
    jet2.rotation.x = Math.PI;
    jet2.position.set(0, -size * 6, 0);
    group.add(jet2);

    return { group, haloMaterial: dmHaloMat };
  }

  const particleCount = id === 'andromeda' ? 2400 : 1200;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const arm = i % 2;
    const rNorm = 0.08 + 0.92 * Math.sqrt(Math.random());
    const angle = (rNorm * 8.5) + arm * Math.PI + (Math.random() - 0.5) * 0.35;
    const dist = rNorm * size * 2.8;

    positions[i * 3] = Math.cos(angle) * dist;
    positions[i * 3 + 1] = (Math.random() - 0.5) * (size * 0.3);
    positions[i * 3 + 2] = Math.sin(angle) * dist;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: colorHex,
    size: 0.6,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });
  group.add(new THREE.Points(geo, mat));

  const coreMat = new THREE.MeshBasicMaterial({
    color: '#fff8e7',
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(size * 0.5, 16, 16), coreMat));

  return { group, haloMaterial: dmHaloMat };
}

function createBlackHoleModel(size: number, isSupermassive: boolean): THREE.Group {
  const group = new THREE.Group();
  const bhGeo = new THREE.SphereGeometry(size * (isSupermassive ? 0.45 : 0.35), 24, 24);
  const bhMat = new THREE.MeshBasicMaterial({ color: '#030508' });
  group.add(new THREE.Mesh(bhGeo, bhMat));

  const ringGeo = new THREE.RingGeometry(size * 0.65, size * (isSupermassive ? 2.2 : 1.55), 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: isSupermassive ? '#e3a23b' : '#9aa4b5',
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2.3;
  group.add(ringMesh);
  return group;
}

export const CosmicCanvas: React.FC<CosmicCanvasProps> = ({
  currentTimeMs,
  showOrbits,
  activeCategories,
  selectedId,
  followingId,
  onPickObject,
  onSampleFrameMs,
  targetFlyId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const [currentZoomDist, setCurrentZoomDist] = useState<number>(150);
  const currentZoomDistRef = useRef<number>(150);

  const bodyGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const bodyMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const orbitLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const labelSpritesRef = useRef<Map<string, THREE.Sprite>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Dynamic Real-Time Solar Galactic Kinematics
  const sunLightRef = useRef<THREE.PointLight | null>(null);
  const heliosphereRef = useRef<THREE.Mesh | null>(null);
  const solarApexArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const spurBeaconRef = useRef<THREE.Object3D | null>(null);
  const constellationLinesRef = useRef<THREE.LineSegments | null>(null);
  const solarGalacticPosRef = useRef<THREE.Vector3>(new THREE.Vector3(SOLAR_GALACTIC_OFFSET.x, SOLAR_GALACTIC_OFFSET.y, SOLAR_GALACTIC_OFFSET.z));

  const galacticState = computeSolarGalacticState(currentTimeMs);
  const [showGalacticTelemetry, setShowGalacticTelemetry] = useState<boolean>(true);

  // Dark Matter Halos & WebGL Filament Materials references
  const darkMatterMaterialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const darkMatterIntensityRef = useRef<number>(0);

  const isTransitioningRef = useRef<boolean>(false);
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());

  const texturesRef = useRef<{
    sun?: THREE.CanvasTexture;
    earth?: THREE.CanvasTexture;
    jupiter?: THREE.CanvasTexture;
    mars?: THREE.CanvasTexture;
  }>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05070c');
    sceneRef.current = scene;

    const currentSolar = solarGalacticPosRef.current;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.05, 18000);
    camera.position.set(currentSolar.x + 22, currentSolar.y + 70, currentSolar.z + 150);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5;
    controls.maxDistance = 4500;
    controls.target.copy(currentSolar);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfff6e4, 110, 320, 1.8);
    sunLight.position.copy(currentSolar);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Heliosphere Boundary Mesh (~120 AU Termination Shock / Heliopause)
    const helioGeo = new THREE.SphereGeometry(32, 28, 28);
    const helioMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const helioMesh = new THREE.Mesh(helioGeo, helioMat);
    helioMesh.name = 'heliosphere_boundary';
    helioMesh.position.copy(currentSolar);
    scene.add(helioMesh);
    heliosphereRef.current = helioMesh;

    // Solar Apex Velocity Vector Arrow (heading toward Hercules / Vega)
    const apexArrow = new THREE.ArrowHelper(
      new THREE.Vector3(galacticState.velocityDirection.x, galacticState.velocityDirection.y, galacticState.velocityDirection.z),
      currentSolar,
      34,
      0xf59e0b,
      6,
      3.2
    );
    apexArrow.name = 'solar_apex_arrow';
    scene.add(apexArrow);
    solarApexArrowRef.current = apexArrow;

    // Multi-Layered Starfield
    const multiLayerStarfield = createMultiLayeredStarfield();
    scene.add(multiLayerStarfield);

    // 3D Milky Way Structure with Dark Matter Halo
    const { group: milkyWay3D, haloMaterial: mwHaloMat } = create3DMilkyWayGalaxy();
    milkyWay3D.position.set(0, 0, 0);
    scene.add(milkyWay3D);
    darkMatterMaterialsRef.current.push(mwHaloMat);

    const spurBeacon = milkyWay3D.getObjectByName('orion_spur_beacon_group');
    if (spurBeacon) {
      spurBeaconRef.current = spurBeacon;
    }

    // Build Intergalactic Cosmic Web Filaments (Gravitational Scaffolding Tubes)
    const filamentConnections: [string, string][] = [
      ['milkyway', 'andromeda'],
      ['milkyway', 'triangulum'],
      ['milkyway', 'lmc'],
      ['andromeda', 'triangulum'],
      ['andromeda', 'whirlpool'],
      ['whirlpool', 'm87'],
      ['m87', 'sombrero'],
      ['sombrero', 'ton618'],
    ];

    filamentConnections.forEach(([id1, id2]) => {
      const spec1 = CELESTIAL_MAP.get(id1);
      const spec2 = CELESTIAL_MAP.get(id2);
      if (!spec1 || !spec2) return;

      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();
      const temp1 = { x: 0, y: 0, z: 0 };
      const temp2 = { x: 0, y: 0, z: 0 };

      if (computeCelestialPosition(id1, Date.now(), temp1) && computeCelestialPosition(id2, Date.now(), temp2)) {
        p1.set(temp1.x, temp1.y, temp1.z);
        p2.set(temp2.x, temp2.y, temp2.z);

        // Gravitational curve deflection mid-point
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        mid.y += (Math.random() - 0.5) * 80;
        mid.x += (Math.random() - 0.5) * 60;

        const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
        const tubeGeo = new THREE.TubeGeometry(curve, 36, 2.2, 8, false);
        const tubeMat = createCosmicFilamentMaterial();
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tubeMesh);

        darkMatterMaterialsRef.current.push(tubeMat);
      }
    });

    // Build Constellation Asterism Stick-Figure Lines (Orion & Orion's Belt, Big Dipper, Cassiopeia, etc.)
    const constelLinePositions: number[] = [];
    CONSTELLATION_LINES.forEach(([id1, id2]) => {
      const temp1 = { x: 0, y: 0, z: 0 };
      const temp2 = { x: 0, y: 0, z: 0 };
      if (computeCelestialPosition(id1, 0, temp1) && computeCelestialPosition(id2, 0, temp2)) {
        constelLinePositions.push(temp1.x, temp1.y, temp1.z);
        constelLinePositions.push(temp2.x, temp2.y, temp2.z);
      }
    });

    if (constelLinePositions.length > 0) {
      const constelGeo = new THREE.BufferGeometry();
      constelGeo.setAttribute('position', new THREE.Float32BufferAttribute(constelLinePositions, 3));
      const constelMat = new THREE.LineBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      const constelLines = new THREE.LineSegments(constelGeo, constelMat);
      constelLines.name = 'constellation_lines';
      constelLines.position.copy(currentSolar);
      constelLines.visible = activeCategories.constellation ?? true;
      scene.add(constelLines);
      constellationLinesRef.current = constelLines;
    }

    texturesRef.current.sun = createSunTexture();
    texturesRef.current.earth = createEarthTexture();
    texturesRef.current.jupiter = createBandedTexture([
      '#f0e2c0',
      '#c47a3a',
      '#f6edd8',
      '#a35a28',
      '#e7d3a8',
      '#8a4e24',
    ]);
    texturesRef.current.mars = createBandedTexture([
      '#c4623e',
      '#e08a62',
      '#9a4630',
      '#d4724b',
    ]);

    // Build Mesh representations
    CELESTIAL_OBJECTS.forEach((spec) => {
      const group = new THREE.Group();
      group.name = spec.id;

      let primaryMesh: THREE.Object3D | null = null;

      if (spec.id === 'sun') {
        const sunGeo = new THREE.SphereGeometry(spec.size, 36, 36);
        const sunMat = new THREE.MeshBasicMaterial({
          map: texturesRef.current.sun,
        });
        primaryMesh = new THREE.Mesh(sunGeo, sunMat);
        group.add(primaryMesh);

        const chromoGeo = new THREE.SphereGeometry(spec.size * 1.08, 24, 24);
        const chromoMat = new THREE.MeshBasicMaterial({
          color: '#ff8c00',
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(chromoGeo, chromoMat));

        const coronaGeo = new THREE.SphereGeometry(spec.size * 1.85, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
          color: '#e3a23b',
          transparent: true,
          opacity: 0.25,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(coronaGeo, coronaMat));

        const flareBeamGeo = new THREE.ConeGeometry(spec.size * 0.45, spec.size * 2.8, 16);
        const flareBeamMat = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        });
        const flareBeam = new THREE.Mesh(flareBeamGeo, flareBeamMat);
        flareBeam.name = 'sun_flare_beam';
        flareBeam.position.set(spec.size * 0.7, spec.size * 0.5, spec.size * 0.8);
        flareBeam.rotation.set(0.6, 0.8, -0.4);
        group.add(flareBeam);
      } else if (spec.id === 'sgr') {
        primaryMesh = createBlackHoleModel(spec.size * 1.8, true);
        group.add(primaryMesh);
      } else if (spec.id === 'earth') {
        const earthGeo = new THREE.SphereGeometry(spec.size, 32, 32);
        const earthMat = new THREE.MeshStandardMaterial({
          map: texturesRef.current.earth,
          roughness: 0.7,
        });
        primaryMesh = new THREE.Mesh(earthGeo, earthMat);
        group.add(primaryMesh);
      } else if (spec.id === 'jupiter') {
        const jupGeo = new THREE.SphereGeometry(spec.size, 32, 32);
        const jupMat = new THREE.MeshStandardMaterial({
          map: texturesRef.current.jupiter,
          roughness: 0.55,
        });
        primaryMesh = new THREE.Mesh(jupGeo, jupMat);
        group.add(primaryMesh);
      } else if (spec.id === 'mars') {
        const marsGeo = new THREE.SphereGeometry(spec.size, 28, 28);
        const marsMat = new THREE.MeshStandardMaterial({
          map: texturesRef.current.mars,
          roughness: 0.8,
        });
        primaryMesh = new THREE.Mesh(marsGeo, marsMat);
        group.add(primaryMesh);
      } else if (spec.id === 'jwst') {
        const { group: jwstModel } = createJWST3DModel();
        primaryMesh = jwstModel;
        group.add(primaryMesh);
      } else if (spec.category === 'galaxy') {
        const { group: galGroup, haloMaterial: galHaloMat } = create3DGalaxyModel(spec.id, spec.color, spec.size, spec.phase);
        primaryMesh = galGroup;
        group.add(primaryMesh);
        darkMatterMaterialsRef.current.push(galHaloMat);
      } else if (spec.category === 'sn') {
        const remGeo = new THREE.SphereGeometry(spec.size * 0.22, 16, 16);
        const remMat = new THREE.MeshBasicMaterial({ color: '#fff6e4' });
        primaryMesh = new THREE.Mesh(remGeo, remMat);
        group.add(primaryMesh);

        const blastGeo = new THREE.SphereGeometry(spec.size * 0.72, 18, 18);
        const blastMat = new THREE.MeshBasicMaterial({
          color: spec.color,
          wireframe: true,
          transparent: true,
          opacity: 0.28,
        });
        group.add(new THREE.Mesh(blastGeo, blastMat));
      } else if (spec.category === 'bh' || spec.category === 'smbh') {
        primaryMesh = createBlackHoleModel(spec.size, spec.category === 'smbh');
        group.add(primaryMesh);
      } else if (spec.category === 'exoplanet') {
        const exoGeo = new THREE.SphereGeometry(spec.size, 28, 28);
        const exoMat = new THREE.MeshStandardMaterial({
          color: spec.color,
          roughness: 0.5,
          metalness: 0.1,
        });
        primaryMesh = new THREE.Mesh(exoGeo, exoMat);
        group.add(primaryMesh);

        const atmosGeo = new THREE.SphereGeometry(spec.size * 1.2, 24, 24);
        const atmosMat = new THREE.MeshBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.32,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(atmosGeo, atmosMat));

        const ringGeo = new THREE.RingGeometry(spec.size * 1.4, spec.size * 1.55, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: spec.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.25,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);
      } else if (spec.category === 'constellation') {
        const starGeo = new THREE.SphereGeometry(spec.size * 0.85, 20, 20);
        const starMat = new THREE.MeshBasicMaterial({ color: spec.color });
        primaryMesh = new THREE.Mesh(starGeo, starMat);
        group.add(primaryMesh);

        // Luminous stellar corona
        const coronaGeo = new THREE.SphereGeometry(spec.size * 1.9, 16, 16);
        const coronaMat = new THREE.MeshBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.32,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(coronaGeo, coronaMat));

        // Outer diffraction halo
        const haloGeo = new THREE.SphereGeometry(spec.size * 3.4, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: 0.14,
          blending: THREE.AdditiveBlending,
        });
        group.add(new THREE.Mesh(haloGeo, haloMat));
      } else {
        const sphGeo = new THREE.SphereGeometry(spec.size, 24, 24);
        const sphMat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.62, metalness: 0.05 });
        primaryMesh = new THREE.Mesh(sphGeo, sphMat);
        group.add(primaryMesh);
      }

      if (primaryMesh) {
        bodyMeshesRef.current.set(spec.id, primaryMesh);
      }

      const sprite = createLabelSprite(spec.name);
      sprite.position.set(0, spec.size + 0.45, 0);
      group.add(sprite);
      labelSpritesRef.current.set(spec.id, sprite);

      scene.add(group);
      bodyGroupsRef.current.set(spec.id, group);

      if (spec.orbit) {
        const pathPoints = generateOrbitPath(spec.id, currentTimeMs);
        if (pathPoints) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints(
            pathPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z))
          );
          const lineMat = new THREE.LineBasicMaterial({
            color: '#2a3548',
            transparent: true,
            opacity: 0.45,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          line.position.copy(currentSolar);
          scene.add(line);
          orbitLinesRef.current.set(spec.id, line);
        }
      }
    });

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const interactiveMeshes: THREE.Object3D[] = [];

      bodyGroupsRef.current.forEach((group) => {
        if (group.visible) {
          group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh || (child as THREE.Sprite).isSprite) {
              interactiveMeshes.push(child);
            }
          });
        }
      });

      const intersects = raycasterRef.current.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        let hitObject: THREE.Object3D | null = intersects[0].object;
        while (hitObject && hitObject !== scene) {
          if (hitObject.name && bodyGroupsRef.current.has(hitObject.name)) {
            onPickObject(hitObject.name);
            return;
          }
          hitObject = hitObject.parent;
        }
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let animId = 0;
    let lastTime = performance.now();
    let frameCount = 0;
    let accumulatedMs = 0;

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      const frameDeltaMs = time - lastTime;
      lastTime = time;

      frameCount++;
      accumulatedMs += frameDeltaMs;
      if (frameCount >= 30) {
        onSampleFrameMs(accumulatedMs / frameCount);
        frameCount = 0;
        accumulatedMs = 0;
      }

      bodyMeshesRef.current.forEach((mesh, id) => {
        if (id === 'jupiter' || id === 'saturn') mesh.rotation.y += delta * 0.8;
        else if (id === 'sun') mesh.rotation.y += delta * 0.15;
        else if (id === 'mars') mesh.rotation.y += delta * 0.38;
      });

      const mw = scene.getObjectByName('milkyway_3d_structure');
      if (mw) {
        mw.rotation.y += delta * 0.03;
      }

      // Smooth lerp transition for WebGL Dark Matter Halos & Filaments
      const targetIntensity = activeCategories.darkmatter ? 1.0 : 0.0;
      darkMatterIntensityRef.current += (targetIntensity - darkMatterIntensityRef.current) * 0.08;

      darkMatterMaterialsRef.current.forEach((mat) => {
        if (mat.uniforms.uTime) mat.uniforms.uTime.value = time * 0.001;
        if (mat.uniforms.uIntensity) mat.uniforms.uIntensity.value = darkMatterIntensityRef.current;
      });

      controls.update();

      if (cameraRef.current && controlsRef.current) {
        const dist = cameraRef.current.position.distanceTo(controlsRef.current.target);
        if (Math.abs(dist - currentZoomDistRef.current) > 2.0) {
          currentZoomDistRef.current = dist;
          setCurrentZoomDist(dist);
        }
      }

      if (isTransitioningRef.current && cameraRef.current) {
        controls.target.lerp(targetLookAtRef.current, 0.08);
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.06);

        if (
          cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.6 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.3
        ) {
          isTransitioningRef.current = false;
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const tempPos: Vector3D = { x: 0, y: 0, z: 0 };
    const gState = computeSolarGalacticState(currentTimeMs);
    const solarWorld = gState.worldPosition;
    solarGalacticPosRef.current.set(solarWorld.x, solarWorld.y, solarWorld.z);

    if (sunLightRef.current) {
      sunLightRef.current.position.set(solarWorld.x, solarWorld.y, solarWorld.z);
    }
    if (heliosphereRef.current) {
      heliosphereRef.current.position.set(solarWorld.x, solarWorld.y, solarWorld.z);
    }
    if (solarApexArrowRef.current) {
      solarApexArrowRef.current.position.set(solarWorld.x, solarWorld.y, solarWorld.z);
      solarApexArrowRef.current.setDirection(
        new THREE.Vector3(gState.velocityDirection.x, gState.velocityDirection.y, gState.velocityDirection.z)
      );
    }
    if (spurBeaconRef.current) {
      spurBeaconRef.current.position.set(gState.diskPosition.x, gState.diskPosition.y, gState.diskPosition.z);
    }
    if (constellationLinesRef.current) {
      constellationLinesRef.current.position.set(solarWorld.x, solarWorld.y, solarWorld.z);
      constellationLinesRef.current.visible = activeCategories.constellation ?? true;
    }

    CELESTIAL_OBJECTS.forEach((spec) => {
      const group = bodyGroupsRef.current.get(spec.id);
      if (!group) return;

      const isCategoryActive = activeCategories[spec.category] ?? true;
      group.visible = isCategoryActive;

      const isDeepSkyOrGalaxy = spec.category === 'galaxy' || spec.category === 'bh' || spec.category === 'smbh' || spec.id === 'sgr' || spec.id === 'milkyway';

      if (computeCelestialPosition(spec.id, currentTimeMs, tempPos)) {
        if (isDeepSkyOrGalaxy) {
          if (spec.id === 'sgr' || spec.id === 'milkyway') {
            group.position.set(0, 0, 0);
          } else {
            group.position.set(tempPos.x, tempPos.y, tempPos.z);
          }
        } else {
          group.position.set(tempPos.x + solarWorld.x, tempPos.y + solarWorld.y, tempPos.z + solarWorld.z);
        }

        if (spec.id === 'earth') {
          const daySeconds = (currentTimeMs / 1000) % 86400;
          const earthRotationRad = (daySeconds / 86400) * (2 * Math.PI);
          const mesh = bodyMeshesRef.current.get('earth');
          if (mesh) {
            mesh.rotation.y = earthRotationRad;
          }
        }

        if (spec.id === 'jwst') {
          const mesh = bodyMeshesRef.current.get('jwst');
          if (mesh) {
            const toSun = new THREE.Vector3(-tempPos.x, -tempPos.y, -tempPos.z).normalize();
            mesh.lookAt(mesh.position.clone().add(toSun));
          }
        }
      }

      if (spec.orbit) {
        const line = orbitLinesRef.current.get(spec.id);
        if (line) {
          line.position.set(solarWorld.x, solarWorld.y, solarWorld.z);
        }
      }
    });
  }, [currentTimeMs, activeCategories]);

  useEffect(() => {
    if (!targetFlyId) return;
    jumpPreset(targetFlyId);
  }, [targetFlyId]);

  const jumpPreset = (targetId: string) => {
    const group = bodyGroupsRef.current.get(targetId);
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (group && camera && controls) {
      targetLookAtRef.current.copy(group.position);
      const spec = CELESTIAL_MAP.get(targetId);
      const offsetDist = spec ? Math.max(8.0, spec.size * 5.5) : 35;
      targetCamPosRef.current.set(
        group.position.x + offsetDist * 1.35,
        group.position.y + offsetDist * 0.85,
        group.position.z + offsetDist * 1.7
      );
      isTransitioningRef.current = true;
      onPickObject(targetId);
    }
  };

  const jumpScale = (scale: 'system' | 'jwst' | 'youarehere' | 'orion' | 'milkyway' | 'localgroup' | 'deepspace') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const currentSolar = solarGalacticPosRef.current;

    if (scale === 'system') {
      targetLookAtRef.current.copy(currentSolar);
      targetCamPosRef.current.set(currentSolar.x + 22, currentSolar.y + 70, currentSolar.z + 150);
    } else if (scale === 'jwst') {
      const jwstGroup = bodyGroupsRef.current.get('jwst');
      if (jwstGroup) {
        targetLookAtRef.current.copy(jwstGroup.position);
        targetCamPosRef.current.set(
          jwstGroup.position.x + 2.8,
          jwstGroup.position.y + 1.4,
          jwstGroup.position.z + 3.8
        );
      }
      onPickObject('jwst');
    } else if (scale === 'youarehere') {
      targetLookAtRef.current.set(currentSolar.x * 0.7, currentSolar.y * 0.7, currentSolar.z * 0.7);
      targetCamPosRef.current.set(currentSolar.x + 130, currentSolar.y + 260, currentSolar.z + 320);
    } else if (scale === 'orion') {
      const alnilamGroup = bodyGroupsRef.current.get('alnilam');
      if (alnilamGroup) {
        targetLookAtRef.current.copy(alnilamGroup.position);
        targetCamPosRef.current.set(
          alnilamGroup.position.x - 24,
          alnilamGroup.position.y + 12,
          alnilamGroup.position.z + 85
        );
      } else {
        targetLookAtRef.current.set(currentSolar.x + 18, currentSolar.y - 4, currentSolar.z - 170);
        targetCamPosRef.current.set(currentSolar.x, currentSolar.y + 20, currentSolar.z - 60);
      }
      onPickObject('alnilam');
    } else if (scale === 'milkyway') {
      targetLookAtRef.current.set(0, 0, 0);
      targetCamPosRef.current.set(180, 520, 680);
    } else if (scale === 'localgroup') {
      targetLookAtRef.current.set(0, 0, 0);
      targetCamPosRef.current.set(550, 1100, 1550);
    } else if (scale === 'deepspace') {
      targetLookAtRef.current.set(0, 0, 0);
      targetCamPosRef.current.set(1100, 2200, 2900);
    }
    isTransitioningRef.current = true;
  };

  const getScaleBadge = (dist: number) => {
    if (dist < 220) return { label: '☀️ ORION SPUR — SOLAR SYSTEM SCALE (~100 AU)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    if (dist < 850) return { label: '🌌 SAGITTARIUS A* — MILKY WAY GALAXY SCALE (~100k ly)', color: 'text-flare border-flare/30 bg-flare/10' };
    if (dist < 2100) return { label: '🪐 LOCAL GROUP GALAXIES (~10M ly)', color: 'text-signal border-signal/30 bg-signal/10' };
    return { label: '💫 OBSERVABLE UNIVERSE & DEEP QUASARS', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' };
  };

  const scaleBadge = getScaleBadge(currentZoomDist);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto">
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* SCALE & PRESET CONTROL BAR */}
      <div className="pointer-events-auto absolute top-16 left-3 sm:left-4 z-20 flex flex-wrap items-center gap-1.5 bg-surface/90 backdrop-blur-md p-2 border border-line rounded-lg shadow-2xl max-w-[95vw]">
        <span className={`font-mono text-[10px] font-extrabold px-2 py-1 rounded border uppercase tracking-wider block ${scaleBadge.color}`}>
          {scaleBadge.label}
        </span>

        {activeCategories.darkmatter && (
          <span className="font-mono text-[10px] font-extrabold px-2 py-1 rounded border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 uppercase tracking-wider block animate-pulse">
            🌌 DARK MATTER SCAFFOLDING ACTIVE
          </span>
        )}

        <div className="flex items-center gap-1 pl-1 border-l border-line/60">
          <button
            type="button"
            onClick={() => jumpScale('system')}
            className="min-h-7 px-2 text-[11px] font-mono border border-line/60 bg-bg hover:bg-raised text-fg rounded transition-colors"
            title="Zoom to Sun & Solar System in Orion Spur"
          >
            ☀️ Sun &amp; System
          </button>
          <button
            type="button"
            onClick={() => jumpScale('jwst')}
            className="min-h-7 px-2 text-[11px] font-mono border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold rounded transition-colors"
            title="Fly camera directly to JWST at Sun-Earth L2"
          >
            🔭 JWST @ L2
          </button>
          <button
            type="button"
            onClick={() => jumpScale('orion')}
            className="min-h-7 px-2 text-[11px] font-mono border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold rounded transition-colors"
            title="Fly camera to Orion Constellation and Orion's Belt"
          >
            🏹 Orion &amp; Belt
          </button>
          <button
            type="button"
            onClick={() => jumpScale('youarehere')}
            className="min-h-7 px-2 text-[11px] font-mono border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold rounded transition-colors"
            title="Galactic perspective showing our Solar System inside the Milky Way spiral arms"
          >
            📍 You Are Here
          </button>
          <button
            type="button"
            onClick={() => jumpPreset('sgr')}
            className="min-h-7 px-2 text-[11px] font-mono border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold rounded transition-colors"
            title="Fly to Sagittarius A* (Supermassive Black Hole at Galactic Center)"
          >
            🕳️ Sgr A* Core
          </button>
          <button
            type="button"
            onClick={() => jumpScale('milkyway')}
            className="min-h-7 px-2 text-[11px] font-mono border border-line/60 bg-bg hover:bg-raised text-flare font-bold rounded transition-colors"
            title="Zoom out to view 3D Milky Way Spiral Galaxy"
          >
            🌌 Milky Way
          </button>
          <button
            type="button"
            onClick={() => jumpScale('localgroup')}
            className="min-h-7 px-2 text-[11px] font-mono border border-line/60 bg-bg hover:bg-raised text-signal font-bold rounded transition-colors"
            title="Zoom out to Local Group (Andromeda, Triangulum, LMC)"
          >
            🪐 Local Group
          </button>
          <button
            type="button"
            onClick={() => jumpScale('deepspace')}
            className="min-h-7 px-2 text-[11px] font-mono border border-line/60 bg-bg hover:bg-raised text-purple-300 font-bold rounded transition-colors"
            title="Zoom out to Observable Universe & Quasars"
          >
            💫 Deep Space
          </button>
          <button
            type="button"
            onClick={() => setShowGalacticTelemetry(!showGalacticTelemetry)}
            className={`min-h-7 px-2 text-[11px] font-mono border rounded transition-colors ${
              showGalacticTelemetry
                ? 'border-amber-500/60 bg-amber-500/20 text-amber-300 font-bold'
                : 'border-line/60 bg-bg text-muted hover:text-fg'
            }`}
            title="Toggle Live Real-Time Galactic Orbit & Solar System Telemetry"
          >
            🧭 Galactic HUD
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-1 pl-1 border-l border-line/60">
          <button
            type="button"
            onClick={() => jumpPreset('andromeda')}
            className="min-h-7 px-2 text-[10px] font-mono border border-line/60 bg-bg hover:bg-raised text-fg rounded transition-colors"
          >
            Andromeda (M31)
          </button>
          <button
            type="button"
            onClick={() => jumpPreset('m87')}
            className="min-h-7 px-2 text-[10px] font-mono border border-line/60 bg-bg hover:bg-raised text-fg rounded transition-colors"
          >
            M87* Black Hole Jet
          </button>
          <button
            type="button"
            onClick={() => jumpPreset('ton618')}
            className="min-h-7 px-2 text-[10px] font-mono border border-line/60 bg-bg hover:bg-raised text-fg rounded transition-colors"
          >
            TON 618 Quasar
          </button>
        </div>
      </div>

      {/* REAL-TIME GALACTIC ORBIT KINEMATICS FLOATING HUD */}
      {showGalacticTelemetry && (
        <div className="pointer-events-auto absolute top-28 left-3 sm:left-4 z-20 w-80 max-w-[90vw] p-3 rounded-lg bg-surface/92 backdrop-blur-md border border-line shadow-2xl font-mono text-xs text-fg space-y-2">
          <div className="flex items-center justify-between border-b border-line/60 pb-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[11px]">
              🌌 Solar Galactic Orbit Kinematics
            </span>
            <button
              type="button"
              onClick={() => setShowGalacticTelemetry(false)}
              className="text-muted hover:text-fg text-sm leading-none"
              title="Close Galactic Telemetry HUD"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted">Galactic Center:</span>
              <span className="font-bold text-fg">Sagittarius A* (26,670 ly)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Galactic Velocity:</span>
              <span className="font-bold text-signal">230 km/s (828,000 km/h)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cosmic Year Period:</span>
              <span className="font-bold text-flare">~230 Million Years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Galactic Orbit Progress:</span>
              <span className="font-bold text-amber-300">
                {(galacticState.galacticYearProgress * 100).toFixed(4)}% (Rev #{galacticState.galacticRevolutionsTotal.toFixed(2)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Current Spiral Arm:</span>
              <span className="font-bold text-cyan-300">{galacticState.spiralArm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Disk Midplane Offset:</span>
              <span className="font-bold text-fg">+{galacticState.verticalHeightLy.toFixed(0)} ly (northward)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Solar Apex Heading:</span>
              <span className="font-bold text-amber-400 truncate max-w-[150px] text-right" title={galacticState.solarApexConstellation}>
                {galacticState.solarApexConstellation}
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-line/40 flex items-center justify-between text-[10px] text-muted">
            <span>Heliosphere: ~120 AU</span>
            <button
              type="button"
              onClick={() => jumpScale('youarehere')}
              className="text-cyan-400 hover:underline font-bold"
            >
              Fly to You Are Here ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
