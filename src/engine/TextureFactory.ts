import * as THREE from 'three';

export class TextureFactory {
  private static cache: Record<string, THREE.Texture> = {};

  private static setupTexture(texture: THREE.Texture): THREE.Texture {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
    return texture;
  }

  static get(type: string): THREE.Texture {
    if (TextureFactory.cache[type]) {
      return TextureFactory.cache[type];
    }
    let texture: THREE.Texture;
    switch (type) {
      case 'star':
        texture = TextureFactory.createStarTexture();
        break;
      case 'square':
        texture = TextureFactory.createSquareTexture();
        break;
      case 'spark':
        texture = TextureFactory.createSparkTexture();
        break;
      case 'circle':
      default:
        texture = TextureFactory.createCircleTexture();
        break;
    }
    TextureFactory.cache[type] = texture;
    return texture;
  }

  static createCircleTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    return TextureFactory.setupTexture(texture);
  }

  static createStarTexture(points = 5): THREE.Texture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size * 0.42;
    const innerRadius = outerRadius * 0.45;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.beginPath();

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius * 1.2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 240, 200, 0.9)');
    gradient.addColorStop(0.8, 'rgba(255, 200, 100, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 180, 50, 0)');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'rgba(255, 220, 150, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius * 0.85 : innerRadius * 0.85;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    return TextureFactory.setupTexture(texture);
  }

  static createFromDataUrl(dataUrl: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        dataUrl,
        (texture) => {
          resolve(TextureFactory.setupTexture(texture));
        },
        undefined,
        (error) => {
          reject(error);
        },
      );
    });
  }

  static createSquareTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(size * 0.15, size * 0.15, size * 0.7, size * 0.7);

    const texture = new THREE.CanvasTexture(canvas);
    return TextureFactory.setupTexture(texture);
  }

  static createSparkTexture(): THREE.Texture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      const gradient = ctx.createLinearGradient(0, -size / 2, 0, 0);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-2, -size / 2, 4, size / 2);
    }

    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.15);
    centerGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    return TextureFactory.setupTexture(texture);
  }

  static dispose() {
    Object.values(TextureFactory.cache).forEach((texture) => {
      texture.dispose();
    });
    TextureFactory.cache = {};
  }
}

export default TextureFactory;
