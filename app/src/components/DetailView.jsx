import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { X, Hash, Layers } from 'lucide-react';

export default function DetailView() {
  const selectedElementId = usePortfolioStore((state) => state.selectedElementId);
  const deselectElement = usePortfolioStore((state) => state.deselectElement);
  const elements = usePortfolioStore((state) => state.elements);

  const fullscreenImageId = usePortfolioStore((state) => state.fullscreenImageId);

  const element = elements.find((el) => el.id === selectedElementId);

  if (!element || fullscreenImageId) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2000, // Render on top of everything!
        backgroundColor: 'rgba(255, 255, 255, 0.98)', // White backdrop matching light FADU aesthetic
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'auto',
        animation: 'fadeIn 0.15s cubic-bezier(0.19, 1, 0.22, 1)',
      }}
    >
      {/* Brutalist Close Button (Top Right) */}
      <button
        onClick={deselectElement}
        className="brutalist-btn responsive-close-btn"
      >
        <X size={16} /> [CERRAR_ARCHIVO]
      </button>

      {/* Main Lightbox Layout Wrapper */}
      <div className="detail-view-modal">
        {/* Large Original Hi-Res Graphic Viewport */}
        <div
          className="brutalist-panel frame-pink"
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            borderWidth: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '10px 10px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          <img
            src={element.fullImage}
            alt={element.title}
            style={{
              maxWidth: '96%',
              maxHeight: '94%',
              objectFit: 'contain',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              backgroundColor: '#000000',
              padding: '4px 10px',
              fontSize: '0.6rem',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
            }}
          >
            RESOLUCIÓN_COMPLETA_ALTA_FIDELIDAD // WEB_COMPRESSED
          </div>
        </div>

        {/* Technical Data Stream Overlay Card */}
        <div
          className="brutalist-panel responsive-row-to-col"
          style={{
            backgroundColor: '#ffffff',
            padding: '1.2rem 2rem',
          }}
        >
          {/* Left Block: Title and tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={14} style={{ color: 'var(--color-frame-pink)' }} />
              <span className="cad-label" style={{ color: '#000000', fontSize: '0.6rem' }}>
                REGISTRO_FADU_UBA // ARCHIVE_BLOCK
              </span>
            </div>
            <h2
              className="title-display"
              style={{
                fontSize: '1.6rem',
                margin: 0,
                color: '#000000',
                lineHeight: '1.1',
              }}
            >
              {element.title.toUpperCase()}
            </h2>
          </div>

          {/* Right Block: Technical Grid Details */}
          <div className="technical-data-grid">
            <div>
              <div className="cad-label" style={{ color: '#000' }}>NOMBRE_ARCHIVO</div>
              <div style={{ color: 'var(--color-frame-cyan)', fontWeight: 'bold', wordBreak: 'break-all' }}>{element.filename}</div>
            </div>
            <div>
              <div className="cad-label" style={{ color: '#000' }}>AÑO_CICLO</div>
              <div style={{ color: 'var(--color-frame-purple)', fontWeight: 'bold' }}>{element.year}</div>
            </div>
            <div>
              <div className="cad-label" style={{ color: '#000' }}>CATEGORÍA_TÉCNICA</div>
              <div style={{ color: 'var(--color-frame-orange)', fontWeight: 'bold' }}>{element.type.toUpperCase()}</div>
            </div>
            <div>
              <div className="cad-label" style={{ color: '#000' }}>MEDIDAS_ORIGINAL</div>
              <div style={{ fontWeight: 'bold' }}>
                {element.width} x {element.height} px
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
