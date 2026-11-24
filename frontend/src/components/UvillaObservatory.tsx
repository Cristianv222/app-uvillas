import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface ObservatoryProps {
  mode: number; // 0: Planta completa, 1: Cáliz dorado, 2: Frutos naranjas, 3: Vórtice de esporas
  focusPart?: 'caliz' | 'fruto' | 'tallo' | 'base' | null;
  onSelectHotspot?: (part: 'caliz' | 'fruto' | 'tallo') => void;
}

// Generate soft circular glowing particle sprite texture
function createParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 210, 95, 0.9)');
  gradient.addColorStop(0.7, 'rgba(232, 136, 42, 0.35)');
  gradient.addColorStop(1, 'rgba(232, 136, 42, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function UvillaObservatory({ mode, focusPart }: ObservatoryProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const modeRef = useRef(mode);
  const focusRef = useRef(focusPart);

  modeRef.current = mode;
  focusRef.current = focusPart;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    let isMobile = width < 768;

    // ── 1. Scene, Camera & Renderer ──
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06110a, 0.04);

    const camera = new THREE.PerspectiveCamera(isMobile ? 46 : 38, width / height, 0.1, 100);
    camera.position.set(isMobile ? 0 : 0.2, isMobile ? 0.8 : 1.1, isMobile ? 6.5 : 5.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // ── 2. Master Lighting (Balanced so no foliage is black) ──
    // Hemisphere light: soft daylight from sky, deep warm moss bounce from ground
    const hemiLight = new THREE.HemisphereLight(0xdcf0d5, 0x091c10, 2.4);
    scene.add(hemiLight);

    // Key sunlight beaming from top
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 2.8);
    sunLight.position.set(1.5, 6.5, 3.0);
    scene.add(sunLight);

    // Warm amber backlight / rim
    const rimLight = new THREE.DirectionalLight(0xff9900, 2.2);
    rimLight.position.set(-3.5, 3.0, -2.5);
    scene.add(rimLight);

    // Front soft fill
    const fillLight = new THREE.PointLight(0x438059, 1.8, 10);
    fillLight.position.set(0.5, 0.5, 4.0);
    scene.add(fillLight);

    // ── 3. Volumetric Light Shaft (Sunbeam through canopy) ──
    const beamGeo = new THREE.CylinderGeometry(0.3, 3.8, 9.0, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfff0d0,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lightBeam = new THREE.Mesh(beamGeo, beamMat);
    lightBeam.position.set(0.6, 2.8, -0.4);
    lightBeam.rotation.z = -0.08;
    scene.add(lightBeam);

    // ── 4. Plant Hierarchy (Positioned on the right side on desktop) ──
    const plantGroup = new THREE.Group();
    plantGroup.position.set(isMobile ? 0 : 0.65, 0, 0);
    scene.add(plantGroup);

    // Stone plinth / pedestal
    const plinthGeo = new THREE.CylinderGeometry(1.65, 1.85, 0.45, 36);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x1c2820,
      roughness: 0.92,
      metalness: 0.05,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -1.45;
    plantGroup.add(plinth);

    // Moss top on plinth
    const mossGeo = new THREE.CylinderGeometry(1.62, 1.65, 0.1, 36);
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x2b4f32,
      roughness: 0.98,
      metalness: 0.0,
    });
    const moss = new THREE.Mesh(mossGeo, mossMat);
    moss.position.y = -1.2;
    plantGroup.add(moss);

    // ── 5. Herbaceous Green Stems (Physalis peruviana) ──
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x4f7d38, // Healthy green herbaceous stem
      emissive: 0x182e12, // Ambient green glow so stems never look black
      roughness: 0.65,
      metalness: 0.04,
    });

    const pedicelMat = new THREE.MeshStandardMaterial({
      color: 0x5e9142,
      emissive: 0x1b3514,
      roughness: 0.6,
      metalness: 0.04,
    });

    function createStem(points: THREE.Vector3[], rStart: number, rEnd: number) {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 22, rStart, 10, false);
      return new THREE.Mesh(tubeGeo, stemMat);
    }

    // Main erect stem
    const mainStem = createStem([
      new THREE.Vector3(0, -1.2, 0),
      new THREE.Vector3(0.04, -0.65, 0.02),
      new THREE.Vector3(-0.02, -0.1, -0.02),
      new THREE.Vector3(0.06, 0.45, 0.03),
      new THREE.Vector3(0.02, 1.0, 0.01),
      new THREE.Vector3(-0.04, 1.45, -0.04),
    ], 0.08, 0.04);
    plantGroup.add(mainStem);

    // Branch 1 (Right lower ascending branch)
    const b1 = createStem([
      new THREE.Vector3(0.02, -0.25, 0.01),
      new THREE.Vector3(0.42, 0.18, 0.22),
      new THREE.Vector3(0.8, 0.55, 0.14),
      new THREE.Vector3(1.1, 0.82, -0.05),
    ], 0.055, 0.028);
    plantGroup.add(b1);

    // Branch 2 (Left lower ascending branch)
    const b2 = createStem([
      new THREE.Vector3(-0.02, 0.02, -0.02),
      new THREE.Vector3(-0.46, 0.38, -0.18),
      new THREE.Vector3(-0.85, 0.75, -0.08),
      new THREE.Vector3(-1.12, 1.0, 0.1),
    ], 0.052, 0.026);
    plantGroup.add(b2);

    // Branch 3 (Upper right spreading branch)
    const b3 = createStem([
      new THREE.Vector3(0.06, 0.45, 0.03),
      new THREE.Vector3(0.35, 0.88, -0.22),
      new THREE.Vector3(0.65, 1.25, -0.12),
    ], 0.045, 0.024);
    plantGroup.add(b3);

    // Branch 4 (Upper left spreading branch)
    const b4 = createStem([
      new THREE.Vector3(0.04, 0.72, 0.02),
      new THREE.Vector3(-0.32, 1.08, 0.22),
      new THREE.Vector3(-0.55, 1.4, 0.32),
    ], 0.042, 0.022);
    plantGroup.add(b4);

    // ── 6. Heart-Shaped Uvilla Leaves (Lush Green Cordate Foliage) ──
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(-0.22, 0.06, -0.36, 0.4, -0.3, 0.68);
    leafShape.bezierCurveTo(-0.22, 0.95, -0.06, 1.15, 0, 1.35); // Pointed acute tip
    leafShape.bezierCurveTo(0.06, 1.15, 0.22, 0.95, 0.3, 0.68);
    leafShape.bezierCurveTo(0.36, 0.4, 0.22, 0.06, 0, 0);

    const leafGeo = new THREE.ShapeGeometry(leafShape, 12);
    // Subtle organic cup curvature
    const lPos = leafGeo.attributes.position;
    for (let i = 0; i < lPos.count; i++) {
      const y = lPos.getY(i);
      const x = lPos.getX(i);
      const zCurv = Math.sin((y / 1.35) * Math.PI) * 0.06 - (x * x) * 0.12;
      lPos.setZ(i, zCurv);
    }
    leafGeo.computeVertexNormals();

    // Leaf material: rich botanical green with soft emissive green glow so it's NEVER dark
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4f8836, // Vibrant agricultural leaf green
      emissive: 0x1e3f14, // Generous green fill luminescence
      roughness: 0.5,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const leafPlacements: [number, number, number, number, number, number, number][] = [
      // Main stem nodes
      [0.08, -0.32, 0.14, 0.5, 0.2, -0.4, 0.7],
      [-0.08, -0.06, -0.14, -0.4, 0.6, 0.3, 0.75],
      [0.12, 0.24, 0.16, 0.3, -0.3, -0.5, 0.8],
      [-0.1, 0.52, -0.1, -0.3, 0.5, 0.6, 0.82],
      [0.06, 0.82, 0.12, 0.4, 0.2, -0.4, 0.78],
      // Branch 1 (right)
      [0.42, 0.3, 0.26, 0.6, 0.4, -0.6, 0.82],
      [0.68, 0.64, 0.2, 0.5, -0.3, -0.7, 0.86],
      [0.92, 0.84, 0.08, 0.3, 0.5, -0.4, 0.78],
      [1.12, 0.94, -0.1, 0.2, 0.8, -0.3, 0.72],
      [0.56, 0.46, 0.32, 0.7, 0.1, -0.8, 0.75],
      // Branch 2 (left)
      [-0.42, 0.45, -0.2, 0.5, -0.7, 0.5, 0.82],
      [-0.74, 0.78, -0.16, 0.4, -0.5, 0.6, 0.86],
      [-0.96, 0.98, -0.04, 0.3, -0.3, 0.8, 0.78],
      [-1.12, 1.12, 0.16, 0.2, 0.4, 0.7, 0.68],
      [-0.62, 0.62, -0.3, 0.6, -0.8, 0.4, 0.76],
      // Upper branches
      [0.3, 0.98, -0.26, 0.4, 0.3, -0.5, 0.72],
      [0.52, 1.28, -0.18, 0.5, 0.6, -0.4, 0.76],
      [0.68, 1.42, -0.08, 0.3, 0.8, -0.2, 0.68],
      [-0.28, 1.14, 0.26, 0.3, -0.6, 0.5, 0.72],
      [-0.48, 1.38, 0.35, 0.4, -0.4, 0.7, 0.75],
      [0.0, 1.54, -0.04, 0.2, 0.1, -0.2, 0.62],
    ];

    leafPlacements.forEach(([x, y, z, rx, ry, rz, s]) => {
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.position.set(x, y, z);
      leafMesh.rotation.set(rx, ry, rz);
      leafMesh.scale.set(s, s, s);
      plantGroup.add(leafMesh);
    });

    // ── 7. Uvilla Lanterns (Capachos) & Real Orange Fruits ──
    const lanternGroup = new THREE.Group();
    plantGroup.add(lanternGroup);

    // Smooth lathed balloon lantern geometry
    const lanternPoints: THREE.Vector2[] = [];
    lanternPoints.push(new THREE.Vector2(0.02, 0)); // top cap
    lanternPoints.push(new THREE.Vector2(0.08, -0.04));
    lanternPoints.push(new THREE.Vector2(0.18, -0.12)); // widest belly
    lanternPoints.push(new THREE.Vector2(0.20, -0.20));
    lanternPoints.push(new THREE.Vector2(0.16, -0.30));
    lanternPoints.push(new THREE.Vector2(0.08, -0.38));
    lanternPoints.push(new THREE.Vector2(0.01, -0.42)); // pointed tip
    const lanternGeo = new THREE.LatheGeometry(lanternPoints, 16);

    // Golden straw papery lantern material with warm inner glow
    const goldenLanternMat = new THREE.MeshStandardMaterial({
      color: 0xf5b642,
      emissive: 0xb56a08,
      emissiveIntensity: 0.55,
      roughness: 0.42,
      metalness: 0.05,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    });

    // Young green lantern material
    const greenLanternMat = new THREE.MeshStandardMaterial({
      color: 0x6ca33e,
      emissive: 0x224a12,
      emissiveIntensity: 0.35,
      roughness: 0.5,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });

    // Glossy juicy orange uvilla berry (fruit inside)
    const berryGeo = new THREE.SphereGeometry(0.11, 20, 20);
    const berryMat = new THREE.MeshStandardMaterial({
      color: 0xff6d00, // Vibrant ripe orange
      emissive: 0xff4800,
      emissiveIntensity: 0.5,
      roughness: 0.15, // High specular gloss
      metalness: 0.06,
    });

    // Peeled open calyx sepal shape (star-like sepals opening as in photo 2)
    const openSepalShape = new THREE.Shape();
    openSepalShape.moveTo(0, 0);
    openSepalShape.quadraticCurveTo(-0.07, 0.14, -0.05, 0.3);
    openSepalShape.lineTo(0, 0.36);
    openSepalShape.lineTo(0.05, 0.3);
    openSepalShape.quadraticCurveTo(0.07, 0.14, 0, 0);
    const openSepalGeo = new THREE.ShapeGeometry(openSepalShape, 8);

    const lanternLights: THREE.PointLight[] = [];

    interface LanternDef {
      pos: [number, number, number];
      type: 'golden' | 'green' | 'open';
      rot: [number, number, number];
    }

    const lanterns: LanternDef[] = [
      // Branch 1 (right)
      { pos: [0.62, 0.48, 0.22], type: 'open', rot: [0.3, 0.2, -0.4] }, // Star open showing fruit!
      { pos: [0.92, 0.68, 0.1], type: 'golden', rot: [0.2, -0.3, -0.2] },
      { pos: [1.14, 0.78, -0.08], type: 'golden', rot: [-0.1, 0.4, -0.3] },
      // Branch 2 (left)
      { pos: [-0.64, 0.58, -0.22], type: 'open', rot: [-0.2, 0.5, 0.4] }, // Star open showing fruit!
      { pos: [-0.94, 0.88, -0.08], type: 'golden', rot: [0.3, -0.4, 0.3] },
      { pos: [-1.1, 1.0, 0.12], type: 'green', rot: [-0.2, 0.3, 0.2] }, // Developing green lantern
      // Upper branches
      { pos: [0.45, 1.1, -0.2], type: 'golden', rot: [0.4, 0.2, -0.1] },
      { pos: [-0.4, 1.22, 0.3], type: 'golden', rot: [-0.3, 0.4, 0.3] },
      { pos: [0.08, 0.84, 0.16], type: 'open', rot: [0.2, -0.5, -0.2] }, // Central open fruit
      { pos: [-0.1, 1.36, -0.06], type: 'green', rot: [0.3, 0.1, 0.1] },
    ];

    lanterns.forEach(({ pos, type, rot }) => {
      const pivot = new THREE.Group();
      pivot.position.set(pos[0], pos[1], pos[2]);
      pivot.rotation.set(rot[0], rot[1], rot[2]);

      // Slender curved pedicel
      const pCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.16, 0),
        new THREE.Vector3(0.02, 0.08, 0.01),
        new THREE.Vector3(0, 0, 0),
      ]);
      const pGeo = new THREE.TubeGeometry(pCurve, 6, 0.011, 6, false);
      const pMesh = new THREE.Mesh(pGeo, pedicelMat);
      pivot.add(pMesh);

      if (type === 'open') {
        // CÁLIZ ABIERTO EN ESTRELLA CON FRUTO NARANJA EXPUESTO
        const openGrp = new THREE.Group();
        openGrp.position.set(0, -0.04, 0);

        for (let s = 0; s < 5; s++) {
          const sepal = new THREE.Mesh(openSepalGeo, goldenLanternMat);
          const a = (s / 5) * Math.PI * 2;
          sepal.rotation.z = Math.PI * 0.72; // flare outward like star petals
          sepal.rotation.y = a;
          openGrp.add(sepal);
        }

        // Exposed glistening round orange fruit
        const berry = new THREE.Mesh(berryGeo, berryMat);
        openGrp.add(berry);

        // Warm fruit illumination
        const fLight = new THREE.PointLight(0xff6a00, 1.5, 2.2);
        fLight.position.set(0, 0, 0.08);
        openGrp.add(fLight);
        lanternLights.push(fLight);

        pivot.add(openGrp);
      } else {
        // CÁLIZ CERRADO INFLADO (DORADO O VERDE)
        const mat = type === 'golden' ? goldenLanternMat : greenLanternMat;
        const calyx = new THREE.Mesh(lanternGeo, mat);
        calyx.position.set(0, 0, 0);
        pivot.add(calyx);

        // Berry inside
        const innerBerry = new THREE.Mesh(berryGeo, berryMat);
        innerBerry.position.set(0, -0.16, 0);
        innerBerry.scale.set(0.85, 0.85, 0.85);
        pivot.add(innerBerry);

        if (type === 'golden') {
          const pL = new THREE.PointLight(0xff8c00, 1.1, 1.8);
          pL.position.set(0, -0.16, 0);
          pivot.add(pL);
          lanternLights.push(pL);
        }
      }

      lanternGroup.add(pivot);
    });

    // ── 8. Delicate Yellow Flowers (5 Petals with dark center) ──
    const flowerShape = new THREE.Shape();
    flowerShape.moveTo(0, 0);
    flowerShape.lineTo(-0.035, 0.07);
    flowerShape.lineTo(0, 0.11);
    flowerShape.lineTo(0.035, 0.07);
    flowerShape.lineTo(0, 0);
    const flowerPetalGeo = new THREE.ShapeGeometry(flowerShape);

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    const flowerCenterMat = new THREE.MeshBasicMaterial({ color: 0x4a2412 });
    const flowerCenterGeo = new THREE.CircleGeometry(0.022, 8);

    const flowers: [number, number, number, number, number][] = [
      [0.3, 0.45, 0.16, 0.4, 0.6],
      [-0.4, 0.68, -0.16, -0.3, 0.8],
      [0.14, 1.2, -0.14, 0.2, -0.5],
      [-0.16, 1.0, 0.16, -0.4, 0.4],
    ];

    flowers.forEach(([fx, fy, fz, rx, ry]) => {
      const flGrp = new THREE.Group();
      flGrp.position.set(fx, fy, fz);
      flGrp.rotation.set(rx, ry, 0);

      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(flowerPetalGeo, petalMat);
        petal.rotation.z = (p / 5) * Math.PI * 2;
        flGrp.add(petal);
      }
      const cMesh = new THREE.Mesh(flowerCenterGeo, flowerCenterMat);
      cMesh.position.z = 0.005;
      flGrp.add(cMesh);

      plantGroup.add(flGrp);
    });

    // ── 9. Delicate Golden Dust Spores (Tiny, Soft, Ethereal) ──
    const particleCount = 650; // Refined count so it never clutters the screen
    const particleTex = createParticleTexture();
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const originArray = new Float32Array(particleCount * 3);
    const speedArray = new Float32Array(particleCount);
    const angleArray = new Float32Array(particleCount);
    const radiusArray = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const r = 0.35 + Math.random() * 2.1;
      const theta = Math.random() * Math.PI * 2;
      const y = -1.0 + Math.random() * 3.8;

      const px = Math.cos(theta) * r;
      const pz = Math.sin(theta) * r;

      posArray[i3] = px;
      posArray[i3 + 1] = y;
      posArray[i3 + 2] = pz;

      originArray[i3] = px;
      originArray[i3 + 1] = y;
      originArray[i3 + 2] = pz;

      speedArray[i] = 0.2 + Math.random() * 0.6;
      angleArray[i] = theta;
      radiusArray[i] = r;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045, // Subtle, fine golden motes
      map: particleTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    plantGroup.add(particles);

    // ── 10. Pointer Tracking ──
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      mouseX = (clientX / window.innerWidth) * 2 - 1;
      mouseY = -(clientY / window.innerHeight) * 2 + 1;
      targetRotY = mouseX * 0.28;
      targetRotX = mouseY * 0.12;
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    // Resize handler with mobile dynamic FOV
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      isMobile = width < 768;

      camera.aspect = width / height;
      camera.fov = isMobile ? 46 : 38;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      plantGroup.position.x = isMobile ? 0 : 0.65;
    };
    window.addEventListener('resize', onResize);

    // ── 11. Animation Loop ──
    const clock = new THREE.Clock();
    let vortexProgress = 0;

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse/touch tilt
      plantGroup.rotation.y += (targetRotY - plantGroup.rotation.y) * 0.05;
      plantGroup.rotation.x += (targetRotX - plantGroup.rotation.x) * 0.05;

      // Natural gentle botanical breathe/sway in the breeze
      const breeze = Math.sin(elapsed * 1.3) * 0.015;
      lanternGroup.rotation.z = breeze;
      lanternGroup.rotation.x = Math.cos(elapsed * 1.5) * 0.01;

      // Subtle lantern glow pulse
      const pulse = 1.0 + Math.sin(elapsed * 2.6) * 0.2;
      lanternLights.forEach((l) => (l.intensity = 1.2 * pulse));
      goldenLanternMat.emissiveIntensity = 0.5 + Math.sin(elapsed * 2.0) * 0.15;

      // Target mode: Mode 3 is Vortex (Screenshot 2: glowing particle vortex)
      const targetVortex = modeRef.current === 3 ? 1.0 : 0.0;
      vortexProgress += (targetVortex - vortexProgress) * 0.045;

      // Camera target interpolation
      const mobile = (container.clientWidth || window.innerWidth) < 768;
      let targetCamZ = mobile ? 6.5 : 5.4;
      let targetCamY = mobile ? 0.7 : 1.1;
      let targetCamX = mobile ? 0 : 0.2;

      if (focusRef.current === 'caliz' || modeRef.current === 1) {
        // Zoom into hanging golden calyces
        targetCamX = mobile ? 0.3 : 0.85;
        targetCamY = 0.75;
        targetCamZ = mobile ? 4.8 : 3.8;
      } else if (focusRef.current === 'fruto' || modeRef.current === 2) {
        // Zoom into bright orange exposed berry
        targetCamX = mobile ? -0.2 : 0.2;
        targetCamY = 0.95;
        targetCamZ = mobile ? 4.4 : 3.4;
      } else if (focusRef.current === 'tallo' || focusRef.current === 'base') {
        // View main green stem and base
        targetCamX = mobile ? 0 : 0.65;
        targetCamY = -0.3;
        targetCamZ = mobile ? 5.6 : 4.4;
      } else if (modeRef.current === 3) {
        // Wide view of the glowing vortex
        targetCamZ = mobile ? 7.2 : 6.4;
        targetCamY = 1.2;
      }

      camera.position.x += (targetCamX - camera.position.x) * 0.04;
      camera.position.y += (targetCamY - camera.position.y) * 0.04;
      camera.position.z += (targetCamZ - camera.position.z) * 0.04;
      camera.lookAt(targetCamX * 0.5, targetCamY * 0.5, 0);

      // Particle physics
      const pos = particleGeo.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const speed = speedArray[i];

        if (vortexProgress < 0.05) {
          // Normal mode: delicate ascending golden dust
          pos[i3 + 1] += speed * delta * 0.28;
          pos[i3] += Math.sin(elapsed * 0.8 + i) * 0.002;
          pos[i3 + 2] += Math.cos(elapsed * 0.6 + i) * 0.002;

          if (pos[i3 + 1] > 3.4) {
            pos[i3 + 1] = -1.1;
            pos[i3] = originArray[i3];
            pos[i3 + 2] = originArray[i3 + 2];
          }
        } else {
          // Vortex mode (Screenshot 2): Swirling spiral vortex
          angleArray[i] += speed * delta * (1.2 + vortexProgress * 2.2);
          const currentRadius = radiusArray[i] * (1.0 + Math.sin(elapsed + i) * 0.18) * (1.0 + vortexProgress * 0.5);

          const vx = Math.cos(angleArray[i]) * currentRadius;
          const vz = Math.sin(angleArray[i]) * currentRadius;
          const vy = originArray[i3 + 1] + Math.sin(angleArray[i] * 2 + elapsed) * 0.6;

          pos[i3] += (vx - pos[i3]) * 0.06;
          pos[i3 + 1] += (vy - pos[i3 + 1]) * 0.06;
          pos[i3 + 2] += (vz - pos[i3 + 2]) * 0.06;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // In vortex mode, make plant ethereal and particles glow brighter
      if (vortexProgress > 0.01) {
        goldenLanternMat.opacity = THREE.MathUtils.lerp(0.86, 0.35, vortexProgress);
        leafMat.opacity = THREE.MathUtils.lerp(1.0, 0.45, vortexProgress);
        leafMat.transparent = true;
        particleMat.size = THREE.MathUtils.lerp(0.045, 0.1, vortexProgress);
        particleMat.opacity = THREE.MathUtils.lerp(0.65, 0.95, vortexProgress);
      } else {
        goldenLanternMat.opacity = 0.86;
        leafMat.opacity = 1.0;
        particleMat.size = 0.045;
        particleMat.opacity = 0.65;
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="observatory-canvas-wrap"
      aria-hidden="true"
    />
  );
}
