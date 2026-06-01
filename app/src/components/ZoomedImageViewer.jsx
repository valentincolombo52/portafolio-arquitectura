import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function ZoomedImageViewer() {
  const zoomedImage = usePortfolioStore((state) => state.zoomedImage);
  const clearZoomedImage = usePortfolioStore((state) => state.clearZoomedImage);

  if (!zoomedImage) return null;

  // Limpiamos la ruta también en la etiqueta HTML para evitar el error 404 de Vite
  let zoomPath = zoomedImage.image || zoomedImage.url || zoomedImage.thumbnail || '';
  let cleanZoomPath = zoomPath.replace(/thumbnails/i, 'projects').replace(/^.*public\//, '/');
  if (!cleanZoomPath.startsWith('/')) cleanZoomPath = '/' + cleanZoomPath;

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
        overflow: 'auto',
        touchAction: 'pan-x pan-y pinch-zoom'
      }}
      onClick={clearZoomedImage}
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

      <img
        src={cleanZoomPath}
        alt={zoomedImage.projectTitle || 'Zoom'}
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          objectFit: 'contain',
          boxShadow: '10px 10px 0px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}