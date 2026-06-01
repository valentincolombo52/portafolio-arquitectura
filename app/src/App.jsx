import React, { useEffect, Suspense } from 'react';
import { useProgress } from '@react-three/drei';
import { usePortfolioStore } from './store/usePortfolioStore';
import CanvasWorkspace from './components/CanvasWorkspace';
import TerminalHUD from './components/TerminalHUD';
import ControlPanel from './components/ControlPanel';
import FullscreenViewer from './components/FullscreenViewer';
import ZoomedImageViewer from './components/ZoomedImageViewer';
import projectsData from './data/projects.json';

// Dynamic Retro Loading Terminal using Drei progress hooks
function TerminalLoader() {
  const { active, progress, item } = useProgress();

  if (!active) return null;

  const barLength = 30;
  const filledCount = Math.round((progress / 100) * barLength);
  const loadingBar = '[' + '='.repeat(filledCount) + ' '.repeat(barLength - filledCount) + ']';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        color: '#000000',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        lineHeight: '1.8',
        padding: '2rem',
      }}
    >
      <div
        className="brutalist-panel frame-pink"
        style={{
          padding: '2rem 3rem',
          maxWidth: '650px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderWidth: '2px',
        }}
      >
        <div className="title-display flicker" style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#ff007f' }}>
          INICIANDO // TABLERO_ARQUITECTURA
        </div>

        <div>ASIGNANDO TEXTURAS DE GPU...</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>ARCHIVO: {item ? item.slice(-45) : 'COMPILANDO_DIBUJOS.webp'}</div>
        <div style={{ color: '#00b4d8', margin: '1rem 0', letterSpacing: '2px', fontWeight: 'bold' }}>
          {loadingBar} {progress.toFixed(0)}%
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '0.65rem' }}>
          <span>MEMORIA_VRAM: CARGADA</span>
          <span>COMPILADOR_WebGL: ACTIVO</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const loadElements = usePortfolioStore((state) => state.loadElements);
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);
  const fullscreenImageId = usePortfolioStore((state) => state.fullscreenImageId);
  const zoomedImage = usePortfolioStore((state) => state.zoomedImage);
  const clearActiveProjectId = usePortfolioStore((state) => state.clearActiveProjectId);
  const elements = usePortfolioStore((state) => state.elements);

  useEffect(() => {
    if (projectsData && projectsData.length > 0) {
      loadElements(projectsData);
    }
  }, [loadElements]);

  const activeElement = elements.find((el) => el.projectId === activeProjectId);
  const activeProjectTitle = activeElement ? activeElement.projectTitle : '';
  const activeGroupCount = elements.filter((el) => el.projectId === activeProjectId).length;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div className="crt-overlay flicker"></div>

      {/* Ocultamos el mundo 3D sin destruirlo para que el visor 2D funcione */}
      <div
        style={{
          visibility: (fullscreenImageId || zoomedImage) ? 'hidden' : 'visible',
          opacity: (fullscreenImageId || zoomedImage) ? 0 : 1,
          pointerEvents: (fullscreenImageId || zoomedImage) ? 'none' : 'auto',
          width: '100%',
          height: '100%',
          position: 'absolute',
          transition: 'opacity 0.3s ease'
        }}
      >
        <Suspense fallback={null}>
          <CanvasWorkspace />
        </Suspense>

        <TerminalHUD />
        <ControlPanel />

        {activeProjectId && (
          <div className="brutalist-panel frame-pink active-project-overlay">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                whiteSpace: 'normal',
                textAlign: 'center'
              }}
            >
              GRUPO // {activeProjectTitle.toUpperCase()} // {activeGroupCount} ACTIVOS AGRUPADOS
            </span>
            <button
              onClick={clearActiveProjectId}
              className="brutalist-btn"
              style={{
                padding: '0.4rem 1rem',
                borderColor: '#ff007f',
                color: '#ff007f',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}
            >
              [CERRAR_PROYECTO]
            </button>
          </div>
        )}
      </div>

      <FullscreenViewer />
      <ZoomedImageViewer />
      <TerminalLoader />
    </div>
  );
}