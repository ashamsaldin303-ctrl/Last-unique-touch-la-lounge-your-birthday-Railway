'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { shouldEnable3D } from '@/lib/device-capabilities';
import { BRAND_COLORS } from '@/lib/brand-colors';

/*
 * FIX-1B / R1-D M7: consolidated all hardcoded pink hex literals into
 * named tint constants derived from the La Lounge brand pink
 * (#E6007E = BRAND_COLORS.LA_LOUNGE). The very light tints below are
 * the closest Tailwind-equivalent shades (pink-50/100/200/300) needed
 * for the subtle blueprint-grid aesthetic — they can't be expressed
 * with the bare brand hex alone without blowing out the grid lines,
 * so they live here as named constants instead of scattered literals.
 */
const PINK_LIGHT = '#FFD1E8'   // ≈ pink-200  — base grid cross-lines
const PINK_LIGHTER = '#FFEFF6' // ≈ pink-50   — base grid lines (lightest)
const PINK_SOFT = '#FFE0EF'    // ≈ pink-100  — secondary grid lines
const PINK_MID = '#FFB3D9'     // ≈ pink-300  — radial grid rings

function BlueprintGrid() {
  const gridGroup = useRef<THREE.Group>(null);
  const radarRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (gridGroup.current) {
      gridGroup.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
    if (radarRef.current) {
      radarRef.current.rotation.z = -state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <group ref={gridGroup}>
      {/* Base Grids */}
      <gridHelper args={[200, 200, PINK_LIGHT, PINK_LIGHTER]} position={[0, -0.01, 0]} />
      <gridHelper args={[200, 20, BRAND_COLORS.LA_LOUNGE_LIGHT, PINK_SOFT]} position={[0, -0.02, 0]} />
      
      {/* Radial Grid (Architectural Focus) */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={`radial_${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <ringGeometry args={[5 + i * 5, 5.05 + i * 5, 128]} />
          <meshBasicMaterial color={PINK_MID} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {/* Radar Sweep */}
      <mesh ref={radarRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]}>
        <circleGeometry args={[100, 64]} />
        <meshBasicMaterial color={BRAND_COLORS.LA_LOUNGE_LIGHT} transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>

      {/* Crosshairs */}
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh key={`cross_${i}`} rotation={[0, (i * Math.PI) / 24, 0]} position={[0, -0.015, 0]}>
          <boxGeometry args={[200, 0.01, 0.04]} />
          <meshBasicMaterial color={PINK_LIGHT} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 400;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 2;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <PointMaterial transparent color={BRAND_COLORS.LA_LOUNGE} size={0.15} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
    </points>
  );
}

function EventArchitecture() {
  const groupRef = useRef<THREE.Group>(null);
  const centerRingsRef = useRef<THREE.Group>(null);
  const geometriesRef = useRef<THREE.BufferGeometry[]>([]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
    if (centerRingsRef.current) {
      centerRingsRef.current.children.forEach((ring, idx) => {
        ring.rotation.z = state.clock.elapsedTime * 0.2 * (idx % 2 === 0 ? 1 : -1);
      });
    }
  });

  const { elements, nodes, materials } = useMemo(() => {
    const items = [];
    const technicalNodes = [];
    const geometries: THREE.BufferGeometry[] = [];

    // Track a geometry so it can be disposed on unmount
    const track = <T extends THREE.BufferGeometry>(geo: T): T => {
      geometries.push(geo);
      return geo;
    };
    
    // Materials that look like blueprint ink
    const matBold = new THREE.LineBasicMaterial({ color: BRAND_COLORS.LA_LOUNGE, transparent: true, opacity: 0.95 });
    const matMain = new THREE.LineBasicMaterial({ color: BRAND_COLORS.LA_LOUNGE, transparent: true, opacity: 0.8 });
    const matSub = new THREE.LineBasicMaterial({ color: BRAND_COLORS.LA_LOUNGE, transparent: true, opacity: 0.5 });
    const matAccent = new THREE.LineBasicMaterial({ color: BRAND_COLORS.LA_LOUNGE_LIGHT, transparent: true, opacity: 0.9 });
    
    const addBoundingBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const box = track(new THREE.BoxGeometry(w + 0.5, h + 0.5, d + 0.5));
      items.push(<lineSegments key={`bbox_${x}_${y}_${z}`} geometry={track(new THREE.EdgesGeometry(box))} material={matSub} position={[x, y, z]} />);
    };

    // --- 1. THE STAGE (Grand Event Focal Point) ---
    const stageWidth = 40;
    const stageDepth = 20;
    const stageHeight = 1.5;
    const stageZ = -35;
    
    // Main Stage Platform
    const stageGeo = track(new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth));
    items.push(<lineSegments key="stage" geometry={track(new THREE.EdgesGeometry(stageGeo))} material={matBold} position={[0, stageHeight/2, stageZ]} />);
    addBoundingBox(stageWidth, stageHeight, stageDepth, 0, stageHeight/2, stageZ);
    
    // Stage Steps (Curved)
    for(let step=1; step<=4; step++) {
       const stepWidth = stageWidth - 10 + (step * 2);
       const stepGeo = track(new THREE.BoxGeometry(stepWidth, 0.4, 1.5));
       items.push(<lineSegments key={`step_${step}`} geometry={track(new THREE.EdgesGeometry(stepGeo))} material={matMain} position={[0, (5-step)*0.38, stageZ + stageDepth/2 + step*1.2]} />);
    }

    // Huge LED Backdrop Screen
    const screenGeo = track(new THREE.BoxGeometry(stageWidth - 2, 16, 0.5));
    items.push(<lineSegments key="screen" geometry={track(new THREE.EdgesGeometry(screenGeo))} material={matBold} position={[0, stageHeight + 8, stageZ - stageDepth/2 + 1]} />);
    addBoundingBox(stageWidth - 2, 16, 0.5, 0, stageHeight + 8, stageZ - stageDepth/2 + 1);
    
    // Screen Panels (Grid inside the screen)
    for(let x=-stageWidth/2 + 2; x<=stageWidth/2 - 2; x+=4) {
      const panelGeo = track(new THREE.BoxGeometry(3.8, 15.6, 0.2));
      items.push(<lineSegments key={`panel_${x}`} geometry={track(new THREE.EdgesGeometry(panelGeo))} material={matSub} position={[x, stageHeight + 8, stageZ - stageDepth/2 + 1.2]} />);
    }

    // Stage Podium
    const podiumGeo = track(new THREE.CylinderGeometry(0.8, 0.6, 2.5, 8));
    items.push(<lineSegments key="podium" geometry={track(new THREE.EdgesGeometry(podiumGeo))} material={matAccent} position={[0, stageHeight + 1.25, stageZ + 4]} />);
    
    // Stage Projection Cones (Lighting)
    for (const lx of [-15, -5, 5, 15]) {
      const lightCone = track(new THREE.ConeGeometry(3, 15, 8, 1, true));
      items.push(<lineSegments key={`light_${lx}`} geometry={track(new THREE.EdgesGeometry(lightCone))} material={matSub} position={[lx, stageHeight + 15, stageZ + 5]} rotation={[Math.PI/6, 0, 0]} />);
    }

    // --- 2. OVERHEAD TRUSS & RIGGING SYSTEM (Highly detailed) ---
    const trussPositions = [
      [-22, -40], [22, -40], [-22, -20], [22, -20],
      [-24, 0], [24, 0], [-24, 25], [24, 25]
    ];
    
    trussPositions.forEach(([x, z], idx) => {
      const pillarGeo = track(new THREE.BoxGeometry(1.2, 24, 1.2));
      items.push(<lineSegments key={`pil_${idx}`} geometry={track(new THREE.EdgesGeometry(pillarGeo))} material={matBold} position={[x, 12, z]} />);
      for(let y=1; y<23; y+=2) {
        const braceGeo = track(new THREE.BoxGeometry(1.2, 0.1, 1.2));
        items.push(<lineSegments key={`brace_${idx}_${y}`} geometry={track(new THREE.EdgesGeometry(braceGeo))} material={matSub} position={[x, y, z]} />);
      }
      technicalNodes.push(new THREE.Vector3(x, 24, z));
    });

    const hTrussGeo1 = track(new THREE.BoxGeometry(48, 1.2, 1.2));
    items.push(<lineSegments key="ht_1" geometry={track(new THREE.EdgesGeometry(hTrussGeo1))} material={matBold} position={[0, 24, -20]} />);
    items.push(<lineSegments key="ht_2" geometry={track(new THREE.EdgesGeometry(hTrussGeo1))} material={matBold} position={[0, 24, 0]} />);
    const hTrussGeo2 = track(new THREE.BoxGeometry(52, 1.2, 1.2));
    items.push(<lineSegments key="ht_3" geometry={track(new THREE.EdgesGeometry(hTrussGeo2))} material={matBold} position={[0, 24, 25]} />);

    // Hanging Line Array Speakers
    [-18, 18].forEach((lx, idx) => {
      for(let s=0; s<6; s++) {
        const speakerGeo = track(new THREE.BoxGeometry(1.8, 1.2, 2.5));
        const rotX = (s * 0.1);
        items.push(<lineSegments key={`speaker_${idx}_${s}`} geometry={track(new THREE.EdgesGeometry(speakerGeo))} material={matBold} position={[lx, 20 - s * 1.5, -30 + s * 0.2]} rotation={[rotX, 0, 0]} />);
      }
      // Hanging wire
      const wirePts = [new THREE.Vector3(lx, 24, -30), new THREE.Vector3(lx, 20.6, -30)];
      items.push(<primitive key={`wire_${idx}`} object={new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(wirePts)), matMain)} />);
    });

    // Additional Lighting Arrays
    for(let lx=-20; lx<=20; lx+=4) {
      const lightGeo = track(new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8));
      items.push(<lineSegments key={`tlight1_${lx}`} geometry={track(new THREE.EdgesGeometry(lightGeo))} material={matAccent} position={[lx, 23, -20]} rotation={[Math.PI/4, 0, 0]} />);
      items.push(<lineSegments key={`tlight2_${lx}`} geometry={track(new THREE.EdgesGeometry(lightGeo))} material={matAccent} position={[lx, 23, 0]} rotation={[Math.PI/3, 0, 0]} />);
    }

    // --- 3. LOUNGE & VIP SEATING AREAS ---
    [-1, 1].forEach((side) => {
      for(let row=0; row<2; row++) {
        const vx = side * 18;
        const vz = 5 + row * 14;
        
        const boothGeo = track(new THREE.TorusGeometry(3.5, 1.2, 8, 16, Math.PI));
        const rotY = side === 1 ? Math.PI/2 : -Math.PI/2;
        items.push(<lineSegments key={`booth_${side}_${row}`} geometry={track(new THREE.EdgesGeometry(boothGeo))} material={matMain} position={[vx, 1, vz]} rotation={[Math.PI/2, 0, rotY]} />);
        
        const tableGeo = track(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16));
        items.push(<lineSegments key={`viptab_${side}_${row}`} geometry={track(new THREE.EdgesGeometry(tableGeo))} material={matAccent} position={[vx + side*1.5, 0.4, vz]} />);
        addBoundingBox(7, 2, 7, vx, 1, vz);
      }
    });

    const tablePositions = [
      [-7, -6], [7, -6], [-9, 8], [9, 8], [-6, 18], [6, 18]
    ];
    
    tablePositions.forEach(([tx, tz], idx) => {
      const tGeo = track(new THREE.CylinderGeometry(1.8, 1.8, 0.7, 16));
      items.push(<lineSegments key={`tab_${idx}`} geometry={track(new THREE.EdgesGeometry(tGeo))} material={matMain} position={[tx, 0.35, tz]} />);
      
      for(let c=0; c<6; c++) {
        const cAngle = (c/6) * Math.PI * 2;
        const cx = tx + Math.cos(cAngle) * 2.8;
        const cz = tz + Math.sin(cAngle) * 2.8;
        const chairGeo = track(new THREE.BoxGeometry(0.8, 1.2, 0.8));
        items.push(<lineSegments key={`chair_${idx}_${c}`} geometry={track(new THREE.EdgesGeometry(chairGeo))} material={matSub} position={[cx, 0.6, cz]} rotation={[0, -cAngle, 0]} />);
      }
      addBoundingBox(7, 2, 7, tx, 1, tz);
    });

    // --- 4. THE LUXURY BAR AREA ---
    const barZ = 40;
    const barGeo = track(new THREE.BoxGeometry(28, 1.2, 3));
    items.push(<lineSegments key="bar" geometry={track(new THREE.EdgesGeometry(barGeo))} material={matBold} position={[0, 1.1, barZ]} />);
    
    const shelfGeo = track(new THREE.BoxGeometry(26, 7, 1));
    items.push(<lineSegments key="barshelf" geometry={track(new THREE.EdgesGeometry(shelfGeo))} material={matMain} position={[0, 3.5, barZ + 3]} />);
    
    for(let sx=-12; sx<=12; sx+=2.4) {
      const stoolGeo = track(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 8));
      items.push(<lineSegments key={`stool_${sx}`} geometry={track(new THREE.EdgesGeometry(stoolGeo))} material={matAccent} position={[sx, 0.45, barZ - 2.5]} />);
    }

    // --- 5. DRAFTING ANNOTATIONS & MEASUREMENTS ---
    const addDimension = (p1: [number, number], p2: [number, number], height: number, key: string) => {
      const pts = [
        new THREE.Vector3(p1[0], height, p1[1]),
        new THREE.Vector3(p2[0], height, p2[1])
      ];
      
      items.push(<primitive key={`dim_l_${key}`} object={new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(pts)), matSub)} />);
      
      technicalNodes.push(new THREE.Vector3(p1[0], height, p1[1]));
      technicalNodes.push(new THREE.Vector3(p2[0], height, p2[1]));
      
      const markGeo = track(new THREE.BoxGeometry(0.5, 0.5, 0.5));
      items.push(<lineSegments key={`dim_m1_${key}`} geometry={track(new THREE.EdgesGeometry(markGeo))} material={matAccent} position={[p1[0], height, p1[1]]} />);
      items.push(<lineSegments key={`dim_m2_${key}`} geometry={track(new THREE.EdgesGeometry(markGeo))} material={matAccent} position={[p2[0], height, p2[1]]} />);
    };

    addDimension([-20, -35], [20, -35], 0.1, 'stage_w');
    addDimension([-22, -45], [-22, -25], 0.1, 'stage_d');
    addDimension([-24, 25], [24, 25], 25, 'truss_span');
    addDimension([-14, 40], [14, 40], 0.1, 'bar_w');

    // Random floating elevation markers (Architectural flair)
    for(let k=0; k<25; k++) {
      const px = (Math.random() - 0.5) * 90;
      const pz = (Math.random() - 0.5) * 110;
      const h = 5 + Math.random() * 25;
      
      const pts = [
        new THREE.Vector3(px, 0, pz),
        new THREE.Vector3(px, h, pz),
        new THREE.Vector3(px + 4, h, pz)
      ];
      items.push(<primitive key={`elev_${k}`} object={new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(pts)), matSub)} />);
      
      const textBox = track(new THREE.BoxGeometry(3.5, 0.8, 0.1));
      items.push(<lineSegments key={`elev_txt_${k}`} geometry={track(new THREE.EdgesGeometry(textBox))} material={matSub} position={[px + 6, h, pz]} />);
      technicalNodes.push(new THREE.Vector3(px, h, pz));
    }

    geometriesRef.current = geometries;

    return { elements: items, nodes: technicalNodes, materials: { matBold, matMain, matSub, matAccent } };
  }, []);

  useEffect(() => {
    return () => {
      // Dispose materials created in this component
      materials.matBold.dispose()
      materials.matMain.dispose()
      materials.matSub.dispose()
      materials.matAccent.dispose()
      // Dispose all tracked geometries to free GPU memory
      geometriesRef.current.forEach((g) => g.dispose())
      geometriesRef.current = []
    }
  }, [materials])

  return (
    <group ref={groupRef}>
      {elements}

      {/* Nodes points */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(nodes.flatMap(v => [v.x, v.y, v.z])), 3]}
          />
        </bufferGeometry>
        <pointsMaterial color={BRAND_COLORS.LA_LOUNGE} size={0.5} sizeAttenuation={true} />
      </points>

      {/* Animated Center Focal Point (Dance Floor / Core) */}
      <group position={[0, 0.1, 0]} ref={centerRingsRef}>
        {[8, 12, 16].map((r, i) => (
          <mesh key={`cring_${i}`} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r, r + 0.2, 64]} />
            <meshBasicMaterial color={BRAND_COLORS.LA_LOUNGE} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CameraRig() {
  // Perf fix: `window.innerWidth` was being read on every frame (60/sec),
  // which forced a synchronous layout reflow inside the render loop. Hoist
  // the mobile check to a ref that updates only on resize.
  const isMobileRef = useRef(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  useEffect(() => {
    const onResize = () => {
      isMobileRef.current = window.innerWidth < 768
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const isMobile = isMobileRef.current;
    const m = isMobile ? 1.4 : 1.0;
    
    // Cinematic slow sweep over the blueprint (Adjusted for mobile)
    state.camera.position.x = Math.sin(t * 0.03) * (45 * m);
    state.camera.position.z = Math.cos(t * 0.03) * (45 * m) + 5;
    state.camera.position.y = (25 * m) + Math.sin(t * 0.06) * (4 * m);
    state.camera.lookAt(0, 5, 0);
  });
  return null;
}

export default function PurpleWaves3D() {
  const [enabled, setEnabled] = useState(false)
  const [inView, setInView] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEnabled(shouldEnable3D())
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting)
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (!enabled) return null

  return (
    <div ref={containerRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none bg-[#fafafa] z-0 overflow-hidden">
      <Canvas
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: [0, 40, 60], fov: 45 }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          // Prevent the page from crashing when the GPU yanks the WebGL context
          // (e.g. tab backgrounding, driver reset). Calling preventDefault lets
          // R3F attempt context restoration instead of tearing down the canvas.
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
        }}
      >
        <fog attach="fog" args={['#fafafa', 50, 180]} />
        <CameraRig />
        <BlueprintGrid />
        <EventArchitecture />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}


