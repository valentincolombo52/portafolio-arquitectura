import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePortfolioStore } from '../store/usePortfolioStore';

// Helper para calcular la intersección EXACTA en el marco/filo de la lámina
function getSheetEdgePoint(centerA, centerB, scaleA) {
  const dx = centerB[0] - centerA[0];
  const dy = centerB[1] - centerA[1];

  const dist = Math.hypot(dx, dy);
  if (dist < 0.01) return [centerA[0], centerA[1]];

  // Multiplicador visual real de CollageItem es 2.2
  const mult = 2.2;
  const halfW = (((scaleA && scaleA[0]) ? scaleA[0] : 5) * mult) / 2;
  const halfH = (((scaleA && scaleA[1]) ? scaleA[1] : 3.5) * mult) / 2;

  const scaleX = halfW / Math.abs(dx);
  const scaleY = halfH / Math.abs(dy);
  const s = Math.min(scaleX, scaleY);

  return [centerA[0] + dx * s, centerA[1] + dy * s];
}

// Genera curvas Bézier plásticas estilo Mapa Sinóptico de Miró (S-Curves y C-Curves fluidas)
function generateMiroSplineSegments(edgeA, edgeB, isDashed, zPos, connIndex) {
  const dx = edgeB[0] - edgeA[0];
  const dy = edgeB[1] - edgeA[1];
  const dist = Math.hypot(dx, dy);

  if (dist < 0.1) return [];

  const handleLen = Math.min(dist * 0.42, 6.5);

  let c1X = edgeA[0], c1Y = edgeA[1];
  let c2X = edgeB[0], c2Y = edgeB[1];

  if (connIndex % 2 === 0) {
    // S-Curve horizontal / vertical suave
    if (Math.abs(dx) > Math.abs(dy)) {
      c1X += dx > 0 ? handleLen : -handleLen;
      c2X -= dx > 0 ? handleLen : -handleLen;
    } else {
      c1Y += dy > 0 ? handleLen : -handleLen;
      c2Y -= dy > 0 ? handleLen : -handleLen;
    }
  } else {
    // C-Curve arqueada plástica
    const perpX = (-dy / dist) * handleLen * 0.65;
    const perpY = (dx / dist) * handleLen * 0.65;
    const sign = connIndex % 4 === 1 ? 1 : -1;
    const midX = (edgeA[0] + edgeB[0]) / 2 + perpX * sign;
    const midY = (edgeA[1] + edgeB[1]) / 2 + perpY * sign;
    c1X = (edgeA[0] + midX) / 2;
    c1Y = (edgeA[1] + midY) / 2;
    c2X = (edgeB[0] + midX) / 2;
    c2Y = (edgeB[1] + midY) / 2;
  }

  const samples = 22;
  const points = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const invT = 1 - t;
    const x =
      invT * invT * invT * edgeA[0] +
      3 * invT * invT * t * c1X +
      3 * invT * t * t * c2X +
      t * t * t * edgeB[0];
    const y =
      invT * invT * invT * edgeA[1] +
      3 * invT * invT * t * c1Y +
      3 * invT * t * t * c2Y +
      t * t * t * edgeB[1];
    points.push([x, y, zPos]);
  }

  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    if (!isDashed || i % 3 !== 2) {
      segments.push(points[i], points[i + 1]);
    }
  }
  return segments;
}

export default function ProjectGraphLines() {
  const lineSegmentsRef = useRef();
  const elements = usePortfolioStore((state) => state.elements);

  // Organiza el grafo sinóptico por proyecto (Secuencial + Ramificaciones limpias)
  const graphConnections = useMemo(() => {
    const groups = {};
    elements.forEach((el, index) => {
      if (!groups[el.projectId]) groups[el.projectId] = [];
      groups[el.projectId].push({ ...el, globalIndex: index });
    });

    const connections = [];
    let globalConnIdx = 0;

    Object.keys(groups).forEach((projId) => {
      const group = groups[projId];
      if (group.length < 2) return;

      const color = new THREE.Color(group[0].glowColor || '#00b4d8');

      // Flujo secuencial limpio estilo Miró (Lámina 0 -> 1 -> 2 -> 3...)
      for (let i = 0; i < group.length - 1; i++) {
        const connIdx = globalConnIdx++;
        const isFront = connIdx % 2 === 0;
        const zPos = isFront ? 0.35 : -0.35;
        const isDashed = connIdx % 3 === 0;

        connections.push({
          projectId: projId,
          idxA: group[i].globalIndex,
          idxB: group[i + 1].globalIndex,
          color,
          zPos,
          isDashed,
          connIdx,
        });
      }

      // Ramificaciones secundarias elegantes para proyectos grandes
      if (group.length > 4) {
        for (let i = 0; i < group.length - 2; i += 3) {
          const connIdx = globalConnIdx++;
          connections.push({
            projectId: projId,
            idxA: group[i].globalIndex,
            idxB: group[i + 2].globalIndex,
            color,
            zPos: connIdx % 2 === 0 ? 0.35 : -0.35,
            isDashed: true,
            connIdx,
          });
        }
      }
    });

    return connections;
  }, [elements]);

  const SAMPLES = 22;
  const maxSegmentsPerConn = SAMPLES * 2;
  const totalMaxVertices = graphConnections.length * maxSegmentsPerConn;

  const positionsArray = useMemo(() => new Float32Array(totalMaxVertices * 3), [totalMaxVertices]);
  const colorsArray = useMemo(() => new Float32Array(totalMaxVertices * 3), [totalMaxVertices]);

  useFrame(() => {
    if (!lineSegmentsRef.current || graphConnections.length === 0) return;

    const state = usePortfolioStore.getState();
    const currentElements = state.elements;
    const activeProjectId = state.activeProjectId;

    const geometry = lineSegmentsRef.current.geometry;
    const posAttr = geometry.attributes.position;
    const colAttr = geometry.attributes.color;

    let vertexIdx = 0;

    graphConnections.forEach((conn) => {
      const elA = currentElements[conn.idxA];
      const elB = currentElements[conn.idxB];

      if (!elA || !elB) return;

      const posA = elA.currentPosition;
      const posB = elB.currentPosition;
      const scaleA = elA.targetScale || elA.scale;
      const scaleB = elB.targetScale || elB.scale;

      // Intersección en el FILO/MARCO exterior de las láminas A y B
      const edgeA = getSheetEdgePoint(posA, posB, scaleA);
      const edgeB = getSheetEdgePoint(posB, posA, scaleB);

      // Curva Bézier plástica S-Curve / C-Curve de Miró
      const segments = generateMiroSplineSegments(
        edgeA,
        edgeB,
        conn.isDashed,
        conn.zPos,
        conn.connIdx
      );

      // Opacidad del hilo según el proyecto activo
      let opacityFactor = 0.90;
      if (activeProjectId) {
        opacityFactor = String(activeProjectId) === String(conn.projectId) ? 1.0 : 0.06;
      }

      const c = conn.color;
      const r = c.r * opacityFactor;
      const g = c.g * opacityFactor;
      const b = c.b * opacityFactor;

      for (let i = 0; i < segments.length; i++) {
        const pt = segments[i];
        posAttr.setXYZ(vertexIdx, pt[0], pt[1], pt[2]);
        colAttr.setXYZ(vertexIdx, r, g, b);
        vertexIdx++;
      }
    });

    for (let i = vertexIdx; i < totalMaxVertices; i++) {
      posAttr.setXYZ(i, 0, 0, -1000);
      colAttr.setXYZ(i, 0, 0, 0);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (graphConnections.length === 0) return null;

  return (
    <lineSegments ref={lineSegmentsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={totalMaxVertices}
          array={positionsArray}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={totalMaxVertices}
          array={colorsArray}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors={true}
        transparent={true}
        opacity={0.92}
        depthWrite={false}
      />
    </lineSegments>
  );
}
