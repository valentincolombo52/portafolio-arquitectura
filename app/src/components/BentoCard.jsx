import React, { useState, useEffect } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function BentoCard({ project }) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const openProjectModal = usePortfolioStore((state) => state.openProjectModal);

  const { projectTitle, glowColor, year, yearDisplay, sheets = [], bentoSize } = project;

  // Extraer URLs de imágenes
  const images = sheets.map((s) => {
    let url = s.fullImage || s.thumbnail || s.filename || '';
    url = url.replace(/^.*public\//, '/');
    if (!url.startsWith('/')) url = '/' + url;
    return url;
  }).filter(Boolean);

  const totalSheets = images.length;

  // Autoplay carrusel con desfasaje por proyecto
  useEffect(() => {
    if (totalSheets <= 1 || isPaused) return;
    const offset = (project.projectId.charCodeAt(0) % 5) * 400;
    const intervalTime = 3400 + offset;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSheets);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [totalSheets, isPaused, project.projectId]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + totalSheets) % totalSheets);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % totalSheets);
  };

  // Spans de grid: en móvil (<540px) todo es 1 columna,
  // en tablet (540-900px) hero/tall hacen span 1 col × 2 rows,
  // en desktop (>900px) hero=2col×2row, tall=1col×2row, wide=2col×1row
  const getGridSpanStyle = (size) => {
    switch (size) {
      case 'hero':
        return {
          '--col-span-mobile': 1,
          '--row-span-mobile': 2,
          '--col-span-tablet': 1,
          '--row-span-tablet': 2,
          '--col-span-desktop': 2,
          '--row-span-desktop': 2,
        };
      case 'tall':
        return {
          '--col-span-mobile': 1,
          '--row-span-mobile': 2,
          '--col-span-tablet': 1,
          '--row-span-tablet': 2,
          '--col-span-desktop': 1,
          '--row-span-desktop': 2,
        };
      case 'wide':
        return {
          '--col-span-mobile': 1,
          '--row-span-mobile': 1,
          '--col-span-tablet': 2,
          '--row-span-tablet': 1,
          '--col-span-desktop': 2,
          '--row-span-desktop': 1,
        };
      case 'compact':
      default:
        return {
          '--col-span-mobile': 1,
          '--row-span-mobile': 1,
          '--col-span-tablet': 1,
          '--row-span-tablet': 1,
          '--col-span-desktop': 1,
          '--row-span-desktop': 1,
        };
    }
  };

  const spanVars = getGridSpanStyle(bentoSize);
  const cardId = `bento-card-${project.projectId}`;

  const isLarge = bentoSize === 'hero' || bentoSize === 'tall';
  const titleSize = isLarge ? 'clamp(1rem, 3.5vw, 1.5rem)' : 'clamp(0.85rem, 2.8vw, 1.1rem)';

  return (
    <>
      {/* CSS en línea para los spans responsivos */}
      <style>{`
        #${cardId} {
          grid-column: span var(--col-span-mobile, 1);
          grid-row: span var(--row-span-mobile, 1);
        }
        @media (min-width: 541px) {
          #${cardId} {
            grid-column: span var(--col-span-tablet, 1);
            grid-row: span var(--row-span-tablet, 1);
          }
        }
        @media (min-width: 900px) {
          #${cardId} {
            grid-column: span var(--col-span-desktop, 1);
            grid-row: span var(--row-span-desktop, 1);
          }
        }
      `}</style>

      <div
        id={cardId}
        style={spanVars}
        onClick={() => openProjectModal(project, currentIndex)}
        onMouseEnter={() => { setIsHovered(true); setIsPaused(true); }}
        onMouseLeave={() => { setIsHovered(false); setIsPaused(false); }}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        role="button"
        tabIndex={0}
        aria-label={`Abrir proyecto ${projectTitle}`}
        style={{
          ...spanVars,
          position: 'relative',
          borderRadius: 'clamp(16px, 3vw, 28px)',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: '#f1f5f9',
          boxShadow: isHovered
            ? `0 16px 36px ${glowColor || '#ff007f'}33, 0 6px 16px rgba(15,23,42,0.12)`
            : '0 3px 12px rgba(15,23,42,0.07)',
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',
          border: `2px solid ${isHovered ? glowColor || '#ff007f' : 'rgba(226, 232, 240, 0.9)'}`,
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Carrusel de imágenes con crossfade */}
        {images.map((imgUrl, idx) => (
          <img
            key={imgUrl + idx}
            src={imgUrl}
            alt={`${projectTitle} lámina ${idx + 1}`}
            loading={idx === 0 ? 'eager' : 'lazy'}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === currentIndex ? 0.95 : 0,
              transform: idx === currentIndex
                ? (isHovered ? 'scale(1.04)' : 'scale(1.0)')
                : 'scale(1.02)',
              transition: 'opacity 0.8s ease, transform 0.5s ease',
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* Degradado inferior */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,14,30,0.9) 0%, rgba(10,14,30,0.12) 50%, transparent 100%)',
            pointerEvents: 'none'
          }}
        />

        {/* Flechas de navegación (solo hover en desktop, siempre visible en touch) */}
        {totalSheets > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Lámina anterior"
              style={{
                position: 'absolute',
                top: '50%',
                left: '10px',
                transform: `translateY(-50%)`,
                opacity: isHovered ? 1 : 0,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(6px)',
                border: 'none',
                color: '#0f172a',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'opacity 0.2s ease',
                zIndex: 3,
                // En mobile, siempre visible para touch
                ['@media (maxWidth: 768px)']: { opacity: 1 }
              }}
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              aria-label="Siguiente lámina"
              style={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: `translateY(-50%)`,
                opacity: isHovered ? 1 : 0,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(6px)',
                border: 'none',
                color: '#0f172a',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'opacity 0.2s ease',
                zIndex: 3
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Año en esquina superior derecha */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 2
          }}
        >
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(6px)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)',
              fontWeight: '800',
              color: glowColor || '#0f172a',
              letterSpacing: '0.08em',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            {yearDisplay || year}
          </div>
        </div>

        {/* Indicador de láminas arriba izquierda */}
        {totalSheets > 1 && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              gap: '3px',
              alignItems: 'center',
              zIndex: 2
            }}
          >
            {Array.from({ length: Math.min(totalSheets, 10) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentIndex ? '14px' : '5px',
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: i === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* Información inferior */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 'clamp(14px, 3vw, 22px) clamp(14px, 3vw, 22px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            pointerEvents: 'none',
            zIndex: 2
          }}
        >
          {totalSheets > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: glowColor || '#00ffff'
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 'clamp(0.55rem, 1.6vw, 0.68rem)',
                  fontWeight: '700',
                  color: 'rgba(255,255,255,0.8)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}
              >
                LÁMINA {currentIndex + 1}/{totalSheets}
              </span>
            </div>
          )}

          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: titleSize,
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '-0.01em',
              lineHeight: '1.2',
              textTransform: 'uppercase'
            }}
          >
            {projectTitle}
          </h3>
        </div>
      </div>
    </>
  );
}
