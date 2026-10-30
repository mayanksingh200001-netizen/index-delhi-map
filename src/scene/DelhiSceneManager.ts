/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MonumentId, LightingPreset, RenderStyle, CameraPreset, Hotspot } from '../types';
import { MONUMENTS } from '../data/monuments';
import { IndiaGateModel } from './models/indiaGate';
import { QutubMinarModel } from './models/qutubMinar';
import { LotusTempleModel } from './models/lotusTemple';
import { RedFortModel } from './models/redFort';
import { DelhiDioramaModel } from './models/delhiDiorama';
import { ProceduralTextureGenerator } from './proceduralTextures';

// Pre-allocated scratch objects to prevent garbage collection in render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mouse = new THREE.Vector2();

export class DelhiSceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Models
  private activeMonumentId: MonumentId = 'delhi-diorama';
  private models: Map<MonumentId, THREE.Object3D> = new Map();
  private indiaGateModel: IndiaGateModel;
  private qutubMinarModel: QutubMinarModel;
  private lotusTempleModel: LotusTempleModel;
  private redFortModel: RedFortModel;
  private dioramaModel: DelhiDioramaModel;

  // Lighting
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private fillLight: THREE.DirectionalLight;
  private tricolourLights: THREE.PointLight[] = [];

  // Hotspots
  private hotspotGroup: THREE.Group;
  private raycaster: THREE.Raycaster;
  private onHotspotClick?: (hotspot: Hotspot) => void;
  private onHotspotHover?: (hotspot: Hotspot | null) => void;
  private currentHotspots: Hotspot[] = [];

  // Camera damping target
  private cameraTarget = new THREE.Vector3(0, 2, 0);
  private cameraDesiredPos = new THREE.Vector3(0, 42, 68);
  private cameraLookAt = new THREE.Vector3(0, 2, 0);

  // Interaction State
  private isDragging = false;
  private prevMousePos = { x: 0, y: 0 };
  private spherical = new THREE.Spherical();
  private autoRotate = false;
  private explodedAmount = 0.0;
  private currentStyle: RenderStyle = 'pbr-realistic';
  private currentLighting: LightingPreset = 'golden-hour';

  // Lifecycle
  private isSoftwareGl = false;
  private isRunning = false;
  private frameId = 0;
  private lastTime = 0;

  constructor(
    container: HTMLElement,
    callbacks?: {
      onHotspotClick?: (h: Hotspot) => void;
      onHotspotHover?: (h: Hotspot | null) => void;
    }
  ) {
    this.container = container;
    this.onHotspotClick = callbacks?.onHotspotClick;
    this.onHotspotHover = callbacks?.onHotspotHover;

    // 1. Software WebGL Guard (Skill Directive 1.1)
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Set Max Anisotropy for procedural textures
    ProceduralTextureGenerator.setMaxAnisotropy(this.renderer.capabilities.getMaxAnisotropy());

    // 2. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdce7f0);
    this.scene.fog = new THREE.FogExp2(0xdce7f0, 0.009);

    // 3. Camera Setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    this.camera.position.set(0, 42, 68);
    this.camera.lookAt(this.cameraTarget);

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xfff6ea, 0x5a6d7c, 1.2);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffecd2, 2.4);
    this.keyLight.position.set(30, 45, 35);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 5;
    this.keyLight.shadow.camera.far = 160;
    const d = 36;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xb4d4ff, 0.8);
    this.fillLight.position.set(-25, 20, -20);
    this.scene.add(this.fillLight);

    // Republic Day Tricolour architectural floodlights
    const saffronLight = new THREE.PointLight(0xff671f, 0, 30);
    saffronLight.position.set(0, 18, 10);
    this.scene.add(saffronLight);

    const whiteLight = new THREE.PointLight(0xffffff, 0, 30);
    whiteLight.position.set(0, 10, 10);
    this.scene.add(whiteLight);

    const greenLight = new THREE.PointLight(0x046a38, 0, 30);
    greenLight.position.set(0, 2, 10);
    this.scene.add(greenLight);

    this.tricolourLights = [saffronLight, whiteLight, greenLight];

    // 6. Build Models
    this.dioramaModel = new DelhiDioramaModel();
    this.scene.add(this.dioramaModel.group);
    this.models.set('delhi-diorama', this.dioramaModel.group);

    this.indiaGateModel = new IndiaGateModel();
    this.indiaGateModel.group.visible = false;
    this.scene.add(this.indiaGateModel.group);
    this.models.set('india-gate', this.indiaGateModel.group);

    this.qutubMinarModel = new QutubMinarModel();
    this.qutubMinarModel.group.visible = false;
    this.scene.add(this.qutubMinarModel.group);
    this.models.set('qutub-minar', this.qutubMinarModel.group);

    this.lotusTempleModel = new LotusTempleModel();
    this.lotusTempleModel.group.visible = false;
    this.scene.add(this.lotusTempleModel.group);
    this.models.set('lotus-temple', this.lotusTempleModel.group);

    this.redFortModel = new RedFortModel();
    this.redFortModel.group.visible = false;
    this.scene.add(this.redFortModel.group);
    this.models.set('red-fort', this.redFortModel.group);

    // 7. Hotspots & Raycasting
    this.hotspotGroup = new THREE.Group();
    this.scene.add(this.hotspotGroup);
    this.raycaster = new THREE.Raycaster();

    this.setupEventListeners();
    this.setMonument('delhi-diorama');
    this.setLighting('golden-hour');
    this.startLoop();
  }

  private setupEventListeners() {
    const dom = this.renderer.domElement;

    // Mouse / Touch Drag to Orbit
    dom.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('pointermove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.prevMousePos.x;
        const dy = e.clientY - this.prevMousePos.y;
        this.prevMousePos = { x: e.clientX, y: e.clientY };

        _vec3A.subVectors(this.cameraDesiredPos, this.cameraTarget);
        this.spherical.setFromVector3(_vec3A);

        this.spherical.theta -= dx * 0.007;
        this.spherical.phi -= dy * 0.007;
        // Clamp polar angle
        this.spherical.phi = Math.max(0.1, Math.min(Math.PI * 0.48, this.spherical.phi));

        this.cameraDesiredPos.setFromSpherical(this.spherical).add(this.cameraTarget);
      } else {
        // Raycast Hotspot hover
        this.checkHotspotHover(e);
      }
    });

    // Mouse Wheel to Zoom
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      _vec3A.subVectors(this.cameraDesiredPos, this.cameraTarget);
      _vec3A.multiplyScalar(zoomFactor);
      const minDistance = 5;
      const maxDistance = 140;
      if (_vec3A.length() >= minDistance && _vec3A.length() <= maxDistance) {
        this.cameraDesiredPos.copy(this.cameraTarget).add(_vec3A);
      }
    }, { passive: false });

    // Click on Hotspots
    dom.addEventListener('click', (e) => {
      const rect = dom.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(_mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.hotspotGroup.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData.hotspot) {
          obj = obj.parent;
        }
        if (obj && obj.userData.hotspot && this.onHotspotClick) {
          this.onHotspotClick(obj.userData.hotspot as Hotspot);
        }
      }
    });

    // Resize
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private checkHotspotHover(e: PointerEvent) {
    const dom = this.renderer.domElement;
    const rect = dom.getBoundingClientRect();
    _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(_mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hotspotGroup.children, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData.hotspot) {
        obj = obj.parent;
      }
      if (obj && obj.userData.hotspot) {
        dom.style.cursor = 'pointer';
        if (this.onHotspotHover) this.onHotspotHover(obj.userData.hotspot as Hotspot);
        return;
      }
    }
    dom.style.cursor = 'grab';
    if (this.onHotspotHover) this.onHotspotHover(null);
  }

  public setMonument(id: MonumentId) {
    this.activeMonumentId = id;

    // Toggle model visibilities
    this.models.forEach((group, mId) => {
      group.visible = mId === id;
    });

    // Reposition camera target
    const data = MONUMENTS[id];
    if (data) {
      this.cameraDesiredPos.set(...data.initialCamera.position);
      this.cameraTarget.set(...data.initialCamera.target);
      this.camera.fov = data.initialCamera.fov;
      this.camera.updateProjectionMatrix();

      this.rebuildHotspots(data.hotspots);
    }

    // Reset exploded slider smoothly
    this.explodedAmount = 0;
  }

  private rebuildHotspots(hotspots: Hotspot[]) {
    // Clear existing
    while (this.hotspotGroup.children.length > 0) {
      const child = this.hotspotGroup.children[0];
      this.hotspotGroup.remove(child);
    }

    this.currentHotspots = hotspots;

    for (const h of hotspots) {
      const node = new THREE.Group();
      node.userData.hotspot = h;
      node.position.set(...h.position);

      // Core circular emblem
      const discGeo = new THREE.CircleGeometry(0.55, 24);
      const discMat = new THREE.MeshBasicMaterial({
        color: 0xffa000,
        side: THREE.DoubleSide,
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      node.add(disc);

      // Outer ring
      const ringGeo = new THREE.RingGeometry(0.65, 0.78, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      node.add(ring);

      this.hotspotGroup.add(node);
    }
  }

  public setLighting(preset: LightingPreset) {
    this.currentLighting = preset;
    const fog = this.scene.fog as THREE.FogExp2;

    // Turn off tricolour by default
    for (const l of this.tricolourLights) l.intensity = 0;

    switch (preset) {
      case 'golden-hour':
        this.scene.background = new THREE.Color(0xf5dcc8);
        fog.color.setHex(0xf5dcc8);
        fog.density = 0.008;
        this.keyLight.color.setHex(0xffaa5e);
        this.keyLight.intensity = 2.6;
        this.keyLight.position.set(40, 22, 25);
        this.hemiLight.color.setHex(0xffedd5);
        this.hemiLight.groundColor.setHex(0x524036);
        this.hemiLight.intensity = 1.0;
        this.fillLight.color.setHex(0xaec8e6);
        this.fillLight.intensity = 0.6;
        break;

      case 'noon':
        this.scene.background = new THREE.Color(0xdce7f0);
        fog.color.setHex(0xdce7f0);
        fog.density = 0.007;
        this.keyLight.color.setHex(0xfffbf2);
        this.keyLight.intensity = 2.8;
        this.keyLight.position.set(15, 60, 20);
        this.hemiLight.color.setHex(0xffffff);
        this.hemiLight.groundColor.setHex(0x506575);
        this.hemiLight.intensity = 1.2;
        this.fillLight.color.setHex(0xbcd7f0);
        this.fillLight.intensity = 0.8;
        break;

      case 'republic-day':
        // Twilight illumination with Saffron, White, Green architectural lighting
        this.scene.background = new THREE.Color(0x13172e);
        fog.color.setHex(0x13172e);
        fog.density = 0.012;
        this.keyLight.color.setHex(0x556699);
        this.keyLight.intensity = 0.9;
        this.keyLight.position.set(20, 30, 20);
        this.hemiLight.color.setHex(0x283256);
        this.hemiLight.groundColor.setHex(0x0d121c);
        this.hemiLight.intensity = 0.7;
        this.fillLight.color.setHex(0x3a4b6b);
        this.fillLight.intensity = 0.5;

        // Activate Tricolour
        this.tricolourLights[0].intensity = 4.0; // saffron
        this.tricolourLights[1].intensity = 3.5; // white
        this.tricolourLights[2].intensity = 4.0; // green
        break;

      case 'night':
        this.scene.background = new THREE.Color(0x0c0f17);
        fog.color.setHex(0x0c0f17);
        fog.density = 0.014;
        this.keyLight.color.setHex(0x7080b0);
        this.keyLight.intensity = 0.6;
        this.keyLight.position.set(-20, 35, 10);
        this.hemiLight.color.setHex(0x192138);
        this.hemiLight.groundColor.setHex(0x080b12);
        this.hemiLight.intensity = 0.5;
        this.fillLight.color.setHex(0xffa726);
        this.fillLight.intensity = 1.2;
        break;
    }
  }

  public setRenderStyle(style: RenderStyle) {
    this.currentStyle = style;
    this.indiaGateModel.setRenderStyle(style);
    this.qutubMinarModel.setRenderStyle(style);
    this.lotusTempleModel.setRenderStyle(style);
    this.redFortModel.setRenderStyle(style);
    this.dioramaModel.setRenderStyle(style);
  }

  public setExplodedAmount(val: number) {
    this.explodedAmount = Math.max(0, Math.min(1, val));
  }

  public setAutoRotate(rotate: boolean) {
    this.autoRotate = rotate;
  }

  public setCameraPreset(preset: CameraPreset) {
    const data = MONUMENTS[this.activeMonumentId];
    if (!data) return;

    const [tx, ty, tz] = data.initialCamera.target;
    this.cameraTarget.set(tx, ty, tz);

    switch (preset) {
      case 'perspective':
        this.cameraDesiredPos.set(...data.initialCamera.position);
        break;
      case 'drone':
        this.cameraDesiredPos.set(tx, ty + 50, tz + 25);
        break;
      case 'ground':
        this.cameraDesiredPos.set(tx, ty + 1.8, tz + 18);
        break;
      case 'front':
        this.cameraDesiredPos.set(tx, ty + 12, tz + 30);
        break;
    }
  }

  public focusHotspot(hotspot: Hotspot) {
    this.cameraTarget.set(...hotspot.position);
    _vec3A.set(hotspot.position[0], hotspot.position[1] + 3, hotspot.position[2] + 10);
    this.cameraDesiredPos.copy(_vec3A);
  }

  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // Animation Loop with Software WebGL Guard (Skill Directive 2.3)
  private startLoop() {
    this.isRunning = true;
    this.lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 60);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = (now: number) => {
      if (!this.isRunning) return;

      const delta = Math.min((now - this.lastTime) * 0.001, 0.1);
      this.lastTime = now;
      const time = now * 0.001;

      // Camera Exponential Damping
      const dampFactor = Math.min(delta * 5.0, 1.0);
      this.camera.position.lerp(this.cameraDesiredPos, dampFactor);
      this.cameraLookAt.lerp(this.cameraTarget, dampFactor);
      this.camera.lookAt(this.cameraLookAt);

      // Auto rotation
      if (this.autoRotate && !this.isDragging) {
        _vec3A.subVectors(this.cameraDesiredPos, this.cameraTarget);
        this.spherical.setFromVector3(_vec3A);
        this.spherical.theta += delta * 0.25;
        this.cameraDesiredPos.setFromSpherical(this.spherical).add(this.cameraTarget);
      }

      // Hotspots billboard orientation (face camera)
      for (const hMesh of this.hotspotGroup.children) {
        hMesh.quaternion.copy(this.camera.quaternion);
      }

      // Update active models
      if (this.activeMonumentId === 'delhi-diorama') {
        this.dioramaModel.update(time, this.explodedAmount);
      } else if (this.activeMonumentId === 'india-gate') {
        this.indiaGateModel.update(time, this.explodedAmount);
      } else if (this.activeMonumentId === 'qutub-minar') {
        this.qutubMinarModel.update(time, this.explodedAmount);
      } else if (this.activeMonumentId === 'lotus-temple') {
        this.lotusTempleModel.update(time, this.explodedAmount);
      } else if (this.activeMonumentId === 'red-fort') {
        this.redFortModel.update(time, this.explodedAmount);
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(() => tick(performance.now()));
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(() => tick(performance.now()));
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
