export type EmitShape = 'point' | 'sphere' | 'cone' | 'rect' | 'box';
export type EmitterShape = EmitShape;
export type TextureType = 'circle' | 'spark' | 'smoke' | 'star' | 'ring' | 'custom' | 'square';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BezierPoint {
  x: number;
  y: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
}

export interface ColorStop {
  t: number;
  color: string;
}

export interface EmitterShapeParams {
  sphereRadius?: number;
  coneAngle?: number;
  coneHeight?: number;
  rectWidth?: number;
  rectHeight?: number;
  rectDepth?: number;
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  angle?: number;
}

export interface Attractor {
  id: string;
  position: Vec3;
  strength: number;
  radius: number;
}

export interface EmitterConfig {
  id: string;
  name: string;
  enabled: boolean;
  shape: EmitShape;
  shapeParams: EmitterShapeParams;
  position: Vec3;
  rate: number;
  lifetime: number;
  lifetimeJitter?: number;
  speed?: number;
  speedJitter?: number;
  speedMin: number;
  speedMax: number;
  direction: Vec3;
  directionSpread?: number;
  spread: number;
  sizeStart: number;
  sizeEnd: number;
  sizeCurve: [number, number, number, number] | BezierPoint[];
  colorGradient?: ColorStop[];
  colorStops: ColorStop[];
  alphaStart: number;
  alphaEnd: number;
  rotationStart?: number;
  rotationSpeed: number;
  textureType: TextureType | string;
  customTextureDataUrl?: string;
  gravity?: Vec3;
  wind?: Vec3;
  gravityFactor: number;
  windFactor: number;
  attractorStrength: number;
  damping: number;
  collisionEnabled: boolean;
  particleRadius: number;
}

export interface ProjectConfig {
  emitters: EmitterConfig[];
  attractors: Attractor[];
  globalGravity: Vec3;
  globalWind: Vec3;
  doCollisions?: boolean;
}
