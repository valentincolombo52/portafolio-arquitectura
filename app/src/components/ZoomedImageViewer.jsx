import React, { useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function ZoomedImageViewer() {
  const zoomedImage = usePortfolioStore((state) => state.zoomedImage);
  const clearZoomedImage = usePortfolioStore((state) => state.clearZoomedImage);
  const setZoomedImage = usePortfolioStore((state) => state.setZoomedImage);
  const elements = usePortfolioStore((state) => state.elements);
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);

  // Estados para detectar el deslizamiento (Swipe) en celulares
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  // Estados para Pan & Zoom
  const [scale, setScale] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!zoomedImage) return null;

  // Mantenemos la sanitización estricta para que siga cargando en HD
  let zoomPath = zoomedImage.image || zoomedImage.url || zoomedImage.thumbnail || '';
  let cleanZoomPath = zoomPath.replace(/thumbnails/i, 'projects').replace(/^.*public\//, '/');
  if (!cleanZoomPath.startsWith('/')) cleanZoomPath = '/' + cleanZoomPath;

  // Filtramos la base de datos para armar el carrete solo con las fotos del proyecto activo
  const projectImages = elements.filter(el => String(el.projectId) === String(activeProjectId));
  const currentIndex = projectImages.findIndex(el => el.id === zoomedImage.id);

  // Reseteo de Zoom
  const resetZoom = () => {
    setScale(1);
    setPositionX(0);
    setPositionY(0);
    setIsDragging(false);
  };

  // Funciones de navegación
  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (projectImages.length <= 1) return;
    const nextIndex = (currentIndex + 1) % projectImages.length;
    setZoomedImage(projectImages[nextIndex]);
    resetZoom();
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (projectImages.length <= 1) return;
    const prevIndex = (currentIndex - 1 + projectImages.length) % projectImages.length;
    setZoomedImage(projectImages[prevIndex]);
    resetZoom();
  };

  // Lógica del motor táctil (Swipe)
  const handleTouchStart = (e) => {
    if (scale > 1) return; // Conflicto: bloquear swipe cuando hay zoom
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (scale > 1) return; // Conflicto: bloquear swipe cuando hay zoom
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (scale > 1) return; // Conflicto: bloquear swipe cuando hay zoom
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // Píxeles mínimos que hay que arrastrar para que cuente como cambio

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Lógica de Zoom con la Rueda del Ratón (Wheel)
  const handleWheel = (e) => {
    e.stopPropagation();
    setScale((prevScale) => {
      // scroll up es negativo (acercar), scroll down es positivo (alejar)
      const delta = -e.deltaY * 0.002;
      const nextScale = Math.min(5, Math.max(1, prevScale + delta));
      if (nextScale === 1) {
        setPositionX(0);
        setPositionY(0);
      }
      return nextScale;
    });
  };

  // Lógica de arrastre / panning con puntero
  const handlePointerDown = (e) => {
    if (scale > 1) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.clientX - positionX, y: e.clientY - positionY });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging && scale > 1) {
      e.stopPropagation();
      setPositionX(e.clientX - dragStart.x);
      setPositionY(e.clientY - dragStart.y);
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignorar si el pointer capture ya fue liberado
      }
    }
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
        overflow: 'hidden', // Evitamos el scroll nativo que traba el swipe
        touchAction: 'none' // Le decimos al celular que nosotros manejamos los gestos
      }}
      onClick={clearZoomedImage}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          clearZoomedImage();
        }}
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

      {/* Flecha Anterior (Para PC) */}
      {projectImages.length > 1 && (
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            fontSize: '3rem',
            color: '#ff007f',
            cursor: 'pointer',
            zIndex: 10000,
            padding: '20px',
            opacity: 0.6,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = 1}
          onMouseOut={(e) => e.target.style.opacity = 0.6}
        >
          &#10094;
        </button>
      )}

      {/* Contenedor de la imagen con overflow hidden para que la foto no tape los botones principales al agrandarse */}
      <div
        style={{
          position: 'relative',
          width: '90vw',
          height: '90vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          zIndex: 1
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={zoomedImage.id} // Forza un mini reseteo visual al cambiar de foto
          src={cleanZoomPath}
          alt={zoomedImage.projectTitle || 'Zoom'}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            boxShadow: '10px 10px 0px rgba(0,0,0,0.1)',
            userSelect: 'none', // Previene que la imagen se pinte de azul al arrastrar en PC
            WebkitUserSelect: 'none',
            transform: `translate(${positionX}px, ${positionY}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          onDoubleClick={resetZoom}
          draggable="false"
        />
      </div>

      {/* Flecha Siguiente (Para PC) */}
      {projectImages.length > 1 && (
        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            fontSize: '3rem',
            color: '#ff007f',
            cursor: 'pointer',
            zIndex: 10000,
            padding: '20px',
            opacity: 0.6,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = 1}
          onMouseOut={(e) => e.target.style.opacity = 0.6}
        >
          &#10095;
        </button>
      )}

      {/* Contador de Fotos */}
      {projectImages.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          color: '#000000',
          backgroundColor: '#ffffff',
          padding: '0.5rem 1rem',
          border: '2px solid #000000',
          boxShadow: '4px 4px 0px #ff007f',
          zIndex: 10000,
        }}>
          {currentIndex + 1} / {projectImages.length}
        </div>
      )}
    </div>
  );
}