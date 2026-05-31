import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { X } from 'lucide-react';

export default function FullscreenViewer() {
  const fullscreenImageId = usePortfolioStore((state) => state.fullscreenImageId);
  const clearFullscreenImage = usePortfolioStore((state) => state.clearFullscreenImage);
  const elements = usePortfolioStore((state) => state.elements);

  if (!fullscreenImageId) return null;

  const element = elements.find((el) => el.id === fullscreenImageId);

  if (!element) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#ffffff', // Pure white backdrop
        zIndex: 99999, // Absolute top, covering all components and HUDs
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'auto',
      }}
    >
      {/* Brutalist Close Button (Top Right) */}
      <button
        onClick={clearFullscreenImage}
        className="brutalist-btn"
        style={{
          position: 'absolute',
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
        }}
      >
        <X size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        [CERRAR_ARCHIVO]
      </button>

      {/* Main Image Container */}
      <div
        style={{
          width: '90%',
          height: '85%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
        }}
      >
        <img
          src={element.fullImage}
          alt={element.title}
          style={{
            maxWidth: '96%',
            maxHeight: '94%',
            objectFit: 'contain',
            border: '2px solid #000000',
            boxShadow: '15px 15px 0px rgba(0, 0, 0, 0.1)',
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
            letterSpacing: '1px'
          }}
        >
          {element.title.toUpperCase()} // RES_ORIGINAL_COMPLETA
        </span>
      </div>
    </div>
  );
}
