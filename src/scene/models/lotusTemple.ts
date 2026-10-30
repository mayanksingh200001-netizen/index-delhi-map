/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ProceduralTextureGenerator } from '../proceduralTextures';
import { ExplodableComponent } from './indiaGate';

export class LotusTempleModel {
  public group: THREE.Group;
  private explodables: ExplodableComponent[] = [];
  private waterMeshes: THREE.Mesh[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'LotusTempleModel';

    const { map: marbleMap, roughnessMap: marbleRough } = ProceduralTextureGenerator.createMarbleTexture();
    const waterNormal = ProceduralTextureGenerator.createWaterNormalTexture();
    const contactShadowMap = ProceduralTextureGenerator.createContactShadowTexture();

    const whiteMarbleMat = new THREE.MeshStandardMaterial({
      map: marbleMap,
      roughnessMap: marbleRough,
      roughness: 0.22,
      metalness: 0.08,
      bumpScale: 0.02,
    });

    const innerSanctumMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3ea,
      roughness: 0.35,
      metalness: 0.1,
    });

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1e88e5,
      roughness: 0.1,
      metalness: 0.85,
      normalMap: waterNormal,
      transparent: true,
      opacity: 0.88,
    });

    const gardenLawnMat = new THREE.MeshStandardMaterial({
      color: 0x3d7042,
      roughness: 0.9,
      metalness: 0.02,
    });

    const pathwayMat = new THREE.MeshStandardMaterial({
      color: 0xd8c2b0,
      roughness: 0.8,
      metalness: 0.05,
    });

    // 0. Contact Shadow Disc
    const shadowGeo = new THREE.PlaneGeometry(38, 38);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowMap,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    this.group.add(shadowMesh);

    // 1. Manicured Base Podium & Concentric Lawns
    const groundGroup = new THREE.Group();
    const lawnPodium = new THREE.Mesh(new THREE.CylinderGeometry(19, 19.5, 0.4, 36), gardenLawnMat);
    lawnPodium.position.y = 0.2;
    lawnPodium.receiveShadow = true;
    groundGroup.add(lawnPodium);

    const centralPlaza = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.5, 36), pathwayMat);
    centralPlaza.position.y = 0.45;
    centralPlaza.receiveShadow = true;
    groundGroup.add(centralPlaza);

    this.group.add(groundGroup);
    this.registerExplodable(groundGroup, new THREE.Vector3(0, -1, 0));

    // 2. Nine Water Reflection Pools (Shaped radially between pathways)
    const poolGroup = new THREE.Group();
    for (let p = 0; p < 9; p++) {
      const angle = (p / 9) * Math.PI * 2;
      const poolCenterDist = 12.5;
      const px = Math.cos(angle) * poolCenterDist;
      const pz = Math.sin(angle) * poolCenterDist;

      // Pool retaining border
      const poolRim = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.5, 16), pathwayMat);
      poolRim.position.set(px, 0.5, pz);
      poolRim.castShadow = true;
      poolRim.receiveShadow = true;
      poolGroup.add(poolRim);

      // Water surface inside pool
      const waterSurface = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.45, 16), waterMat);
      waterSurface.position.set(px, 0.52, pz);
      poolGroup.add(waterSurface);
      this.waterMeshes.push(waterSurface);

      // Radial access bridge / walkway pointing into each door
      const bridgeAngle = angle + (Math.PI / 9);
      const bx = Math.cos(bridgeAngle) * 11.5;
      const bz = Math.sin(bridgeAngle) * 11.5;
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 7), pathwayMat);
      bridge.position.set(bx, 0.55, bz);
      bridge.rotation.y = -bridgeAngle + Math.PI / 2;
      bridge.receiveShadow = true;
      poolGroup.add(bridge);
    }
    this.group.add(poolGroup);
    this.registerExplodable(poolGroup, new THREE.Vector3(0, -0.6, 0));

    // Helper: Build a curved sculptural Lotus Petal
    const createPetalMesh = (
      width: number,
      height: number,
      curvature: number,
      thickness: number,
      mat: THREE.Material
    ) => {
      const shape = new THREE.Shape();
      // Graceful pointed Gothic/lotus leaf contour
      shape.moveTo(0, 0);
      shape.bezierCurveTo(-width * 0.7, height * 0.2, -width, height * 0.6, 0, height);
      shape.bezierCurveTo(width, height * 0.6, width * 0.7, height * 0.2, 0, 0);

      const extrudeSettings = {
        depth: thickness,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 4,
        bevelSize: 0.15,
        bevelThickness: 0.15,
      };

      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Curve vertices along Z to give convex/concave shell form
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const x = pos.getX(i);
        const yRatio = y / height;
        const curveOffset = Math.sin(yRatio * Math.PI) * curvature * (1 - (Math.abs(x) / (width + 0.1)) * 0.4);
        pos.setZ(i, pos.getZ(i) + curveOffset);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // 3. Nine Outer Petals (Opening outward over the 9 entrance portals)
    const outerGroup = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2 + (Math.PI / 9);
      const petal = createPetalMesh(3.2, 9.5, -2.2, 0.3, whiteMarbleMat);
      
      const petalHolder = new THREE.Group();
      petal.position.set(0, 0.7, 0);
      petal.rotation.x = 0.38; // flares outward
      petalHolder.add(petal);

      // Entrance arched doorway frame underneath
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.4), innerSanctumMat);
      doorFrame.position.set(0, 2.1, 0.2);
      petalHolder.add(doorFrame);

      petalHolder.position.set(Math.cos(angle) * 7.5, 0.4, Math.sin(angle) * 7.5);
      petalHolder.rotation.y = -angle - Math.PI / 2;
      outerGroup.add(petalHolder);
    }
    this.group.add(outerGroup);
    this.registerExplodable(outerGroup, new THREE.Vector3(0, 0, 4));

    // 4. Nine Inner Petals (Towering primary sanctuary shell)
    const innerGroup = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const petal = createPetalMesh(3.8, 19.5, 3.8, 0.35, whiteMarbleMat);

      const petalHolder = new THREE.Group();
      petal.position.set(0, 0.7, 0);
      petal.rotation.x = -0.18; // tilts inward toward apex
      petalHolder.add(petal);

      petalHolder.position.set(Math.cos(angle) * 5.2, 0.6, Math.sin(angle) * 5.2);
      petalHolder.rotation.y = -angle - Math.PI / 2;
      innerGroup.add(petalHolder);
    }
    this.group.add(innerGroup);
    this.registerExplodable(innerGroup, new THREE.Vector3(0, 4, 0));

    // 5. Crown Petals & Apex Skylight Star
    const crownGroup = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2 + (Math.PI / 9);
      const crownPetal = createPetalMesh(2.2, 8.5, 2.0, 0.25, whiteMarbleMat);

      const holder = new THREE.Group();
      crownPetal.position.set(0, 14.5, 0);
      crownPetal.rotation.x = -0.32;
      holder.add(crownPetal);

      holder.position.set(Math.cos(angle) * 3.2, 0, Math.sin(angle) * 3.2);
      holder.rotation.y = -angle - Math.PI / 2;
      crownGroup.add(holder);
    }

    // Glass & steel apex star cap
    const skylightGeo = new THREE.CylinderGeometry(0.2, 2.2, 1.2, 9);
    const skylightMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const skylight = new THREE.Mesh(skylightGeo, skylightMat);
    skylight.position.y = 20.2;
    crownGroup.add(skylight);

    this.group.add(crownGroup);
    this.registerExplodable(crownGroup, new THREE.Vector3(0, 8, 0));

    // 6. Central Sanctuary Interior Podium & Warm Light
    const sanctumGroup = new THREE.Group();
    const podiumMesh = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 0.6, 24), innerSanctumMat);
    podiumMesh.position.y = 1.0;
    sanctumGroup.add(podiumMesh);

    const sanctumLight = new THREE.PointLight(0xfffaed, 2.2, 15, 1.2);
    sanctumLight.position.set(0, 4.5, 0);
    sanctumGroup.add(sanctumLight);

    this.group.add(sanctumGroup);
    this.registerExplodable(sanctumGroup, new THREE.Vector3(0, 1.5, 0));
  }

  private registerExplodable(mesh: THREE.Object3D, offset: THREE.Vector3) {
    this.explodables.push({
      mesh,
      origPos: mesh.position.clone(),
      targetOffset: offset,
    });
  }

  public update(time: number, explodedAmount: number) {
    // Gentle water ripple animation via offset
    for (const wm of this.waterMeshes) {
      if ((wm.material as THREE.MeshStandardMaterial).normalMap) {
        (wm.material as THREE.MeshStandardMaterial).normalMap!.offset.x = (time * 0.04) % 1;
        (wm.material as THREE.MeshStandardMaterial).normalMap!.offset.y = (time * 0.02) % 1;
      }
    }

    for (const item of this.explodables) {
      item.mesh.position.x = item.origPos.x + item.targetOffset.x * explodedAmount;
      item.mesh.position.y = item.origPos.y + item.targetOffset.y * explodedAmount;
      item.mesh.position.z = item.origPos.z + item.targetOffset.z * explodedAmount;
    }
  }

  public setRenderStyle(style: string) {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name !== 'shadow') {
        if (style === 'wireframe') {
          child.material.wireframe = true;
        } else if (style === 'architectural-clay') {
          child.material.wireframe = false;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.map = null;
            child.material.roughnessMap = null;
            child.material.color.setHex(0xe8ded1);
            child.material.roughness = 0.95;
            child.material.needsUpdate = true;
          }
        } else if (style === 'blueprint') {
          child.material.wireframe = false;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.map = null;
            child.material.roughnessMap = null;
            child.material.color.setHex(0x0a4d7d);
            child.material.roughness = 0.4;
            child.material.metalness = 0.3;
            child.material.needsUpdate = true;
          }
        }
      }
    });
  }
}
