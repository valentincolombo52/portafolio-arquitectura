import React, { useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function HeaderNav() {
  const activeFilter = usePortfolioStore((state) => state.activeFilter);
  const setFilter = usePortfolioStore((state) => state.setFilter);
  const setAboutOpen = usePortfolioStore((state) => state.setAboutOpen);
  const projects = usePortfolioStore((state) => state.projects);

  // Obtener lista única de años ordenada cronológicamente descendente
  const yearSet = new Set();
  projects.forEach((p) => {
    if (p.yearDisplay) yearSet.add(p.yearDisplay);
    else if (p.year) yearSet.add(p.year.toString());
  });
  const availableYears = Array.from(yearSet);

  const filters = [
    { id: 'ALL', label: 'TODOS' },
    ...availableYears.map((y) => ({ id: y, label: y })),
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1.5px solid #e2e8f0',
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0'
      }}
    >
      {/* Fila superior: Título + Botón Sobre Mí */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0 8px 0',
          gap: '8px'
        }}
      >
        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ff007f',
              boxShadow: '0 0 8px #ff007f',
              flexShrink: 0
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'clamp(0.7rem, 2.8vw, 0.92rem)',
              fontWeight: '800',
              letterSpacing: '0.06em',
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            VALENTÍN COLOMBO{' '}
            <span style={{ opacity: 0.35, display: 'none' /* oculto en mobile via CSS */ }}>
              // ARCHIVO DE ARQUITECTURA
            </span>
          </span>
        </div>

        {/* Botón Sobre Mí */}
        <button
          onClick={() => setAboutOpen(true)}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)',
            fontWeight: '700',
            letterSpacing: '0.06em',
            padding: '7px 14px',
            borderRadius: '20px',
            border: '1.5px solid #ff007f',
            backgroundColor: '#fff0f6',
            color: '#d6006e',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            minHeight: '36px'
          }}
        >
          SOBRE MÍ ↗
        </button>
      </div>

      {/* Fila de filtros con scroll horizontal */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '10px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        className="scrollbar-hide"
      >
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 'clamp(0.65rem, 2.4vw, 0.75rem)',
                fontWeight: '700',
                letterSpacing: '0.06em',
                padding: '7px 14px',
                borderRadius: '20px',
                border: `1.5px solid ${isActive ? '#0f172a' : '#e2e8f0'}`,
                backgroundColor: isActive ? '#0f172a' : '#f8fafc',
                color: isActive ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                minHeight: '36px',
                minWidth: '44px'
              }}
            >
              {f.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
