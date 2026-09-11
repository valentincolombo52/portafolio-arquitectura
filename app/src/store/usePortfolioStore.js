import { create } from 'zustand';

// Asignación de tamaños Bento para lograr la grilla irregular inspirada en la imagen de referencia:
// - 'hero': Tarjeta grande de 2 columnas x 2 filas (Destacados principales)
// - 'tall': Tarjeta vertical alta de 1 columna x 2 filas
// - 'wide': Tarjeta horizontal ancha de 2 columnas x 1 fila
// - 'compact': Tarjeta estándar de 1 columna x 1 fila
const BENTO_PRESETS = {
  // Proyectos Destacados Grandes Solicitados (Hero / Wide)
  'campo-y-ciudad': { size: 'hero', order: 1 },
  'campo-trabajo-y-educacion': { size: 'hero', order: 2 },
  'megacamalote': { size: 'hero', order: 3 },
  'lugares-temporales': { size: 'hero', order: 4 },
  'parche-1': { size: 'wide', order: 5 }, // Los espacios Poché
  'planes-para-argentina': { size: 'wide', order: 6 },
  'puerta-del-sol': { size: 'wide', order: 7 }, // Puerta del Sol_202X

  // Variaciones para encaje perfecto sin huecos blancos
  'cardales-1': { size: 'tall', order: 8 },
  'diagramas-y-ensayos': { size: 'tall', order: 9 },
  'reconstruccion-civica': { size: 'compact', order: 10 },
  'parque-pyme': { size: 'compact', order: 11 },
  'reconversion': { size: 'compact', order: 12 },
  'retoque': { size: 'compact', order: 13 },
  'centro-cultural': { size: 'compact', order: 14 },
  'conurbano-profundo': { size: 'tall', order: 15 },
  'morfologias': { size: 'tall', order: 16 },
  'bicho': { size: 'compact', order: 17 },
  'conjunto-estudiantil': { size: 'compact', order: 18 },
};

export const usePortfolioStore = create((set, get) => ({
  activeFilter: 'ALL',
  rawElements: [],
  projects: [],
  activeProjectModal: null,
  activeSheetIndex: 0,
  isAboutOpen: false,

  loadElements: (data) => {
    // Excluir telon-de-fondo
    const cleanData = data.filter(el => el.projectId !== 'telon-de-fondo');

    // Agrupar por projectId
    const groups = {};
    cleanData.forEach(el => {
      if (!groups[el.projectId]) {
        groups[el.projectId] = {
          projectId: el.projectId,
          projectTitle: el.projectTitle || el.projectId,
          glowColor: el.glowColor || '#00ffff',
          year: el.year || 2024,
          yearDisplay: el.yearDisplay || `${el.year || 2024}`,
          type: el.type || 'Proyecto',
          sheets: []
        };
      }
      groups[el.projectId].sheets.push(el);
    });

    // Formatear array de proyectos para la grilla Bento
    const projectList = Object.values(groups).map(proj => {
      const preset = BENTO_PRESETS[proj.projectId] || { size: 'compact', order: 99 };
      const coverImage = proj.sheets[0]?.fullImage || proj.sheets[0]?.thumbnail || '';

      return {
        ...proj,
        bentoSize: preset.size,
        order: preset.order,
        coverImage,
        sheetCount: proj.sheets.length
      };
    });

    // Ordenar proyectos: los más recientes arriba (mayor año) y los más viejos abajo (menor año)
    projectList.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year; // Orden cronológico descendente (2025 -> 2024 -> 2023 -> 2022 -> 2021)
      }
      return a.order - b.order;
    });

    set({
      rawElements: cleanData,
      projects: projectList
    });
  },

  setFilter: (filter) => set({ activeFilter: filter }),

  openProjectModal: (project, initialSheetIndex = 0) => set({
    activeProjectModal: project,
    activeSheetIndex: initialSheetIndex
  }),

  closeProjectModal: () => set({
    activeProjectModal: null,
    activeSheetIndex: 0
  }),

  setActiveSheetIndex: (index) => set({ activeSheetIndex: index }),

  nextSheet: () => set((state) => {
    if (!state.activeProjectModal) return {};
    const total = state.activeProjectModal.sheets.length;
    return { activeSheetIndex: (state.activeSheetIndex + 1) % total };
  }),

  prevSheet: () => set((state) => {
    if (!state.activeProjectModal) return {};
    const total = state.activeProjectModal.sheets.length;
    return { activeSheetIndex: (state.activeSheetIndex - 1 + total) % total };
  }),

  setAboutOpen: (isOpen) => set({ isAboutOpen: isOpen }),
}));