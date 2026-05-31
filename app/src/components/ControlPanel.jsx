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
      className="brutalist-panel frame-pink scrollbar-hide"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
        height: '56px',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        fontSize: '11px',
        touchAction: 'pan-x',
        backgroundColor: 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(8px)',
        borderTop: '2px solid var(--color-border)',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        boxShadow: 'none',
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

      <span className="cad-label" style={{ fontSize: '0.55rem', color: '#000', marginRight: '0.2rem', flexShrink: 0 }}>
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
  );
}
