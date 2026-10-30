/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Creates high-fidelity procedural PBR textures without external assets (zero 404s).
 */
export class ProceduralTextureGenerator {
  private static maxAnisotropy = 4;

  public static setMaxAnisotropy(val: number) {
    this.maxAnisotropy = Math.max(1, Math.min(val, 16));
  }

  /**
   * Generates Bharatpur / Dholpur Red Sandstone procedural diffuse and roughness texture.
   */
  public static createSandstoneTexture(baseHex = 0xb44c3c, isAccent = false): {
    map: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
  } {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base color
    const rBase = (baseHex >> 16) & 255;
    const gBase = (baseHex >> 8) & 255;
    const bBase = baseHex & 255;

    ctx.fillStyle = `rgb(${rBase}, ${gBase}, ${bBase})`;
    ctx.fillRect(0, 0, size, size);

    // Subtle horizontal sedimentary layers & grain
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    // Noise and stratification
    for (let y = 0; y < size; y++) {
      const layerOffset = Math.sin(y * 0.08) * 12 + Math.sin(y * 0.02) * 20;
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const noise = (Math.random() - 0.5) * 22;
        const streak = Math.sin((x * 0.02 + y * 0.1)) * 10;
        const val = layerOffset + noise + streak;

        data[i] = Math.min(255, Math.max(0, rBase + val));
        data[i + 1] = Math.min(255, Math.max(0, gBase + val * 0.7));
        data[i + 2] = Math.min(255, Math.max(0, bBase + val * 0.5));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle stone block joint lines if not accent
    if (!isAccent) {
      ctx.strokeStyle = 'rgba(40, 10, 5, 0.2)';
      ctx.lineWidth = 2;
      for (let y = 0; y < size; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();

        const offset = (y / 64) % 2 === 0 ? 0 : 64;
        for (let x = offset; x < size; x += 128) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 64);
          ctx.stroke();
        }
      }
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = this.maxAnisotropy;

    // Bump map (grayscale height)
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);
    const bData = bCtx.getImageData(0, 0, 256, 256);
    for (let k = 0; k < bData.data.length; k += 4) {
      const n = (Math.random() - 0.5) * 40;
      const v = Math.min(255, Math.max(0, 128 + n));
      bData.data[k] = v;
      bData.data[k + 1] = v;
      bData.data[k + 2] = v;
    }
    bCtx.putImageData(bData, 0, 0);

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.anisotropy = this.maxAnisotropy;

    return { map, bumpMap };
  }

  /**
   * Generates Greek Pentelic / Makrana White Marble texture with crystalline veins.
   */
  public static createMarbleTexture(): {
    map: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
  } {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Pure alabaster white foundation
    ctx.fillStyle = '#f8f8fa';
    ctx.fillRect(0, 0, size, size);

    // Elegant faint gray-amber veins
    ctx.strokeStyle = 'rgba(195, 198, 205, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.filter = 'blur(1px)';

    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      let cx = Math.random() * size;
      let cy = 0;
      ctx.moveTo(cx, cy);
      while (cy < size) {
        cx += (Math.random() - 0.5) * 35;
        cy += Math.random() * 40 + 10;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    ctx.filter = 'none';

    // Faint micro crystalline noise
    const imgData = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 8;
      imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + grain));
      imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + grain));
      imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + grain));
    }
    ctx.putImageData(imgData, 0, 0);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = this.maxAnisotropy;

    // Roughness map (polished marble has 0.15 - 0.3 roughness with veined variation)
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 256;
    rCanvas.height = 256;
    const rCtx = rCanvas.getContext('2d')!;
    rCtx.fillStyle = '#3c3c3c'; // smooth ~0.24
    rCtx.fillRect(0, 0, 256, 256);
    const roughnessMap = new THREE.CanvasTexture(rCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;

    return { map, roughnessMap };
  }

  /**
   * Generates Delhi 4th-century Iron Pillar forged wrought iron texture.
   */
  public static createIronPillarTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Weathered charcoal dark iron
    ctx.fillStyle = '#2b2d30';
    ctx.fillRect(0, 0, size, size);

    // Hammered forged bloomery iron striations
    for (let y = 0; y < size; y += 4) {
      const alpha = 0.05 + Math.random() * 0.12;
      ctx.fillStyle = `rgba(18, 19, 21, ${alpha})`;
      ctx.fillRect(0, y, size, 3);
    }

    // Subtle passive misawite phosphate luster (bronze-grey flecks)
    ctx.fillStyle = 'rgba(92, 85, 76, 0.18)';
    for (let k = 0; k < 60; k++) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 3, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    return tex;
  }

  /**
   * Creates water surface normal map for Lotus Temple reflection ponds & Yamuna.
   */
  public static createWaterNormalTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Neutral normal map base is RGB(128, 128, 255)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const wave1 = Math.sin(x * 0.1) * Math.cos(y * 0.1);
        const wave2 = Math.sin((x + y) * 0.15) * 0.5;
        const nx = Math.round(128 + (wave1 + wave2) * 35);
        const ny = Math.round(128 + (wave1 - wave2) * 35);

        imgData.data[i] = Math.min(255, Math.max(0, nx));
        imgData.data[i + 1] = Math.min(255, Math.max(0, ny));
        imgData.data[i + 2] = 245;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  /**
   * Creates Kartavya Path radial plaza pavers texture.
   */
  public static createPaverTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#b6886e';
    ctx.fillRect(0, 0, size, size);

    // Paver grid
    ctx.strokeStyle = '#6f4b38';
    ctx.lineWidth = 2;
    for (let p = 0; p < size; p += 32) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    return tex;
  }

  /**
   * Creates contact shadow radial falloff texture.
   */
  public static createContactShadowTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }
}
