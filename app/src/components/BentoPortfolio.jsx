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
        backgroundColor: '#f8fafc', // Fondo claro
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

      {/* Contenedor Principal Bento Grid - 100% Ancho de Pantalla */}
      <main
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '24px 28px 60px 28px',
          flex: 1,
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Grilla Bento Irregular 2D de Ancho Completo - Ajuste Perfecto Sin Espacios Vacíos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gridAutoRows: '220px',
            gridAutoFlow: 'dense',
            gap: '20px', // Margen entre viñetas de proyectos
            width: '100%'
          }}
        >
          {filteredProjects.map((proj) => (
            <BentoCard key={proj.projectId} project={proj} />
          ))}
        </div>
      </main>

      {/* Modales Desplegables de Galería y Biografía */}
      <ProjectGalleryModal />
      <AboutModal />
    </div>
  );
}
