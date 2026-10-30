/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ProceduralTextureGenerator } from '../proceduralTextures';

export interface ExplodableComponent {
  mesh: THREE.Object3D;
  origPos: THREE.Vector3;
  targetOffset: THREE.Vector3;
}

export class IndiaGateModel {
  public group: THREE.Group;
  private explodables: ExplodableComponent[] = [];
  private flameLight: THREE.PointLight;
  private flameParticles: THREE.Points;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'IndiaGateModel';

    // Textures & Materials
    const { map: redStoneMap, bumpMap: redStoneBump } = ProceduralTextureGenerator.createSandstoneTexture(0xa84c38);
    const { map: buffStoneMap, bumpMap: buffStoneBump } = ProceduralTextureGenerator.createSandstoneTexture(0xc68e64, true);
    const contactShadowMap = ProceduralTextureGenerator.createContactShadowTexture();

    const redSandstoneMat = new THREE.MeshStandardMaterial({
      map: redStoneMap,
      bumpMap: redStoneBump,
      bumpScale: 0.04,
      roughness: 0.88,
      metalness: 0.05,
    });

    const buffSandstoneMat = new THREE.MeshStandardMaterial({
      map: buffStoneMap,
      bumpMap: buffStoneBump,
      bumpScale: 0.03,
      roughness: 0.75,
      metalness: 0.05,
    });

    const blackMarbleMat = new THREE.MeshStandardMaterial({
      color: 0x111215,
      roughness: 0.2,
      metalness: 0.3,
    });

    const darkBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x242628,
      roughness: 0.45,
      metalness: 0.85,
    });

    const goldBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.9,
    });

    // 0. Contact Shadow Disc
    const shadowGeo = new THREE.PlaneGeometry(28, 20);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowMap,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    this.group.add(shadowMesh);

    // 1. Stepped Plinth / Foundations (Secondary Read)
    const plinthGroup = new THREE.Group();
    const baseStep1 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.8, 14), redSandstoneMat);
    baseStep1.position.y = 0.4;
    baseStep1.castShadow = true;
    baseStep1.receiveShadow = true;
    plinthGroup.add(baseStep1);

    const baseStep2 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.8, 12.6), buffSandstoneMat);
    baseStep2.position.y = 1.2;
    baseStep2.castShadow = true;
    baseStep2.receiveShadow = true;
    plinthGroup.add(baseStep2);

    this.group.add(plinthGroup);
    this.registerExplodable(plinthGroup, new THREE.Vector3(0, -1.5, 0));

    // 2. Twin Monumental Piers / Pylons (Primary Silhouette)
    const leftPierGroup = new THREE.Group();
    const rightPierGroup = new THREE.Group();

    // Pier Shafts
    const pierGeo = new THREE.BoxGeometry(5.2, 12, 10);
    const leftPier = new THREE.Mesh(pierGeo, redSandstoneMat);
    leftPier.position.set(-6, 7.6, 0);
    leftPier.castShadow = true;
    leftPier.receiveShadow = true;
    leftPierGroup.add(leftPier);

    // Beveled corner pilasters
    const pilasterGeo = new THREE.BoxGeometry(0.8, 12, 0.8);
    for (const [px, pz] of [[-8.4, -4.8], [-8.4, 4.8], [-3.6, -4.8], [-3.6, 4.8]]) {
      const pilaster = new THREE.Mesh(pilasterGeo, buffSandstoneMat);
      pilaster.position.set(px, 7.6, pz);
      pilaster.castShadow = true;
      leftPierGroup.add(pilaster);
    }

    const rightPier = new THREE.Mesh(pierGeo, redSandstoneMat);
    rightPier.position.set(6, 7.6, 0);
    rightPier.castShadow = true;
    rightPier.receiveShadow = true;
    rightPierGroup.add(rightPier);

    for (const [px, pz] of [[3.6, -4.8], [3.6, 4.8], [8.4, -4.8], [8.4, 4.8]]) {
      const pilaster = new THREE.Mesh(pilasterGeo, buffSandstoneMat);
      pilaster.position.set(px, 7.6, pz);
      pilaster.castShadow = true;
      rightPierGroup.add(pilaster);
    }

    this.group.add(leftPierGroup);
    this.group.add(rightPierGroup);
    this.registerExplodable(leftPierGroup, new THREE.Vector3(-4, 0, 0));
    this.registerExplodable(rightPierGroup, new THREE.Vector3(4, 0, 0));

    // 3. Vaulted Triumphal Archway (Primary Silhouette Arch)
    const archVaultGroup = new THREE.Group();

    // Arch Extrusion Shape
    const archShape = new THREE.Shape();
    archShape.moveTo(-3.4, 0);
    archShape.lineTo(-3.4, 6.8);
    // Semicircular barrel arch
    archShape.absarc(0, 6.8, 3.4, Math.PI, 0, true);
    archShape.lineTo(3.4, 0);
    archShape.lineTo(-3.4, 0);

    const extrudeSettings = {
      depth: 9.8,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.15,
      bevelThickness: 0.15,
    };

    // Cutout arch surround
    const archOuterShape = new THREE.Shape();
    archOuterShape.moveTo(-6.8, 0);
    archOuterShape.lineTo(-6.8, 12);
    archOuterShape.lineTo(6.8, 12);
    archOuterShape.lineTo(6.8, 0);
    archOuterShape.holes.push(archShape);

    const archSpandrel = new THREE.Mesh(new THREE.ExtrudeGeometry(archOuterShape, extrudeSettings), redSandstoneMat);
    archSpandrel.position.set(0, 1.6, -4.9);
    archSpandrel.castShadow = true;
    archSpandrel.receiveShadow = true;
    archVaultGroup.add(archSpandrel);

    // Keystones
    const keystoneGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
    const keystoneF = new THREE.Mesh(keystoneGeo, buffSandstoneMat);
    keystoneF.position.set(0, 11.9, 5.1);
    archVaultGroup.add(keystoneF);
    const keystoneB = new THREE.Mesh(keystoneGeo, buffSandstoneMat);
    keystoneB.position.set(0, 11.9, -5.1);
    archVaultGroup.add(keystoneB);

    this.group.add(archVaultGroup);
    this.registerExplodable(archVaultGroup, new THREE.Vector3(0, 3, 0));

    // 4. Classical Entablature & Cornice Band
    const corniceGroup = new THREE.Group();
    const corniceLower = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.7, 11.2), buffSandstoneMat);
    corniceLower.position.y = 14;
    corniceLower.castShadow = true;
    corniceGroup.add(corniceLower);

    const corniceDentil = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.6, 10.6), redSandstoneMat);
    corniceDentil.position.y = 14.65;
    corniceDentil.castShadow = true;
    corniceGroup.add(corniceDentil);

    const corniceUpper = new THREE.Mesh(new THREE.BoxGeometry(18.8, 0.6, 11.0), buffSandstoneMat);
    corniceUpper.position.y = 15.25;
    corniceUpper.castShadow = true;
    corniceGroup.add(corniceUpper);

    this.group.add(corniceGroup);
    this.registerExplodable(corniceGroup, new THREE.Vector3(0, 5, 0));

    // 5. Attic Storey with Inscription Frieze (Accent Detail & Scale)
    const atticGroup = new THREE.Group();
    const atticBlock = new THREE.Mesh(new THREE.BoxGeometry(17.2, 3.8, 9.8), redSandstoneMat);
    atticBlock.position.y = 17.4;
    atticBlock.castShadow = true;
    atticBlock.receiveShadow = true;
    atticGroup.add(atticBlock);

    // Inscribed Frieze Plaque Front and Back
    const friezeGeo = new THREE.BoxGeometry(14, 2.2, 0.2);
    const friezeF = new THREE.Mesh(friezeGeo, buffSandstoneMat);
    friezeF.position.set(0, 17.5, 5.0);
    atticGroup.add(friezeF);

    const friezeB = new THREE.Mesh(friezeGeo, buffSandstoneMat);
    friezeB.position.set(0, 17.5, -5.0);
    atticGroup.add(friezeB);

    // 6. Crowning Finial Urli / Shallow Ceremonial Bowl
    const urliGroup = new THREE.Group();
    const bowlBase = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.6, 24), buffSandstoneMat);
    bowlBase.position.y = 19.6;
    urliGroup.add(bowlBase);

    // Shallow brass bowl
    const bowlGeo = new THREE.CylinderGeometry(2.4, 1.4, 0.7, 24, 1, true);
    const bowlMesh = new THREE.Mesh(bowlGeo, goldBrassMat);
    bowlMesh.position.y = 20.2;
    urliGroup.add(bowlMesh);

    atticGroup.add(urliGroup);

    this.group.add(atticGroup);
    this.registerExplodable(atticGroup, new THREE.Vector3(0, 7.5, 0));

    // 7. Amar Jawan Jyoti Cenotaph & Eternal Flame
    const cenotaphGroup = new THREE.Group();
    const cenotaphPodium = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 3.6), blackMarbleMat);
    cenotaphPodium.position.y = 1.9;
    cenotaphPodium.castShadow = true;
    cenotaphPodium.receiveShadow = true;
    cenotaphGroup.add(cenotaphPodium);

    // Inverted Rifle (barrel pointing down) & Soldier's Helmet
    const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), darkBronzeMat);
    rifleBarrel.position.set(0, 2.75, 0);
    rifleBarrel.castShadow = true;
    cenotaphGroup.add(rifleBarrel);

    const rifleStock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.08), darkBronzeMat);
    rifleStock.position.set(0, 3.2, 0);
    cenotaphGroup.add(rifleStock);

    // Helmet atop the rifle stock
    const helmetGeo = new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const helmet = new THREE.Mesh(helmetGeo, darkBronzeMat);
    helmet.position.set(0, 3.5, 0);
    helmet.castShadow = true;
    cenotaphGroup.add(helmet);

    // 4 Corner Eternal Flame Urns
    const urnGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.35, 12);
    const cornerOffsets = [[-1.4, -1.4], [-1.4, 1.4], [1.4, -1.4], [1.4, 1.4]];
    for (const [ux, uz] of cornerOffsets) {
      const urn = new THREE.Mesh(urnGeo, goldBrassMat);
      urn.position.set(ux, 2.38, uz);
      cenotaphGroup.add(urn);
    }

    // Flame PointLight
    this.flameLight = new THREE.PointLight(0xff7722, 2.5, 12, 1.5);
    this.flameLight.position.set(0, 2.7, 0);
    cenotaphGroup.add(this.flameLight);

    // Procedural glowing flame particle cluster
    const flameGeo = new THREE.BufferGeometry();
    const flameCount = 30;
    const flamePositions = new Float32Array(flameCount * 3);
    for (let f = 0; f < flameCount; f++) {
      flamePositions[f * 3] = (Math.random() - 0.5) * 0.4;
      flamePositions[f * 3 + 1] = 2.45 + Math.random() * 0.5;
      flamePositions[f * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    const flameMat = new THREE.PointsMaterial({
      color: 0xffaa33,
      size: 0.18,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.flameParticles = new THREE.Points(flameGeo, flameMat);
    cenotaphGroup.add(this.flameParticles);

    this.group.add(cenotaphGroup);
    this.registerExplodable(cenotaphGroup, new THREE.Vector3(0, 0, 5));
  }

  private registerExplodable(mesh: THREE.Object3D, offset: THREE.Vector3) {
    this.explodables.push({
      mesh,
      origPos: mesh.position.clone(),
      targetOffset: offset,
    });
  }

  public update(time: number, explodedAmount: number) {
    // Subtle flame flicker
    if (this.flameLight) {
      this.flameLight.intensity = 2.2 + Math.sin(time * 12) * 0.6 + Math.cos(time * 23) * 0.4;
    }

    // Exploded view interpolation
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
            child.material.bumpMap = null;
            child.material.color.setHex(0xe8ded1);
            child.material.roughness = 0.95;
            child.material.needsUpdate = true;
          }
        } else if (style === 'blueprint') {
          child.material.wireframe = false;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.map = null;
            child.material.bumpMap = null;
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
