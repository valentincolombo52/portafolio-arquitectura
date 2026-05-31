import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
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
  const { width: viewportWidth } = useThree((state) => state.viewport);
  // Base scale multiplier is 2.2 on desktop. On mobile, scale it down proportionally to fit the viewport.
  const scaleMultiplier = Math.max(1.0, viewportWidth < 18 ? (viewportWidth / 18) * 2.2 : 2.2);

  const meshRef = useRef();
  const materialRef = useRef();
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const [dragValue, setDragValue] = useState(0);
  
  const startDragging = usePortfolioStore((state) => state.startDragging);
  const updateDraggedPosition = usePortfolioStore((state) => state.updateDraggedPosition);
  const stopDragging = usePortfolioStore((state) => state.stopDragging);
  const setActiveProjectId = usePortfolioStore((state) => state.setActiveProjectId);
  const setFullscreenImage = usePortfolioStore((state) => state.setFullscreenImage);
  const setZoomedImage = usePortfolioStore((state) => state.setZoomedImage);
  const zoomedImage = usePortfolioStore((state) => state.zoomedImage);
  const draggingElementId = usePortfolioStore((state) => state.draggingElementId);
  const activeFilter = usePortfolioStore((state) => state.activeFilter);
  
  // Pull active project group targets from state
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);
  const elements = usePortfolioStore((state) => state.elements);

  const subtableroFactor = (activeProjectId && viewportWidth < 18) ? 0.65 : 1.0;
  const finalScaleMultiplier = scaleMultiplier * subtableroFactor;
  const isAttenuated = activeProjectId !== null && activeProjectId !== element.projectId;

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
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };

    if (e.pointerType === 'touch') {
      // Do not stop propagation, capture pointer, or start dragging on mobile touch devices.
      // This allows touch dragging to bubble up to the CanvasWorkspace for fluid camera panning.
      return;
    }

    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    startDragging(element.id);
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return;
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
    if (e.pointerType === 'touch') return;
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
    let targetZ = index * 0.01; // Strict layer height depth based on array index!
    let targetRot = element.targetRotation;

    // Apply project magnetic grouping logic if activeProjectId is active!
    if (activeProjectId) {
      if (element.projectId === activeProjectId) {
        // Element belongs to active project!
        const groupElements = elements.filter(el => el.projectId === activeProjectId);
        const idx = groupElements.findIndex(el => el.id === element.id);
        
        if (idx !== -1) {
          if (viewportWidth < 18) {
            // Mobile vertical perfect column layout (no overlaps, aspect ratio preserving)
            targetX = 0;
            
            const targetWidth = viewportWidth * 0.45;
            const altura = targetWidth / element.aspectRatio;
            const margen = 1.5; // 3D world units gap
            
            targetY = -idx * (altura + margen);
            targetZ = 5.0 + index * 0.01;
            targetRot = 0;
          } else {
            // Desktop grid positioning
            const cols = Math.min(3, Math.ceil(Math.sqrt(groupElements.length)));
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            
            const gapX = 7.5;
            const gapY = 6.25;
            
            const gridWidth = (cols - 1) * gapX;
            const gridHeight = (Math.ceil(groupElements.length / cols) - 1) * gapY;
            
            targetX = col * gapX - gridWidth / 2;
            targetY = gridHeight / 2 - row * gapY;
            targetZ = 5.0 + index * 0.01; // Bring closer to camera (Z = 5 + offset)
            targetRot = 0; // Rigid orthogonal alignment
          }
        }
      } else {
        // Element does NOT belong to active project!
        // Push to outer boundaries (volar X*5, Y*5)
        targetX = element.initialPosition[0] * 5.0;
        targetY = element.initialPosition[1] * 5.0;
        targetZ = -5.0 + index * 0.01; // Push deep into background
      }
    }

    // Strict conditional opacity logic
    let targetOpacity = 1;
    if (activeProjectId !== null) {
      if (activeProjectId === element.projectId) {
        targetOpacity = 1;
      } else {
        targetOpacity = 0.15;
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

    // Scale springs (animating mesh size smoothly and dynamically)
    let targetScaleX = element.scale[0] * finalScaleMultiplier;
    let targetScaleY = element.scale[1] * finalScaleMultiplier;

    if (activeProjectId) {
      if (element.projectId === activeProjectId) {
        if (viewportWidth < 18) {
          const targetWidth = viewportWidth * 0.45;
          targetScaleX = targetWidth;
          targetScaleY = targetWidth / element.aspectRatio;
        }
      }
    }

    mesh.scale.x += (targetScaleX - mesh.scale.x) * 0.15;
    mesh.scale.y += (targetScaleY - mesh.scale.y) * 0.15;

    // Reset tilt coordinates to 0 to keep the scene estático and realistic
    mesh.rotation.x = 0;
    mesh.rotation.y = 0;

    // 2. Uniform interpolation (only if not attenuated)
    if (materialRef.current && !isAttenuated) {
      const mat = materialRef.current;
      
      // Keep hover uniform at 0.0 since hover is removed
      mat.uniforms.u_hover.value = 0.0;

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
      scale={[element.scale[0] * finalScaleMultiplier, element.scale[1] * finalScaleMultiplier, 1]}
      raycast={isAttenuated ? () => null : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        e.stopPropagation();
        
        // Calculate distance moved to prevent clicks during drag/pan
        const dx = e.clientX - pointerDownPosRef.current.x;
        const dy = e.clientY - pointerDownPosRef.current.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 6) {
          // Dragged/Panned, ignore click!
          return;
        }

        if (activeProjectId === element.projectId) {
          setZoomedImage(element);
        } else {
          setActiveProjectId(element.projectId);
        }
      }}
    >
      <planeGeometry args={[1, 1]} />
      {isAttenuated ? (
        <meshStandardMaterial attach="material" transparent={true} opacity={0.15} />
      ) : (
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
      )}
    </mesh>
  );
}
