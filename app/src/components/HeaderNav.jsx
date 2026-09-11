import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

const FILTERS = [
  { id: 'ALL', label: 'TODOS' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
  { id: '2022', label: '2022' },
  { id: '2021', label: '2021' },
];

export default function HeaderNav() {
  const activeFilter = usePortfolioStore((state) => state.activeFilter);
  const setFilter = usePortfolioStore((state) => state.setFilter);
  const setAboutOpen = usePortfolioStore((state) => state.setAboutOpen);
  const projects = usePortfolioStore((state) => state.projects);

  // Obtener lista única de años preservando el orden cronológico
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
        backgroundColor: '#ffffff',
        borderBottom: '1.5px solid #e2e8f0',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      {/* Título Identificatorio */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#ff007f',
            boxShadow: '0 0 10px #ff007f'
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.95rem',
            fontWeight: '800',
            letterSpacing: '0.12em',
            color: '#0f172a'
          }}
        >
          VALENTÍN COLOMBO <span style={{ opacity: 0.4 }}>// ARCHIVO DE ARQUITECTURA</span>
        </span>
      </div>

      {/* Pestañas de Filtro */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                padding: '6px 14px',
                borderRadius: '20px',
                border: `1.5px solid ${isActive ? '#0f172a' : '#e2e8f0'}`,
                backgroundColor: isActive ? '#0f172a' : '#f8fafc',
                color: isActive ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          );
        })}
      </nav>

      {/* Botón Sobre Mí / Contacto */}
      <button
        onClick={() => setAboutOpen(true)}
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          padding: '8px 18px',
          borderRadius: '20px',
          border: '1.5px solid #ff007f',
          backgroundColor: '#fff0f6',
          color: '#d6006e',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        SOBRE MÍ ↗
      </button>
    </header>
  );
}
