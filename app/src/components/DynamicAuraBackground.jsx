import React from 'react';

export default function DynamicAuraBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#f8fafc' // Fondo claro arquitectónico
      }}
    >
      {/* Estilos de animación keyframe para los blobs difuminados pastel */}
      <style>{`
        @keyframes floatBlobA {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(140px, -90px) scale(1.15); }
          66% { transform: translate(-100px, 110px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes floatBlobB {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-160px, 100px) scale(1.1); }
          66% { transform: translate(110px, -120px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes floatBlobC {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(90px, 130px) scale(1.2); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>

      {/* Blob 1: Naranja Pastel Cálido */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          backgroundColor: '#ffd8b1',
          filter: 'blur(120px)',
          opacity: 0.70,
          animation: 'floatBlobA 22s ease-in-out infinite'
        }}
      />

      {/* Blob 2: Violeta Pastel */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          right: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          backgroundColor: '#e2c6ff',
          filter: 'blur(130px)',
          opacity: 0.65,
          animation: 'floatBlobB 26s ease-in-out infinite'
        }}
      />

      {/* Blob 3: Amarillo Solar Pastel */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          backgroundColor: '#fff1a8',
          filter: 'blur(110px)',
          opacity: 0.65,
          animation: 'floatBlobC 20s ease-in-out infinite'
        }}
      />

      {/* Blob 4: Verde Mente / Esmeralda Soft */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '-8%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          backgroundColor: '#bbf7d0',
          filter: 'blur(120px)',
          opacity: 0.60,
          animation: 'floatBlobB 24s ease-in-out infinite'
        }}
      />

      {/* Blob 5: Rosa Pastel Soft */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '20%',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          backgroundColor: '#fbcfe8',
          filter: 'blur(125px)',
          opacity: 0.65,
          animation: 'floatBlobA 28s ease-in-out infinite'
        }}
      />
    </div>
  );
}
