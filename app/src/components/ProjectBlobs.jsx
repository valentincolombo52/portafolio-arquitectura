import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePortfolioStore } from '../store/usePortfolioStore';

const BlobShader = {
  uniforms: {
    u_color: { value: new THREE.Color('#00b4d8') },
    u_opacity: { value: 0.22 },
    u_active: { value: 0.0 },
    u_time: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec3 u_color;
    uniform float u_opacity;
    uniform float u_active;
    uniform float u_time;

    void main() {
      vec2 st = vUv * 2.0 - 1.0;
      
      // Forma de mancha orgánica con esquinas redondeadas y suaves ondulaciones estilo acuarela
      float dist = length(st);
      
      // Ondulación plástica de borde (inspirada en manchas de acuarela / clusters de mapas)
      float angle = atan(st.y, st.x);
      float wobble = sin(angle * 5.0 + u_time * 1.2) * 0.035 + cos(angle * 7.0 - u_time * 0.7) * 0.025;
      float blobDist = dist - wobble;

      // Relleno de la mancha con desvanecimiento gradual en los bordes
      float fillAlpha = 1.0 - smoothstep(0.65, 0.98, blobDist);
      
      // Contorno exterior orgánico de la mancha
      float border = smoothstep(0.86, 0.93, blobDist) - smoothstep(0.93, 0.98, blobDist);
      
      vec3 finalColor = mix(u_color, vec3(1.0), 0.12);
      float finalAlpha = (fillAlpha * u_opacity + border * 0.40) * (1.0 + u_active * 0.85);

      gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 0.85));
    }
  `
};

export default function ProjectBlobs() {
  const elements = usePortfolioStore((state) => state.elements);
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);

  // Calcula la posición y tamaño de las manchas (blobs) por grupo de proyecto
  const projectBlobsData = useMemo(() => {
    const groups = {};
    elements.forEach((el) => {
      if (!groups[el.projectId]) groups[el.projectId] = [];
      groups[el.projectId].push(el);
    });

    const blobs = [];
    Object.keys(groups).forEach((projId) => {
      const group = groups[projId];
      if (group.length === 0) return;

      const color = new THREE.Color(group[0].glowColor || '#00b4d8');

      // Calcular los límites de las láminas pertenecientes al mismo proyecto
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      group.forEach((el) => {
        const mult = 2.2;
        const pos = el.currentPosition || el.initialPosition;
        const halfW = ((el.scale ? el.scale[0] : 5) * mult) / 2;
        const halfH = ((el.scale ? el.scale[1] : 3.5) * mult) / 2;

        minX = Math.min(minX, pos[0] - halfW);
        maxX = Math.max(maxX, pos[0] + halfW);
        minY = Math.min(minY, pos[1] - halfH);
        maxY = Math.max(maxY, pos[1] + halfH);
      });

      const padX = 3.2;
      const padY = 3.2;
      const width = (maxX - minX) + padX * 2;
      const height = (maxY - minY) + padY * 2;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      blobs.push({
        projectId: projId,
        cx,
        cy,
        width,
        height,
        color,
      });
    });

    return blobs;
  }, [elements]);

  return (
    <group>
      {projectBlobsData.map((blob) => {
        let opacity = 0.22;
        let isActive = 0.0;
        if (activeProjectId) {
          if (String(activeProjectId) === String(blob.projectId)) {
            opacity = 0.55;
            isActive = 1.0;
          } else {
            opacity = 0.04;
          }
        }

        return (
          <mesh
            key={`blob-${blob.projectId}`}
            position={[blob.cx, blob.cy, -0.25]}
          >
            <planeGeometry args={[blob.width, blob.height]} />
            <shaderMaterial
              transparent={true}
              depthWrite={false}
              depthTest={true}
              uniforms={THREE.UniformsUtils.clone({
                ...BlobShader.uniforms,
                u_color: { value: blob.color },
                u_opacity: { value: opacity },
                u_active: { value: isActive },
              })}
              vertexShader={BlobShader.vertexShader}
              fragmentShader={BlobShader.fragmentShader}
            />
          </mesh>
        );
      })}
    </group>
  );
}
