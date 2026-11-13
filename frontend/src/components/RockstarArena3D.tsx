import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SeatInfo } from './Theatre3D';

interface RockstarArena3DProps {
  seatsMap: Map<string, SeatInfo>;
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  cameraMode: 'OVERVIEW' | 'POV' | 'AISLE';
  activeSeatId: string | null;
  onSetCameraMode: (mode: 'OVERVIEW' | 'POV' | 'AISLE') => void;
  eventTitle?: string;
  venueName?: string;
}

// Concert Colors per tier & status
const COLOR_FAN_PIT = new THREE.Color('#f59e0b');      // Golden Amber Fan Pit (Rows A-C)
const COLOR_DIAMOND = new THREE.Color('#10b981');      // Emerald / Cyan Diamond Tier (Rows D-I)
const COLOR_GRANDSTAND = new THREE.Color('#3b82f6');   // Royal Sapphire Grandstand (Rows J-Y)
const COLOR_HELD = new THREE.Color('#f43f5e');         // Pulsing Rose / Held
const COLOR_SOLD = new THREE.Color('#1e2333');         // Charcoal Slate / Sold
const COLOR_SELECTED = new THREE.Color('#00f0ff');     // Electric Neon Cyan Selection
const COLOR_HOVER = new THREE.Color('#fbbf24');        // Bright Gold Hover

const ROWS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y'];
const SEATS_PER_ROW = 48;
const TOTAL_SEATS = ROWS.length * SEATS_PER_ROW; // 1,200 seats

// Seat Position Calculator around Rockstar Center Stage (240° horseshoe stadium bowl)
function getRockstarSeatCoordinates(rowIdx: number, seatNum: number): { x: number; y: number; z: number; rotY: number } {
  // Center stage is at (0, 0, 0)
  // Distance from center stage increases with row: Row A is close (radius ~18), Row Y is outer grandstand (~62)
  const radius = 17 + (rowIdx * 1.85);
  // Stadium elevation steps up as distance increases
  const y = 1.0 + Math.pow(rowIdx / 24, 1.4) * 16.5;

  // Seats spread in a 230° arc around the front and sides of the center stage
  // Seat 1 is far left, seat 48 is far right, seat 24 is dead center
  const totalAngle = Math.PI * 1.35; // 243 degrees
  const angleStep = totalAngle / (SEATS_PER_ROW - 1);
  const angle = -totalAngle / 2 + (seatNum - 1) * angleStep;

  // Add small central aisle gap between seat 24 and 25
  const aisleOffset = (seatNum > 24 ? 0.035 : -0.035);
  const adjustedAngle = angle + aisleOffset;

  // Polar to Cartesian
  const x = Math.sin(adjustedAngle) * radius;
  const z = Math.cos(adjustedAngle) * radius;

  // Each seat rotates to face directly at Rockstar Anirudh on center stage (0, 2.5, 0)
  const rotY = Math.atan2(-x, -z);

  return { x, y, z, rotY };
}

export const RockstarArena3D: React.FC<RockstarArena3DProps> = ({
  seatsMap,
  selectedSeats,
  onToggleSeat,
  cameraMode,
  activeSeatId,
  onSetCameraMode,
  eventTitle = 'ANIRUDH: HUKUM WORLD TOUR',
  venueName = 'GMR ARENA • 360° ROCKSTAR STADIUM'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredSeat, setHoveredSeat] = useState<SeatInfo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Three.js runtime references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const sightlineLineRef = useRef<THREE.Line | null>(null);
  const lasersGroupRef = useRef<THREE.Group | null>(null);
  const rockstarGroupRef = useRef<THREE.Group | null>(null);
  const spotlightsRef = useRef<THREE.SpotLight[]>([]);

  // Camera Orbit Physics state
  const cameraStateRef = useRef({
    currentPos: new THREE.Vector3(0, 32, 54),
    targetPos: new THREE.Vector3(0, 32, 54),
    currentLookAt: new THREE.Vector3(0, 4, 0),
    targetLookAt: new THREE.Vector3(0, 4, 0),
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    azimuth: 0,
    elevation: 0.55,
    distance: 58
  });

  const seatIndexMapRef = useRef<Map<number, string>>(new Map());
  const seatIdToIndexRef = useRef<Map<string, number>>(new Map());

  // ─── Three.js Scene Setup ──────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 64);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05070e');
    scene.fog = new THREE.FogExp2('#05070e', 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 300);
    camera.position.set(0, 32, 54);
    camera.lookAt(0, 4, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ResizeObserver to dynamically update viewport
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    ro.observe(container);

    // ─── Concert Arena Stage Architecture ────────────────────────────
    // 1. Stadium Floor
    const floorGeo = new THREE.CircleGeometry(75, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#080a14',
      roughness: 0.85,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // 2. Center Rockstar Stage (Octagonal / Circular Elevated Podium)
    const stageRadius = 9;
    const stageHeight = 2.2;
    const stageGeo = new THREE.CylinderGeometry(stageRadius, stageRadius + 0.6, stageHeight, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: '#121422',
      roughness: 0.35,
      metalness: 0.7
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, stageHeight / 2, 0);
    scene.add(stage);

    // Glowing Stage Rim Ring (Neon Cyan & Crimson)
    const rimGeo = new THREE.TorusGeometry(stageRadius + 0.1, 0.22, 16, 64);
    const rimMat = new THREE.MeshBasicMaterial({ color: '#f43f5e' });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, stageHeight + 0.05, 0);
    scene.add(rim);

    // Center Stage Decal (Rockstar Anirudh Hukum Tour)
    const decalCanvas = document.createElement('canvas');
    decalCanvas.width = 1024;
    decalCanvas.height = 1024;
    const dctx = decalCanvas.getContext('2d')!;
    dctx.fillStyle = '#10121d';
    dctx.fillRect(0, 0, 1024, 1024);

    // Glowing Neon Rings on stage floor
    dctx.strokeStyle = '#00f0ff';
    dctx.lineWidth = 14;
    dctx.beginPath();
    dctx.arc(512, 512, 460, 0, Math.PI * 2);
    dctx.stroke();

    dctx.strokeStyle = '#f43f5e';
    dctx.lineWidth = 8;
    dctx.beginPath();
    dctx.arc(512, 512, 430, 0, Math.PI * 2);
    dctx.stroke();

    // Bold typography
    dctx.fillStyle = '#ffffff';
    dctx.font = 'bold 54px system-ui, sans-serif';
    dctx.textAlign = 'center';
    dctx.fillText('⚡ ROCKSTAR ANIRUDH ⚡', 512, 380);

    dctx.fillStyle = '#f59e0b';
    dctx.font = '900 84px system-ui, sans-serif';
    dctx.fillText('HUKUM WORLD TOUR', 512, 512);

    dctx.fillStyle = '#38bdf8';
    dctx.font = 'bold 36px monospace';
    dctx.fillText('GMR ARENA • 360° CONCERT STADIUM', 512, 620);

    const stageDecalTex = new THREE.CanvasTexture(decalCanvas);
    const stageDecalGeo = new THREE.CircleGeometry(stageRadius * 0.92, 32);
    const stageDecalMat = new THREE.MeshBasicMaterial({ map: stageDecalTex });
    const stageDecal = new THREE.Mesh(stageDecalGeo, stageDecalMat);
    stageDecal.rotation.x = -Math.PI / 2;
    stageDecal.position.set(0, stageHeight + 0.08, 0);
    scene.add(stageDecal);

    // ─── 3D ROCKSTAR ANIRUDH RAVICHANDER ON STAGE ──────────────────────
    const rockstarGroup = new THREE.Group();
    rockstarGroup.position.set(0, stageHeight + 0.1, 0);
    scene.add(rockstarGroup);
    rockstarGroupRef.current = rockstarGroup;

    // Stylized Anirudh Figure
    // 1. Black Stage Pants
    const legMat = new THREE.MeshStandardMaterial({ color: '#11131a', roughness: 0.8 });
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 1.8), legMat);
    leftLeg.position.set(-0.35, 0.9, 0);
    rockstarGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 1.8), legMat);
    rightLeg.position.set(0.35, 0.9, 0);
    rockstarGroup.add(rightLeg);

    // 2. Rockstar Red & Black Leather Jacket (Torso)
    const jacketMat = new THREE.MeshStandardMaterial({
      color: '#e11d48',
      roughness: 0.4,
      metalness: 0.3
    });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.38, 1.6, 16), jacketMat);
    torso.position.set(0, 2.5, 0);
    rockstarGroup.add(torso);

    // 3. Head with stylish sunglasses and undercut hairstyle
    const skinMat = new THREE.MeshStandardMaterial({ color: '#f3c59a', roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), skinMat);
    head.position.set(0, 3.65, 0);
    rockstarGroup.add(head);

    // Rockstar Shades / Sunglasses
    const glassesMat = new THREE.MeshBasicMaterial({ color: '#09090b' });
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.18), glassesMat);
    glasses.position.set(0, 3.68, 0.28);
    rockstarGroup.add(glasses);

    // Hair
    const hairMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 });
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.52), hairMat);
    hair.position.set(0, 3.92, -0.05);
    rockstarGroup.add(hair);

    // 4. Synthesizer Keyboard Workstation (Anirudh's Signature Live Rig)
    const synthRigGroup = new THREE.Group();
    synthRigGroup.position.set(0, 0, 1.1);

    // Chrome X-Stand
    const chromeMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.1 });
    const standLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), chromeMat);
    standLeg1.rotation.z = 0.35;
    standLeg1.position.set(-0.35, 1.1, 0);
    synthRigGroup.add(standLeg1);

    const standLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), chromeMat);
    standLeg2.rotation.z = -0.35;
    standLeg2.position.set(0.35, 1.1, 0);
    synthRigGroup.add(standLeg2);

    // Lower Tier Keyboard (Roland Fantom)
    const keyboardMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.5 });
    const lowerKey = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.55), keyboardMat);
    lowerKey.position.set(0, 2.1, 0);
    synthRigGroup.add(lowerKey);

    // Upper Tier Synth (Nord Stage)
    const upperKeyMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.4 });
    const upperKey = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 0.45), upperKeyMat);
    upperKey.rotation.x = 0.2;
    upperKey.position.set(0, 2.65, -0.15);
    synthRigGroup.add(upperKey);

    // Glowing Synth Keys (Neon Blue LED)
    const keysGlowMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const keysGlow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.2), keysGlowMat);
    keysGlow.position.set(0, 2.2, 0.12);
    synthRigGroup.add(keysGlow);

    // Microphone & Boom Stand
    const micStand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.2), chromeMat);
    micStand.position.set(0.7, 1.6, 0.6);
    synthRigGroup.add(micStand);

    const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), chromeMat);
    micHead.position.set(0.4, 3.4, 0.4);
    synthRigGroup.add(micHead);

    rockstarGroup.add(synthRigGroup);

    // Dual Subwoofer Line-Array Towers flanking the stage
    const speakerMat = new THREE.MeshStandardMaterial({ color: '#090a0f', roughness: 0.8 });
    const speakerL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.2, 1.2), speakerMat);
    speakerL.position.set(-stageRadius + 1.8, 2.1, 0);
    scene.add(speakerL);

    const speakerR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.2, 1.2), speakerMat);
    speakerR.position.set(stageRadius - 1.8, 2.1, 0);
    scene.add(speakerR);

    // ─── Overhead Concert Lighting Truss & Followspots ───────────────
    const trussRadius = 9.5;
    const trussHeight = 22;
    const trussGeo = new THREE.TorusGeometry(trussRadius, 0.35, 12, 48);
    const trussMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8, roughness: 0.3 });
    const truss = new THREE.Mesh(trussGeo, trussMat);
    truss.rotation.x = Math.PI / 2;
    truss.position.set(0, trussHeight, 0);
    scene.add(truss);

    // 4 High-Powered Follow-Spotlights converging on Anirudh
    const spotColors = ['#f43f5e', '#00f0ff', '#f59e0b', '#a855f7'];
    const spots: THREE.SpotLight[] = [];

    spotColors.forEach((col, idx) => {
      const angle = (idx * Math.PI) / 2;
      const spot = new THREE.SpotLight(col, 25, 60, Math.PI / 7, 0.6, 1.2);
      spot.position.set(Math.cos(angle) * (trussRadius - 1), trussHeight - 0.5, Math.sin(angle) * (trussRadius - 1));
      spot.target = rockstarGroup;
      scene.add(spot);
      spots.push(spot);
    });
    spotlightsRef.current = spots;

    // Ambient concert lights
    const ambientLight = new THREE.AmbientLight('#1e1b4b', 1.8);
    scene.add(ambientLight);

    const stageKeyLight = new THREE.PointLight('#ffffff', 4, 25);
    stageKeyLight.position.set(0, stageHeight + 5, 2);
    scene.add(stageKeyLight);

    // ─── Dynamic Sweeping Concert Lasers ─────────────────────────────
    const lasersGroup = new THREE.Group();
    scene.add(lasersGroup);
    lasersGroupRef.current = lasersGroup;

    const laserColors = ['#00f0ff', '#f43f5e', '#a855f7', '#10b981', '#f59e0b', '#3b82f6'];
    const laserCount = 12;

    for (let i = 0; i < laserCount; i++) {
      const angle = (i * Math.PI * 2) / laserCount;
      const targetRadius = 65;
      const targetY = 3 + Math.sin(i * 1.5) * 8;
      const targetX = Math.cos(angle) * targetRadius;
      const targetZ = Math.sin(angle) * targetRadius;

      const points = [
        new THREE.Vector3(0, trussHeight - 1, 0),
        new THREE.Vector3(targetX, targetY, targetZ)
      ];
      const laserGeo = new THREE.BufferGeometry().setFromPoints(points);
      const laserMat = new THREE.LineBasicMaterial({
        color: laserColors[i % laserColors.length],
        linewidth: 2,
        transparent: true,
        opacity: 0.85
      });
      const laserLine = new THREE.Line(laserGeo, laserMat);
      lasersGroup.add(laserLine);
    }

    // ─── 1,200 Interactive Stadium Seats (InstancedMesh) ─────────────
    const seatGeo = new THREE.BoxGeometry(0.72, 0.75, 0.72);
    const seatMat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.25
    });

    const instancedMesh = new THREE.InstancedMesh(seatGeo, seatMat, TOTAL_SEATS);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3(1, 1, 1);

    const seatIndexMap = new Map<number, string>();
    const seatIdToIndex = new Map<string, number>();

    let idx = 0;
    for (let r = 0; r < ROWS.length; r++) {
      const rowLetter = ROWS[r];
      for (let s = 1; s <= SEATS_PER_ROW; s++) {
        const seatId = `${rowLetter}-${s}`;
        const coords = getRockstarSeatCoordinates(r, s);

        position.set(coords.x, coords.y, coords.z);
        rotation.set(0, coords.rotY, 0);
        matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);

        instancedMesh.setMatrixAt(idx, matrix);

        // Initial default color by tier
        let defaultColor = COLOR_GRANDSTAND;
        if (r <= 2) defaultColor = COLOR_FAN_PIT;
        else if (r <= 8) defaultColor = COLOR_DIAMOND;

        instancedMesh.setColorAt(idx, defaultColor);

        seatIndexMap.set(idx, seatId);
        seatIdToIndex.set(seatId, idx);
        idx++;
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;
    seatIndexMapRef.current = seatIndexMap;
    seatIdToIndexRef.current = seatIdToIndex;

    // ─── Laser Sightline Beam to Rockstar ────────────────────────────
    const sightlineMat = new THREE.LineBasicMaterial({
      color: '#00f0ff',
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    const sightlineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, stageHeight + 2.5, 0)
    ]);
    const sightlineLine = new THREE.Line(sightlineGeo, sightlineMat);
    sightlineLine.visible = false;
    scene.add(sightlineLine);
    sightlineLineRef.current = sightlineLine;

    // ─── Window Resize Handler ───────────────────────────────────────
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ─── Render Animation Loop (60 FPS) ──────────────────────────────
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // 1. Rockstar Anirudh Head-bobbing & Jamming Animation
      if (rockstarGroupRef.current) {
        // Head and body sway to the rock rhythm
        const beat = Math.sin(elapsedTime * 6.5);
        rockstarGroupRef.current.position.y = (stageHeight + 0.1) + Math.abs(beat) * 0.08;
        head.rotation.x = beat * 0.12;
        head.rotation.y = Math.cos(elapsedTime * 3.2) * 0.15;
      }

      // 2. Sweeping Arena Laser Movement
      if (lasersGroupRef.current) {
        lasersGroupRef.current.rotation.y = elapsedTime * 0.45;
      }

      // 3. Dynamic Spotlights Oscillating over Rockstar & Crowd
      spotlightsRef.current.forEach((spot, i) => {
        const offset = i * (Math.PI / 2);
        spot.intensity = 20 + Math.sin(elapsedTime * 4 + offset) * 8;
      });

      // 4. Smooth Camera Lerping
      const state = cameraStateRef.current;
      state.currentPos.lerp(state.targetPos, 0.08);
      state.currentLookAt.lerp(state.targetLookAt, 0.08);

      camera.position.copy(state.currentPos);
      camera.lookAt(state.currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
      renderer.dispose();
    };
  }, []);

  // ─── Update Colors from Redis SeatsMap & Selected Seats ────────────
  useEffect(() => {
    const instancedMesh = instancedMeshRef.current;
    if (!instancedMesh || !instancedMesh.instanceColor) return;

    seatIdToIndexRef.current.forEach((idx, seatId) => {
      const isSelected = selectedSeats.includes(seatId);
      const seatInfo = seatsMap.get(seatId);
      const [row] = seatId.split('-');
      const rIdx = ROWS.indexOf(row);

      let targetColor: THREE.Color;
      if (isSelected) {
        targetColor = COLOR_SELECTED;
      } else if (seatInfo?.status === 'SOLD') {
        targetColor = COLOR_SOLD;
      } else if (seatInfo?.status === 'HELD') {
        targetColor = COLOR_HELD;
      } else {
        // Tier default
        if (rIdx <= 2) targetColor = COLOR_FAN_PIT;
        else if (rIdx <= 8) targetColor = COLOR_DIAMOND;
        else targetColor = COLOR_GRANDSTAND;
      }

      instancedMesh.setColorAt(idx, targetColor);
    });

    instancedMesh.instanceColor.needsUpdate = true;
  }, [seatsMap, selectedSeats]);

  // ─── Camera Perspective Management ─────────────────────────────────
  useEffect(() => {
    const state = cameraStateRef.current;

    if (cameraMode === 'POV') {
      const targetSeat = activeSeatId || selectedSeats[0] || 'D-24';
      let row = 'D';
      let sNum = 24;
      if (targetSeat.includes('-')) {
        const parts = targetSeat.split('-');
        row = parts[0];
        sNum = parseInt(parts[1], 10);
      } else {
        const match = targetSeat.match(/^([A-Z]+)(\d+)$/);
        if (match) {
          row = match[1];
          sNum = parseInt(match[2], 10);
        }
      }

      const rIdx = ROWS.indexOf(row);
      if (rIdx !== -1 && !isNaN(sNum)) {
        const coords = getRockstarSeatCoordinates(rIdx, sNum);
        // Position camera inside the seat at human eye level (+1.3y)
        state.targetPos.set(coords.x, coords.y + 1.3, coords.z);
        // Look directly at Rockstar Anirudh on the center stage
        state.targetLookAt.set(0, 4.2, 0);

        // Update Laser Sightline Ray from Seat to Rockstar
        if (sightlineLineRef.current) {
          const points = [
            new THREE.Vector3(coords.x, coords.y + 1.2, coords.z),
            new THREE.Vector3(0, 4.2, 0)
          ];
          sightlineLineRef.current.geometry.setFromPoints(points);
          sightlineLineRef.current.visible = true;
        }
        return;
      }
    } else if (cameraMode === 'AISLE') {
      // Stage Cam / Rock Cam Vantage Point (On stage looking out at the 5,000 crowd)
      state.targetPos.set(0, 3.8, 3.2);
      state.targetLookAt.set(0, 10, 45);
      if (sightlineLineRef.current) sightlineLineRef.current.visible = false;
      return;
    }

    // Default: Orbit Overview Mode
    if (sightlineLineRef.current) sightlineLineRef.current.visible = false;
    const phi = state.elevation;
    const theta = state.azimuth;
    const r = state.distance;

    state.targetPos.set(
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.cos(theta)
    );
    state.targetLookAt.set(0, 3.5, 0);
  }, [cameraMode, activeSeatId, selectedSeats]);

  // ─── Mouse Orbit & Seat Picking Handlers ────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    cameraStateRef.current.isDragging = true;
    cameraStateRef.current.prevMouseX = e.clientX;
    cameraStateRef.current.prevMouseY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = cameraStateRef.current;

    if (state.isDragging && cameraMode === 'OVERVIEW') {
      const deltaX = e.clientX - state.prevMouseX;
      const deltaY = e.clientY - state.prevMouseY;
      state.prevMouseX = e.clientX;
      state.prevMouseY = e.clientY;

      state.azimuth -= deltaX * 0.007;
      state.elevation = Math.max(0.18, Math.min(1.42, state.elevation + deltaY * 0.007));

      const phi = state.elevation;
      const theta = state.azimuth;
      const r = state.distance;

      state.targetPos.set(
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta)
      );
      return;
    }

    // Hover Raycasting for Seats
    if (!mountRef.current || !cameraRef.current || !instancedMeshRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(instancedMeshRef.current);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const instId = intersects[0].instanceId;
      const seatId = seatIndexMapRef.current.get(instId);
      if (seatId) {
        const [row, numStr] = seatId.split('-');
        const rIdx = ROWS.indexOf(row);
        let tier: 'VIP' | 'PREMIUM' | 'STANDARD' = 'STANDARD';
        let price = 999;
        if (rIdx <= 2) {
          tier = 'VIP';
          price = 4500;
        } else if (rIdx <= 8) {
          tier = 'PREMIUM';
          price = 2500;
        }

        const currentSeat = seatsMap.get(seatId);
        setHoveredSeat({
          seat_id: seatId,
          row,
          number: parseInt(numStr, 10),
          tier,
          price: currentSeat?.price || price,
          status: currentSeat?.status || 'AVAILABLE'
        });
        setTooltipPos({ x: e.clientX, y: e.clientY });
        return;
      }
    }
    setHoveredSeat(null);
  };

  const handlePointerUp = () => {
    cameraStateRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (cameraMode !== 'OVERVIEW') return;
    const state = cameraStateRef.current;
    state.distance = Math.max(22, Math.min(95, state.distance + e.deltaY * 0.05));

    const phi = state.elevation;
    const theta = state.azimuth;
    const r = state.distance;

    state.targetPos.set(
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.cos(theta)
    );
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !instancedMeshRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(instancedMeshRef.current);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const instId = intersects[0].instanceId;
      const seatId = seatIndexMapRef.current.get(instId);
      if (seatId) {
        onToggleSeat(seatId);
      }
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full select-none overflow-hidden">
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Seat Hover Tooltip */}
      {hoveredSeat && tooltipPos && (
        <div
          style={{
            left: `${tooltipPos.x + 14}px`,
            top: `${tooltipPos.y + 14}px`
          }}
          className="fixed pointer-events-none z-50 bg-[#0d101d]/95 backdrop-blur-xl border border-white/15 px-3.5 py-2 rounded-xl shadow-2xl text-xs font-mono animate-fadeIn"
        >
          <div className="font-extrabold text-white flex items-center justify-between gap-3">
            <span>Seat {hoveredSeat.seat_id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              hoveredSeat.tier === 'VIP' ? 'bg-amber-500/20 text-amber-300' :
              hoveredSeat.tier === 'PREMIUM' ? 'bg-emerald-500/20 text-emerald-300' :
              'bg-blue-500/20 text-blue-300'
            }`}>
              {hoveredSeat.tier === 'VIP' ? 'Golden Fan Pit' : hoveredSeat.tier === 'PREMIUM' ? 'Diamond Bowl' : 'Grandstand'}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between gap-3">
            <span className="text-cyan-300 font-bold">₹{hoveredSeat.price.toLocaleString()}</span>
            <span className={
              hoveredSeat.status === 'SOLD' ? 'text-slate-500' :
              hoveredSeat.status === 'HELD' ? 'text-rose-400' :
              'text-emerald-400'
            }>
              {hoveredSeat.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
