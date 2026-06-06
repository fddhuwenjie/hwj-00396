import * as THREE from 'three';
import type { ProjectConfig } from '../types';

let globalCanvas: HTMLCanvasElement | null = null;
let globalRenderer: THREE.WebGLRenderer | null = null;
let globalScene: THREE.Scene | null = null;
let globalCamera: THREE.Camera | null = null;

export function setViewportRefs(
  canvas: HTMLCanvasElement | null,
  renderer: THREE.WebGLRenderer | null,
  scene: THREE.Scene | null,
  camera: THREE.Camera | null
): void {
  globalCanvas = canvas;
  globalRenderer = renderer;
  globalScene = scene;
  globalCamera = camera;
}

export function exportToJson(project: ProjectConfig): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `particle-project-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const downloadJson = exportToJson;

export function importFromJson(file: File): Promise<ProjectConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content) as ProjectConfig;
        resolve(config);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function captureScreenshot(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

export function downloadScreenshot(
  canvas?: HTMLCanvasElement,
  filename = 'particle.png'
): void {
  const targetCanvas = canvas ?? globalCanvas;
  if (!targetCanvas) {
    console.warn('No canvas available for screenshot');
    return;
  }
  const dataUrl = captureScreenshot(targetCanvas);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

class NeuQuant {
  private static readonly NETSIZE = 256;
  private static readonly PRIMES = [499, 491, 487, 479, 475, 473, 469, 463, 457, 451, 449, 443, 439, 433, 431, 421, 419, 417, 409, 397, 391, 389, 383, 379, 377, 373, 367, 359, 357, 353, 349, 347, 337, 331, 329, 323, 317, 313, 311, 307, 293, 283, 281, 277, 271, 269, 263, 257, 251, 241, 239, 233, 229, 227, 223, 211, 199, 197, 193, 191, 181, 179, 173, 167, 163, 157, 151, 149, 139, 137, 131, 127, 113, 109, 107, 103, 101, 97, 89, 83, 79, 73, 71, 67, 61, 59, 53, 47, 43, 41, 37, 31, 29, 23, 19, 17, 13, 11, 7, 5, 3, 2];
  private network: number[][];
  private netindex: number[];
  private bias: number[];
  private freq: number[];
  private radpower: number[];
  private samplefac: number;

  constructor(sample: number[], samplefac: number) {
    this.samplefac = samplefac;
    this.network = [];
    for (let i = 0; i < NeuQuant.NETSIZE; i++) {
      const p = [0, 0, 0];
      p[0] = p[1] = p[2] = (i << 8) / NeuQuant.NETSIZE;
      this.network.push(p);
    }
    this.bias = new Array(NeuQuant.NETSIZE).fill(0);
    this.freq = new Array(NeuQuant.NETSIZE).fill(1 / NeuQuant.NETSIZE);
    this.radpower = new Array(Math.floor(NeuQuant.NETSIZE / 8) + 1);
    this.netindex = new Array(256);
    this.learn(sample);
    this.unbiasnet();
    this.inxbuild();
  }

  private altersingle(alpha: number, i: number, b: number, g: number, r: number): void {
    this.network[i][0] -= alpha * (this.network[i][0] - b);
    this.network[i][1] -= alpha * (this.network[i][1] - g);
    this.network[i][2] -= alpha * (this.network[i][2] - r);
  }

  private alterneigh(rad: number, i: number, b: number, g: number, r: number): void {
    const lo = i - rad;
    const hi = i + rad;
    let j = i + 1;
    let k = i - 1;
    let m = 1;
    while ((j < hi) || (k > lo)) {
      const a = this.radpower[m++];
      if (j < hi) {
        this.network[j][0] -= a * (this.network[j][0] - b);
        this.network[j][1] -= a * (this.network[j][1] - g);
        this.network[j][2] -= a * (this.network[j][2] - r);
        j++;
      }
      if (k > lo) {
        this.network[k][0] -= a * (this.network[k][0] - b);
        this.network[k][1] -= a * (this.network[k][1] - g);
        this.network[k][2] -= a * (this.network[k][2] - r);
        k--;
      }
    }
  }

  private contest(b: number, g: number, r: number): number {
    let bestd = ~(1 << 31);
    let bestbiasd = bestd;
    let bestpos = -1;
    let bestbiaspos = bestpos;
    for (let i = 0; i < NeuQuant.NETSIZE; i++) {
      const n = this.network[i];
      let dist = n[0] - b;
      let ad = Math.abs(dist);
      let dist2 = ad;
      dist = n[1] - g;
      if (dist < 0) dist = -dist;
      ad += dist;
      dist2 *= dist2;
      dist = n[2] - r;
      if (dist < 0) dist = -dist;
      ad += dist;
      dist2 += dist * dist;
      if (ad < bestd) {
        bestd = ad;
        bestpos = i;
      }
      const biasdist = dist2 - (this.bias[i] << 12);
      if (biasdist < bestbiasd) {
        bestbiasd = biasdist;
        bestbiaspos = i;
      }
      const betafreq = this.freq[i] >> 10;
      this.freq[i] -= betafreq;
      this.bias[i] += betafreq << 10;
    }
    this.freq[bestpos] += 1 << 10;
    this.bias[bestpos] -= 1 << 14;
    return bestbiaspos;
  }

  private inxbuild(): void {
    let p: number[];
    let q: number[];
    let smallpos: number;
    let smallval: number;
    let previouscol = 0;
    let startpos = 0;
    for (let i = 0; i < NeuQuant.NETSIZE; i++) {
      p = this.network[i];
      smallpos = i;
      smallval = p[1];
      for (let j = i + 1; j < NeuQuant.NETSIZE; j++) {
        q = this.network[j];
        if (q[1] < smallval) {
          smallpos = j;
          smallval = q[1];
        }
      }
      q = this.network[smallpos];
      if (i != smallpos) {
        let j = q[0];
        q[0] = p[0];
        p[0] = j;
        j = q[1];
        q[1] = p[1];
        p[1] = j;
        j = q[2];
        q[2] = p[2];
        p[2] = j;
      }
      if (smallval != previouscol) {
        this.netindex[previouscol] = (startpos + i) >> 1;
        for (let j = previouscol + 1; j < smallval; j++) {
          this.netindex[j] = i;
        }
        previouscol = smallval;
        startpos = i;
      }
    }
    this.netindex[previouscol] = (startpos + 255) >> 1;
    for (let j = previouscol + 1; j < 256; j++) {
      this.netindex[j] = 255;
    }
  }

  private inxsearch(b: number, g: number, r: number): number {
    let a: number;
    let p: number[];
    let dist: number;
    let bestd = 1000;
    let best = -1;
    let i = this.netindex[g];
    let j = i - 1;
    while ((i < NeuQuant.NETSIZE) || (j >= 0)) {
      if (i < NeuQuant.NETSIZE) {
        p = this.network[i];
        dist = p[1] - g;
        if (dist >= bestd) {
          i = NeuQuant.NETSIZE;
        } else {
          i++;
          if (dist < 0) dist = -dist;
          a = p[0] - b;
          if (a < 0) a = -a;
          dist += a;
          if (dist < bestd) {
            a = p[2] - r;
            if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
              bestd = dist;
              best = this.network.indexOf(p);
            }
          }
        }
      }
      if (j >= 0) {
        p = this.network[j];
        dist = g - p[1];
        if (dist >= bestd) {
          j = -1;
        } else {
          j--;
          if (dist < 0) dist = -dist;
          a = p[0] - b;
          if (a < 0) a = -a;
          dist += a;
          if (dist < bestd) {
            a = p[2] - r;
            if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
              bestd = dist;
              best = this.network.indexOf(p);
            }
          }
        }
      }
    }
    return best;
  }

  private unbiasnet(): void {
    for (let i = 0; i < NeuQuant.NETSIZE; i++) {
      this.network[i][0] >>= 3;
      this.network[i][1] >>= 3;
      this.network[i][2] >>= 3;
    }
  }

  private exp2(x: number): number {
    return Math.pow(2, x);
  }

  private learn(sample: number[]): void {
    let b: number;
    let g: number;
    let r: number;
    let step = 0;
    let pos = 0;
    const lengthcount = sample.length;
    const samplepixels = lengthcount / (3 * 4);
    let delta = samplepixels / 100;
    let alpha = 1;
    let alpha2 = 1;
    let radius = 30;
    let rad = 0;
    if (delta === 0) delta = 1;
    for (let i = 0; i <= 30; i++) {
      this.radpower[i] = this.exp2(-((i * i) / (2 * (radius * radius)))) * (alpha2 * ((1 << 16) / (3 * radius + 1)));
    }
    const alphadec = 30 + ((this.samplefac - 1) / 3);
    for (let i = 0; i < samplepixels; i++) {
      if (i % 1000 === 0) alpha -= 1 / alphadec;
      pos = step * 3;
      b = sample[pos] & 0xff;
      g = sample[pos + 1] & 0xff;
      r = sample[pos + 2] & 0xff;
      b = g = r = 0;
      for (let k = 0; k < this.samplefac; k++) {
        pos = (step + k) * 3;
        b += sample[pos] & 0xff;
        g += sample[pos + 1] & 0xff;
        r += sample[pos + 2] & 0xff;
      }
      b = (b / this.samplefac) >> 5;
      g = (g / this.samplefac) >> 5;
      r = (r / this.samplefac) >> 5;
      rad = radius >> 3;
      const j = this.contest(b, g, r);
      alpha2 = alpha * (1 / NeuQuant.NETSIZE);
      this.altersingle(alpha2, j, b, g, r);
      if (rad > 0) this.alterneigh(rad, j, b, g, r);
      step += NeuQuant.PRIMES[i % NeuQuant.PRIMES.length];
      step %= lengthcount / 4;
      if (i % delta === 0) {
        radius--;
        if (radius <= 0) return;
        for (let k = 0; k <= rad; k++) {
          this.radpower[k] = this.exp2(-((k * k) / (2 * (radius * radius)))) * (alpha2 * ((1 << 16) / (3 * radius + 1)));
        }
      }
    }
  }

  public map(b: number, g: number, r: number): number {
    return this.inxsearch(b >> 5, g >> 5, r >> 5);
  }

  public process(pixels: number[]): number[][] {
    const map = this.network.map((p) => [p[0] << 3, p[1] << 3, p[2] << 3, 255]);
    const palette = map.flat();
    const output = new Array(pixels.length / 4);
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      output[i / 4] = this.map(b, g, r);
    }
    return [palette, output] as unknown as number[][];
  }

  public getColormap(): number[] {
    const map = [];
    for (let i = 0; i < NeuQuant.NETSIZE; i++) {
      for (let j = 0; j < 3; j++) {
        let x = this.network[i][2 - j];
        x = x << 3 | x >> 5;
        map.push(x & 0xff);
      }
    }
    return map;
  }

  public getIndexChannel(pixels: number[]): Uint8Array {
    const nPix = pixels.length / 3;
    const idx = new Uint8Array(nPix);
    let k = 0;
    for (let j = 0; j < nPix; j++) {
      const b = pixels[k++] & 0xff;
      const g = pixels[k++] & 0xff;
      const r = pixels[k++] & 0xff;
      idx[j] = this.inxsearch(b, g, r);
    }
    return idx;
  }
}

class LZWEncoder {
  static readonly EOF = -1;
  static readonly BITS = 12;
  static readonly HSIZE = 5003;
  private n_bits: number;
  private remaining = 0;
  private curPixel = 0;
  private accum = 0;
  private masks = [
    0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F,
    0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF,
    0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF
  ];
  private privA: number[];
  private accum_bits: number;
  private htab: Int32Array;
  private codetab: Int32Array;
  private hsize = LZWEncoder.HSIZE;
  private free_ent: number;
  private maxcode: number;
  private clear_flg: boolean;
  private g_init_bits: number;
  private ClearCode: number;
  private EOFCode: number;
  private indexPixels: Uint8Array;
  private minCodeSize: number;
  private initCodeSize: number;

  constructor(width: number, height: number, pixels: Uint8Array, color_depth: number) {
    this.indexPixels = pixels;
    this.curPixel = 0;
    this.initCodeSize = Math.max(2, color_depth);
    this.minCodeSize = 0;
    this.privA = new Array(256);
    this.htab = new Int32Array(LZWEncoder.HSIZE);
    this.codetab = new Int32Array(LZWEncoder.HSIZE);
    this.g_init_bits = 0;
    this.ClearCode = 0;
    this.EOFCode = 0;
    this.n_bits = 0;
    this.maxcode = 0;
    this.free_ent = 0;
    this.clear_flg = false;
    this.accum_bits = 0;
  }

  private char_out(c: number, outs: number[]): void {
    this.privA[this.accum_bits++] = c;
    if (this.accum_bits >= 8) {
      outs.push(this.flush_char());
    }
  }

  private cl_block(outs: number[]): void {
    this.cl_hash(this.hsize);
    this.free_ent = this.ClearCode + 2;
    this.clear_flg = true;
    this.output(this.ClearCode, outs);
  }

  private cl_hash(hsize: number): void {
    for (let i = 0; i < hsize; ++i) this.htab[i] = -1;
  }

  private compress(init_bits: number, outs: number[]): void {
    let fcode: number;
    let c: number;
    let i: number;
    let ent: number;
    let disp: number;
    let hsize_reg: number;
    let hshift: number;

    this.g_init_bits = init_bits;
    outs.push(0);
    this.ClearCode = 1 << (init_bits - 1);
    this.EOFCode = this.ClearCode + 1;
    this.free_ent = this.ClearCode + 2;
    this.accum_bits = 0;
    this.n_bits = init_bits;
    this.maxcode = this.MAXCODE(this.n_bits);

    ent = this.nextPixel();
    hshift = 0;
    for (fcode = this.hsize; fcode < 65536; fcode *= 2) ++hshift;
    hshift = 8 - hshift;
    hsize_reg = this.hsize;
    this.cl_hash(hsize_reg);
    this.output(this.ClearCode, outs);

    outer_loop:
    while ((c = this.nextPixel()) != LZWEncoder.EOF) {
      fcode = (c << LZWEncoder.BITS) + ent;
      i = (c << hshift) ^ ent;
      if (this.htab[i] === fcode) {
        ent = this.codetab[i];
        continue;
      } else if (this.htab[i] >= 0) {
        disp = hsize_reg - i;
        if (i === 0) disp = 1;
        do {
          if ((i -= disp) < 0) i += hsize_reg;
          if (this.htab[i] === fcode) {
            ent = this.codetab[i];
            continue outer_loop;
          }
        } while (this.htab[i] >= 0);
      }
      this.output(ent, outs);
      ent = c;
      if (this.free_ent < 1 << LZWEncoder.BITS) {
        this.codetab[i] = this.free_ent++;
        this.htab[i] = fcode;
      } else {
        this.cl_block(outs);
      }
    }
    this.output(ent, outs);
    this.output(this.EOFCode, outs);
  }

  private encode(outs: number[]): void {
    this.compress(this.initCodeSize + 1, outs);
  }

  private flush_char(): number {
    const fcb: number = this.accum;
    this.accum = 0;
    this.accum_bits = 0;
    return fcb;
  }

  private flush_zero(outs: number[]): void {
    if (this.accum_bits > 0) {
      outs.push(this.flush_char());
    }
  }

  private MAXCODE(n_bits: number): number {
    return (1 << n_bits) - 1;
  }

  private nextPixel(): number {
    if (this.curPixel === this.indexPixels.length) {
      return LZWEncoder.EOF;
    }
    return this.indexPixels[this.curPixel++];
  }

  private output(code: number, outs: number[]): void {
    this.accum &= this.masks[this.accum_bits];
    if (this.accum_bits > 0) this.accum |= (code << this.accum_bits);
    else this.accum = code;
    this.accum_bits += this.n_bits;
    while (this.accum_bits >= 8) this.char_out(this.flush_char(), outs);
    if (this.free_ent > this.maxcode || this.clear_flg) {
      if (this.clear_flg) {
        this.maxcode = this.MAXCODE(this.n_bits = this.g_init_bits);
        this.clear_flg = false;
      } else {
        ++this.n_bits;
        if (this.n_bits == LZWEncoder.BITS) this.maxcode = 1 << LZWEncoder.BITS;
        else this.maxcode = this.MAXCODE(this.n_bits);
      }
    }
    if (code === this.EOFCode) {
      while (this.accum_bits > 0) this.char_out(this.flush_char(), outs);
    }
  }

  public encodeImage(): number[] {
    const enc = new Array<number>();
    this.encode(enc);
    this.flush_zero(enc);
    return enc;
  }
}

class GifWriter {
  private out: number[] = [];

  public writeBytes(bytes: number[]): void {
    for (const b of bytes) {
      this.out.push(b);
    }
  }

  public writeByte(b: number): void {
    this.out.push(b & 0xff);
  }

  public writeShort(s: number): void {
    this.writeByte(s & 0xff);
    this.writeByte((s >> 8) & 0xff);
  }

  public writeString(s: string): void {
    for (let i = 0; i < s.length; i++) {
      this.writeByte(s.charCodeAt(i));
    }
  }

  public getData(): Uint8Array {
    return new Uint8Array(this.out);
  }
}

function quantizeImage(imageData: ImageData): { palette: number[]; indices: Uint8Array } {
  const len = imageData.width * imageData.height;
  const rgb = new Array<number>(len * 3);
  for (let i = 0; i < len; i++) {
    rgb[i * 3] = imageData.data[i * 4];
    rgb[i * 3 + 1] = imageData.data[i * 4 + 1];
    rgb[i * 3 + 2] = imageData.data[i * 4 + 2];
  }
  const nq = new NeuQuant(rgb, 10);
  const palette = nq.getColormap();
  const indices = nq.getIndexChannel(rgb);
  return { palette, indices };
}

export async function recordGif(
  canvasOrDuration?: HTMLCanvasElement | number,
  rendererOrFps?: THREE.WebGLRenderer | number,
  getSceneAndCamera?: () => { scene: THREE.Scene; camera: THREE.Camera },
  duration = 3,
  fps = 20
): Promise<string> {
  let canvas: HTMLCanvasElement | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let sceneAndCamera: { scene: THREE.Scene; camera: THREE.Camera } | null = null;
  let actualDuration = duration;
  let actualFps = fps;

  if (typeof canvasOrDuration === 'number') {
    actualDuration = canvasOrDuration / 1000;
    actualFps = typeof rendererOrFps === 'number' ? rendererOrFps : 20;
    canvas = globalCanvas;
    renderer = globalRenderer;
    if (globalScene && globalCamera) {
      sceneAndCamera = { scene: globalScene, camera: globalCamera };
    }
  } else if (canvasOrDuration instanceof HTMLCanvasElement) {
    canvas = canvasOrDuration;
    if (rendererOrFps instanceof THREE.WebGLRenderer) {
      renderer = rendererOrFps;
    }
    if (getSceneAndCamera) {
      sceneAndCamera = getSceneAndCamera();
    }
  } else {
    canvas = globalCanvas;
    renderer = globalRenderer;
    if (globalScene && globalCamera) {
      sceneAndCamera = { scene: globalScene, camera: globalCamera };
    }
  }

  if (!canvas || !renderer || !sceneAndCamera) {
    throw new Error('Canvas, renderer, or scene/camera not available. Please use setViewportRefs first.');
  }

  const width = canvas.width;
  const height = canvas.height;
  const totalFrames = Math.max(1, Math.floor(actualDuration * actualFps));
  const frameDelay = Math.max(2, Math.round(100 / actualFps));

  const frameDataList: ImageData[] = [];
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = width;
  tmpCanvas.height = height;
  const tmpCtx = tmpCanvas.getContext('2d');
  if (!tmpCtx) throw new Error('Cannot get 2D context');

  const { scene, camera } = sceneAndCamera;

  for (let i = 0; i < totalFrames; i++) {
    renderer.render(scene, camera);
    tmpCtx.drawImage(canvas, 0, 0);
    frameDataList.push(tmpCtx.getImageData(0, 0, width, height));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const writer = new GifWriter();

  writer.writeString('GIF89a');
  writer.writeShort(width);
  writer.writeShort(height);
  writer.writeByte(0xf7);
  writer.writeByte(0);
  writer.writeByte(0);

  const globalPalette: number[] = new Array(256 * 3).fill(0);
  const firstQuant = quantizeImage(frameDataList[0]);
  for (let i = 0; i < Math.min(firstQuant.palette.length, globalPalette.length); i++) {
    globalPalette[i] = firstQuant.palette[i];
  }
  for (let i = 0; i < 256 * 3; i++) {
    writer.writeByte(globalPalette[i] || 0);
  }

  writer.writeByte(0x21);
  writer.writeByte(0xff);
  writer.writeByte(11);
  writer.writeString('NETSCAPE2.0');
  writer.writeByte(3);
  writer.writeByte(1);
  writer.writeShort(0);
  writer.writeByte(0);

  for (let i = 0; i < frameDataList.length; i++) {
    const imageData = frameDataList[i];
    const quantized = quantizeImage(imageData);

    writer.writeByte(0x21);
    writer.writeByte(0xf9);
    writer.writeByte(4);
    writer.writeByte(0x09);
    writer.writeShort(frameDelay);
    writer.writeByte(0);
    writer.writeByte(0);

    writer.writeByte(0x2c);
    writer.writeShort(0);
    writer.writeShort(0);
    writer.writeShort(width);
    writer.writeShort(height);
    writer.writeByte(0x87);

    const localPalette = quantized.palette;
    for (let j = 0; j < 256 * 3; j++) {
      writer.writeByte(localPalette[j] || 0);
    }

    writer.writeByte(8);

    const lzw = new LZWEncoder(width, height, quantized.indices, 8);
    const compressed = lzw.encodeImage();

    let idx = 0;
    while (idx < compressed.length) {
      const blockSize = Math.min(255, compressed.length - idx);
      writer.writeByte(blockSize);
      for (let j = 0; j < blockSize; j++) {
        writer.writeByte(compressed[idx + j]);
      }
      idx += blockSize;
    }
    writer.writeByte(0);
  }

  writer.writeByte(0x3b);

  const gifData = writer.getData();
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < gifData.length; i += chunkSize) {
    const chunk = gifData.subarray(i, Math.min(i + chunkSize, gifData.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return 'data:image/gif;base64,' + btoa(binary);
}

export function generateHtmlSnippet(project: ProjectConfig): string {
  const projectJson = JSON.stringify(project);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>Particle Preview</title>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #070814; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script>
(function () {
  const PROJECT = ${projectJson};

  function createCircleTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.premultiplyAlpha = true;
    return tex;
  }

  function createStarTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size / 2, cy = size / 2, outer = size * 0.42, inner = outer * 0.45, pts = 5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i * Math.PI) / pts - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, outer * 1.2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,240,200,0.9)');
    g.addColorStop(0.8, 'rgba(255,200,100,0.5)');
    g.addColorStop(1, 'rgba(255,180,50,0)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.premultiplyAlpha = true;
    return tex;
  }

  function getTexture(type) {
    if (type === 'star') return createStarTexture();
    return createCircleTexture();
  }

  function parseColor(c) {
    c = c.trim();
    if (c.startsWith('rgba(')) {
      const m = c.match(/rgba\\(\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*\\)/);
      if (m) return [parseFloat(m[1])/255, parseFloat(m[2])/255, parseFloat(m[3])/255, parseFloat(m[4])];
    }
    if (c.startsWith('rgb(')) {
      const m = c.match(/rgb\\(\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*,\\s*([\\d.]+)\\s*\\)/);
      if (m) return [parseFloat(m[1])/255, parseFloat(m[2])/255, parseFloat(m[3])/255, 1];
    }
    let hex = c.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(ch => ch+ch).join('');
    if (hex.length === 8) return [parseInt(hex.slice(0,2),16)/255, parseInt(hex.slice(2,4),16)/255, parseInt(hex.slice(4,6),16)/255, parseInt(hex.slice(6,8),16)/255];
    if (hex.length === 6) return [parseInt(hex.slice(0,2),16)/255, parseInt(hex.slice(2,4),16)/255, parseInt(hex.slice(4,6),16)/255, 1];
    return [1, 1, 1, 1];
  }

  function sampleColor(stops, t) {
    if (!stops || stops.length === 0) return [1,1,1,1];
    if (stops.length === 1) return parseColor(stops[0].color);
    const sorted = [...stops].sort((a,b) => a.t - b.t);
    t = Math.max(0, Math.min(1, t));
    if (t <= sorted[0].t) return parseColor(sorted[0].color);
    if (t >= sorted[sorted.length-1].t) return parseColor(sorted[sorted.length-1].color);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i+1];
      if (t >= a.t && t <= b.t) {
        const range = b.t - a.t;
        const lt = range === 0 ? 0 : (t - a.t) / range;
        const ca = parseColor(a.color), cb = parseColor(b.color);
        return [ca[0]+(cb[0]-ca[0])*lt, ca[1]+(cb[1]-ca[1])*lt, ca[2]+(cb[2]-ca[2])*lt, ca[3]+(cb[3]-ca[3])*lt];
      }
    }
    return parseColor(sorted[sorted.length-1].color);
  }

  function evalBezier(curve, t) {
    if (Array.isArray(curve) && curve.length === 4 && typeof curve[0] === 'number') {
      const [y0, cp1y, cp2y, y1] = curve;
      const invT = 1 - t;
      return invT*invT*invT*y0 + 3*invT*invT*t*cp1y + 3*invT*t*t*cp2y + t*t*t*y1;
    }
    const points = curve || [];
    if (points.length === 0) return 0;
    if (points.length === 1) return points[0].y;
    const sorted = [...points].sort((a,b) => a.x - b.x);
    t = Math.max(0, Math.min(1, t));
    if (t <= sorted[0].x) return sorted[0].y;
    if (t >= sorted[sorted.length-1].x) return sorted[sorted.length-1].y;
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i+1];
      if (t >= a.x && t <= b.x) {
        const range = b.x - a.x;
        const lt = range === 0 ? 0 : (t - a.x) / range;
        const invT = 1 - lt;
        return invT*invT*invT*a.y + 3*invT*invT*lt*a.cp2y + 3*invT*lt*lt*b.cp1y + lt*lt*lt*b.y;
      }
    }
    return sorted[sorted.length-1].y;
  }

  function randomInUnitSphere() {
    let x, y, z;
    do {
      x = Math.random()*2-1; y = Math.random()*2-1; z = Math.random()*2-1;
    } while (x*x + y*y + z*z > 1);
    return { x, y, z };
  }

  function randomInCone(dir, angleRad) {
    const d = new THREE.Vector3(dir.x, dir.y, dir.z).normalize();
    const up = Math.abs(d.y) < 0.9 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
    const t = new THREE.Vector3().crossVectors(d, up).normalize();
    const b = new THREE.Vector3().crossVectors(d, t).normalize();
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * angleRad;
    const r = Math.sin(phi);
    const res = new THREE.Vector3();
    res.addScaledVector(d, Math.cos(phi));
    res.addScaledVector(t, r * Math.cos(theta));
    res.addScaledVector(b, r * Math.sin(theta));
    res.normalize();
    return { x: res.x, y: res.y, z: res.z };
  }

  function randomInRect(w, h, d) {
    return { x: (Math.random()-0.5)*w, y: (Math.random()-0.5)*h, z: (Math.random()-0.5)*d };
  }

  class EmitterRuntime {
    constructor(config, scene) {
      this.config = config;
      this.particles = [];
      this.maxParticles = Math.max(100, Math.ceil(config.rate * config.lifetime * 2));
      this.positions = new Float32Array(this.maxParticles * 3);
      this.colors = new Float32Array(this.maxParticles * 4);
      this.sizes = new Float32Array(this.maxParticles);
      this.rotations = new Float32Array(this.maxParticles);
      this.spawnAccumulator = 0;

      this.geometry = new THREE.BufferGeometry();
      this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
      this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 4));
      this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(this.sizes, 1));
      this.geometry.setAttribute('rotation', new THREE.Float32BufferAttribute(this.rotations, 1));
      this.geometry.setDrawRange(0, 0);

      this.material = new THREE.PointsMaterial({
        size: 1, vertexColors: true, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, sizeAttenuation: true,
        map: getTexture(config.textureType || 'circle')
      });

      this.material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\\nattribute float size;\\nattribute float rotation;\\nvarying vec4 vColor;\\nvarying float vRotation;')
          .replace('#include <color_vertex>', 'vColor = vec4(color, 1.0);')
          .replace('gl_PointSize = size;', 'vRotation = rotation;\\nvec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\\ngl_PointSize = size * (300.0 / -mvPosition.z);');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\\nvarying vec4 vColor;\\nvarying float vRotation;')
          .replace('vec4 diffuseColor = vec4(diffuse, opacity);',
            'vec2 rotatedUv = gl_PointCoord - 0.5;\\nfloat c = cos(vRotation);\\nfloat s = sin(vRotation);\\nrotatedUv = vec2(rotatedUv.x * c - rotatedUv.y * s, rotatedUv.x * s + rotatedUv.y * c);\\nrotatedUv += 0.5;\\nvec4 texelColor = texture2D(map, rotatedUv);\\nvec4 diffuseColor = texelColor * vColor;');
      };

      this.point = new THREE.Points(this.geometry, this.material);
      this.point.frustumCulled = false;
      scene.add(this.point);
    }

    spawnParticle() {
      const cfg = this.config;
      let pos = { ...cfg.position };
      let dir = { ...cfg.direction };
      const dl = Math.sqrt(dir.x*dir.x + dir.y*dir.y + dir.z*dir.z);
      if (dl > 0) { dir.x /= dl; dir.y /= dl; dir.z /= dl; } else { dir = { x:0, y:1, z:0 }; }

      const shape = cfg.shape, params = cfg.shapeParams || {};
      if (shape === 'sphere') {
        const r = params.sphereRadius || params.radius || 1;
        const off = randomInUnitSphere();
        pos.x += off.x*r; pos.y += off.y*r; pos.z += off.z*r;
      } else if (shape === 'cone') {
        const r = params.radius || 0;
        const ang = params.coneAngle || params.angle || 0.5;
        if (r > 0) {
          const off = randomInUnitSphere();
          pos.x += off.x*r; pos.y += off.y*r; pos.z += off.z*r;
        }
        dir = randomInCone(dir, ang);
      } else if (shape === 'rect' || shape === 'box') {
        const w = params.rectWidth || params.width || 1;
        const h = params.rectHeight || params.height || 1;
        const d = params.rectDepth || params.depth || 1;
        const off = randomInRect(w, h, d);
        pos.x += off.x; pos.y += off.y; pos.z += off.z;
      }

      const spread = cfg.spread ?? cfg.directionSpread ?? 0;
      if (spread > 0 && shape !== 'cone') {
        dir = randomInCone(dir, spread * Math.PI);
      }

      let speed;
      if (cfg.speed !== undefined) {
        speed = cfg.speed * (1 + (Math.random()-0.5) * 2 * (cfg.speedJitter || 0));
      } else {
        speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
      }

      const lifetime = cfg.lifetime * (1 + (Math.random()-0.5) * 2 * (cfg.lifetimeJitter || 0));

      this.particles.push({
        position: pos,
        velocity: { x: dir.x*speed, y: dir.y*speed, z: dir.z*speed },
        age: 0,
        lifetime: Math.max(0.001, lifetime),
        sizeStart: cfg.sizeStart,
        sizeEnd: cfg.sizeEnd,
        rotation: cfg.rotationStart || 0,
        rotationSpeed: cfg.rotationSpeed,
        colorStops: cfg.colorStops || cfg.colorGradient || [],
        sizeCurve: cfg.sizeCurve,
        alphaStart: cfg.alphaStart,
        alphaEnd: cfg.alphaEnd
      });
    }

    spawn(dt) {
      if (!this.config.enabled || this.config.rate <= 0) return;
      this.spawnAccumulator += dt * this.config.rate;
      while (this.spawnAccumulator >= 1 && this.particles.length < this.maxParticles) {
        this.spawnParticle();
        this.spawnAccumulator -= 1;
      }
    }

    update(dt, globalGravity, globalWind, attractors, doCollisions) {
      const cfg = this.config;
      this.spawn(dt);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.age += dt;
        if (p.age >= p.lifetime) { this.particles.splice(i, 1); continue; }

        const eg = cfg.gravity || { x:0,y:0,z:0 };
        const ew = cfg.wind || { x:0,y:0,z:0 };
        p.velocity.x += (globalGravity.x*cfg.gravityFactor + eg.x)*dt;
        p.velocity.y += (globalGravity.y*cfg.gravityFactor + eg.y)*dt;
        p.velocity.z += (globalGravity.z*cfg.gravityFactor + eg.z)*dt;
        p.velocity.x += (globalWind.x*cfg.windFactor + ew.x)*dt;
        p.velocity.y += (globalWind.y*cfg.windFactor + ew.y)*dt;
        p.velocity.z += (globalWind.z*cfg.windFactor + ew.z)*dt;

        for (const att of attractors) {
          const dx = att.position.x - p.position.x;
          const dy = att.position.y - p.position.y;
          const dz = att.position.z - p.position.z;
          const distSq = dx*dx + dy*dy + dz*dz;
          const radius = att.radius || 1;
          const radiusSq = radius*radius;
          if (distSq < radiusSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const falloff = 1 - dist / radius;
            const strength = att.strength * cfg.attractorStrength * falloff * dt;
            const invDist = 1 / dist;
            p.velocity.x += dx * invDist * strength;
            p.velocity.y += dy * invDist * strength;
            p.velocity.z += dz * invDist * strength;
          }
        }

        const damping = Math.max(0, Math.min(1, cfg.damping));
        const df = Math.pow(1 - damping, dt);
        p.velocity.x *= df; p.velocity.y *= df; p.velocity.z *= df;

        p.position.x += p.velocity.x * dt;
        p.position.y += p.velocity.y * dt;
        p.position.z += p.velocity.z * dt;
        p.rotation += p.rotationSpeed * dt;

        if (doCollisions && cfg.collisionEnabled) {
          const pr = cfg.particleRadius || 0.1;
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

    updateBuffers() {
      const count = this.particles.length;
      for (let i = 0; i < count; i++) {
        const p = this.particles[i];
        const t = Math.max(0, Math.min(1, p.age / p.lifetime));
        this.positions[i*3] = p.position.x;
        this.positions[i*3+1] = p.position.y;
        this.positions[i*3+2] = p.position.z;
        const color = sampleColor(p.colorStops, t);
        const alpha = p.alphaStart + (p.alphaEnd - p.alphaStart) * t;
        this.colors[i*4] = color[0];
        this.colors[i*4+1] = color[1];
        this.colors[i*4+2] = color[2];
        this.colors[i*4+3] = color[3] * alpha;
        const ct = evalBezier(p.sizeCurve, t);
        this.sizes[i] = p.sizeStart + (p.sizeEnd - p.sizeStart) * ct;
        this.rotations[i] = p.rotation;
      }
      this.geometry.setDrawRange(0, count);
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
      this.geometry.attributes.size.needsUpdate = true;
      this.geometry.attributes.rotation.needsUpdate = true;
    }

    dispose() {
      if (this.point.parent) this.point.parent.remove(this.point);
      this.geometry.dispose();
      this.material.dispose();
      this.particles = [];
    }
  }

  class ParticleEngine {
    constructor() {
      this.scene = null;
      this.emitters = new Map();
      this.attractorMeshes = new Map();
      this.attractors = [];
      this.doCollisions = false;
    }
    attachTo(scene) { this.scene = scene; }
    applyProjectConfig(config) {
      this.clearEmitters();
      this.clearAttractors();
      if (config.doCollisions !== undefined) this.doCollisions = config.doCollisions;
      config.emitters.forEach(ec => this.addEmitter(ec));
      this.setAttractors(config.attractors);
    }
    addEmitter(cfg) {
      if (!this.scene) return;
      const old = this.emitters.get(cfg.id);
      if (old) old.dispose();
      const em = new EmitterRuntime(cfg, this.scene);
      this.emitters.set(cfg.id, em);
    }
    clearEmitters() {
      this.emitters.forEach(e => e.dispose());
      this.emitters.clear();
    }
    clearAttractors() {
      this.attractorMeshes.forEach(m => {
        if (m.parent) m.parent.remove(m);
        m.geometry.dispose(); m.material.dispose();
      });
      this.attractorMeshes.clear();
      this.attractors = [];
    }
    setAttractors(list) {
      const existing = new Set(this.attractors.map(a => a.id));
      const newer = new Set(list.map(a => a.id));
      existing.forEach(id => {
        if (!newer.has(id)) {
          const m = this.attractorMeshes.get(id);
          if (m) {
            if (m.parent) m.parent.remove(m);
            m.geometry.dispose(); m.material.dispose();
            this.attractorMeshes.delete(id);
          }
        }
      });
      list.forEach(att => {
        let mesh = this.attractorMeshes.get(att.id);
        const color = att.strength >= 0 ? 0x00ff00 : 0xff0000;
        const vr = Math.max(0.1, att.radius * 0.1);
        if (!mesh) {
          const geo = new THREE.SphereGeometry(vr, 16, 16);
          const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.5 });
          mesh = new THREE.Mesh(geo, mat);
          this.attractorMeshes.set(att.id, mesh);
          if (this.scene) this.scene.add(mesh);
        } else {
          mesh.material.color.setHex(color);
          mesh.scale.setScalar(1);
          mesh.geometry.dispose();
          mesh.geometry = new THREE.SphereGeometry(vr, 16, 16);
        }
        mesh.position.set(att.position.x, att.position.y, att.position.z);
      });
      this.attractors = [...list];
    }
    update(dt, gg, gw) {
      this.emitters.forEach(e => e.update(dt, gg, gw, this.attractors, this.doCollisions));
    }
  }

  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070814);
  scene.fog = new THREE.FogExp2(0x070814, 0.05);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 8);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const pl1 = new THREE.PointLight(0x22d3ee, 1, 50); pl1.position.set(5,5,5); scene.add(pl1);
  const pl2 = new THREE.PointLight(0xfb923c, 0.8, 50); pl2.position.set(-5,3,-5); scene.add(pl2);

  const grid = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
  grid.material.transparent = true; grid.material.opacity = 0.6; scene.add(grid);
  scene.add(new THREE.AxesHelper(2));

  const engine = new ParticleEngine();
  engine.attachTo(scene);
  engine.applyProjectConfig(PROJECT);

  let lastTime = 0;
  function animate(time) {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
    lastTime = time;
    engine.update(dt, PROJECT.globalGravity, PROJECT.globalWind);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();
})();
</script>
</body>
</html>`;
}

export const generateHtml = generateHtmlSnippet;
