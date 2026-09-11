import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { usePortfolioStore } from '../store/usePortfolioStore';
import CollageItem from './CollageItem';
import ProjectBackgrounds from './ProjectBackgrounds';
import InfoTiles from './InfoTiles';

const DESKTOP_Z = 22;
const MOBILE_Z = 95;
const initialZ = () =>
  typeof window !== 'undefined' && window.innerWidth < 768 ? MOBILE_Z : DESKTOP_Z;

// ─── Controlador de cámara: interpola suavemente hacia el objetivo ───
function CameraController() {
  const targetCameraOffset = usePortfolioStore((state) => state.targetCameraOffset);

  useFrame((state) => {
    const cam = state.camera;
    const [tx, ty, tz] = targetCameraOffset;

    // Damping adaptativo: rápido para gestos (distancia corta), suave para transiciones
    const dist =
      Math.abs(tx - cam.position.x) +
      Math.abs(ty - cam.position.y) +
      Math.abs(tz - cam.position.z);
    const k = dist > 3 ? 0.12 : 0.5;

    cam.position.x += (tx - cam.position.x) * k;
    cam.position.y += (ty - cam.position.y) * k;
    cam.position.z += (tz - cam.position.z) * k;
    cam.lookAt(cam.position.x, cam.position.y, 0);
  });

  return null;
}

// ─── Medidor de performance (fuera del componente principal para evitar re-montajes) ───
function PerformanceStats() {
  const setFps = usePortfolioStore((state) => state.setFps);
  const stats = useRef({ last: performance.now(), frames: 0 });

  useFrame(() => {
    stats.current.frames++;
    const time = performance.now();
    if (time >= stats.current.last + 1000) {
      setFps(Math.round((stats.current.frames * 1000) / (time - stats.current.last)));
      stats.current.frames = 0;
      stats.current.last = time;
    }
  });

  return null;
}

// ─── Botones de navegación siempre visibles (móvil y desktop) ───
function CanvasNavButtons({ zoomCamera, resetCamera }) {
  const btnBase = {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '2px solid #000000',
    boxShadow: '3px 3px 0px #ff007f',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  };

  const zoom = (direction) => {
    const focal = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    zoomCamera(direction * 220, focal);
  };

  return (
    <div
      className="canvas-nav"
      style={{
        position: 'absolute',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 950,
      }}
    >
      <button style={btnBase} onClick={() => zoom(-1)} aria-label="Acercar">+</button>
      <button style={btnBase} onClick={() => zoom(1)} aria-label="Alejar">−</button>
      <button style={btnBase} onClick={resetCamera} aria-label="Reiniciar vista">⟲</button>
    </div>
  );
}

export default function CanvasWorkspace() {
  const containerRef = useRef(null);
  const elements = usePortfolioStore((state) => state.elements);
  const zoomCamera = usePortfolioStore((state) => state.zoomCamera);
  const panCamera = usePortfolioStore((state) => state.panCamera);
  const resetCamera = usePortfolioStore((state) => state.resetCamera);

  const isSpaceRef = useRef(false);
  const isPanningRef = useRef(false);
  const pointersRef = useRef({});
  const pinchRef = useRef(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const velocitySamplesRef = useRef([]);
  const inertiaRef = useRef(null);

  // ─── Inercia: deslizamiento natural al soltar el dedo (solo táctil) ───
  const cancelInertia = () => {
    if (inertiaRef.current) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }
  };

  const startInertia = () => {
    const samples = velocitySamplesRef.current;
    if (samples.length < 2) return;
    const now = performance.now();
    const recent = samples.filter((s) => now - s.t < 120);
    if (recent.length < 2) return;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.t - first.t;
    if (dt < 1) return;

    let vx = ((last.x - first.x) / dt) * 16; // px por frame
    let vy = ((last.y - first.y) / dt) * 16;

    const speed = Math.hypot(vx, vy);
    const MAX_V = 55;
    if (speed > MAX_V) {
      vx = (vx / speed) * MAX_V;
      vy = (vy / speed) * MAX_V;
    }
    if (speed < 2) return;

    const step = () => {
      const store = usePortfolioStore.getState();
      if (store.draggingElementId || store.fullscreenImageId || store.zoomedImage) {
        inertiaRef.current = null;
        return;
      }
      vx *= 0.93;
      vy *= 0.93;
      if (Math.hypot(vx, vy) < 0.1) {
        inertiaRef.current = null;
        return;
      }
      panCamera(vx, vy);
      inertiaRef.current = requestAnimationFrame(step);
    };
    inertiaRef.current = requestAnimationFrame(step);
  };

  // ─── Barra espaciadora = modo "mano" (solo desktop) ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        isSpaceRef.current = true;
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpaceRef.current = false;
        if (containerRef.current) containerRef.current.style.cursor = 'default';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelInertia();
    };
  }, []);

  // ─── Rueda del mouse / trackpad: listener NATIVO no-pasivo ───
  // (necesario para que Ctrl+scroll no dispare el zoom del navegador)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const onWheel = (e) => {
      e.preventDefault();
      const store = usePortfolioStore.getState();
      if (store.draggingElementId) return;
      if (store.fullscreenImageId || store.zoomedImage) return;

      // Scroll normal y Ctrl+rueda (pellizco del trackpad) = ZOOM hacia el cursor
      zoomCamera(e.deltaY * 1.2, { x: e.clientX, y: e.clientY });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomCamera]);

  // ─── UN SOLO sistema de gestos: Pointer Events (cubre mouse + touch) ───
  const handlePointerDown = (e) => {
    cancelInertia();

    // Consulta fresca del estado: si se está arrastrando una imagen, no paneamos
    const store = usePortfolioStore.getState();
    if (store.draggingElementId) return;

    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}

    pointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    const ids = Object.keys(pointersRef.current);

    if (ids.length === 2) {
      // Inicio de pellizco (2 dedos)
      const p1 = pointersRef.current[ids[0]];
      const p2 = pointersRef.current[ids[1]];
      pinchRef.current = {
        dist: Math.hypot(p1.x - p2.x, p1.y - p2.y),
        cx: (p1.x + p2.x) / 2,
        cy: (p1.y + p2.y) / 2,
      };
      isPanningRef.current = true;
    } else if (ids.length === 1) {
      const isTouch = e.pointerType === 'touch';
      const isMiddleClick = e.button === 1;
      const isLeftDrag = e.button === 0;

      if (isTouch || isMiddleClick || isLeftDrag) {
        isPanningRef.current = true;
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
        velocitySamplesRef.current = [];
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handlePointerMove = (e) => {
    const store = usePortfolioStore.getState();
    if (store.draggingElementId) return;

    if (pointersRef.current[e.pointerId]) {
      pointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    }
    const ids = Object.keys(pointersRef.current);

    if (ids.length === 2 && pinchRef.current) {
      // PELLIZCO: zoom hacia el centro de los dedos + pan del centroide (1:1)
      e.preventDefault();
      const p1 = pointersRef.current[ids[0]];
      const p2 = pointersRef.current[ids[1]];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;

      const deltaDist = pinchRef.current.dist - dist;
      zoomCamera(deltaDist * 1.2, { x: cx, y: cy });

      const dx = cx - pinchRef.current.cx;
      const dy = cy - pinchRef.current.cy;
      panCamera(dx, dy);

      pinchRef.current = { dist, cx, cy };
    } else if (isPanningRef.current && ids.length === 1) {
      // PAN con 1 dedo o mouse: 1:1 con el movimiento
      e.preventDefault();
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      panCamera(dx, dy);
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      // Registro de velocidad para la inercia (solo táctil)
      if (e.pointerType === 'touch') {
        velocitySamplesRef.current.push({
          t: performance.now(),
          x: e.clientX,
          y: e.clientY,
        });
        if (velocitySamplesRef.current.length > 6) velocitySamplesRef.current.shift();
      }
    }
  };

  const handlePointerUp = (e) => {
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}

    delete pointersRef.current[e.pointerId];
    const ids = Object.keys(pointersRef.current);

    if (ids.length < 2) {
      pinchRef.current = null;
    }

    // Transición pellizco → 1 dedo: reposicionamos la referencia para
    // que el lienzo no salte al seguir el dedo restante
    if (ids.length === 1) {
      lastPointerRef.current = {
        x: pointersRef.current[ids[0]].x,
        y: pointersRef.current[ids[0]].y,
      };
      velocitySamplesRef.current = [];
    }

    if (ids.length === 0) {
      if (isPanningRef.current && e.pointerType === 'touch') {
        startInertia();
      }
      isPanningRef.current = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = isSpaceRef.current ? 'grab' : 'default';
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        eventPrefix="client"
        orthographic={false}
        camera={{ fov: 60, position: [0, 0, initialZ()], near: 0.1, far: 2000 }}
        gl={{ antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true, alpha: true }}
      >
        {/* Grilla infinita quitada a pedido del usuario */}

        {/* Elementos bajo Suspense */}
        <Suspense fallback={null}>
          <ProjectBackgrounds />
          <InfoTiles />
          {elements.map((el, idx) => (
            <CollageItem key={el.id} element={el} index={idx} />
          ))}
        </Suspense>

        {/* Cámara con pan/zoom suavizado */}
        <CameraController />

        {/* Performance */}
        <PerformanceStats />
      </Canvas>

      {/* Botones de zoom y reinicio (visibles en móvil y desktop) */}
      <CanvasNavButtons zoomCamera={zoomCamera} resetCamera={resetCamera} />
    </div>
  );
}
