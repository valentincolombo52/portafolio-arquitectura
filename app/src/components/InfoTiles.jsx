import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const FILTERS = [
  { id: 'ALL', label: 'TODOS' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
  { id: 'Blueprint', label: 'PLANTAS' },
  { id: 'Render', label: 'RENDERS' },
];

export default function InfoTiles() {
  const infoBounds = usePortfolioStore((state) => state.infoBounds);
  const activeFilter = usePortfolioStore((state) => state.activeFilter);
  const setFilter = usePortfolioStore((state) => state.setFilter);

  if (!infoBounds || infoBounds.length === 0) return null;

  return (
    <group name="info-tiles">
      {infoBounds.map((bound) => {
        const { projectId, infoType, projectTitle, color, x, y, width, height } = bound;

        return (
          <group key={projectId} position={[x, y, -0.1]}>
            {/* Fondo neón con borde tenue */}
            <mesh>
              <planeGeometry args={[width, height]} />
              <meshBasicMaterial
                color={new THREE.Color(color)}
                transparent
                opacity={0.12}
                depthWrite={false}
              />
            </mesh>

            {/* Contenido HTML interactivo 3D */}
            <Html
              position={[-width / 2 + 0.6, height / 2 - 0.6, 0.05]}
              transform
              distanceFactor={28}
              style={{
                width: `${(width - 1.2) * 26}px`,
                height: `${(height - 1.2) * 26}px`,
                boxSizing: 'border-box',
                pointerEvents: 'auto'
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  border: `2px solid ${color}`,
                  borderRadius: '10px',
                  padding: '16px 20px',
                  boxShadow: `0 0 20px ${color}33`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  height: '100%',
                  justifyContent: 'space-between'
                }}
              >
                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.18em',
                      color: color,
                      textTransform: 'uppercase'
                    }}
                  >
                    {projectTitle}
                  </span>
                </div>

                {/* Contenido según tipo de ficha */}
                {infoType === 'profile' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#111' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                      VALENTÍN COLOMBO
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8, lineHeight: '1.4' }}>
                      Estudiante de Arquitectura · FADU UBA. Portafolio cartográfico y archivo manguera de proyectos.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7, color: '#333' }}>
                      SELECCIONAR FILTRO:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {FILTERS.map((f) => {
                        const isActive = activeFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              fontFamily: 'inherit',
                              border: `1.5px solid ${isActive ? color : '#ccc'}`,
                              backgroundColor: isActive ? color : '#fff',
                              color: isActive ? '#fff' : '#111',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pie de ficha */}
                <div style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  [MURAL INTERACTIVO 2026]
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
