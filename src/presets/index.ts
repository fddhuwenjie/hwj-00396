import type { EmitterConfig, ProjectConfig, EmitterShapeParams } from '../types';
import { uid } from '../utils/bezier';

function defaultBezier(): [number, number, number, number] {
  return [1, 1, 0, 0];
}

function makeEmitter(partial: Partial<EmitterConfig> & { name: string; shapeParams?: EmitterShapeParams }): EmitterConfig {
  return {
    id: uid(),
    name: partial.name,
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
    sizeCurve: defaultBezier(),
    colorGradient: [{ t: 0, color: '#ffffff' }, { t: 1, color: '#ffffff' }],
    colorStops: [{ t: 0, color: '#ffffff' }, { t: 1, color: '#ffffff' }],
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
}

const fireEmitter = makeEmitter({
  name: '火焰',
  rate: 200,
  lifetime: 1.5,
  speed: 4.5,
  speedMin: 3,
  speedMax: 6,
  direction: { x: 0, y: 1, z: 0 },
  directionSpread: 0.3,
  spread: 0.3,
  sizeStart: 1.2,
  sizeEnd: 0,
  colorStops: [
    { t: 0, color: '#fff9c4' },
    { t: 0.3, color: '#ff9800' },
    { t: 0.7, color: '#f44336' },
    { t: 1, color: '#1a0000' }
  ],
  gravityFactor: 0.3,
  gravity: { x: 0, y: -3, z: 0 },
  textureType: 'circle'
});

const smokeEmitter = makeEmitter({
  name: '烟雾',
  rate: 60,
  lifetime: 5,
  speed: 0.85,
  speedMin: 0.5,
  speedMax: 1.2,
  direction: { x: 0, y: 1, z: 0 },
  directionSpread: 0.6,
  spread: 0.6,
  sizeStart: 0.8,
  sizeEnd: 4,
  colorStops: [
    { t: 0, color: 'rgba(158, 158, 158, 0.8)' },
    { t: 1, color: 'rgba(66, 66, 66, 0)' }
  ],
  gravityFactor: 0.05,
  gravity: { x: 0, y: -0.5, z: 0 },
  damping: 0.5,
  textureType: 'circle'
});

const rainEmitter = makeEmitter({
  name: '雨',
  shape: 'box',
  shapeParams: { width: 20, height: 20, depth: 20 },
  position: { x: 0, y: 10, z: 0 },
  rate: 400,
  lifetime: 2.5,
  speed: 17.5,
  speedMin: 15,
  speedMax: 20,
  direction: { x: 0, y: -1, z: 0 },
  directionSpread: 0.05,
  spread: 0.05,
  sizeStart: 0.05,
  sizeEnd: 0.05,
  colorStops: [
    { t: 0, color: '#b3e5fc' },
    { t: 1, color: '#b3e5fc' }
  ],
  gravityFactor: 3,
  gravity: { x: 0, y: -30, z: 0 },
  textureType: 'circle'
});

const snowEmitter = makeEmitter({
  name: '雪',
  shape: 'box',
  shapeParams: { width: 25, height: 25, depth: 25 },
  position: { x: 0, y: 12, z: 0 },
  rate: 150,
  lifetime: 8,
  speed: 1,
  speedMin: 0.5,
  speedMax: 1.5,
  direction: { x: 0, y: -1, z: 0 },
  directionSpread: 0.8,
  spread: 0.8,
  colorStops: [
    { t: 0, color: '#ffffff' },
    { t: 1, color: '#e3f2fd' }
  ],
  gravityFactor: 0.1,
  gravity: { x: 0, y: -1, z: 0 },
  damping: 0.8,
  windFactor: 1,
  wind: { x: 0.2, y: 0, z: 0 },
  rotationSpeed: 1,
  textureType: 'star'
});

const fountainEmitter = makeEmitter({
  name: '喷泉',
  shape: 'cone',
  shapeParams: { coneAngle: 0.3, angle: 0.3 },
  rate: 120,
  lifetime: 2.5,
  speed: 10,
  speedMin: 8,
  speedMax: 12,
  direction: { x: 0, y: 1, z: 0 },
  directionSpread: 0.1,
  spread: 0.1,
  colorStops: [
    { t: 0, color: '#4fc3f7' },
    { t: 1, color: '#29b6f6' }
  ],
  gravityFactor: 1.5,
  gravity: { x: 0, y: -15, z: 0 },
  textureType: 'circle'
});

const fireworksLauncher = makeEmitter({
  name: '烟花发射',
  shape: 'cone',
  shapeParams: { coneAngle: 0.3, angle: 0.3 },
  rate: 20,
  lifetime: 1.8,
  speed: 12.5,
  speedMin: 10,
  speedMax: 15,
  direction: { x: 0, y: 1, z: 0 },
  directionSpread: 0.1,
  spread: 0.1,
  colorStops: [
    { t: 0, color: '#fff59d' },
    { t: 1, color: '#ff9800' }
  ],
  gravityFactor: 1,
  gravity: { x: 0, y: -10, z: 0 },
  textureType: 'circle'
});

const fireworksExplosion1 = makeEmitter({
  name: '烟花爆炸1',
  shape: 'sphere',
  shapeParams: { sphereRadius: 0.1, radius: 0.1 },
  position: { x: -3, y: 6, z: 0 },
  rate: 500,
  lifetime: 1.2,
  speed: 5,
  speedMin: 3,
  speedMax: 7,
  directionSpread: 1,
  spread: 1,
  colorStops: [
    { t: 0, color: '#fff176' },
    { t: 0.4, color: '#ff9800' },
    { t: 0.8, color: '#f44336' },
    { t: 1, color: 'rgba(244, 67, 54, 0)' }
  ],
  gravityFactor: 0.2,
  gravity: { x: 0, y: -2, z: 0 },
  textureType: 'circle'
});

const fireworksExplosion2 = makeEmitter({
  name: '烟花爆炸2',
  shape: 'sphere',
  shapeParams: { sphereRadius: 0.1, radius: 0.1 },
  position: { x: 3, y: 7, z: 0 },
  rate: 500,
  lifetime: 1.2,
  speed: 5,
  speedMin: 3,
  speedMax: 7,
  directionSpread: 1,
  spread: 1,
  colorStops: [
    { t: 0, color: '#fff176' },
    { t: 0.4, color: '#ff9800' },
    { t: 0.8, color: '#f44336' },
    { t: 1, color: 'rgba(244, 67, 54, 0)' }
  ],
  gravityFactor: 0.2,
  gravity: { x: 0, y: -2, z: 0 },
  textureType: 'circle'
});

const stardustEmitter = makeEmitter({
  name: '星尘',
  shape: 'sphere',
  shapeParams: { sphereRadius: 3, radius: 3 },
  rate: 100,
  lifetime: 6,
  speed: 0.5,
  speedMin: 0.2,
  speedMax: 0.8,
  directionSpread: 1,
  spread: 1,
  colorStops: [
    { t: 0, color: '#ce93d8' },
    { t: 1, color: '#64b5f6' }
  ],
  gravityFactor: 0,
  gravity: { x: 0, y: 0, z: 0 },
  damping: 0.1,
  textureType: 'star'
});

const waterfallEmitter = makeEmitter({
  name: '瀑布',
  shape: 'box',
  shapeParams: { width: 8, height: 0.1, depth: 0.1 },
  position: { x: 0, y: 6, z: 0 },
  rate: 300,
  lifetime: 2,
  speed: 3,
  speedMin: 2,
  speedMax: 4,
  direction: { x: 0, y: -1, z: 0 },
  directionSpread: 0.2,
  spread: 0.2,
  colorStops: [
    { t: 0, color: '#80deea' },
    { t: 1, color: '#26c6da' }
  ],
  gravityFactor: 2,
  gravity: { x: 0, y: -20, z: 0 },
  textureType: 'circle'
});

const magicVortexEmitter = makeEmitter({
  name: '魔法旋涡',
  rate: 150,
  lifetime: 4,
  speed: 2,
  speedMin: 1,
  speedMax: 3,
  directionSpread: 1,
  spread: 1,
  colorStops: [
    { t: 0, color: '#e040fb' },
    { t: 1, color: '#7c4dff' }
  ],
  gravityFactor: 0,
  gravity: { x: 0, y: 0, z: 0 },
  attractorStrength: 1,
  damping: 0.05,
  textureType: 'star'
});

const magicVortexAttractor = {
  id: uid(),
  position: { x: 0, y: 0, z: 0 },
  strength: -10,
  radius: 5
};

const explosionEmitter = makeEmitter({
  name: '爆炸',
  shape: 'sphere',
  shapeParams: { sphereRadius: 0.05, radius: 0.05 },
  rate: 800,
  lifetime: 1.2,
  speed: 10,
  speedMin: 5,
  speedMax: 15,
  directionSpread: 1,
  spread: 1,
  colorStops: [
    { t: 0, color: '#fff176' },
    { t: 0.3, color: '#ff5722' },
    { t: 1, color: '#b71c1c' }
  ],
  gravityFactor: 0.2,
  gravity: { x: 0, y: -2, z: 0 },
  textureType: 'circle'
});

export const PRESETS: { id: string; name: string; icon: string; config: ProjectConfig }[] = [
  {
    id: 'fire',
    name: '火焰',
    icon: '🔥',
    config: {
      emitters: [fireEmitter],
      attractors: [],
      globalGravity: { x: 0, y: -9.8, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'smoke',
    name: '烟雾',
    icon: '💨',
    config: {
      emitters: [smokeEmitter],
      attractors: [],
      globalGravity: { x: 0, y: -9.8, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'rain',
    name: '雨',
    icon: '🌧️',
    config: {
      emitters: [rainEmitter],
      attractors: [],
      globalGravity: { x: 0, y: -9.8, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'snow',
    name: '雪',
    icon: '❄️',
    config: {
      emitters: [snowEmitter],
      attractors: [],
      globalGravity: { x: 0, y: -9.8, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'fountain',
    name: '喷泉',
    icon: '⛲',
    config: {
      emitters: [fountainEmitter],
      attractors: [],
      globalGravity: { x: 0, y: -9.8, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'fireworks',
    name: '烟花',
    icon: '🎆',
    config: {
      emitters: [fireworksLauncher, fireworksExplosion1, fireworksExplosion2],
      attractors: [],
      globalGravity: { x: 0, y: -9.8, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'stardust',
    name: '星尘',
    icon: '✨',
    config: {
      emitters: [stardustEmitter],
      attractors: [],
      globalGravity: { x: 0, y: 0, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'waterfall',
    name: '瀑布',
    icon: '🌊',
    config: {
      emitters: [waterfallEmitter],
      attractors: [],
      globalGravity: { x: 0, y: -9.8, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'magic-vortex',
    name: '魔法旋涡',
    icon: '🌀',
    config: {
      emitters: [magicVortexEmitter],
      attractors: [magicVortexAttractor],
      globalGravity: { x: 0, y: 0, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  },
  {
    id: 'explosion',
    name: '爆炸',
    icon: '💥',
    config: {
      emitters: [explosionEmitter],
      attractors: [],
      globalGravity: { x: 0, y: -9.8, z: 0 },
      globalWind: { x: 0, y: 0, z: 0 }
    }
  }
];
