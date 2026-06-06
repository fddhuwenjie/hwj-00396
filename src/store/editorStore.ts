import { create } from 'zustand';
import type { EmitterConfig, ProjectConfig, Attractor, Vec3 } from '../types';
import { PRESETS } from '../presets';
import { uid } from '../utils/bezier';

interface EditorState {
  project: ProjectConfig;
  activeEmitterId: string | null;
  fps: number;
  activeParticleCount: number;
  collapsedSections: Record<string, boolean>;

  setProject: (p: ProjectConfig) => void;
  loadPreset: (id: string) => void;
  addEmitter: (partial?: Partial<EmitterConfig>) => void;
  removeEmitter: (id: string) => void;
  updateEmitter: (id: string, patch: Partial<EmitterConfig>) => void;
  setActiveEmitter: (id: string) => void;
  addAttractor: (position: Vec3, strength?: number, radius?: number) => void;
  updateAttractor: (id: string, patch: Partial<Attractor>) => void;
  removeAttractor: (id: string) => void;
  setGlobalGravity: (v: Vec3) => void;
  setGlobalWind: (v: Vec3) => void;
  setFps: (fps: number) => void;
  setParticleCount: (count: number) => void;
  toggleSection: (key: string) => void;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const defaultProject = deepClone(PRESETS[0].config);

export const useEditorStore = create<EditorState>((set) => ({
  project: defaultProject,
  activeEmitterId: defaultProject.emitters[0]?.id ?? null,
  fps: 0,
  activeParticleCount: 0,
  collapsedSections: {},

  setProject: (p) => set({ project: p }),

  loadPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) {
      const config = deepClone(preset.config);
      set({
        project: config,
        activeEmitterId: config.emitters[0]?.id ?? null
      });
    }
  },

  addEmitter: (partial) =>
    set((state) => {
      const newEmitter: EmitterConfig = {
        id: uid(),
        name: partial?.name ?? '发射器',
        enabled: true,
        shape: 'point',
        shapeParams: {},
        position: { x: 0, y: 0, z: 0 },
        rate: 50,
        lifetime: 2,
        lifetimeJitter: 0,
        speed: 1.5,
        speedJitter: 0,
        speedMin: 1,
        speedMax: 2,
        direction: { x: 0, y: 1, z: 0 },
        directionSpread: 0.2,
        spread: 0.2,
        sizeStart: 1,
        sizeEnd: 0,
        sizeCurve: [1, 1, 0, 0],
        colorGradient: [
          { t: 0, color: '#ffffff' },
          { t: 1, color: '#ffffff' }
        ],
        colorStops: [
          { t: 0, color: '#ffffff' },
          { t: 1, color: '#ffffff' }
        ],
        alphaStart: 1,
        alphaEnd: 0,
        rotationStart: 0,
        rotationSpeed: 0,
        textureType: 'circle',
        gravity: { x: 0, y: -9.8, z: 0 },
        wind: { x: 0, y: 0, z: 0 },
        gravityFactor: 1,
        windFactor: 1,
        attractorStrength: 1,
        damping: 0,
        collisionEnabled: false,
        particleRadius: 0.1,
        ...partial
      };
      return {
        project: {
          ...state.project,
          emitters: [...state.project.emitters, newEmitter]
        },
        activeEmitterId: newEmitter.id
      };
    }),

  removeEmitter: (id) =>
    set((state) => {
      const newEmitters = state.project.emitters.filter((e) => e.id !== id);
      return {
        project: {
          ...state.project,
          emitters: newEmitters
        },
        activeEmitterId: state.activeEmitterId === id ? newEmitters[0]?.id ?? null : state.activeEmitterId
      };
    }),

  updateEmitter: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        emitters: state.project.emitters.map((e) =>
          e.id === id ? { ...e, ...patch } : e
        )
      }
    })),

  setActiveEmitter: (id) => set({ activeEmitterId: id }),

  addAttractor: (position, strength = 10, radius = 3) =>
    set((state) => ({
      project: {
        ...state.project,
        attractors: [
          ...state.project.attractors,
          { id: uid(), position, strength, radius }
        ]
      }
    })),

  updateAttractor: (id, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        attractors: state.project.attractors.map((a) =>
          a.id === id ? { ...a, ...patch } : a
        )
      }
    })),

  removeAttractor: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        attractors: state.project.attractors.filter((a) => a.id !== id)
      }
    })),

  setGlobalGravity: (v) =>
    set((state) => ({
      project: {
        ...state.project,
        globalGravity: v
      }
    })),

  setGlobalWind: (v) =>
    set((state) => ({
      project: {
        ...state.project,
        globalWind: v
      }
    })),

  setFps: (fps) => set({ fps }),

  setParticleCount: (count) => set({ activeParticleCount: count }),

  toggleSection: (key) =>
    set((state) => ({
      collapsedSections: {
        ...state.collapsedSections,
        [key]: !state.collapsedSections[key]
      }
    }))
}));
