import React, { useRef, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePortfolioStore } from '../store/usePortfolioStore';

// Constantes reutilizadas (evita crear objetos en cada movimiento)
const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.0);
const DRAG_INTERSECTION = new THREE.Vector3();

// px máximos de movimiento para contar como "toque limpio" (aplica a mouse Y táctil)
const TAP_THRESHOLD = 8;

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
      
      if (u_dragged > 0.01) {
        float warp = sin(pos.y * 3.0 + u_time * 25.0) * 0.12 * u_dragged;
        pos.x += warp;
        float noise = sin(u_time * 50.0) * 0.05 * u_dragged;
        if (fract(pos.y * 5.0) > 0.8) pos.x += noise;
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
      vec2 d = abs(uv - 0.5) * 2.0; 
      float dist = max(d.x, d.y);
      vec3 glowColor = u_colorTint; 
      
      if (dist < 0.82) {
        vec2 imgUv = (uv - 0.09) / 0.82;
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
        float innerGlow = smoothstep(0.4, 0.82, dist) * 0.15;
        vec3 finalColor = mix(texColor.rgb, glowColor, innerGlow * (0.2 + u_hover * 0.5 + u_dragged * 0.5));
        gl_FragColor = vec4(finalColor, texColor.a * u_opacity);
      } else {
        float outerGlow = smoothstep(1.0, 0.82, dist);
        outerGlow = pow(outerGlow, 1.5);
        float finalGlowOpacity = outerGlow * (0.04 + u_hover * 0.12 + u_dragged * 0.22) * u_opacity * 0.55;
        gl_FragColor = vec4(glowColor, finalGlowOpacity);
      }
    }
  `
};

export default function CollageItem({ element, index }) {
  const { width: viewportWidth } = useThree((state) => state.viewport);
  const scaleMultiplier = Math.max(1.0, viewportWidth < 18 ? (viewportWidth / 18) * 2.2 : 2.2);

  const meshRef = useRef();
  const materialRef = useRef();
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const dragValue = useRef(0);
  const hoverValue = useRef(0);

  const startDragging = usePortfolioStore((state) => state.startDragging);
  const updateDraggedPosition = usePortfolioStore((state) => state.updateDraggedPosition);
  const stopDragging = usePortfolioStore((state) => state.stopDragging);
  const setActiveProjectId = usePortfolioStore((state) => state.setActiveProjectId);
  const setZoomedImage = usePortfolioStore((state) => state.setZoomedImage);
  const draggingElementId = usePortfolioStore((state) => state.draggingElementId);
  const activeFilter = usePortfolioStore((state) => state.activeFilter);
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);
  const elements = usePortfolioStore((state) => state.elements);

  const subtableroFactor = (activeProjectId && viewportWidth < 18) ? 0.65 : 1.0;
  const finalScaleMultiplier = scaleMultiplier * subtableroFactor;

  const isAttenuated = activeProjectId !== null && String(activeProjectId) !== String(element.projectId);

  // Use thumbnails for the 3D canvas (lightweight ~15kb each), full images only in the zoomed viewer
  let rawPath = element.thumbnail || element.image || element.url || '';
  let hdPath = rawPath.replace(/^.*public\//, '/');
  if (!hdPath.startsWith('/')) hdPath = '/' + hdPath;

  const texture = useLoader(THREE.TextureLoader, hdPath);

  useEffect(() => {
    if (texture) {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;
      texture.needsUpdate = true;
    }
  }, [texture]);

  // ── RED DE SEGURIDAD ──
  // Si el pointerup ocurre fuera del mesh (drag rápido) o el sistema cancela
  // el pointer, liberamos el drag para que NUNCA quede "pegado" bloqueando el pan.
  useEffect(() => {
    const stopIfDragging = () => {
      if (usePortfolioStore.getState().draggingElementId === element.id) {
        stopDragging(element.id);
      }
    };
    window.addEventListener('pointerup', stopIfDragging);
    window.addEventListener('pointercancel', stopIfDragging);
    return () => {
      window.removeEventListener('pointerup', stopIfDragging);
      window.removeEventListener('pointercancel', stopIfDragging);
    };
  }, [element.id, stopDragging]);

  // ── POINTER EVENTS ──
  // MOUSE (non-touch): pointerDown starts drag, pointerMove updates, pointerUp ends.
  // TOUCH: we do NOT start dragging. Touch users tap to click (onClick).
  //        Canvas panning for touch is managed by CanvasWorkspace.

  const handlePointerDown = (e) => {
    if (isAttenuated) return;
    // Guardamos posición inicial SIEMPRE (mouse y táctil): la usa el onClick
    // para distinguir "toque limpio" de "arrastre de paneo"
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    if (e.pointerType === 'touch') return;
    e.stopPropagation();
    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
    startDragging(element.id);
  };

  const handlePointerMove = (e) => {
    if (isAttenuated || e.pointerType === 'touch') return;
    e.stopPropagation();
    if (draggingElementId === element.id) {
      e.raycast.ray.intersectPlane(DRAG_PLANE, DRAG_INTERSECTION);
      updateDraggedPosition(element.id, [DRAG_INTERSECTION.x, DRAG_INTERSECTION.y]);
    }
  };

  const handlePointerUp = (e) => {
    if (isAttenuated || e.pointerType === 'touch') return;
    if (draggingElementId !== element.id) return;
    e.stopPropagation();
    try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
    stopDragging(element.id);
  };

  useFrame((state) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const isDragged = draggingElementId === element.id;

    let targetX = element.targetPosition[0];
    let targetY = element.targetPosition[1];
    let targetZ = index * 0.01;
    let targetRot = element.targetRotation;

    const currentActiveProject = usePortfolioStore.getState().activeProjectId;

    if (currentActiveProject) {
      if (String(element.projectId) === String(currentActiveProject)) {
        const groupElements = elements.filter(el => String(el.projectId) === String(currentActiveProject));
        const idx = groupElements.findIndex(el => el.id === element.id);

        if (idx !== -1) {
          if (viewportWidth < 18) {
            targetX = 0;
            targetY = element.targetMobileY || 0;
            targetZ = 5.0 + index * 0.01;
            targetRot = 0;
          } else {
            const cols = Math.min(3, Math.ceil(Math.sqrt(groupElements.length)));
            const gapX = 7.5;
            const gapY = 6.25;
            targetX = (idx % cols) * gapX - ((cols - 1) * gapX) / 2;
            targetY = ((Math.ceil(groupElements.length / cols) - 1) * gapY) / 2 - Math.floor(idx / cols) * gapY;
            targetZ = 5.0 + index * 0.01;
            targetRot = 0;
          }
        }
      } else {
        targetX = element.initialPosition[0] * 5.0;
        targetY = element.initialPosition[1] * 5.0;
        targetZ = -5.0 + index * 0.01;
      }
    }

    const springStrength = activeFilter === 'ALL' && !currentActiveProject ? 0.07 : 0.12;
    mesh.position.x += (targetX - mesh.position.x) * springStrength;
    mesh.position.y += (targetY - mesh.position.y) * springStrength;
    mesh.position.z += ((isDragged ? 8.0 : targetZ) - mesh.position.z) * 0.25;
    mesh.rotation.z += (targetRot - mesh.rotation.z) * springStrength;

    let baseScaleX = element.targetScale ? element.targetScale[0] : element.scale[0];
    let baseScaleY = element.targetScale ? element.targetScale[1] : element.scale[1];
    let targetScaleX = baseScaleX * finalScaleMultiplier;
    let targetScaleY = baseScaleY * finalScaleMultiplier;

    if (currentActiveProject && String(element.projectId) === String(currentActiveProject)) {
      if (viewportWidth < 18) {
        targetScaleX = 12.0;
        targetScaleY = 12.0 / (element.aspectRatio || 1);
      } else {
        // En vista de proyecto, volvemos a la escala original para que se vea en su tamaño de diseño
        targetScaleX = element.scale[0] * finalScaleMultiplier;
        targetScaleY = element.scale[1] * finalScaleMultiplier;
      }
    }

    mesh.scale.x += (targetScaleX - mesh.scale.x) * 0.15;
    mesh.scale.y += (targetScaleY - mesh.scale.y) * 0.15;
    mesh.rotation.x = 0;
    mesh.rotation.y = 0;

    if (materialRef.current) {
      const mat = materialRef.current;
      // Hover con suavizado (antes estaba forzado a 0 = efecto muerto)
      mat.uniforms.u_hover.value += (hoverValue.current - mat.uniforms.u_hover.value) * 0.2;
      const nextDrag = dragValue.current + ((isDragged ? 1.0 : 0.0) - dragValue.current) * 0.15;
      dragValue.current = nextDrag;
      mat.uniforms.u_dragged.value = nextDrag;
      mat.uniforms.u_time.value = state.clock.getElapsedTime();

      const targetOpacity = (currentActiveProject !== null && String(currentActiveProject) !== String(element.projectId)) ? 0.15 : 1.0;
      mat.transparent = true;
      mat.uniforms.u_opacity.value += (targetOpacity - mat.uniforms.u_opacity.value) * 0.2;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[element.currentPosition[0], element.currentPosition[1], 0]}
      rotation={[0, 0, element.currentRotation]}
      scale={[element.scale[0] * finalScaleMultiplier, element.scale[1] * finalScaleMultiplier, 1]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerOver={(e) => {
        // Brillo de hover solo para mouse (en táctil no tiene sentido)
        if (e.pointerType === 'mouse' && !isAttenuated) {
          hoverValue.current = 1;
        }
      }}
      onPointerOut={() => {
        hoverValue.current = 0;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isAttenuated) return;

        // Umbral universal (mouse Y táctil): si el dedo/mouse se movió más de
        // TAP_THRESHOLD píxeles entre el down y el up, es un paneo, NO un click.
        // Esto evita abrir proyectos por accidente al paneear desde una imagen.
        const dx = e.clientX - pointerDownPosRef.current.x;
        const dy = e.clientY - pointerDownPosRef.current.y;
        if (Math.hypot(dx, dy) > TAP_THRESHOLD) return;

        const currentActiveProject = usePortfolioStore.getState().activeProjectId;

        if (currentActiveProject && String(currentActiveProject) === String(element.projectId)) {
          setZoomedImage(element);
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
        depthWrite={false}
        depthTest={true}
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