import React from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';

export default function AboutModal() {
  const isAboutOpen = usePortfolioStore((state) => state.isAboutOpen);
  const setAboutOpen = usePortfolioStore((state) => state.setAboutOpen);

  if (!isAboutOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2100,
        backgroundColor: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={() => setAboutOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90dvh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '1.5px solid #ff007f',
          borderRadius: 'clamp(16px, 4vw, 24px)',
          padding: 'clamp(20px, 5vw, 32px)',
          boxShadow: '0 20px 50px rgba(255, 0, 127, 0.25)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          position: 'relative',
          scrollbarWidth: 'none'
        }}
      >
        {/* Botón cerrar */}
        <button
          onClick={() => setAboutOpen(false)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            fontSize: '1.2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff007f' }} />
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', letterSpacing: '0.15em', color: '#ff007f', fontWeight: '800' }}>
            PERFIL PROFESIONAL
          </span>
        </div>

        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
            VALENTÍN COLOMBO
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
            Estudiante de Arquitectura · FADU UBA
          </p>
        </div>

        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: '#cbd5e1' }}>
          Apasionado por la investigación morfológica, el diseño espacial contemporáneo y la representación digital.
          Este portafolio reúne ensayos proyectuales, investigaciones de campo y bitácoras desarrolladas a lo largo de la carrera.
        </p>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#ff007f', fontWeight: '800', letterSpacing: '0.12em' }}>
            CONTACTO & REDES
          </span>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="mailto:valentincolombo52@gmail.com"
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
                fontFamily: 'var(--font-mono, monospace)'
              }}
            >
              ✉ EMAIL
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
