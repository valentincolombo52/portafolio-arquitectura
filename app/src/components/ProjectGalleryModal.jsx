import React, { useEffect } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function ProjectGalleryModal() {
  const activeProjectModal = usePortfolioStore((state) => state.activeProjectModal);
  const activeSheetIndex = usePortfolioStore((state) => state.activeSheetIndex);
  const closeProjectModal = usePortfolioStore((state) => state.closeProjectModal);
  const nextSheet = usePortfolioStore((state) => state.nextSheet);
  const prevSheet = usePortfolioStore((state) => state.prevSheet);
  const setActiveSheetIndex = usePortfolioStore((state) => state.setActiveSheetIndex);

  // Eventos de teclado: ESC para cerrar, Flechas para navegar láminas
  useEffect(() => {
    if (!activeProjectModal) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeProjectModal();
      if (e.key === 'ArrowRight') nextSheet();
      if (e.key === 'ArrowLeft') prevSheet();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProjectModal, closeProjectModal, nextSheet, prevSheet]);

  if (!activeProjectModal) return null;

  const currentSheet = activeProjectModal.sheets[activeSheetIndex] || activeProjectModal.sheets[0];
  let imgUrl = (currentSheet?.fullImage || currentSheet?.thumbnail || '').replace(/^.*public\//, '/');
  if (!imgUrl.startsWith('/')) imgUrl = '/' + imgUrl;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(9, 13, 22, 0.95)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 24px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Cabecera del Visor */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: activeProjectModal.glowColor || '#00ffff'
            }}
          />
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '1.2rem',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase'
            }}
          >
            {activeProjectModal.projectTitle}
          </h2>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.1em'
            }}
          >
            [{activeSheetIndex + 1} DE {activeProjectModal.sheets.length}]
          </span>
        </div>

        {/* Botón Cerrar (×) */}
        <button
          onClick={closeProjectModal}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            fontSize: '1.4rem',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          aria-label="Cerrar visor"
        >
          ×
        </button>
      </div>

      {/* Área Principal de Visualización de Lámina */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '16px 0',
          overflow: 'hidden'
        }}
      >
        {/* Flecha Anterior */}
        {activeProjectModal.sheets.length > 1 && (
          <button
            onClick={prevSheet}
            style={{
              position: 'absolute',
              left: '16px',
              zIndex: 10,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)'
            }}
            aria-label="Lámina anterior"
          >
            ‹
          </button>
        )}

        {/* Lámina HD en 100% aspecto nativo sin distorsión */}
        <img
          src={imgUrl}
          alt={currentSheet?.title || activeProjectModal.projectTitle}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        />

        {/* Flecha Siguiente */}
        {activeProjectModal.sheets.length > 1 && (
          <button
            onClick={nextSheet}
            style={{
              position: 'absolute',
              right: '16px',
              zIndex: 10,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)'
            }}
            aria-label="Lámina siguiente"
          >
            ›
          </button>
        )}
      </div>

      {/* Barra Inferior de Miniaturas */}
      {activeProjectModal.sheets.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {activeProjectModal.sheets.map((sh, idx) => {
            const isSelected = idx === activeSheetIndex;
            let thumbUrl = (sh.thumbnail || sh.fullImage || '').replace(/^.*public\//, '/');
            if (!thumbUrl.startsWith('/')) thumbUrl = '/' + thumbUrl;

            return (
              <img
                key={sh.id || idx}
                src={thumbUrl}
                alt={`Lámina ${idx + 1}`}
                onClick={() => setActiveSheetIndex(idx)}
                style={{
                  width: '52px',
                  height: '38px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: isSelected ? 1.0 : 0.4,
                  border: isSelected ? `2px solid ${activeProjectModal.glowColor || '#00ffff'}` : '1.5px solid transparent',
                  transform: isSelected ? 'scale(1.1)' : 'scale(1.0)',
                  transition: 'all 0.15s ease'
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
