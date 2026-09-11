import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function ZoomedImageViewer() {
  const zoomedImage = usePortfolioStore((state) => state.zoomedImage);
  const clearZoomedImage = usePortfolioStore((state) => state.clearZoomedImage);
  const setZoomedImage = usePortfolioStore((state) => state.setZoomedImage);
  const elements = usePortfolioStore((state) => state.elements);

  // Estados de Zoom y Paneo
  const [scale, setScale] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Referencias (ALL hooks MUST be before any early return)
  const mouseStart = useRef({ x: 0, y: 0 });
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const initialTouchDistance = useRef(null);
  const initialScale = useRef(1);
  const initialTouchCenter = useRef({ x: 0, y: 0 });
  const initialPosition = useRef({ x: 0, y: 0 });
  const handleNextRef = useRef(null);
  const handlePrevRef = useRef(null);

  // Keyboard effect — MUST be before early return
  useEffect(() => {
    if (!zoomedImage) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearZoomedImage();
      } else if (e.key === 'ArrowRight') {
        if (handleNextRef.current) handleNextRef.current();
      } else if (e.key === 'ArrowLeft') {
        if (handlePrevRef.current) handlePrevRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage, clearZoomedImage]);

  // Early return AFTER all hooks
  if (!zoomedImage) return null;

  // Use fullImage for the zoomed viewer (high resolution)
  let cleanZoomPath = zoomedImage.fullImage || zoomedImage.thumbnail || '';
  if (!cleanZoomPath.startsWith('/')) cleanZoomPath = '/' + cleanZoomPath;

  const projectImages = elements.filter(el => String(el.projectId) === String(zoomedImage.projectId));
  const currentIndex = projectImages.findIndex(el => el.id === zoomedImage.id);

  const resetZoom = () => {
    setScale(1);
    setPositionX(0);
    setPositionY(0);
    setIsDragging(false);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (projectImages.length <= 1) return;
    resetZoom();
    const nextIndex = (currentIndex + 1) % projectImages.length;
    setZoomedImage(projectImages[nextIndex]);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (projectImages.length <= 1) return;
    resetZoom();
    const prevIndex = (currentIndex - 1 + projectImages.length) % projectImages.length;
    setZoomedImage(projectImages[prevIndex]);
  };

  // Keep refs in sync for the keyboard handler
  handleNextRef.current = handleNext;
  handlePrevRef.current = handlePrev;

  // Zoom con Rueda de Ratón (PC)
  const handleWheel = (e) => {
    e.stopPropagation();
    const zoomFactor = 0.15;
    let newScale = scale + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    newScale = Math.max(1, Math.min(5, newScale));
    setScale(newScale);
    if (newScale === 1) {
      setPositionX(0);
      setPositionY(0);
    }
  };

  // Paneo con Mouse (PC)
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    e.stopPropagation();
    setIsDragging(true);
    mouseStart.current = { x: e.clientX - positionX, y: e.clientY - positionY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    e.stopPropagation();
    setPositionX(e.clientX - mouseStart.current.x);
    setPositionY(e.clientY - mouseStart.current.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Lógica Táctil Unificada (Celular: Swipe vs Pinch-to-Zoom)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialTouchDistance.current = dist;
      initialScale.current = scale;
      initialTouchCenter.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
      initialPosition.current = { x: positionX, y: positionY };
      setIsDragging(true);
    } else if (e.touches.length === 1) {
      if (scale === 1) {
        touchStartX.current = e.targetTouches[0].clientX;
      } else {
        const t = e.touches[0];
        mouseStart.current = { x: t.clientX - positionX, y: t.clientY - positionY };
        setIsDragging(true);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialTouchDistance.current !== null) {
      e.stopPropagation();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / initialTouchDistance.current;
      let newScale = initialScale.current * factor;
      newScale = Math.max(1, Math.min(5, newScale));
      setScale(newScale);
      if (newScale > 1) {
        const currentCenter = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2
        };
        setPositionX(initialPosition.current.x + (currentCenter.x - initialTouchCenter.current.x));
        setPositionY(initialPosition.current.y + (currentCenter.y - initialTouchCenter.current.y));
      } else {
        setPositionX(0);
        setPositionY(0);
      }
    } else if (e.touches.length === 1) {
      if (scale === 1) {
        touchEndX.current = e.targetTouches[0].clientX;
      } else if (isDragging) {
        const t = e.touches[0];
        setPositionX(t.clientX - mouseStart.current.x);
        setPositionY(t.clientY - mouseStart.current.y);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (initialTouchDistance.current !== null && e.touches.length < 2) {
      initialTouchDistance.current = null;
      setIsDragging(false);
    }
    if (scale > 1) {
      setIsDragging(false);
      return;
    }
    if (scale === 1 && touchStartX.current && touchEndX.current) {
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 45;
      if (distance > minSwipeDistance) {
        handleNext();
      } else if (distance < -minSwipeDistance) {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    setIsDragging(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        touchAction: 'none'
      }}
      onClick={clearZoomedImage}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={(e) => { e.stopPropagation(); clearZoomedImage(); }}
        className="brutalist-btn"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '0.5rem 1rem',
          backgroundColor: '#ffffff',
          borderColor: '#ff007f',
          color: '#ff007f',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          zIndex: 10000,
          cursor: 'pointer'
        }}
      >
        [X] CERRAR
      </button>

      {projectImages.length > 1 && scale === 1 && (
        <button
          onClick={handlePrev}
          style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', fontSize: '3rem', color: '#ff007f', cursor: 'pointer', zIndex: 10000, padding: '20px', opacity: 0.6 }}
        >
          &#10094;
        </button>
      )}

      <div
        style={{ overflow: 'hidden', width: '90vw', height: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: scale > 1 ? 'grab' : 'zoom-in' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={resetZoom}
      >
        <img
          key={zoomedImage.id}
          src={cleanZoomPath}
          alt={zoomedImage.projectTitle || 'Zoom'}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            boxShadow: scale === 1 ? '10px 10px 0px rgba(0,0,0,0.1)' : 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transform: `translate(${positionX}px, ${positionY}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'center center'
          }}
          draggable="false"
        />
      </div>

      {projectImages.length > 1 && scale === 1 && (
        <button
          onClick={handleNext}
          style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', fontSize: '3rem', color: '#ff007f', cursor: 'pointer', zIndex: 10000, padding: '20px', opacity: 0.6 }}
        >
          &#10095;
        </button>
      )}

      {projectImages.length > 1 && (
        <div style={{ position: 'absolute', bottom: '30px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 'bold', color: '#000000', backgroundColor: '#ffffff', padding: '0.5rem 1rem', border: '2px solid #000000', boxShadow: '4px 4px 0px #ff007f', zIndex: 10000 }}>
          {scale > 1 ? `ZOOM: ${scale.toFixed(1)}x` : `${currentIndex + 1} / ${projectImages.length}`}
        </div>
      )}
    </div>
  );
}