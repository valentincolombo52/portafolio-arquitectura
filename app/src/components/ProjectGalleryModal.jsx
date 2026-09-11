import React, { useEffect, useRef, useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function ProjectGalleryModal() {
  const activeProjectModal = usePortfolioStore((state) => state.activeProjectModal);
  const activeSheetIndex = usePortfolioStore((state) => state.activeSheetIndex);
  const closeProjectModal = usePortfolioStore((state) => state.closeProjectModal);
  const nextSheet = usePortfolioStore((state) => state.nextSheet);
  const prevSheet = usePortfolioStore((state) => state.prevSheet);
  const setActiveSheetIndex = usePortfolioStore((state) => state.setActiveSheetIndex);

  // Swipe support
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Keyboard navigation
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

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (activeProjectModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeProjectModal]);

  if (!activeProjectModal) return null;

  const currentSheet = activeProjectModal.sheets[activeSheetIndex] || activeProjectModal.sheets[0];
  let imgUrl = (currentSheet?.fullImage || currentSheet?.thumbnail || '').replace(/^.*public\//, '/');
  if (!imgUrl.startsWith('/')) imgUrl = '/' + imgUrl;

  const totalSheets = activeProjectModal.sheets.length;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Solo swipe horizontal si es mayor al vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) nextSheet();
      else prevSheet();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(8, 12, 22, 0.97)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out',
        // safe-area para notch y home indicator
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ── Cabecera ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(12px, 3vw, 20px) clamp(14px, 4vw, 24px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          gap: '10px',
          minHeight: '56px'
        }}
      >
        {/* Título + contador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: activeProjectModal.glowColor || '#00ffff',
              flexShrink: 0
            }}
          />
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'clamp(0.8rem, 3.5vw, 1.15rem)',
              fontWeight: '800',
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {activeProjectModal.projectTitle}
          </h2>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'clamp(0.65rem, 2.5vw, 0.8rem)',
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.08em',
              flexShrink: 0
            }}
          >
            [{activeSheetIndex + 1}/{totalSheets}]
          </span>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={closeProjectModal}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            fontSize: '1.5rem',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s ease'
          }}
          aria-label="Cerrar visor"
        >
          ×
        </button>
      </div>

      {/* ── Área de imagen + swipe ───────────────────────────── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 'clamp(8px, 2vw, 16px) clamp(8px, 2vw, 16px)',
          userSelect: 'none'
        }}
      >
        {/* Flecha anterior */}
        {totalSheets > 1 && (
          <button
            onClick={prevSheet}
            style={{
              position: 'absolute',
              left: 'clamp(6px, 2vw, 20px)',
              zIndex: 10,
              width: 'clamp(40px, 8vw, 52px)',
              height: 'clamp(40px, 8vw, 52px)',
              borderRadius: '50%',
              backgroundColor: 'rgba(15,23,42,0.85)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)',
              transition: 'background 0.15s ease'
            }}
            aria-label="Lámina anterior"
          >
            ‹
          </button>
        )}

        {/* Imagen */}
        <img
          key={imgUrl}
          src={imgUrl}
          alt={currentSheet?.title || activeProjectModal.projectTitle}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 'clamp(6px, 1.5vw, 12px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.25s ease-out'
          }}
        />

        {/* Flecha siguiente */}
        {totalSheets > 1 && (
          <button
            onClick={nextSheet}
            style={{
              position: 'absolute',
              right: 'clamp(6px, 2vw, 20px)',
              zIndex: 10,
              width: 'clamp(40px, 8vw, 52px)',
              height: 'clamp(40px, 8vw, 52px)',
              borderRadius: '50%',
              backgroundColor: 'rgba(15,23,42,0.85)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)',
              transition: 'background 0.15s ease'
            }}
            aria-label="Lámina siguiente"
          >
            ›
          </button>
        )}

        {/* Indicador de swipe en mobile (solo cuando hay múltiples láminas) */}
        {totalSheets > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '5px',
              zIndex: 5
            }}
          >
            {Array.from({ length: Math.min(totalSheets, 12) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSheetIndex(i)}
                style={{
                  width: i === activeSheetIndex ? '18px' : '7px',
                  height: '7px',
                  borderRadius: '4px',
                  backgroundColor: i === activeSheetIndex
                    ? activeProjectModal.glowColor || '#00ffff'
                    : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.25s ease'
                }}
                aria-label={`Ir a lámina ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Miniaturas scrollables (solo en pantallas >= 480px) ── */}
      {totalSheets > 1 && (
        <div
          className="scrollbar-hide"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(5px, 1.5vw, 10px)',
            overflowX: 'auto',
            padding: 'clamp(8px, 2vw, 14px) clamp(14px, 4vw, 24px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {activeProjectModal.sheets.map((sh, idx) => {
            const isSelected = idx === activeSheetIndex;
            let thumbUrl = (sh.thumbnail || sh.fullImage || '').replace(/^.*public\//, '/');
            if (!thumbUrl.startsWith('/')) thumbUrl = '/' + thumbUrl;
            return (
              <button
                key={sh.id || idx}
                onClick={() => setActiveSheetIndex(idx)}
                style={{
                  padding: 0,
                  border: `2px solid ${isSelected ? activeProjectModal.glowColor || '#00ffff' : 'transparent'}`,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  width: 'clamp(44px, 10vw, 62px)',
                  height: 'clamp(32px, 7.5vw, 46px)',
                  opacity: isSelected ? 1 : 0.45,
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                }}
                aria-label={`Ver lámina ${idx + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt={`Lámina ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
