import { create } from 'zustand';

// Generate CAD Blueprint Grid coordinates for active elements
function calculateGridPositions(elements, activeFilter) {
  if (activeFilter === 'ALL') {
    return elements.map((el) => ({
      ...el,
      targetPosition: [...el.initialPosition],
      targetRotation: el.initialRotation,
      isActive: true,
    }));
  }

  // Filter elements: active vs inactive
  const filtered = elements.map((el) => {
    const matchesFilter =
      el.year.toString() === activeFilter ||
      el.type.toLowerCase() === activeFilter.toLowerCase();
    return { ...el, matchesFilter };
  });

  const activeElements = filtered.filter((el) => el.matchesFilter);
  const inactiveElements = filtered.filter((el) => !el.matchesFilter);

  // Setup Grid properties for active elements
  const cols = Math.min(4, Math.ceil(Math.sqrt(activeElements.length)));
  const gapX = 7.5;
  const gapY = 6.25;

  const rowCount = Math.ceil(activeElements.length / cols);
  const gridWidth = (cols - 1) * gapX;
  const gridHeight = (rowCount - 1) * gapY;
  const startX = -gridWidth / 2;
  const startY = gridHeight / 2;

  // Assign grid positions to active elements
  const positionedActive = activeElements.map((el, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const targetX = startX + col * gapX;
    const targetY = startY - row * gapY;

    return {
      ...el,
      targetPosition: [targetX, targetY, 0.5],
      targetRotation: 0,
      isActive: true,
    };
  });

  // Make inactive elements "fall down" under gravity
  const positionedInactive = inactiveElements.map((el) => {
    const fallX = el.initialPosition[0] * 1.5;
    const fallY = -40 - Math.random() * 20; // Fall off screen

    return {
      ...el,
      targetPosition: [fallX, fallY, -0.5],
      targetRotation: el.initialRotation * 2.5,
      isActive: false,
    };
  });

  return [...positionedActive, ...positionedInactive];
}

export const usePortfolioStore = create((set, get) => ({
  activeFilter: 'ALL',
  elements: [],
  activeProjectId: null,
  fullscreenImageId: null,
  zoomedImage: null,
  draggingElementId: null,

  setZoomedImage: (image) => {
    set({
      zoomedImage: image,
      systemStatus: image ? `ZOOM_IMAGEN: ${image.id.toUpperCase()}` : 'SYS_OK',
    });
  },

  clearZoomedImage: () => {
    set({
      zoomedImage: null,
      systemStatus: 'SYS_OK',
    });
  },

  cameraOffset: [0, 0, typeof window !== 'undefined' && window.innerWidth < 768 ? 95 : 15],
  targetCameraOffset: [0, 0, typeof window !== 'undefined' && window.innerWidth < 768 ? 95 : 15],
  gridOpacity: 0.25,
  systemStatus: 'SYS_OK',
  fps: 60,

  loadElements: (data) => {
    const totalElements = data.length;
    const cols = Math.ceil(Math.sqrt(totalElements));
    const rows = Math.ceil(totalElements / cols);
    const spacing = 8.0;
    const jitterAmount = 1.5;

    const gridWidth = (cols - 1) * spacing;
    const gridHeight = (rows - 1) * spacing;
    const startX = -gridWidth / 2;
    const startY = gridHeight / 2;

    const initialized = data.map((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const baseX = startX + col * spacing;
      const baseY = startY - row * spacing;

      const finalX = baseX + (Math.random() - 0.5) * jitterAmount;
      const finalY = baseY + (Math.random() - 0.5) * jitterAmount;
      const finalZ = index * 0.01;
      const rotZ = (Math.random() - 0.5) * 0.25;

      const calculatedPosition = [finalX, finalY, finalZ];

      return {
        ...item,
        initialPosition: calculatedPosition,
        currentPosition: [...calculatedPosition],
        targetPosition: [...calculatedPosition],
        currentRotation: rotZ,
        targetRotation: rotZ,
        zIndex: finalZ,
        isActive: true,
      };
    });
    set({ elements: initialized });
  },

  setFilter: (filter) => {
    set((state) => {
      const updatedElements = calculateGridPositions(state.elements, filter);
      return {
        activeFilter: filter,
        elements: updatedElements,
        systemStatus: filter === 'ALL' ? 'CANVAS_CHAOS_ENGAGED' : `GRID_BLUEPRINT_FILTER: ${filter.toUpperCase()}`,
      };
    });
  },

  setActiveProjectId: (projectId) => {
    set((state) => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const targetZ = isMobile ? 95 : state.cameraOffset[2];

      const groupElements = state.elements.filter((el) => el.projectId === projectId);

      const targetWidth = 12.0;
      const margen = 1.5;
      const mobileHeightsMap = {};

      let currentY = 0;

      // Cálculo matemático corregido para orígenes centrales en 3D
      groupElements.forEach((el, index) => {
        const ratio = el.aspectRatio || 1; // Salvavidas matemático
        const alturaEscalada = targetWidth / ratio;

        if (index === 0) {
          mobileHeightsMap[el.id] = 0;
          currentY = -(alturaEscalada / 2) - margen;
        } else {
          const centerPos = currentY - (alturaEscalada / 2);
          mobileHeightsMap[el.id] = centerPos;
          currentY = centerPos - (alturaEscalada / 2) - margen;
        }
      });

      const updatedElements = state.elements.map((el) => {
        if (el.id in mobileHeightsMap) {
          return {
            ...el,
            targetMobileY: mobileHeightsMap[el.id],
          };
        }
        return el;
      });

      return {
        activeProjectId: projectId,
        elements: updatedElements,
        cameraOffset: [0, 0, targetZ],
        targetCameraOffset: [0, 0, targetZ],
        systemStatus: `PROYECTO_AGRUPADO: ${projectId.toUpperCase()}`,
      };
    });
  },

  clearActiveProjectId: () => {
    set((state) => {
      const initialZ = typeof window !== 'undefined' && window.innerWidth < 768 ? 95 : 15;
      return {
        activeProjectId: null,
        fullscreenImageId: null,
        cameraOffset: [0, 0, initialZ],
        targetCameraOffset: [0, 0, initialZ],
        systemStatus: 'CANVAS_CHAOS_ENGAGED',
      };
    });
  },

  setFullscreenImage: (id) => {
    set({
      fullscreenImageId: id,
      systemStatus: `VISOR_HD: ${id.toUpperCase()}`,
    });
  },

  clearFullscreenImage: () => {
    set({
      fullscreenImageId: null,
      systemStatus: 'SYS_OK',
    });
  },

  startDragging: (id) => {
    set((state) => {
      const updatedElements = state.elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            zIndex: Math.max(...state.elements.map(e => e.zIndex)) + 1,
            targetPosition: [el.currentPosition[0], el.currentPosition[1], 1.0],
          };
        }
        return el;
      });

      return {
        draggingElementId: id,
        elements: updatedElements,
        systemStatus: `DRAGGING: ${id.toUpperCase()}`,
      };
    });
  },

  updateDraggedPosition: (id, position) => {
    set((state) => {
      const updated = state.elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            currentPosition: [position[0], position[1], 1.0],
            targetPosition: [position[0], position[1], 1.0],
          };
        }
        return el;
      });
      return { elements: updated };
    });
  },

  stopDragging: (id) => {
    set((state) => {
      const updated = state.elements.map((el) => {
        if (el.id === id) {
          const defaultZ = state.activeFilter === 'ALL' ? 0 : (el.isActive ? 0.5 : -0.5);
          return {
            ...el,
            targetPosition: [el.currentPosition[0], el.currentPosition[1], defaultZ],
          };
        }
        return el;
      });
      return {
        draggingElementId: null,
        elements: updated,
        systemStatus: 'SYS_OK',
      };
    });
  },

  panCamera: (dx, dy) => {
    set((state) => {
      const [cx, cy, cz] = state.cameraOffset;
      const factor = cz * 0.0015;
      const nx = cx - dx * factor;
      const ny = cy + dy * factor;

      const limitX = 80;
      const limitY = 60;
      const clampedX = Math.max(-limitX, Math.min(limitX, nx));
      const clampedY = Math.max(-limitY, Math.min(limitY, ny));

      return {
        cameraOffset: [clampedX, clampedY, cz],
        targetCameraOffset: [clampedX, clampedY, cz],
      };
    });
  },

  zoomCamera: (deltaY) => {
    set((state) => {
      const [cx, cy, cz] = state.cameraOffset;
      const zoomFactor = 1 + deltaY * 0.001;
      const ncz = Math.max(5, Math.min(45, cz * zoomFactor));
      return {
        cameraOffset: [cx, cy, ncz],
        targetCameraOffset: [cx, cy, ncz],
      };
    });
  },

  setFps: (fps) => set({ fps }),
}));