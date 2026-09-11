import React, { useState, useEffect, useRef } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function BentoCard({ project }) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const openProjectModal = usePortfolioStore((state) => state.openProjectModal);

  const { projectTitle, glowColor, year, yearDisplay, sheets = [], bentoSize } = project;

  // Extraer todas las URLs de imágenes del proyecto
  const images = sheets.map((s) => {
    let url = s.fullImage || s.thumbnail || s.filename || '';
    url = url.replace(/^.*public\//, '/');
    if (!url.startsWith('/')) url = '/' + url;
    return url;
  }).filter(Boolean);

  const totalSheets = images.length;

  // Intervalo automático de carrusel con desfasaje por tarjeta para evitar saltos simultáneos
  useEffect(() => {
    if (totalSheets <= 1 || isPaused) return;

    // Tiempo de transición de 3.5s + desfasaje aleatorio basado en id del proyecto
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

  // Mapear bentoSize a clases de span de CSS Grid
  const getGridSpan = (size) => {
    switch (size) {
      case 'hero':
        return { gridColumn: 'span 2', gridRow: 'span 2', minHeight: '460px' };
      case 'tall':
        return { gridColumn: 'span 1', gridRow: 'span 2', minHeight: '460px' };
      case 'wide':
        return { gridColumn: 'span 2', gridRow: 'span 1', minHeight: '220px' };
      case 'compact':
      default:
        return { gridColumn: 'span 1', gridRow: 'span 1', minHeight: '220px' };
    }
  };

  const spanStyles = getGridSpan(bentoSize);

  return (
    <div
      onClick={() => openProjectModal(project, currentIndex)}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsPaused(true); // Pausar autoplay al interactuar con el mouse
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPaused(false);
      }}
      style={{
        ...spanStyles,
        position: 'relative',
        borderRadius: '32px',
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: '#f1f5f9',
        boxShadow: isHovered
          ? `0 20px 40px ${glowColor || '#ff007f'}33, 0 8px 20px rgba(15,23,42,0.12)`
          : '0 4px 16px rgba(15,23,42,0.06)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        border: `2px solid ${isHovered ? glowColor || '#ff007f' : 'rgba(226, 232, 240, 0.9)'}`
      }}
    >
      {/* Carrusel de Láminas con Transición Crossfade Suave */}
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
              ? (isHovered ? 'scale(1.05)' : 'scale(1.0)') 
              : 'scale(1.02)',
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Degradado para lectura óptima */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.15) 55%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Botones de Navegación Manual (Flechas visible al Hover si hay más de 1 imagen) */}
      {totalSheets > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Lámina anterior"
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: `translateY(-50%) scale(${isHovered ? 1 : 0.8})`,
              opacity: isHovered ? 1 : 0,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              color: '#0f172a',
              fontSize: '1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
              zIndex: 3
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
              right: '12px',
              transform: `translateY(-50%) scale(${isHovered ? 1 : 0.8})`,
              opacity: isHovered ? 1 : 0,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              color: '#0f172a',
              fontSize: '1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
              zIndex: 3
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Franja de Año y Contador de Láminas en la esquina superior */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          right: '18px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          zIndex: 2
        }}
      >
        <div
          style={{
            padding: '5px 12px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.7rem',
            fontWeight: '800',
            color: glowColor || '#0f172a',
            letterSpacing: '0.1em',
            border: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          {yearDisplay || year}
        </div>
      </div>

      {/* Indicador visual de progreso / Barras de láminas arriba al hacer hover */}
      {totalSheets > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            zIndex: 2
          }}
        >
          {Array.from({ length: Math.min(totalSheets, 8) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentIndex ? '16px' : '6px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: i === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}

      {/* Información del Proyecto en la parte inferior */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          pointerEvents: 'none',
          zIndex: 2
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: glowColor || '#00ffff'
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.7rem',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}
          >
            LÁMINA {currentIndex + 1} DE {totalSheets}
          </span>
        </div>

        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            fontSize: bentoSize === 'hero' ? '1.5rem' : '1.15rem',
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
  );
}

