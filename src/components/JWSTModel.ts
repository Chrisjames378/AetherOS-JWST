import * as THREE from 'three';

/**
 * Creates an authentic procedural 3D model of the NASA/ESA/CSA James Webb Space Telescope:
 * - 5-Layer Diamond-shaped Sunshield with Kapton/silicon metallic sheen
 * - 18 Hexagonal gold-coated beryllium primary mirror segments (6.5m aperture)
 * - Secondary mirror tripod support struts + convex secondary mirror
 * - Central Aft-Optics Subsystem (AOS) tower
 * - ISIM cryo-instrument compartment
 * - Hot-side Spacecraft bus with solar array & High-Gain Antenna (HGA) dish
 * - Dynamic targeting boresight pointer ray
 */
export function createJWST3DModel(): {
  group: THREE.Group;
  primaryMirrors: THREE.Group;
  boresightRay: THREE.Line;
  antennaDish: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'jwst_observatory_group';

  // Scale multiplier: size ~1.4 for clear visibility at L2
  const scale = 1.0;

  // -------------------------------------------------------------
  // 1. 5-LAYER SUNSHIELD (Diamond shape ~21m x 14m in real life)
  // -------------------------------------------------------------
  const sunshieldGroup = new THREE.Group();
  sunshieldGroup.name = 'jwst_sunshield';

  // Create diamond shape (kite/hexagon stretched)
  const shape = new THREE.Shape();
  shape.moveTo(0, 3.4 * scale);      // Top tip
  shape.lineTo(1.8 * scale, 0.4 * scale);   // Mid right
  shape.lineTo(1.4 * scale, -2.6 * scale);  // Bottom right
  shape.lineTo(0, -3.2 * scale);     // Bottom tip
  shape.lineTo(-1.4 * scale, -2.6 * scale); // Bottom left
  shape.lineTo(-1.8 * scale, 0.4 * scale);  // Mid left
  shape.closePath();

  const extrudeSettings = {
    depth: 0.04 * scale,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.02 * scale,
    bevelThickness: 0.02 * scale,
  };

  const sunshieldGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Layer 1 (Hot side, facing Sun) - Pink/purplish doped silicon Kapton
  const hotLayerMat = new THREE.MeshStandardMaterial({
    color: '#d9779f',
    metalness: 0.85,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });

  // Layer 5 (Cold side, facing telescope) - Silvery vapor-deposited aluminum
  const coldLayerMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    metalness: 0.95,
    roughness: 0.15,
    side: THREE.DoubleSide,
  });

  // 5 distinct separated layers with spacer gaps
  for (let i = 0; i < 5; i++) {
    const layerMesh = new THREE.Mesh(sunshieldGeo, i === 0 ? hotLayerMat : coldLayerMat);
    layerMesh.rotation.x = Math.PI / 2; // Flat horizontal sunshield
    layerMesh.position.y = (i * 0.06 - 0.15) * scale;
    // Slight curvature sag between layers
    layerMesh.scale.set(1 - i * 0.018, 1 - i * 0.018, 1);
    sunshieldGroup.add(layerMesh);
  }

  // Sunshield spreader booms (telescopic arms extending along the width)
  const boomGeo = new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 4.0 * scale, 12);
  const boomMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.3 });
  const boom = new THREE.Mesh(boomGeo, boomMat);
  boom.rotation.z = Math.PI / 2;
  boom.position.y = 0;
  sunshieldGroup.add(boom);

  group.add(sunshieldGroup);

  // -------------------------------------------------------------
  // 2. PRIMARY MIRROR (18 Gold-coated Hexagonal Segments)
  // -------------------------------------------------------------
  const primaryMirrors = new THREE.Group();
  primaryMirrors.name = 'jwst_primary_mirror';
  primaryMirrors.position.set(0, 0.45 * scale, 0);

  // Gold beryllium material with brilliant specular reflections
  const goldMirrorMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    metalness: 0.98,
    roughness: 0.08,
    emissive: '#d97706',
    emissiveIntensity: 0.15,
  });

  // Backing structure (carbon-composite backplane)
  const backplaneMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.7,
    roughness: 0.5,
  });

  // Function to create a 3D hexagon prism for each mirror segment
  const createHexSegment = (r: number): THREE.BufferGeometry => {
    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      if (i === 0) hexShape.moveTo(x, y);
      else hexShape.lineTo(x, y);
    }
    hexShape.closePath();
    return new THREE.ExtrudeGeometry(hexShape, {
      depth: 0.06 * scale,
      bevelEnabled: true,
      bevelThickness: 0.01 * scale,
      bevelSize: 0.01 * scale,
      bevelSegments: 1,
    });
  };

  const segmentRadius = 0.28 * scale;
  const hexGeo = createHexSegment(segmentRadius);
  const sqrt3 = Math.sqrt(3);

  // 18 Hexagonal Segments arranged in concentric rings (inner ring of 6, outer ring of 12, minus central hole)
  const hexCoords: [number, number][] = [];
  const d = segmentRadius * sqrt3 * 1.03; // Distance between hexagon centers

  // Outer and inner hex grid positions
  const qVectors = [
    [1, 0], [0, 1], [-1, 1],
    [-1, 0], [0, -1], [1, -1]
  ];

  // Ring 1 (6 hexes)
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    hexCoords.push([d * Math.cos(angle), d * Math.sin(angle)]);
  }

  // Ring 2 (12 hexes)
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    // Vertex positions
    hexCoords.push([2 * d * Math.cos(angle), 2 * d * Math.sin(angle)]);
    // Edge midpoint positions
    const midAngle = (i * Math.PI) / 3;
    hexCoords.push([sqrt3 * d * Math.cos(midAngle), sqrt3 * d * Math.sin(midAngle)]);
  }

  hexCoords.forEach(([hx, hy], idx) => {
    const segMesh = new THREE.Mesh(hexGeo, goldMirrorMat);
    segMesh.name = `mirror_hex_${idx + 1}`;
    segMesh.position.set(hx, hy, 0);
    // Slight concave curvature for primary focal curve
    const distCenter = Math.hypot(hx, hy);
    segMesh.position.z = -distCenter * distCenter * 0.04 * scale;
    primaryMirrors.add(segMesh);
  });

  // Carbon-composite Primary Mirror Backplane Support Structure
  const backplaneGeo = new THREE.CylinderGeometry(1.4 * scale, 1.4 * scale, 0.15 * scale, 6);
  const backplaneMesh = new THREE.Mesh(backplaneGeo, backplaneMat);
  backplaneMesh.rotation.x = Math.PI / 2;
  backplaneMesh.position.z = -0.15 * scale;
  primaryMirrors.add(backplaneMesh);

  // Central Aft Optics Subsystem (AOS) Tower
  const aosGeo = new THREE.CylinderGeometry(0.18 * scale, 0.24 * scale, 0.45 * scale, 12);
  const aosMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.9, roughness: 0.2 });
  const aosMesh = new THREE.Mesh(aosGeo, aosMat);
  aosMesh.rotation.x = Math.PI / 2;
  aosMesh.position.z = 0.2 * scale;
  primaryMirrors.add(aosMesh);

  // -------------------------------------------------------------
  // 3. SECONDARY MIRROR & TRIPOD STRUTS
  // -------------------------------------------------------------
  const secondaryGroup = new THREE.Group();
  secondaryGroup.name = 'jwst_secondary_mirror_assembly';

  // Secondary mirror focal distance out along optical axis +Z
  const focalDist = 1.9 * scale;

  // Small convex circular secondary mirror pointing back at primary
  const secMirrorGeo = new THREE.CylinderGeometry(0.18 * scale, 0.18 * scale, 0.04 * scale, 16);
  const secMirror = new THREE.Mesh(secMirrorGeo, goldMirrorMat);
  secMirror.rotation.x = Math.PI / 2;
  secMirror.position.set(0, 0, focalDist);
  secondaryGroup.add(secMirror);

  // 3 Carbon fiber support struts
  const strutRadius = 0.02 * scale;
  const strutMat = new THREE.MeshStandardMaterial({ color: '#090d16', metalness: 0.8, roughness: 0.4 });

  const strutBasePositions = [
    new THREE.Vector3(0, 1.25 * scale, 0),             // Top strut
    new THREE.Vector3(-1.08 * scale, -0.65 * scale, 0), // Bottom-left strut
    new THREE.Vector3(1.08 * scale, -0.65 * scale, 0),  // Bottom-right strut
  ];

  strutBasePositions.forEach((basePos) => {
    const tipPos = new THREE.Vector3(0, 0, focalDist);
    const strutLen = basePos.distanceTo(tipPos);
    const strutGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, strutLen, 8);
    const strutMesh = new THREE.Mesh(strutGeo, strutMat);

    // Orient cylinder between basePos and tipPos
    const midPoint = new THREE.Vector3().addVectors(basePos, tipPos).multiplyScalar(0.5);
    strutMesh.position.copy(midPoint);
    strutMesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(tipPos, basePos).normalize()
    );
    secondaryGroup.add(strutMesh);
  });

  primaryMirrors.add(secondaryGroup);
  group.add(primaryMirrors);

  // -------------------------------------------------------------
  // 4. INTEGRATED SCIENCE INSTRUMENT MODULE (ISIM) & BUS
  // -------------------------------------------------------------
  const busGroup = new THREE.Group();
  busGroup.name = 'jwst_spacecraft_bus';

  // Cold ISIM housing on the dark side of sunshield
  const isimGeo = new THREE.BoxGeometry(0.9 * scale, 0.7 * scale, 0.6 * scale);
  const isimMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.9, roughness: 0.3 });
  const isimMesh = new THREE.Mesh(isimGeo, isimMat);
  isimMesh.position.set(0, 0.15 * scale, -0.35 * scale);
  busGroup.add(isimMesh);

  // Hot side Spacecraft Bus under Sunshield
  const busGeo = new THREE.BoxGeometry(0.8 * scale, 0.35 * scale, 0.8 * scale);
  const busMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.2 });
  const busMesh = new THREE.Mesh(busGeo, busMat);
  busMesh.position.set(0, -0.35 * scale, 0);
  busGroup.add(busMesh);

  // Solar Array Panel (tilted toward the Sun)
  const solarPanelGeo = new THREE.BoxGeometry(1.4 * scale, 0.03 * scale, 0.5 * scale);
  const solarPanelMat = new THREE.MeshStandardMaterial({
    color: '#1e3a8a',
    metalness: 0.9,
    roughness: 0.15,
    emissive: '#172554',
    emissiveIntensity: 0.4,
  });
  const solarPanel = new THREE.Mesh(solarPanelGeo, solarPanelMat);
  solarPanel.position.set(0, -0.45 * scale, -1.8 * scale);
  solarPanel.rotation.x = -Math.PI / 8;
  busGroup.add(solarPanel);

  // High-Gain Antenna (HGA) dish for Ka-Band DSN communications back to Earth
  const dishGeo = new THREE.CylinderGeometry(0.24 * scale, 0.05 * scale, 0.08 * scale, 24);
  const dishMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.8, roughness: 0.2 });
  const antennaDish = new THREE.Mesh(dishGeo, dishMat);
  antennaDish.name = 'jwst_hga_dish';
  antennaDish.position.set(0.6 * scale, -0.35 * scale, 0.4 * scale);
  antennaDish.rotation.z = Math.PI / 4;
  antennaDish.rotation.x = -Math.PI / 6;
  busGroup.add(antennaDish);

  group.add(busGroup);

  // -------------------------------------------------------------
  // 5. BORESIGHT SCIENCE TARGETING RAY
  // -------------------------------------------------------------
  // A luminous collimated beam extending along the optical axis (+Z)
  const rayPoints = [
    new THREE.Vector3(0, 0.45 * scale, focalDist),
    new THREE.Vector3(0, 0.45 * scale, focalDist + 80),
  ];
  const rayGeo = new THREE.BufferGeometry().setFromPoints(rayPoints);
  const rayMat = new THREE.LineBasicMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  });
  const boresightRay = new THREE.Line(rayGeo, rayMat);
  boresightRay.name = 'jwst_boresight_ray';
  group.add(boresightRay);

  return {
    group,
    primaryMirrors,
    boresightRay,
    antennaDish,
  };
}
