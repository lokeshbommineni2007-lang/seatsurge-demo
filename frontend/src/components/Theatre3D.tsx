import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TheatreLayoutId } from '../utils/theatreLayouts';

export interface SeatInfo {
  seat_id: string;
  row: string;
  number: number;
  tier: 'VIP' | 'PREMIUM' | 'STANDARD';
  price: number;
  status: 'AVAILABLE' | 'HELD' | 'SOLD';
  held_by?: string;
  expires_at?: number;
}

interface Theatre3DProps {
  seatsMap: Map<string, SeatInfo>;
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  cameraMode: 'OVERVIEW' | 'POV' | 'AISLE';
  activeSeatId: string | null;
  onSetCameraMode: (mode: 'OVERVIEW' | 'POV' | 'AISLE') => void;
  eventTitle?: string;
  venueName?: string;
  layoutId?: TheatreLayoutId;
}

// Seat colors per tier & state
const COLOR_VIP = new THREE.Color('#f59e0b');        // Royal Gold/Amber leather (Rows A-D)
const COLOR_PREMIUM = new THREE.Color('#10b981');    // Emerald velvet (Rows E-M)
const COLOR_STANDARD = new THREE.Color('#3b82f6');   // Royal Sapphire velvet (Rows N-Y)
const COLOR_HELD = new THREE.Color('#f43f5e');       // Pulsing rose/amber
const COLOR_SOLD = new THREE.Color('#1e293b');       // Matte charcoal slate
const COLOR_SELECTED = new THREE.Color('#00f0ff');   // Neon electric cyan

// High-definition cinema screen texture generator
function createCinemaScreenTexture(
  title = 'RAMAYANA (3D)',
  venue = 'PRASADS MULTIPLEX',
  layoutId: TheatreLayoutId = 'PRASADS_PCX'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  // 1. Cinematic dark background with atmospheric radial vignette
  const bgGrad = ctx.createRadialGradient(960, 540, 80, 960, 540, 1100);
  bgGrad.addColorStop(0, '#1a1429');
  bgGrad.addColorStop(0.5, '#0a0814');
  bgGrad.addColorStop(1, '#030208');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // 2. Cinematic atmospheric laser lights from top
  const laserColors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b'];
  laserColors.forEach((color, i) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.30;
    ctx.beginPath();
    ctx.moveTo(960, 0);
    ctx.lineTo(150 + i * 420, 1080);
    ctx.stroke();
  });
  ctx.globalAlpha = 1.0;

  // 3. Screen Bezel & Glowing Neon Rim
  ctx.strokeStyle = layoutId === 'ALLU_KOKAPET' ? '#0066cc' : '#38bdf8';
  ctx.lineWidth = 14;
  ctx.shadowColor = layoutId === 'ALLU_KOKAPET' ? '#0066cc' : '#0284c7';
  ctx.shadowBlur = 40;
  ctx.strokeRect(30, 30, 1860, 1020);
  ctx.shadowBlur = 0;

  // 4. Header Badges
  ctx.fillStyle = '#f43f5e';
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ FLASH SALE LIVE • HYDERABAD MULTIPLEX', 960, 190);

  // 5. Main Title
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 82px "Plus Jakarta Sans", sans-serif';
  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 50;
  const displayTitle = title.length > 28 ? title.slice(0, 26) + '...' : title;
  ctx.fillText(displayTitle.toUpperCase(), 960, 430);
  ctx.shadowBlur = 0;

  // 6. Subtitle / Venue
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 46px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(venue.toUpperCase(), 960, 560);

  // 7. Cinema Technology Badges (Authentic per Hyderabad Theatre)
  let techLine = 'IMAX DUAL 4K LASER  •  DOLBY ATMOS 64-CHANNEL  •  STADIUM ACOUSTICS';
  let formatLine = '✦ 70MM HIGH FRAME RATE  •  COLOR BY DOLBY VISION ✦';

  if (layoutId === 'PRASADS_PCX') {
    techLine = '100FT CURVED PCX GIANT SCREEN  •  BARCO 4K LASER  •  DOLBY ATMOS 7.1.4';
    formatLine = '✦ GOLDEN AMPHITHEATER  •  DUAL GLASS 3D ✦';
  } else if (layoutId === 'PRASADS_SCREEN4') {
    techLine = 'SCREEN 4  •  BARCO 4K LASER PROJECTION  •  DOLBY DIGITAL 7.1';
    formatLine = '✦ EXECUTIVE QUAD-BLOCK SEATING  •  3D GLASSES ✦';
  } else if (layoutId === 'ALLU_KOKAPET') {
    techLine = 'DOLBY VISION 4K DUAL LASER  •  DOLBY ATMOS 64-CHANNEL  •  STADIUM SOUND';
    formatLine = '✦ DIRECTOR CHOICE VIP RECLINERS  •  DOLBY CINEMA 3D ✦';
  } else if (layoutId === 'AAA_AMEERPET') {
    techLine = 'ALLU ARJUN AAA CINEMAS  •  BARCO RGB 4K LASER  •  DOLBY ATMOS';
    formatLine = '✦ MOTORIZED LUXURY RECLINER LOUNGE & FRONT LOUNGERS ✦';
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '32px "JetBrains Mono", monospace';
  ctx.fillText(techLine, 960, 720);

  // 8. Cinema Format Badges
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.fillText(formatLine, 960, 880);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const Theatre3D: React.FC<Theatre3DProps> = ({
  seatsMap,
  selectedSeats,
  onToggleSeat,
  cameraMode,
  activeSeatId,
  onSetCameraMode,
  eventTitle,
  venueName,
  layoutId = 'PRASADS_PCX'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const seatPositionsRef = useRef<Map<number, { x: number; y: number; z: number; seatId: string; tier: string }>>(new Map());
  const seatIdToIndexRef = useRef<Map<string, number>>(new Map());

  const [hoveredSeat, setHoveredSeat] = useState<{ seatId: string; x: number; y: number; tier: string; price: number } | null>(null);

  // Default cinematic perspective looking down into the amphitheatre seating bowl and curved screen
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 26, 56));
  const targetCamLookRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 10, -20));

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060810');
    scene.fog = new THREE.FogExp2('#060810', 0.005);
    sceneRef.current = scene;

    // 2. Camera: Wide cinematic focal length positioned above and behind the tiered bowl
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1000);
    camera.position.set(0, 26, 56);
    camera.lookAt(0, 10, -20);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Architectural Lighting System
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.65);
    scene.add(ambientLight);

    // Dynamic screen point light casting blue/cyan illumination onto chairs
    const screenLight = new THREE.PointLight('#38bdf8', 4.5, 130);
    screenLight.position.set(0, 20, -36);
    scene.add(screenLight);

    // Overhead subtle stadium lighting
    const topLight = new THREE.DirectionalLight('#e2e8f0', 0.85);
    topLight.position.set(0, 75, 20);
    topLight.castShadow = true;
    scene.add(topLight);

    // Warm amber wall sconces along acoustic side walls
    const sconceColors = ['#f59e0b', '#fbbf24'];
    for (let side of [-1, 1]) {
      for (let z = -35; z <= 55; z += 18) {
        const sconce = new THREE.PointLight(sconceColors[Math.abs(z) % 2], 1.6, 22);
        sconce.position.set(side * 52, 12, z);
        scene.add(sconce);

        const fixtureGeo = new THREE.BoxGeometry(0.5, 2.2, 0.5);
        const fixtureMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
        const fixtureMesh = new THREE.Mesh(fixtureGeo, fixtureMat);
        fixtureMesh.position.set(side * 52, 12, z);
        scene.add(fixtureMesh);
      }
    }

    // 5. Auditorium Architecture: Side Acoustic Walls & Floor
    const wallGeo = new THREE.BoxGeometry(2, 60, 160);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#0f111a',
      roughness: 0.85,
      metalness: 0.1
    });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-53, 30, 10);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(53, 30, 10);
    scene.add(rightWall);

    // High ceiling baffles
    const ceilingGeo = new THREE.BoxGeometry(110, 1, 160);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: '#07080f', roughness: 0.95 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, 60, 10);
    scene.add(ceiling);

    // Carpet floor
    const floorGeo = new THREE.PlaneGeometry(160, 180);
    const floorMat = new THREE.MeshStandardMaterial({ color: '#090b14', roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 6. Giant Curved Cinema Screen (Tailored per Hyderabad Multiplex)
    const screenTexture = createCinemaScreenTexture(eventTitle, venueName, layoutId);
    let screenGeo: THREE.BufferGeometry;
    if (layoutId === 'PRASADS_PCX') {
      const plane = new THREE.PlaneGeometry(74, 38, 32, 1);
      const pos = plane.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        // Realistic 100ft curved amphitheatre screen bend
        const bend = Math.cos((x / 37) * (Math.PI / 2.6)) * 4.5;
        pos.setZ(i, -bend + 4.5);
      }
      plane.computeVertexNormals();
      screenGeo = plane;
    } else {
      screenGeo = new THREE.PlaneGeometry(64, 33);
    }

    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTexture,
      emissive: '#0f172a',
      emissiveMap: screenTexture,
      emissiveIntensity: 0.55,
      roughness: 0.15
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 20, -50);
    scene.add(screenMesh);

    // Screen frame
    const frameGeo = new THREE.BoxGeometry(layoutId === 'PRASADS_PCX' ? 76 : 66, layoutId === 'PRASADS_PCX' ? 40 : 35, 1.5);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#06080e', roughness: 0.95 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 20, -51);
    scene.add(frameMesh);

    // Stage platform
    const stageGeo = new THREE.BoxGeometry(78, 2.5, 18);
    const stageMat = new THREE.MeshStandardMaterial({ color: '#10121d', roughness: 0.6 });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.set(0, 1.25, -42);
    scene.add(stageMesh);

    // Glowing stage neon ribbon: "All eyes this way: SCREEN"
    const neonGeo = new THREE.BoxGeometry(78, 0.4, 0.4);
    const neonColor = layoutId === 'ALLU_KOKAPET' ? '#0066cc' : layoutId === 'AAA_AMEERPET' ? '#f59e0b' : '#00f0ff';
    const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });
    const neon = new THREE.Mesh(neonGeo, neonMat);
    neon.position.set(0, 2.6, -33);
    scene.add(neon);

    // 7. Soft Atmospheric Ambience (Subtle screen glow)
    const projectorGlow = new THREE.PointLight(layoutId === 'ALLU_KOKAPET' ? '#3b82f6' : '#38bdf8', 1.2, 80);
    projectorGlow.position.set(0, 35, 30);
    scene.add(projectorGlow);

    // 8. Authentic Multiplex Seating Architecture (InstancedMesh)
    interface Seat3DItem {
      seatId: string;
      x: number;
      y: number;
      z: number;
      tier: 'VIP' | 'PREMIUM' | 'STANDARD';
      tierColor: THREE.Color;
      scaleX?: number;
      scaleY?: number;
      scaleZ?: number;
    }
    const seatsToPlace: Seat3DItem[] = [];

    if (layoutId === 'PRASADS_PCX') {
      // ─── 1. PRASADS PCX: Curved Grand Amphitheater, Rows A to N ───────────
      const pcxRows = [
        { row: 'A', start: 1, end: 34 },
        { row: 'B', start: 1, end: 39 },
        { row: 'C', start: 1, end: 41 },
        { row: 'D', start: 1, end: 45 },
        { row: 'E', start: 1, end: 46 },
        { row: 'F', start: 4, end: 46 },
        { row: 'G', start: 4, end: 46 },
        { row: 'H', start: 4, end: 46 },
        { row: 'J', start: 9, end: 46 },
        { row: 'K', start: 9, end: 46 },
        { row: 'L', start: 9, end: 46 },
        { row: 'M', start: 9, end: 46 },
        { row: 'N', start: 9, end: 46 }
      ];
      pcxRows.forEach(({ row, start, end }, rIdx) => {
        const radius = 25 + (rIdx * 1.55);
        const elevation = 1.2 + (rIdx * 0.48);
        const arcSpread = Math.PI * 0.52;
        const count = end - start + 1;
        for (let num = start; num <= end; num++) {
          const seatId = `${row}-${num}`;
          const t = (num - start) / Math.max(1, count - 1);
          let aisleShift = 0;
          if (t > 0.66) aisleShift = 0.04;
          else if (t > 0.33) aisleShift = 0.02;
          const angle = -arcSpread / 2 + (t * arcSpread) + aisleShift;
          const x = radius * Math.sin(angle);
          const z = -26 + (radius * Math.cos(angle));
          seatsToPlace.push({
            seatId,
            x,
            y: elevation,
            z,
            tier: 'VIP',
            tierColor: COLOR_VIP
          });
        }
      });
    } else if (layoutId === 'PRASADS_SCREEN4') {
      // ─── 2. PRASADS SCREEN 4: 4-Quadrant Layout with Crossover Walkway ─────
      const p4Rows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
      p4Rows.forEach((row, rIdx) => {
        const isUpper = rIdx <= 5; // A to F
        const maxSeat = (row === 'N') ? 24 : 28;
        const half = Math.floor(maxSeat / 2);
        const crossoverGap = rIdx >= 6 ? 4.2 : 0;
        const z = -20 + (rIdx * 1.5) + crossoverGap;
        const y = 1.0 + (rIdx * 0.45);
        const tier = isUpper ? 'PREMIUM' : 'STANDARD';
        const tierColor = isUpper ? COLOR_PREMIUM : COLOR_STANDARD;

        for (let num = 1; num <= maxSeat; num++) {
          const seatId = `${row}-${num}`;
          let x = 0;
          if (num <= half) {
            x = -((half - num + 0.5) * 0.82) - 1.6;
          } else {
            x = ((num - half - 0.5) * 0.82) + 1.6;
          }
          const seatZ = z + (x * x) * 0.003;
          seatsToPlace.push({
            seatId,
            x,
            y,
            z: seatZ,
            tier,
            tierColor
          });
        }
      });
    } else if (layoutId === 'ALLU_KOKAPET') {
      // ─── 3. ALLU KOKAPET: 3-Column + Director's Choice in Row J ───────────
      const alluRows = ['B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'];
      alluRows.forEach((row, rIdx) => {
        const isDirectorChoice = row === 'J';
        const isLower = rIdx >= 9;
        const maxSeat = isDirectorChoice ? 28 : (isLower ? 33 : 37);
        const z = -22 + (rIdx * 1.45);
        const y = 1.1 + (rIdx * 0.46) + (isDirectorChoice ? 0.35 : 0);

        if (isDirectorChoice) {
          for (let num = 1; num <= maxSeat; num++) {
            const seatId = `J-${num}`;
            const x = (num - (maxSeat + 1) / 2) * 1.05;
            const seatZ = z + (x * x) * 0.002;
            seatsToPlace.push({
              seatId,
              x,
              y,
              z: seatZ,
              tier: 'VIP',
              tierColor: COLOR_VIP,
              scaleX: 1.3,
              scaleY: 1.2,
              scaleZ: 1.3
            });
          }
        } else {
          for (let num = 1; num <= maxSeat; num++) {
            const seatId = `${row}-${num}`;
            let x = 0;
            if (num <= 11) {
              x = 9.5 + ((11 - num) * 0.8);
            } else if (num <= 25) {
              x = (num - 18.5) * 0.8;
            } else {
              x = -9.5 - ((num - 26) * 0.8);
            }
            const seatZ = z + (x * x) * 0.0025;
            seatsToPlace.push({
              seatId,
              x,
              y,
              z: seatZ,
              tier: 'PREMIUM',
              tierColor: COLOR_PREMIUM
            });
          }
        }
      });
    } else if (layoutId === 'AAA_AMEERPET') {
      // ─── 4. AAA AMEERPET: Recliners (Row A), Gold (B-N), Loungers (P) ────
      // Row A: Top luxury recliners
      for (let num = 1; num <= 20; num++) {
        const seatId = `A-${num}`;
        const x = (num - 10.5) * 1.25;
        seatsToPlace.push({
          seatId,
          x,
          y: 8.2,
          z: 8.5,
          tier: 'VIP',
          tierColor: COLOR_VIP,
          scaleX: 1.35,
          scaleY: 1.2,
          scaleZ: 1.35
        });
      }
      // Rows B & C: Balcony Gold
      ['B', 'C'].forEach((row, rIdx) => {
        for (let num = 1; num <= 26; num++) {
          const seatId = `${row}-${num}`;
          const x = (num - 13.5) * 0.85;
          seatsToPlace.push({
            seatId,
            x,
            y: 7.2 - rIdx * 0.5,
            z: 5.5 - rIdx * 1.5,
            tier: 'PREMIUM',
            tierColor: COLOR_PREMIUM
          });
        }
      });
      // Rows D to N: 4-Column Gold
      const mainRows = ['D','E','F','G','H','I','J','K','L','M','N'];
      mainRows.forEach((row, rIdx) => {
        const z = 0.5 - (rIdx * 1.4);
        const y = 5.2 - (rIdx * 0.42);
        for (let num = 1; num <= 34; num++) {
          const seatId = `${row}-${num}`;
          let x = 0;
          if (num <= 4) {
            x = -14.0 - ((4 - num) * 0.75);
          } else if (num <= 17) {
            x = -1.5 - ((17 - num) * 0.78);
          } else if (num <= 30) {
            x = 1.5 + ((num - 18) * 0.78);
          } else {
            x = 14.0 + ((num - 31) * 0.75);
          }
          seatsToPlace.push({
            seatId,
            x,
            y,
            z,
            tier: 'STANDARD',
            tierColor: COLOR_STANDARD
          });
        }
      });
      // Row P: Front Loungers
      for (let num = 1; num <= 26; num++) {
        const seatId = `P-${num}`;
        const x = (num - 13.5) * 0.95;
        seatsToPlace.push({
          seatId,
          x,
          y: 0.6,
          z: -16.5,
          tier: 'PREMIUM',
          tierColor: COLOR_PREMIUM,
          scaleX: 1.25,
          scaleY: 0.75,
          scaleZ: 1.4
        });
      }
    } else {
      // ─── 5. Fallback Generic Seating Bowl ──────────────────────────────────
      const genericRows = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y'];
      genericRows.forEach((row, rIdx) => {
        const radius = 24 + (rIdx * 1.35);
        const elevation = 1.2 + (rIdx * 0.38);
        const arcSpread = Math.PI * 0.50;
        const tier = rIdx < 4 ? 'VIP' : rIdx < 13 ? 'PREMIUM' : 'STANDARD';
        const tierColor = tier === 'VIP' ? COLOR_VIP : tier === 'PREMIUM' ? COLOR_PREMIUM : COLOR_STANDARD;
        for (let s = 1; s <= 48; s++) {
          const seatId = `${row}-${s}`;
          let aisleGap = s > 32 ? 0.05 : s > 16 ? 0.025 : 0;
          const t = (s - 1) / 47;
          const angle = -arcSpread / 2 + (t * arcSpread) + aisleGap;
          const x = radius * Math.sin(angle);
          const z = -30 + (radius * Math.cos(angle));
          seatsToPlace.push({
            seatId,
            x,
            y: elevation,
            z,
            tier,
            tierColor
          });
        }
      });
    }

    const TOTAL_SEATS = seatsToPlace.length;
    const chairGeo = new THREE.BoxGeometry(0.55, 0.65, 0.55);
    const chairMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.15
    });
    const instancedMesh = new THREE.InstancedMesh(chairGeo, chairMat, TOTAL_SEATS);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    instancedMeshRef.current = instancedMesh;

    seatPositionsRef.current.clear();
    seatIdToIndexRef.current.clear();

    const dummy = new THREE.Object3D();
    seatsToPlace.forEach((s, idx) => {
      dummy.position.set(s.x, s.y, s.z);
      if (s.scaleX || s.scaleY || s.scaleZ) {
        dummy.scale.set(s.scaleX || 1, s.scaleY || 1, s.scaleZ || 1);
      } else {
        dummy.scale.set(1, 1, 1);
      }
      dummy.lookAt(0, 16, -50);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(idx, dummy.matrix);
      instancedMesh.setColorAt(idx, s.tierColor);

      seatPositionsRef.current.set(idx, { x: s.x, y: s.y, z: s.z, seatId: s.seatId, tier: s.tier });
      seatIdToIndexRef.current.set(s.seatId, idx);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    scene.add(instancedMesh);

    // 9. Smooth Orbit Controls
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const raycaster = new THREE.Raycaster();

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Real-Time Hover Tooltip Raycaster
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObject(instancedMesh);
      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const info = seatPositionsRef.current.get(intersects[0].instanceId);
        if (info) {
          const seat = seatsMap.get(info.seatId);
          setHoveredSeat({
            seatId: info.seatId,
            x: e.clientX,
            y: e.clientY,
            tier: info.tier,
            price: seat?.price || (info.tier === 'VIP' ? 400 : info.tier === 'PREMIUM' ? 325 : 295)
          });
        }
      } else {
        setHoveredSeat(null);
      }

      if (isMouseDown && cameraMode === 'OVERVIEW') {
        const deltaX = (e.clientX - prevMouseX) * 0.0035;
        const deltaY = (e.clientY - prevMouseY) * 0.0035;

        const pos = targetCamPosRef.current;
        const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        let theta = Math.atan2(pos.x, pos.z) - deltaX;

        pos.x = r * Math.sin(theta);
        pos.z = r * Math.cos(theta);
        // Dragging UP (deltaY < 0) raises the camera pitch up; dragging DOWN lowers it
        pos.y = Math.max(8, Math.min(65, pos.y - deltaY * 24));

        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onMouseUp = () => { isMouseDown = false; };

    const onWheel = (e: WheelEvent) => {
      if (cameraMode === 'OVERVIEW') {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.05 : 0.95;
        targetCamPosRef.current.x *= factor;
        targetCamPosRef.current.z *= factor;
        targetCamPosRef.current.y = Math.max(10, Math.min(65, targetCamPosRef.current.y * factor));
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObject(instancedMesh);

      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const instanceId = intersects[0].instanceId;
        const info = seatPositionsRef.current.get(instanceId);
        if (info) {
          onToggleSeat(info.seatId);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // 10. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      camera.position.lerp(targetCamPosRef.current, 0.08);

      const lookTarget = targetCamLookRef.current;
      camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', onResize);
    setTimeout(onResize, 50);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [layoutId, eventTitle, venueName]);

  // Update Seat Instance Colors
  useEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh || !mesh.instanceColor) return;

    seatIdToIndexRef.current.forEach((idx, seatId) => {
      const seat = seatsMap.get(seatId);
      const isSelected = selectedSeats.includes(seatId);
      const info = seatPositionsRef.current.get(idx);

      let baseColor = COLOR_STANDARD;
      if (info?.tier === 'VIP') baseColor = COLOR_VIP;
      else if (info?.tier === 'PREMIUM') baseColor = COLOR_PREMIUM;

      if (isSelected) {
        mesh.setColorAt(idx, COLOR_SELECTED);
      } else if (!seat || seat.status === 'AVAILABLE') {
        mesh.setColorAt(idx, baseColor);
      } else if (seat.status === 'HELD') {
        mesh.setColorAt(idx, COLOR_HELD);
      } else if (seat.status === 'SOLD') {
        mesh.setColorAt(idx, COLOR_SOLD);
      }
    });

    mesh.instanceColor.needsUpdate = true;
  }, [seatsMap, selectedSeats]);

  // Camera Mode Animations
  useEffect(() => {
    if (cameraMode === 'POV' && activeSeatId) {
      const idx = seatIdToIndexRef.current.get(activeSeatId);
      if (idx !== undefined) {
        const pos = seatPositionsRef.current.get(idx);
        if (pos) {
          // Camera swoops to selected seat eye-level
          targetCamPosRef.current.set(pos.x, pos.y + 1.0, pos.z);
          // Look straight at movie screen center
          targetCamLookRef.current.set(0, 20, -50);
        }
      }
    } else if (cameraMode === 'AISLE') {
      targetCamPosRef.current.set(-14, 5, 12);
      targetCamLookRef.current.set(0, 16, -48);
    } else {
      // OVERVIEW: Stadium bowl overview centered above tiered seats
      targetCamPosRef.current.set(0, 26, 56);
      targetCamLookRef.current.set(0, 10, -20);
    }
  }, [cameraMode, activeSeatId]);

  return (
    <div className="absolute inset-0 w-full h-full select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Real-time Seat Hover Tooltip */}
      {hoveredSeat && (
        <div
          className="fixed pointer-events-none z-50 bg-[#0c101c]/95 backdrop-blur-2xl border border-cyan-400/30 px-3.5 py-2 rounded-xl shadow-2xl shadow-cyan-500/20 text-xs font-mono text-white transform -translate-x-1/2 -translate-y-14 transition-transform duration-75"
          style={{ left: hoveredSeat.x, top: hoveredSeat.y }}
        >
          <div className="font-extrabold text-cyan-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Seat {hoveredSeat.seatId}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-sans font-semibold">
              {hoveredSeat.tier}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5 font-sans flex items-center justify-between gap-3">
            <span className="font-bold text-white font-mono">₹{hoveredSeat.price.toLocaleString()}</span>
            <span className="text-cyan-400 text-[10px]">Click to Select</span>
          </div>
        </div>
      )}
    </div>
  );
};
