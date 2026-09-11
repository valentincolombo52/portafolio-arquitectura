import React, { useMemo } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const ContainerShader = {
  uniforms: {
    uColor: { value: new THREE.Color('#00ffff') },
    uSize: { value: new THREE.Vector2(10, 10) },
    uOpacity: { value: 1.0 },
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
    uniform vec3 uColor;
    uniform vec2 uSize;
    uniform float uOpacity;

    // Signed Distance Function para caja redondeada (SDF)
    float sdRoundedBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
    }

    void main() {
      vec2 p = (vUv - 0.5) * uSize;
      float cornerRadius = min(2.5, min(uSize.x, uSize.y) * 0.15);
      vec2 halfSize = (uSize * 0.5) - vec2(0.4);

      float d = sdRoundedBox(p, halfSize, cornerRadius);

      // Grosor del tubo neón en el borde
      float borderWidth = 0.45;
      float distToBorder = abs(d);

      // Gradiente suave de luz neón en el perímetro
      float strokeGlow = smoothstep(borderWidth, 0.0, distToBorder);
      strokeGlow = pow(strokeGlow, 1.3);

      // Relleno claro e interior translúcido
      float fillMask = smoothstep(0.0, -0.15, d);
      vec3 fillColor = mix(vec3(0.97, 0.97, 0.96), uColor, 0.04);
      float fillAlpha = fillMask * 0.82;

      // Resplandor exterior suave
      float outerGlow = smoothstep(1.8, 0.0, max(0.0, d)) * 0.25;

      // Color final: mezcla entre el relleno claro y el borde neón vibrante
      vec3 strokeColor = mix(uColor, vec3(1.0), 0.15);
      vec3 finalColor = mix(fillColor, strokeColor, strokeGlow);
      float finalAlpha = max(fillAlpha, strokeGlow * 0.95) + outerGlow;

      if (d > 1.8) discard;

      gl_FragColor = vec4(finalColor, finalAlpha * uOpacity);
    }
  `
};

function ProjectShape({ bound }) {
  const { x, y, width, height, color, projectTitle } = bound;

  const shaderMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(color || '#ff007f') },
        uSize: { value: new THREE.Vector2(width, height) },
        uOpacity: { value: 1.0 }
      },
      vertexShader: ContainerShader.vertexShader,
      fragmentShader: ContainerShader.fragmentShader
    });
    return mat;
  }, [color, width, height]);

  // Formatear título en mayúsculas sin guiones
  const displayTitle = useMemo(() => {
    if (!projectTitle) return '';
    return projectTitle.replace(/-/g, ' ').toUpperCase();
  }, [projectTitle]);

  return (
    <group position={[x, y, -0.15]}>
      {/* Contenedor plano con shader SDF neón redondeado */}
      <mesh material={shaderMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>

      {/* Etiqueta tipográfica en la esquina superior izquierda del contenedor */}
      <Html
        position={[-width / 2 + 0.6, height / 2 - 0.6, 0.01]}
        transform
        distanceFactor={28}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '0.18em',
            color: color || '#111111',
            textShadow: '0 0 10px rgba(255,255,255,0.9)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${color || '#ccc'}`,
            lineHeight: '1.2'
          }}
        >
          {displayTitle}
        </div>
      </Html>
    </group>
  );
}

export default function ProjectBackgrounds() {
  const projectBounds = usePortfolioStore((state) => state.projectBounds);
  const activeFilter = usePortfolioStore((state) => state.activeFilter);

  if (activeFilter !== 'ALL' || !projectBounds || projectBounds.length === 0) {
    return null;
  }

  return (
    <group name="project-backgrounds">
      {projectBounds.map((bound) => (
        <ProjectShape key={bound.projectId} bound={bound} />
      ))}
    </group>
  );
}
