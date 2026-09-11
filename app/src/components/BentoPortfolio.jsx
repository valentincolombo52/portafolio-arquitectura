import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import HeaderNav from './HeaderNav';
import BentoCard from './BentoCard';
import ProjectGalleryModal from './ProjectGalleryModal';
import AboutModal from './AboutModal';
import DynamicAuraBackground from './DynamicAuraBackground';

export default function BentoPortfolio() {
  const projects = usePortfolioStore((state) => state.projects);
  const activeFilter = usePortfolioStore((state) => state.activeFilter);

  // Filtrar proyectos según el filtro activo
  const filteredProjects = projects.filter((proj) => {
    if (activeFilter === 'ALL') return true;
    const yDisp = (proj.yearDisplay || '').toString().toUpperCase();
    const yNum = (proj.year || '').toString();
    const filterUpper = activeFilter.toUpperCase();
    return yDisp === filterUpper || yNum === filterUpper;
  });

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Fondo Animado de Auras Difuminadas Pastel */}
      <DynamicAuraBackground />

      {/* Barra de Navegación Superior Fija */}
      <HeaderNav />

      {/* Contenedor Principal Bento Grid */}
      <main
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: 'clamp(12px, 3vw, 24px) clamp(10px, 3vw, 24px) 60px',
          flex: 1,
          position: 'relative',
          zIndex: 1
        }}
      >
        {/*
          Grilla responsiva:
          - Mobile (<640px): 1 columna, todas las tarjetas "hero/tall" pasan a 1 columna
          - Tablet (640–1024px): 2 columnas
          - Desktop (>1024px): layout completo con spans múltiples
        */}
        <style>{`
          .bento-grid {
            display: grid;
            gap: clamp(10px, 2vw, 20px);
            width: 100%;
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: clamp(180px, 30vw, 260px);
            grid-auto-flow: dense;
          }
          @media (max-width: 540px) {
            .bento-grid {
              grid-template-columns: 1fr;
              grid-auto-rows: clamp(220px, 55vw, 300px);
            }
          }
          @media (min-width: 900px) {
            .bento-grid {
              grid-template-columns: repeat(4, 1fr);
              grid-auto-rows: 230px;
            }
          }
          @media (min-width: 1200px) {
            .bento-grid {
              grid-auto-rows: 250px;
            }
          }
        `}</style>

        <div className="bento-grid">
          {filteredProjects.map((proj) => (
            <BentoCard key={proj.projectId} project={proj} />
          ))}
        </div>
      </main>

      {/* Modales */}
      <ProjectGalleryModal />
      <AboutModal />
    </div>
  );
}
