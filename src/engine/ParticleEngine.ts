import * as THREE from 'three';
import { EmitterConfig, Attractor, Vec3, ProjectConfig } from '../types';
import { EmitterRuntime } from './Emitter';
import TextureFactory from './TextureFactory';

export class ParticleEngine {
  scene: THREE.Scene | null = null;
  emitters: Map<string, EmitterRuntime> = new Map();
  attractorMeshes: Map<string, THREE.Mesh> = new Map();
  attractors: Attractor[] = [];
  doCollisions: boolean = false;

  constructor(scene?: THREE.Scene) {
    if (scene) {
      this.setScene(scene);
    }
  }

  setScene(scene: THREE.Scene) {
    this.scene = scene;
    this.emitters.forEach((emitter) => {
      if (!emitter.point.parent) {
        scene.add(emitter.point);
      }
    });
    this.attractorMeshes.forEach((mesh) => {
      if (!mesh.parent) {
        scene.add(mesh);
      }
    });
  }

  attachTo(scene: THREE.Scene) {
    this.setScene(scene);
  }

  applyProjectConfig(config: ProjectConfig) {
    this.clearAllEmitters();
    this.clearAllAttractors();

    if (config.doCollisions !== undefined) {
      this.doCollisions = config.doCollisions;
    }

    config.emitters.forEach((emitterConfig) => {
      this.addEmitter(emitterConfig);
    });

    this.setAttractors(config.attractors);
  }

  updateEmitterConfig(id: string, config: EmitterConfig) {
    const existing = this.emitters.get(id);
    if (existing) {
      existing.dispose();
      this.emitters.delete(id);
    }
    this.addEmitter(config);
  }

  addEmitter(config: EmitterConfig): EmitterRuntime | null {
    if (!this.scene) {
      console.warn('ParticleEngine: scene not set, cannot add emitter');
      return null;
    }
    const existing = this.emitters.get(config.id);
    if (existing) {
      existing.dispose();
    }
    const emitter = new EmitterRuntime(config, this.scene);
    this.emitters.set(config.id, emitter);
    return emitter;
  }

  removeEmitter(id: string) {
    const emitter = this.emitters.get(id);
    if (emitter) {
      emitter.dispose();
      this.emitters.delete(id);
    }
  }

  private clearAllEmitters() {
    this.emitters.forEach((emitter) => {
      emitter.dispose();
    });
    this.emitters.clear();
  }

  private clearAllAttractors() {
    this.attractorMeshes.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      (mesh.geometry as THREE.BufferGeometry).dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.attractorMeshes.clear();
    this.attractors = [];
  }

  setAttractors(list: Attractor[]) {
    const existingIds = new Set(this.attractors.map((a) => a.id));
    const newIds = new Set(list.map((a) => a.id));

    existingIds.forEach((id) => {
      if (!newIds.has(id)) {
        const mesh = this.attractorMeshes.get(id);
        if (mesh) {
          if (mesh.parent) {
            mesh.parent.remove(mesh);
          }
          (mesh.geometry as THREE.BufferGeometry).dispose();
          (mesh.material as THREE.Material).dispose();
          this.attractorMeshes.delete(id);
        }
      }
    });

    list.forEach((attractor) => {
      let mesh = this.attractorMeshes.get(attractor.id);
      const color = attractor.strength >= 0 ? 0x00ff00 : 0xff0000;
      const visRadius = Math.max(0.1, attractor.radius * 0.1);

      if (!mesh) {
        const geometry = new THREE.SphereGeometry(visRadius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        });
        mesh = new THREE.Mesh(geometry, material);
        this.attractorMeshes.set(attractor.id, mesh);
        if (this.scene) {
          this.scene.add(mesh);
        }
      } else {
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
        mesh.scale.setScalar(1);
        mesh.geometry.dispose();
        mesh.geometry = new THREE.SphereGeometry(visRadius, 16, 16);
      }

      mesh.position.set(attractor.position.x, attractor.position.y, attractor.position.z);
    });

    this.attractors = [...list];
  }

  setCollisionsEnabled(enabled: boolean) {
    this.doCollisions = enabled;
  }

  update(dt: number, globalGravity: Vec3, globalWind: Vec3) {
    this.emitters.forEach((emitter) => {
      emitter.update(dt, globalGravity, globalWind, this.attractors, this.doCollisions);
    });
  }

  getActiveParticleCount(): number {
    let count = 0;
    this.emitters.forEach((emitter) => {
      count += emitter.particles.length;
    });
    return count;
  }

  dispose() {
    this.clearAllEmitters();
    this.clearAllAttractors();
    TextureFactory.dispose();
    this.scene = null;
  }
}

export default ParticleEngine;
