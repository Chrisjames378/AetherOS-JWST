import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Compass, Navigation } from 'lucide-react';

interface GimbalHUDProps {
  currentTimeMs: number;
  pitchDeg?: number;
  yawDeg?: number;
  rollDeg?: number;
}

export const GimbalHUD: React.FC<GimbalHUDProps> = ({
  currentTimeMs,
  pitchDeg = 14.2,
  yawDeg = 182.4,
  rollDeg = 6.8,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gimbalGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 120;
    const height = container.clientHeight || 120;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Gimbal Group
    const gimbalGroup = new THREE.Group();

    // 1. Ecliptic Ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    gimbalGroup.add(ringMesh);

    // 2. Galactic North Ring
    const galRingGeo = new THREE.RingGeometry(1.2, 1.25, 32);
    const galRingMat = new THREE.MeshBasicMaterial({
      color: '#f59e0b',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const galRingMesh = new THREE.Mesh(galRingGeo, galRingMat);
    galRingMesh.rotation.y = Math.PI / 2;
    gimbalGroup.add(galRingMesh);

    // 3. Axes Arrows (X: Ecliptic Red, Y: Galactic North Green, Z: Boresight Blue)
    const axesHelper = new THREE.AxesHelper(1.1);
    gimbalGroup.add(axesHelper);

    // 4. Boresight Pointing Cone Pointer
    const coneGeo = new THREE.ConeGeometry(0.12, 0.4, 16);
    const coneMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, 0, 1.1);
    coneMesh.rotation.x = Math.PI / 2;
    gimbalGroup.add(coneMesh);

    scene.add(gimbalGroup);
    gimbalGroupRef.current = gimbalGroup;

    let animId = 0;
    const animate = () => {
      if (gimbalGroupRef.current) {
        // Dynamic slow rotation simulating orbital attitude precession
        const t = currentTimeMs / 8000;
        gimbalGroupRef.current.rotation.x = (pitchDeg * Math.PI) / 180 + Math.sin(t) * 0.05;
        gimbalGroupRef.current.rotation.y = (yawDeg * Math.PI) / 180 + t * 0.1;
        gimbalGroupRef.current.rotation.z = (rollDeg * Math.PI) / 180;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="pointer-events-auto absolute bottom-16 right-3 sm:right-4 z-20 flex flex-col items-end gap-1 font-mono text-[10px] text-fg select-none">
      <div className="bg-surface/90 backdrop-blur-md p-2 rounded-xl border border-line shadow-2xl flex items-center gap-2">
        <div ref={containerRef} className="w-24 h-24 relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] text-muted font-bold">
            <span className="absolute top-1 text-emerald-400">G-N</span>
            <span className="absolute bottom-1 text-amber-400">E-S</span>
            <span className="absolute left-1 text-cyan-400">W</span>
            <span className="absolute right-1 text-cyan-400">E</span>
          </div>
        </div>

        <div className="space-y-1 pr-1 border-l border-line/50 pl-2">
          <div className="flex items-center gap-1 font-bold text-cyan-300 border-b border-line/40 pb-0.5 uppercase tracking-wider">
            <Compass className="w-3 h-3 text-cyan-400" /> 3D Attitude
          </div>
          <div className="flex justify-between gap-3 text-[10px]">
            <span className="text-muted">Pitch:</span>
            <span className="font-bold text-fg">+{pitchDeg.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between gap-3 text-[10px]">
            <span className="text-muted">Yaw:</span>
            <span className="font-bold text-fg">{yawDeg.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between gap-3 text-[10px]">
            <span className="text-muted">Roll:</span>
            <span className="font-bold text-fg">+{rollDeg.toFixed(1)}°</span>
          </div>
          <div className="flex justify-between gap-3 text-[10px] text-amber-300">
            <span className="text-muted">Ecliptic:</span>
            <span className="font-bold">23.4° Tilt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
