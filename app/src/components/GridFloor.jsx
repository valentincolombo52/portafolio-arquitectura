import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePortfolioStore } from '../store/usePortfolioStore';

const GridShader = {
  uniforms: {
    u_resolution: { value: new THREE.Vector2() },
    u_cameraOffset: { value: new THREE.Vector3() },
    u_gridSpacing: { value: 1.0 },
    u_gridOpacity: { value: 0.25 },
    u_color: { value: new THREE.Color('#cccccc') },
    u_accentColor: { value: new THREE.Color('#888888') },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vWorldPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    uniform vec3 u_cameraOffset;
    uniform float u_gridSpacing;
    uniform float u_gridOpacity;
    uniform vec3 u_color;
    uniform vec3 u_accentColor;
    
    void main() {
      // Use world coordinates + camera offsets to draw infinite grid lines
      vec2 coord = vWorldPosition.xy - u_cameraOffset.xy;
      
      // Dynamic grid calculations
      vec2 grid = abs(fract(coord / u_gridSpacing - 0.5) - 0.5) / (fwidth(coord) / u_gridSpacing);
      float line = min(grid.x, grid.y);
      float lineAlpha = 1.0 - min(line, 1.0);
      
      // Thicker major grid lines every 5 units
      vec2 majorGrid = abs(fract(coord / (u_gridSpacing * 5.0) - 0.5) - 0.5) / (fwidth(coord) / (u_gridSpacing * 5.0));
      float majorLine = min(majorGrid.x, majorGrid.y);
      float majorLineAlpha = 1.0 - min(majorLine, 1.0);
      
      // Draw grid markings / tick coordinates (small dots at intersections)
      vec2 dotGrid = abs(fract(coord / 1.0 - 0.5) - 0.5);
      float dots = 1.0 - smoothstep(0.02, 0.05, length(dotGrid));
      
      // Combine layers
      vec3 finalColor = mix(u_color, u_accentColor, majorLineAlpha * 0.3);
      float finalAlpha = (lineAlpha * 0.15 + majorLineAlpha * 0.35 + dots * 0.25) * u_gridOpacity;
      
      if (finalAlpha < 0.01) discard;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
};

export default function GridFloor() {
  const meshRef = useRef();
  const materialRef = useRef();
  
  const cameraOffset = usePortfolioStore((state) => state.cameraOffset);
  const gridOpacity = usePortfolioStore((state) => state.gridOpacity);
  
  useFrame((state) => {
    if (materialRef.current) {
      // Update uniform values on frame
      materialRef.current.uniforms.u_cameraOffset.value.set(
        cameraOffset[0],
        cameraOffset[1],
        cameraOffset[2]
      );
      materialRef.current.uniforms.u_resolution.value.set(
        state.size.width,
        state.size.height
      );
      materialRef.current.uniforms.u_gridOpacity.value = gridOpacity;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <planeGeometry args={[1000, 1000]} />
      <shaderMaterial
        ref={materialRef}
        transparent={true}
        depthWrite={false}
        uniforms={THREE.UniformsUtils.clone(GridShader.uniforms)}
        vertexShader={GridShader.vertexShader}
        fragmentShader={GridShader.fragmentShader}
      />
    </mesh>
  );
}
