import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { usePortfolioStore } from '../store/usePortfolioStore';

// Custom GLSL Shader for Brutalist Hover & Glitch Drag deforming
const ProjectShader = {
  uniforms: {
    u_texture: { value: null },
    u_hover: { value: 0.0 },
    u_dragged: { value: 0.0 },
    u_time: { value: 0.0 },
    u_opacity: { value: 1.0 },
    u_colorTint: { value: new THREE.Color('#00ffff') },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float u_dragged;
    uniform float u_time;
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      vec3 pos = position;
      
      // Glitch displacement warp when dragged
      if (u_dragged > 0.01) {
        // High frequency sine-wave distortion along X axis, based on Y position and time
        float warp = sin(pos.y * 3.0 + u_time * 25.0) * 0.12 * u_dragged;
        pos.x += warp;
        
        // Dynamic edge glitch jitter
        float noise = sin(u_time * 50.0) * 0.05 * u_dragged;
        if (fract(pos.y * 5.0) > 0.8) {
          pos.x += noise;
        }
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    uniform sampler2D u_texture;
    uniform float u_hover;
    uniform float u_dragged;
    uniform float u_time;
    uniform float u_opacity;
    uniform vec3 u_colorTint;
    
    void main() {
      vec2 uv = vUv;
      
      // Rectangular bounding distance calculation (center at 0.5, 0.5)
      vec2 d = abs(uv - 0.5) * 2.0; 
      float dist = max(d.x, d.y);
      
      vec3 glowColor = u_colorTint; // Dynamic neon color allocated to this group
      
      if (dist < 0.82) {
        // Image viewport centered at 82% size. Maps uv [0.09, 0.91] -> [0.0, 1.0]
        vec2 imgUv = (uv - 0.09) / 0.82;
        
        // Chromatic aberration shift while dragging
        vec4 texColor;
        if (u_dragged > 0.01) {
          float shift = 0.018 * u_dragged * sin(u_time * 15.0);
          float r = texture2D(u_texture, imgUv + vec2(shift, 0.0)).r;
          float g = texture2D(u_texture, imgUv).g;
          float b = texture2D(u_texture, imgUv - vec2(shift, 0.0)).b;
          texColor = vec4(r, g, b, 1.0);
        } else {
          texColor = texture2D(u_texture, imgUv);
        }
        
        // Drastically reduced subtle inner glow starting at image boundary and fading inwards
        float innerGlow = smoothstep(0.4, 0.82, dist) * 0.15;
        vec3 finalColor = mix(texColor.rgb, glowColor, innerGlow * (0.2 + u_hover * 0.5 + u_dragged * 0.5));
        
        gl_FragColor = vec4(finalColor, texColor.a * u_opacity);
      } else {
        // Drastically reduced soft outer glow fading out to mesh boundaries (dist = 1.0)
        float outerGlow = smoothstep(1.0, 0.82, dist);
        outerGlow = pow(outerGlow, 1.5); // smoothing curve
        
        // Sutil outer glow starts very light (0.04) and intensifies on hover/drag (0.15 / 0.25)
        float finalGlowOpacity = outerGlow * (0.04 + u_hover * 0.12 + u_dragged * 0.22) * u_opacity * 0.55;
        
        gl_FragColor = vec4(glowColor, finalGlowOpacity);
      }
    }
  `
};

export default function CollageItem({ element, index }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [hoverValue, setHoverValue] = useState(0);
  const [dragValue, setDragValue] = useState(0);
  
  const startDragging = usePortfolioStore((state) => state.startDragging);
  const updateDraggedPosition = usePortfolioStore((state) => state.updateDraggedPosition);
  const stopDragging = usePortfolioStore((state) => state.stopDragging);
  const setActiveProjectId = usePortfolioStore((state) => state.setActiveProjectId);
  const setFullscreenImage = usePortfolioStore((state) => state.setFullscreenImage);
  const draggingElementId = usePortfolioStore((state) => state.draggingElementId);
  const activeFilter = usePortfolioStore((state) => state.activeFilter);
  
  // Pull active project group targets from state
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);
  const elements = usePortfolioStore((state) => state.elements);

  // Load thumbnail texture
  const texture = useLoader(THREE.TextureLoader, element.thumbnail || '');
  
  // Clean texture parameters to prevent filtering blur
  useEffect(() => {
    if (texture) {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
    }
  }, [texture]);

  // Handle drag controls
  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    startDragging(element.id);
  };

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (draggingElementId === element.id) {
      const planeIntersection = new THREE.Vector3();
      e.raycast.ray.intersectPlane(
        new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.0),
        planeIntersection
      );
      updateDraggedPosition(element.id, [planeIntersection.x, planeIntersection.y]);
    }
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    e.target.releasePointerCapture(e.pointerId);
    stopDragging(element.id);
  };

  // Animate values (physics + uniforms)
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const isDragged = draggingElementId === element.id;

    // Define target vectors
    let targetX = element.targetPosition[0];
    let targetY = element.targetPosition[1];
    let targetZ = index * 0.05; // Strict layer height depth based on array index!
    let targetRot = element.targetRotation;

    // Apply project magnetic grouping logic if activeProjectId is active!
    if (activeProjectId) {
      if (element.projectId === activeProjectId) {
        // Element belongs to active project!
        // Gather and arrange in a local grid centered on screen
        const groupElements = elements.filter(el => el.projectId === activeProjectId);
        const idx = groupElements.findIndex(el => el.id === element.id);
        
        if (idx !== -1) {
          // Dynamic centered grids: 1, 2, or 3 columns
          const cols = Math.min(3, Math.ceil(Math.sqrt(groupElements.length)));
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          
          // Spacing offsets
          const gapX = 6.0;
          const gapY = 5.0;
          const gridWidth = (cols - 1) * gapX;
          const gridHeight = (Math.ceil(groupElements.length / cols) - 1) * gapY;
          
          const calculatedX = col * gapX - gridWidth / 2;
          const calculatedY = gridHeight / 2 - row * gapY;
          
          if (window.innerWidth < 768) {
            targetX = calculatedX * 0.5;
            targetY = calculatedY * 0.5;
          } else {
            targetX = calculatedX;
            targetY = calculatedY;
          }
          targetZ = 5.0 + index * 0.05; // Bring closer to camera (Z = 5 + offset)
          targetRot = 0; // Rigid orthogonal alignment
        }
      } else {
        // Element does NOT belong to active project!
        // Push to outer boundaries (volar X*5, Y*5)
        targetX = element.initialPosition[0] * 5.0;
        targetY = element.initialPosition[1] * 5.0;
        targetZ = -5.0 + index * 0.05; // Push deep into background
      }
    }

    // Strict conditional opacity logic
    let targetOpacity = 1;
    if (activeProjectId !== null) {
      if (activeProjectId === element.projectId) {
        targetOpacity = 1;
      } else {
        targetOpacity = 0.05;
      }
    }

    // 1. Core spring physics engine
    const springStrength = activeFilter === 'ALL' && !activeProjectId ? 0.07 : 0.12; 
    
    // Position springs X & Y
    mesh.position.x += (targetX - mesh.position.x) * springStrength;
    mesh.position.y += (targetY - mesh.position.y) * springStrength;
    
    // Strict Z layers + drag Z overrides
    if (isDragged) {
      targetZ = 8.0;
    }
    mesh.position.z += (targetZ - mesh.position.z) * 0.25;

    // Rotation spring
    mesh.rotation.z += (targetRot - mesh.rotation.z) * springStrength;

    // 3D tilt effect on hover / drag
    if (hovered && !isDragged && !activeProjectId) {
      const mouse = state.pointer;
      const tiltX = (mouse.y * 0.15) - mesh.rotation.x;
      const tiltY = (mouse.x * 0.15) - mesh.rotation.y;
      mesh.rotation.x += tiltX * 0.1;
      mesh.rotation.y += tiltY * 0.1;
    } else {
      mesh.rotation.x += (0 - mesh.rotation.x) * 0.1;
      mesh.rotation.y += (0 - mesh.rotation.y) * 0.1;
    }

    // 2. Uniform interpolation
    if (materialRef.current) {
      const mat = materialRef.current;
      
      // Interpolate hover uniform
      const targetHover = hovered ? 1.0 : 0.0;
      const nextHover = hoverValue + (targetHover - hoverValue) * 0.1;
      setHoverValue(nextHover);
      mat.uniforms.u_hover.value = nextHover;

      // Interpolate drag uniform
      const targetDrag = isDragged ? 1.0 : 0.0;
      const nextDrag = dragValue + (targetDrag - dragValue) * 0.15;
      setDragValue(nextDrag);
      mat.uniforms.u_dragged.value = nextDrag;

      // Update shader clock
      mat.uniforms.u_time.value = state.clock.getElapsedTime();

      // Interpolate material opacity and shader opacity uniform
      mat.transparent = true;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
      mat.uniforms.u_opacity.value = mat.opacity;
      mat.needsUpdate = true;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[element.currentPosition[0], element.currentPosition[1], 0]}
      rotation={[0, 0, element.currentRotation]}
      scale={[element.scale[0] * 2.2, element.scale[1] * 2.2, 1]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (activeProjectId === element.projectId) {
          setFullscreenImage(element.id);
        } else {
          setActiveProjectId(element.projectId);
        }
      }}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        attach="material"
        ref={materialRef}
        transparent={true}
        depthWrite={true}
        depthTest={true}
        polygonOffset={true}
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-index}
        uniforms={THREE.UniformsUtils.clone({
          ...ProjectShader.uniforms,
          u_texture: { value: texture },
          u_colorTint: { value: new THREE.Color(element.glowColor || '#00ffff') },
        })}
        vertexShader={ProjectShader.vertexShader}
        fragmentShader={ProjectShader.fragmentShader}
      />
    </mesh>
  );
}
