import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { X } from 'lucide-react';

export default function ZoomedImageViewer() {
  const zoomedImage = usePortfolioStore((state) => state.zoomedImage);
  const clearZoomedImage = usePortfolioStore((state) => state.clearZoomedImage);

  if (!zoomedImage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff', // White background matching original design
        zIndex: 99999, // Render on top of everything
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflow: 'auto',
        touchAction: 'pan-x pan-y pinch-zoom',
        cursor: 'zoom-out',
      }}
      onClick={clearZoomedImage} // Closing by clicking the background
    >
      {/* Brutalist Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          clearZoomedImage();
        }}
        className="brutalist-btn"
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          padding: '0.6rem 1.2rem',
          borderColor: '#000000',
          color: '#000000',
          fontSize: '1rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 'bold',
          backgroundColor: '#ffffff',
          boxShadow: '5px 5px 0px #000000',
          cursor: 'pointer',
          zIndex: 100000,
        }}
      >
        <X size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        [CERRAR_ZOOM]
      </button>

      {/* Main Image Container to prevent click propagation and support native sizing/scrolling */}
      <div
        style={{
          maxWidth: '90%',
          maxHeight: '85%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          cursor: 'default',
        }}
        onClick={(e) => e.stopPropagation()} // Click on image card does not close the viewer
      >
        <img
          src={zoomedImage.fullImage}
          alt={zoomedImage.title}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            border: '2px solid #000000',
            boxShadow: '15px 15px 0px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto',
          }}
        />
        
        {/* Monospace annotation */}
        <span 
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            color: '#000000',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textAlign: 'center',
          }}
        >
          {zoomedImage.title.toUpperCase()} // RESOLUCIÓN_DETALLADA
        </span>
      </div>
    </div>
  );
}
