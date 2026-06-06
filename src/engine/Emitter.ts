import * as THREE from 'three';
import { EmitterConfig, Attractor, Vec3, BezierPoint, ColorStop } from '../types';
import { evaluateBezier, sampleColorGradient } from '../utils/bezier';
import TextureFactory from './TextureFactory';

interface ParticleRuntime {
  position: Vec3;
  velocity: Vec3;
  age: number;
  lifetime: number;
  sizeStart: number;
  sizeEnd: number;
  rotation: number;
  rotationSpeed: number;
  colorStops: ColorStop[];
  sizeCurve: [number, number, number, number] | BezierPoint[];
  alphaStart: number;
  alphaEnd: number;
}

export class EmitterRuntime {
  config: EmitterConfig;
  particles: ParticleRuntime[] = [];
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  rotations: Float32Array;
  point: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  spawnAccumulator: number = 0;
  maxParticles: number;

  private _tmpVec3A = new THREE.Vector3();
  private _tmpVec3B = new THREE.Vector3();

  constructor(config: EmitterConfig, threeScene: THREE.Scene) {
    this.config = config;

    this.maxParticles = Math.max(100, Math.ceil(config.rate * config.lifetime * 2));

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 4);
    this.sizes = new Float32Array(this.maxParticles);
    this.rotations = new Float32Array(this.maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 4));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('rotation', new THREE.Float32BufferAttribute(this.rotations, 1));
    this.geometry.setDrawRange(0, 0);

    const texture = TextureFactory.get(config.textureType || 'circle');

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: /* glsl */ `
        uniform float uPixelRatio;

        attribute float size;
        attribute float rotation;
        attribute vec4 color;

        varying vec4 vColor;
        varying float vRotation;

        void main() {
          vColor = color;
          vRotation = rotation;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float sizeScale = 300.0 * uPixelRatio;
          gl_PointSize = size * (sizeScale / -mvPosition.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;

        varying vec4 vColor;
        varying float vRotation;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float c = cos(vRotation);
          float s = sin(vRotation);
          uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
          uv += 0.5;

          vec4 texel = texture2D(uMap, uv);
          if (texel.a < 0.01) discard;

          gl_FragColor = texel * vColor;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
    });

    this.point = new THREE.Points(this.geometry, this.material);
    this.point.frustumCulled = false;
    threeScene.add(this.point);
  }

  private randomInUnitSphere(): Vec3 {
    let x: number, y: number, z: number;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
    } while (x * x + y * y + z * z > 1);
    return { x, y, z };
  }

  private randomInCone(direction: Vec3, angleRad: number): Vec3 {
    const dir = this._tmpVec3A.set(direction.x, direction.y, direction.z).normalize();
    const up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const tangent = this._tmpVec3B.crossVectors(dir, up).normalize();
    const bitangent = new THREE.Vector3().crossVectors(dir, tangent).normalize();

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * angleRad;
    const r = Math.sin(phi);

    const result = new THREE.Vector3();
    result.addScaledVector(dir, Math.cos(phi));
    result.addScaledVector(tangent, r * Math.cos(theta));
    result.addScaledVector(bitangent, r * Math.sin(theta));
    result.normalize();

    return { x: result.x, y: result.y, z: result.z };
  }

  private randomInRect(width: number, height: number, depth: number): Vec3 {
    return {
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: (Math.random() - 0.5) * depth,
    };
  }

  private spawnSingleParticle() {
    const { config } = this;
    let position: Vec3 = { ...config.position };
    let direction: Vec3 = { ...config.direction };

    const dirLen = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    if (dirLen > 0) {
      direction.x /= dirLen;
      direction.y /= dirLen;
      direction.z /= dirLen;
    } else {
      direction = { x: 0, y: 1, z: 0 };
    }

    const shape = config.shape;
    const params = config.shapeParams || {};

    if (shape === 'sphere') {
      const radius = params.sphereRadius || params.radius || 1;
      const offset = this.randomInUnitSphere();
      position.x += offset.x * radius;
      position.y += offset.y * radius;
      position.z += offset.z * radius;
    } else if (shape === 'cone') {
      const radius = params.radius || 0;
      const angle = params.coneAngle || params.angle || 0.5;
      if (radius > 0) {
        const offset = this.randomInUnitSphere();
        position.x += offset.x * radius;
        position.y += offset.y * radius;
        position.z += offset.z * radius;
      }
      direction = this.randomInCone(direction, angle);
    } else if (shape === 'rect' || shape === 'box') {
      const width = params.rectWidth || params.width || 1;
      const height = params.rectHeight || params.height || 1;
      const depth = params.rectDepth || params.depth || 1;
      const offset = this.randomInRect(width, height, depth);
      position.x += offset.x;
      position.y += offset.y;
      position.z += offset.z;
    }

    const spread = config.spread ?? config.directionSpread ?? 0;
    if (spread > 0 && shape !== 'cone') {
      const spreadAngle = spread * Math.PI;
      const spreadDir = this.randomInCone(direction, spreadAngle);
      direction = spreadDir;
    }

    let speed: number;
    if (config.speed !== undefined) {
      speed = config.speed * (1 + (Math.random() - 0.5) * 2 * (config.speedJitter || 0));
    } else {
      speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
    }

    const lifetime = config.lifetime * (1 + (Math.random() - 0.5) * 2 * (config.lifetimeJitter || 0));

    const particle: ParticleRuntime = {
      position,
      velocity: {
        x: direction.x * speed,
        y: direction.y * speed,
        z: direction.z * speed,
      },
      age: 0,
      lifetime: Math.max(0.001, lifetime),
      sizeStart: config.sizeStart,
      sizeEnd: config.sizeEnd,
      rotation: config.rotationStart || 0,
      rotationSpeed: config.rotationSpeed,
      colorStops: config.colorStops || config.colorGradient || [],
      sizeCurve: config.sizeCurve,
      alphaStart: config.alphaStart,
      alphaEnd: config.alphaEnd,
    };

    this.particles.push(particle);
  }

  spawnParticles(dt: number) {
    if (!this.config.enabled || this.config.rate <= 0) return;

    this.spawnAccumulator += dt * this.config.rate;

    while (this.spawnAccumulator >= 1 && this.particles.length < this.maxParticles) {
      this.spawnSingleParticle();
      this.spawnAccumulator -= 1;
    }
  }

  update(
    dt: number,
    globalGravity: Vec3,
    globalWind: Vec3,
    attractors: Attractor[],
    doCollisions: boolean
  ) {
    const { config } = this;

    this.spawnParticles(dt);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;

      if (p.age >= p.lifetime) {
        this.particles.splice(i, 1);
        continue;
      }

      const emitterGravity = config.gravity || { x: 0, y: 0, z: 0 };
      const emitterWind = config.wind || { x: 0, y: 0, z: 0 };

      p.velocity.x += (globalGravity.x * config.gravityFactor + emitterGravity.x) * dt;
      p.velocity.y += (globalGravity.y * config.gravityFactor + emitterGravity.y) * dt;
      p.velocity.z += (globalGravity.z * config.gravityFactor + emitterGravity.z) * dt;

      p.velocity.x += (globalWind.x * config.windFactor + emitterWind.x) * dt;
      p.velocity.y += (globalWind.y * config.windFactor + emitterWind.y) * dt;
      p.velocity.z += (globalWind.z * config.windFactor + emitterWind.z) * dt;

      for (const att of attractors) {
        const dx = att.position.x - p.position.x;
        const dy = att.position.y - p.position.y;
        const dz = att.position.z - p.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const radius = att.radius || 1;
        const radiusSq = radius * radius;

        if (distSq < radiusSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const falloff = 1 - dist / radius;
          const strength = att.strength * config.attractorStrength * falloff * dt;
          const invDist = 1 / dist;
          p.velocity.x += dx * invDist * strength;
          p.velocity.y += dy * invDist * strength;
          p.velocity.z += dz * invDist * strength;
        }
      }

      const damping = Math.max(0, Math.min(1, config.damping));
      const dampFactor = Math.pow(1 - damping, dt);
      p.velocity.x *= dampFactor;
      p.velocity.y *= dampFactor;
      p.velocity.z *= dampFactor;

      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.position.z += p.velocity.z * dt;

      p.rotation += p.rotationSpeed * dt;

      const collisionEnabled = doCollisions && config.collisionEnabled;
      if (collisionEnabled) {
        const pr = config.particleRadius || 0.1;
        if (p.position.y < pr) {
          p.position.y = pr;
          p.velocity.y = -p.velocity.y * 0.5;
          p.velocity.x *= 0.8;
          p.velocity.z *= 0.8;
        }
      }
    }

    this.updateBuffers();
  }

  private updateBuffers() {
    const count = this.particles.length;

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      const t = Math.max(0, Math.min(1, p.age / p.lifetime));

      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;

      const color = sampleColorGradient(p.colorStops, t);
      const alpha = p.alphaStart + (p.alphaEnd - p.alphaStart) * t;
      this.colors[i * 4] = color[0];
      this.colors[i * 4 + 1] = color[1];
      this.colors[i * 4 + 2] = color[2];
      this.colors[i * 4 + 3] = color[3] * alpha;

      const curveT = evaluateBezier(p.sizeCurve, t);
      this.sizes[i] = p.sizeStart + (p.sizeEnd - p.sizeStart) * curveT;

      this.rotations[i] = p.rotation;
    }

    this.geometry.setDrawRange(0, count);
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.rotation as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose() {
    if (this.point.parent) {
      this.point.parent.remove(this.point);
    }
    this.geometry.dispose();
    this.material.dispose();
    this.particles = [];
  }
}

export default EmitterRuntime;
