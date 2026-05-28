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
  const gapX = 6;
  const gapY = 5;
  
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
  // Simplified Core Portfolio State (Centering exclusively on activeProjectId)
  activeFilter: 'ALL',
  elements: [],
  activeProjectId: null,
  fullscreenImageId: null,
  draggingElementId: null,
  
  // Viewport navigation (Rhino/AutoCAD style)
  cameraOffset: [0, 0, 15], 
  targetCameraOffset: [0, 0, 15],
  gridOpacity: 0.25,
  systemStatus: 'SYS_OK',
  fps: 60,

  // Load database items
  loadElements: (data) => {
    const initialized = data.map((item) => ({
      ...item,
      currentPosition: [...item.initialPosition],
      targetPosition: [...item.initialPosition],
      currentRotation: item.initialRotation,
      targetRotation: item.initialRotation,
      zIndex: Math.random() * 10,
      isActive: true,
    }));
    set({ elements: initialized });
  },

  // Set filter & trigger spring layout calculations
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

  // Set Active Project Group (Secondary Collage magnetic trigger)
  setActiveProjectId: (projectId) => {
    set({
      activeProjectId: projectId,
      systemStatus: `PROYECTO_AGRUPADO: ${projectId.toUpperCase()}`,
    });
  },

  clearActiveProjectId: () => {
    set({
      activeProjectId: null,
      fullscreenImageId: null,
      systemStatus: 'CANVAS_CHAOS_ENGAGED',
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

  // Interactive Raycast Dragging Actions
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

  // Camera Pan and Zoom methods
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

  // Manual frame performance rating
  setFps: (fps) => set({ fps }),
}));
