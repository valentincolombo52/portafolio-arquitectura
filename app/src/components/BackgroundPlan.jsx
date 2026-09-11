import React, { useEffect } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const WashedPlanShader = {
  uniforms: {
    u_texture: { value: null },
    u_opacity: { value: 0.45 }, // Menos opacidad (más lavado) según lo solicitado
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
    uniform sampler2D u_texture;
    uniform float u_opacity;

    void main() {
      vec4 tex = texture2D(u_texture, vUv);
      
      // Difuminado de bordes rectangular ultrasuave (se desvanece gradualmente hacia los extremos)
      vec2 edgeDist = abs(vUv - 0.5) * 2.0;
      float fadeX = 1.0 - smoothstep(0.40, 0.95, edgeDist.x);
      float fadeY = 1.0 - smoothstep(0.40, 0.95, edgeDist.y);
      float edgeAlpha = fadeX * fadeY;

      // Fondo lavado sutil
      gl_FragColor = vec4(tex.rgb, tex.a * u_opacity * edgeAlpha);
    }
  `
};

export default function BackgroundPlan() {
  const { gl } = useThree();
  const texture = useLoader(THREE.TextureLoader, '/canvas-bg.jpg');

  useEffect(() => {
    if (texture) {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.needsUpdate = true;
    }
  }, [texture, gl]);

  const aspect = 16 / 9; // Approx aspect ratio
  const planeWidth = 450; // Tamaño reducido para que se vea toda la imagen alrededor de los proyectos
  const planeHeight = planeWidth / aspect;

  return (
    <mesh position={[0, 0, -2.5]} rotation={[0, 0, 0]}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <shaderMaterial
        transparent={true}
        depthWrite={false}
        depthTest={true}
        uniforms={THREE.UniformsUtils.clone({
          ...WashedPlanShader.uniforms,
          u_texture: { value: texture },
        })}
        vertexShader={WashedPlanShader.vertexShader}
        fragmentShader={WashedPlanShader.fragmentShader}
      />
    </mesh>
  );
}
