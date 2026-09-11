import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function ControlPanel() {
  const elements = usePortfolioStore((state) => state.elements);
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);
  const setActiveProjectId = usePortfolioStore((state) => state.setActiveProjectId);
  const clearActiveProjectId = usePortfolioStore((state) => state.clearActiveProjectId);

  // Extract unique projects dynamically from loaded elements, memoized for performance
  const projects = React.useMemo(() => {
    const projs = [];
    const seenIds = new Set();
    elements.forEach((el) => {
      if (el.projectId && !seenIds.has(el.projectId)) {
        seenIds.add(el.projectId);
        projs.push({
          id: el.projectId,
          title: el.projectTitle || el.projectId.toUpperCase(),
        });
      }
    });
    return projs;
  }, [elements]);

  return (
    <div
      className="brutalist-panel frame-pink"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%', // antes 100vw: causaba desborde horizontal en móviles
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
        minHeight: '56px', // antes height fijo: chocaban el contenido
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        // Respeta la barra de inicio de iPhone (safe area)
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        fontSize: '11px',
        touchAction: 'pan-x',
        backgroundColor: 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Safari/iOS necesita este prefijo
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