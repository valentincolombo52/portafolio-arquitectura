import React, { useEffect, useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function TerminalHUD() {
  const cameraOffset = usePortfolioStore((state) => state.cameraOffset);
  const fps = usePortfolioStore((state) => state.fps);
  const systemStatus = usePortfolioStore((state) => state.systemStatus);
  const elements = usePortfolioStore((state) => state.elements);
  const draggingElementId = usePortfolioStore((state) => state.draggingElementId);
  const activeProjectId = usePortfolioStore((state) => state.activeProjectId);

  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [logs, setLogs] = useState([
    'INIC_SISTEMA // PORTFOLIO_OS V1.0',
    'ASIGNACIÓN_MEMORIA: CORRECTO // VRAM COMPILADA',
    'CANVAS_WEBGL: BUFFER_DE_TEXTURAS_ACTIVO',
    'ESPERANDO_INSTRUCCIONES_DE_ARRASQUE'
  ]);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state events to terminal logging stream
  useEffect(() => {
    if (systemStatus !== 'SYS_OK') {
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ${systemStatus}`,
        ...prev.slice(0, 4)
      ]);
    }
  }, [systemStatus]);

  // Sync drag events
  useEffect(() => {
    if (draggingElementId) {
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] BLOQUEO_PUNTERO: ${draggingElementId.toUpperCase()}`,
        ...prev.slice(0, 4)
      ]);
    }
  }, [draggingElementId]);

  const activeCount = elements.filter(el => el.isActive).length;

  return (
    <div 
      className="terminal-hud"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicking through to Canvas!
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.2rem',
        zIndex: 100,
        // SILENCE AND DESATURATE HUD WHEN A PROJECT GROUP IS FOCUS-ACTIVE
        filter: activeProjectId ? 'grayscale(1) opacity(0.2)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
      }}
    >
      {/* Top HUD Header */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%'
        }}
      >
        {/* Title logo (Purple Neon Frame) */}
        <div 
          className="brutalist-panel frame-purple"
          style={{ 
            pointerEvents: 'auto',
            padding: '1rem 1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <h1 className="title-display" style={{ fontSize: '1.8rem', margin: 0, color: '#000000' }}>
            ARQ. FADU, UBA
          </h1>
          <div style={{ fontSize: '0.65rem', marginTop: '0.4rem', color: '#000000', fontWeight: 'bold' }}>
            TABLERO DE COLAGE ARQUITECTÓNICO
          </div>
        </div>

        {/* Real-time coordinates readouts (Cyan Neon Frame) */}
        <div 
          className="brutalist-panel frame-cyan hud-coords"
          style={{
            padding: '0.6rem 1rem',
            pointerEvents: 'auto',
            fontSize: '0.7rem',
            lineHeight: '1.4',
            minWidth: '220px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="cad-label">CAM_X</span>
            <span style={{ fontWeight: 'bold' }}>{cameraOffset[0].toFixed(4)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="cad-label">CAM_Y</span>
            <span style={{ fontWeight: 'bold' }}>{cameraOffset[1].toFixed(4)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="cad-label">ZOOM_D</span>
            <span style={{ color: 'var(--color-frame-cyan)', fontWeight: 'bold' }}>{(15 / cameraOffset[2]).toFixed(2)}x</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
            <span className="cad-label">GPU_REFRESH</span>
            <span style={{ color: 'var(--color-border)', fontWeight: 'bold' }}>
              {fps} FPS
            </span>
          </div>
        </div>
      </div>

      {/* Middle side help panels (CAD style blueprint notes) */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flex: 1,
          margin: '2rem 0'
        }}
      >
        {/* Navigation Instructions (Purple Neon Frame) */}
        <div 
          className="brutalist-panel frame-purple hud-controls"
          style={{
            padding: '0.8rem',
            fontSize: '0.6rem',
            color: '#000000',
            lineHeight: '1.6',
            pointerEvents: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '0.4rem', borderBottom: '1px solid #000' }}>MAPA_CONTROLES // RHINO_CAD</div>
          <div>• ARRASTRE: CLIC MEDIO // ESPACIO + CLIC IZQ</div>
          <div>• ZOOM: RUEDA RATÓN // PELLIZCO DE TRACKPAD</div>
          <div>• EXPLORAR: CLIC PROYECTO PARA AGRANDAR</div>
          <div>• ORDENAR: ARRASTRE LIBRE DE IMÁGENES</div>
        </div>

        {/* CAD Blueprint details box (Orange Neon Frame) */}
        <div 
          className="brutalist-panel frame-orange hud-config"
          style={{
            padding: '0.8rem',
            fontSize: '0.6rem',
            lineHeight: '1.6',
            pointerEvents: 'auto',
            textAlign: 'right',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '0.4rem', borderBottom: '1px solid #000', color: 'var(--color-frame-orange)' }}>CONFIG_SISTEMA // CLOU_ARC</div>
          <div>ELEMENTOS: {elements.length} BLOQUES</div>
          <div>NODOS_ACTIVOS: {activeCount}</div>
          <div>NODOS_HELEADOS: {elements.length - activeCount}</div>
          <div>CÓDIGO: TABLERO_ARQUITECTURA</div>
        </div>
      </div>

      {/* Bottom HUD Log Console */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          width: '100%'
        }}
      >
        {/* Terminal log stream (Yellow Neon Frame) */}
        <div 
          className="brutalist-panel frame-yellow hud-logs"
          style={{
            padding: '0.6rem 1rem',
            width: '450px',
            fontSize: '0.65rem',
            lineHeight: '1.5',
            pointerEvents: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000000', paddingBottom: '0.2rem', marginBottom: '0.4rem', color: 'var(--color-frame-yellow)' }}>
            REGISTROS DEL TERMINAL DE DATOS
          </div>
          {logs.map((log, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', opacity: 1 - i * 0.18, color: '#000000' }}>
              {log}
            </div>
          ))}
        </div>

        {/* Time and Status Box (Green Neon Frame) */}
        <div 
          className="brutalist-panel frame-green hud-logs"
          style={{
            padding: '0.6rem 1rem',
            pointerEvents: 'auto',
            fontSize: '0.65rem',
            textAlign: 'right',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <div>TIEMPO // {timestamp}</div>
          <div style={{ marginTop: '0.3rem' }}>
            ESTADO // <span className="flicker" style={{ fontWeight: 'bold', color: 'var(--color-frame-green)' }}>{systemStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
