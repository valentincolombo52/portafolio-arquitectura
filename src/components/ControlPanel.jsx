import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function ControlPanel() {
  const elements = usePortfolioStore((state) => state.elements);
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);
  const setActiveProjectId = usePortfolioStore((state) => state.setActiveProjectId);
  const clearActiveProjectId = usePortfolioStore((state) => state.clearActiveProjectId);

  // Extract unique projects (id and title) dynamically from loaded elements
  const projects = [];
  const seenIds = new Set();
  
  elements.forEach((el) => {
    if (el.projectId && !seenIds.has(el.projectId)) {
      seenIds.add(el.projectId);
      projects.push({
        id: el.projectId,
        title: el.projectTitle || el.projectId.toUpperCase(),
      });
    }
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '1.2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        alignItems: 'center',
        width: '95vw',
        maxWidth: '850px',
        pointerEvents: 'auto',
        transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
      }}
    >
      <div 
        className="brutalist-panel frame-pink"
        style={{
          padding: '0.8rem 1.4rem',
          display: 'flex',
          gap: '1.2rem',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderWidth: '2px',
          width: '100%',
          overflowX: 'auto', // Sleek scroll on mobile
          whiteSpace: 'nowrap',
          scrollbarWidth: 'thin',
        }}
      >
        {/* Reset / Canvas Initial Chaos Button */}
        <button
          onClick={clearActiveProjectId}
          className={`brutalist-btn ${activeProjectId === null ? 'active' : ''}`}
          style={{ 
            borderColor: 'var(--color-frame-pink)', 
            boxShadow: activeProjectId === null ? '3px 3px 0px var(--color-frame-pink)' : 'none',
            flexShrink: 0,
          }}
        >
          [INICIAL]
        </button>

        <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-border)', flexShrink: 0 }} />

        {/* Dynamic Project Buttons block */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
          <span className="cad-label" style={{ fontSize: '0.55rem', color: '#000', marginRight: '0.4rem', flexShrink: 0 }}>
            :: FILTRAR // PROYECTO
          </span>
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => setActiveProjectId(proj.id)}
              className={`brutalist-btn ${activeProjectId === proj.id ? 'active' : ''}`}
              style={{
                borderColor: activeProjectId === proj.id ? 'var(--color-frame-pink)' : 'var(--color-border)',
                boxShadow: activeProjectId === proj.id ? '3px 3px 0px var(--color-frame-pink)' : 'none',
                flexShrink: 0,
              }}
            >
              {proj.title.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      {/* Console details tag */}
      <span 
        style={{ 
          fontSize: '0.55rem', 
          color: 'var(--color-text-muted)', 
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 'bold'
        }}
      >
        SELECCIÓN_DE_PROYECTO // TABLERO_ARQUITECTÓNICO
      </span>
    </div>
  );
}
