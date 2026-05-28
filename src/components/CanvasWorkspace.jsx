import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { usePortfolioStore } from '../store/usePortfolioStore';
import GridFloor from './GridFloor';
import CollageItem from './CollageItem';

// Camera controller to interpolate between pan & zoom coordinates smoothly
function CameraController() {
  const cameraOffset = usePortfolioStore((state) => state.cameraOffset);
  
  useFrame((state) => {
    const cam = state.camera;
    const [tx, ty, tz] = cameraOffset;
    
    // Smooth camera damping towards target offsets
    cam.position.x += (tx - cam.position.x) * 0.15;
    cam.position.y += (ty - cam.position.y) * 0.15;
    cam.position.z += (tz - cam.position.z) * 0.15;
    
    // Ensure camera looking directly orthogonal to X-Y collage floor
    cam.lookAt(cam.position.x, cam.position.y, 0);
  });
  
  return null;
}

export default function CanvasWorkspace() {
  const containerRef = useRef();
  const elements = usePortfolioStore((state) => state.elements);
  const panCamera = usePortfolioStore((state) => state.panCamera);
  const zoomCamera = usePortfolioStore((state) => state.zoomCamera);
  const setFps = usePortfolioStore((state) => state.setFps);
  const draggingElementId = usePortfolioStore((state) => state.draggingElementId);
  
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const activePointersRef = useRef({});
  const lastTouchDistanceRef = useRef(null);

  // Listen to keyboard spacebar toggles
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(true);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle pointer down on background (capture initial values)
  const handlePointerDown = (e) => {
    if (draggingElementId) return;

    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}

    // Track active pointer
    activePointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    const activePointerIds = Object.keys(activePointersRef.current);

    if (activePointerIds.length === 2) {
      // Start of multi-touch (pinch)
      const p1 = activePointersRef.current[activePointerIds[0]];
      const p2 = activePointersRef.current[activePointerIds[1]];
      lastTouchDistanceRef.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      lastPointerRef.current = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    } else if (activePointerIds.length === 1) {
      const isTouch = e.pointerType === 'touch';
      const isMiddleClick = e.button === 1;
      const isSpaceLeftClick = e.button === 0 && isSpacePressed;

      if (isTouch || isMiddleClick || isSpaceLeftClick) {
        setIsPanning(true);
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }
      }
    }
  };

  // Handle pointer moves to apply pan transforms
  const handlePointerMove = (e) => {
    if (draggingElementId) return;

    // Update active pointer position
    if (activePointersRef.current[e.pointerId]) {
      activePointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    }

    const activePointerIds = Object.keys(activePointersRef.current);
    const isTouch = e.pointerType === 'touch';
    const panSensitivity = isTouch ? 1.0 : 1.0;
    const zoomSensitivity = isTouch ? 3.0 : 1.0;

    if (activePointerIds.length === 2 && lastTouchDistanceRef.current !== null) {
      e.preventDefault();
      const p1 = activePointersRef.current[activePointerIds[0]];
      const p2 = activePointersRef.current[activePointerIds[1]];
      
      const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const deltaDist = lastTouchDistanceRef.current - currentDist;

      // Multi-touch Zoom (zoomSpeed = 1.5 equivalent)
      zoomCamera(deltaDist * 0.4 * zoomSensitivity);

      // Multi-touch Pan (panSpeed = 2.5 equivalent)
      const centerCurrent = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const dx = centerCurrent.x - lastPointerRef.current.x;
      const dy = centerCurrent.y - lastPointerRef.current.y;
      
      panCamera(dx * panSensitivity, dy * panSensitivity);

      lastPointerRef.current = centerCurrent;
      lastTouchDistanceRef.current = currentDist;
    } else if (isPanning && activePointerIds.length === 1) {
      e.preventDefault();
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      
      panCamera(dx * panSensitivity, dy * panSensitivity);
      
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Release capture
  const handlePointerUp = (e) => {
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}

    delete activePointersRef.current[e.pointerId];
    
    const activePointerIds = Object.keys(activePointersRef.current);
    if (activePointerIds.length < 2) {
      lastTouchDistanceRef.current = null;
    }

    if (activePointerIds.length === 0) {
      setIsPanning(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = isSpacePressed ? 'grab' : 'default';
      }
    }
  };

  // Handle zoom and trackpad panning (pinch-to-zoom is sent as ctrlKey + wheel)
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Check if user is pinching trackpad or zooming with mouse wheel
    if (e.ctrlKey) {
      // Zoom speed is faster for pinch
      zoomCamera(e.deltaY * 0.4);
    } else if (Math.abs(e.deltaX) > 0.5) {
      // Trackpad 2-finger panning (sends deltaX and deltaY)
      panCamera(-e.deltaX * 3, -e.deltaY * 3);
    } else {
      // Normal wheel scrolling zoom
      zoomCamera(e.deltaY * 0.7);
    }
  };

  // Simple performance tracker inside rendering
  const PerformanceStats = () => {
    let lastTime = performance.now();
    let frames = 0;
    
    useFrame(() => {
      frames++;
      const time = performance.now();
      if (time >= lastTime + 1000) {
        const currentFps = Math.round((frames * 1000) / (time - lastTime));
        setFps(currentFps);
        frames = 0;
        lastTime = time;
      }
    });
    
    return null;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        maxWidth: '100%',
        maxHeight: '100%',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={(e) => {
        // Prevent default browser double-tap or pinch zooming gestures
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }}
      onTouchMove={(e) => {
        // Prevent default browser scrolling and bounce effects on mobile viewports
        e.preventDefault();
      }}
      onTouchEnd={(e) => {
        // Silent capture
      }}
      onWheel={handleWheel}
    >
      <Canvas
        eventPrefix="client"
        orthographic={false}
        camera={{ fov: 60, position: [0, 0, typeof window !== 'undefined' && window.innerWidth < 768 ? 32 : 15], near: 0.1, far: 2000 }}
        gl={{ antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true }}
      >
        <color attach="background" args={['#ffffff']} />
        
        {/* Infinite Grid */}
        <GridFloor />
        
        {/* Render elements under Suspense */}
        <Suspense fallback={null}>
          {elements.map((el, idx) => (
            <CollageItem key={el.id} element={el} index={idx} />
          ))}
        </Suspense>
        
        {/* Dynamic Camera Pan/Zoom Damping */}
        <CameraController />
        
        {/* GPU Performance Tick */}
        <PerformanceStats />
      </Canvas>
    </div>
  );
}
