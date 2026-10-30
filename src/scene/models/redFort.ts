/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ProceduralTextureGenerator } from '../proceduralTextures';
import { ExplodableComponent } from './indiaGate';

export class RedFortModel {
  public group: THREE.Group;
  private explodables: ExplodableComponent[] = [];
  private flagMesh: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'RedFortModel';

    const { map: redStoneMap, bumpMap: redStoneBump } = ProceduralTextureGenerator.createSandstoneTexture(0xa03828);
    const { map: marbleMap, roughnessMap: marbleRough } = ProceduralTextureGenerator.createMarbleTexture();
    const contactShadowMap = ProceduralTextureGenerator.createContactShadowTexture();

    const redSandstoneMat = new THREE.MeshStandardMaterial({
      map: redStoneMap,
      bumpMap: redStoneBump,
      bumpScale: 0.05,
      roughness: 0.88,
      metalness: 0.04,
    });

    const marbleMat = new THREE.MeshStandardMaterial({
      map: marbleMap,
      roughnessMap: marbleRough,
      roughness: 0.25,
      metalness: 0.1,
    });

    const brassGateMat = new THREE.MeshStandardMaterial({
      color: 0x4a3c28,
      roughness: 0.4,
      metalness: 0.8,
    });

    const flagOrange = new THREE.MeshBasicMaterial({ color: 0xff671f, side: THREE.DoubleSide });
    const flagWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const flagGreen = new THREE.MeshBasicMaterial({ color: 0x046a38, side: THREE.DoubleSide });

    // 0. Contact Shadow Disc
    const shadowGeo = new THREE.PlaneGeometry(36, 22);
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

    // 1. Rampart Base, Moat & Approach Bridge
    const baseGroup = new THREE.Group();
    const moatBase = new THREE.Mesh(new THREE.BoxGeometry(32, 0.8, 16), redSandstoneMat);
    moatBase.position.y = 0.4;
    moatBase.receiveShadow = true;
    baseGroup.add(moatBase);

    // Entrance stone bridge spanning the moat
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 7.5), redSandstoneMat);
    bridge.position.set(0, 0.45, 8.5);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    baseGroup.add(bridge);

    this.group.add(baseGroup);
    this.registerExplodable(baseGroup, new THREE.Vector3(0, -1.5, 0));

    // 2. Twin Octagonal Flanking Bastions (Left & Right)
    const leftBastionGroup = new THREE.Group();
    const rightBastionGroup = new THREE.Group();

    const bastionHeight = 13.5;
    const bastionGeo = new THREE.CylinderGeometry(3.6, 4.2, bastionHeight, 8);

    const leftBastion = new THREE.Mesh(bastionGeo, redSandstoneMat);
    leftBastion.position.set(-10.5, 0.8 + bastionHeight / 2, 0);
    leftBastion.castShadow = true;
    leftBastion.receiveShadow = true;
    leftBastionGroup.add(leftBastion);

    const rightBastion = new THREE.Mesh(bastionGeo, redSandstoneMat);
    rightBastion.position.set(10.5, 0.8 + bastionHeight / 2, 0);
    rightBastion.castShadow = true;
    rightBastion.receiveShadow = true;
    rightBastionGroup.add(rightBastion);

    // Bastion Kanguras (battlements)
    for (let b = 0; b < 8; b++) {
      const bAngle = (b / 8) * Math.PI * 2;
      const kGeo = new THREE.BoxGeometry(0.7, 1.1, 0.5);

      const kL = new THREE.Mesh(kGeo, redSandstoneMat);
      kL.position.set(-10.5 + Math.cos(bAngle) * 3.4, 0.8 + bastionHeight + 0.55, Math.sin(bAngle) * 3.4);
      leftBastionGroup.add(kL);

      const kR = new THREE.Mesh(kGeo, redSandstoneMat);
      kR.position.set(10.5 + Math.cos(bAngle) * 3.4, 0.8 + bastionHeight + 0.55, Math.sin(bAngle) * 3.4);
      rightBastionGroup.add(kR);
    }

    // Octagonal Turret Chhatris atop the bastions
    const buildTurretChhatri = (parentGroup: THREE.Group, x: number) => {
      const chhatriBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.4, 8), redSandstoneMat);
      chhatriBase.position.set(x, 15.0, 0);
      parentGroup.add(chhatriBase);

      for (let p = 0; p < 8; p++) {
        const pa = (p / 8) * Math.PI * 2;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.0, 8), marbleMat);
        pillar.position.set(x + Math.cos(pa) * 1.3, 16.2, Math.sin(pa) * 1.3);
        parentGroup.add(pillar);
      }

      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), marbleMat);
      dome.position.set(x, 17.2, 0);
      parentGroup.add(dome);

      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 8), marbleMat);
      finial.position.set(x, 18.4, 0);
      parentGroup.add(finial);
    };

    buildTurretChhatri(leftBastionGroup, -10.5);
    buildTurretChhatri(rightBastionGroup, 10.5);

    this.group.add(leftBastionGroup);
    this.group.add(rightBastionGroup);
    this.registerExplodable(leftBastionGroup, new THREE.Vector3(-5, 0, 0));
    this.registerExplodable(rightBastionGroup, new THREE.Vector3(5, 0, 0));

    // 3. Central Lahori Gate Curtain Wall & Grand Arch Portal
    const centerWallGroup = new THREE.Group();

    // Main Curtain Wall
    const mainWall = new THREE.Mesh(new THREE.BoxGeometry(14, 12.5, 7), redSandstoneMat);
    mainWall.position.set(0, 7.05, 0);
    mainWall.castShadow = true;
    mainWall.receiveShadow = true;
    centerWallGroup.add(mainWall);

    // Arched portal opening shape
    const archHole = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5.5, 24, 1, false, 0, Math.PI), redSandstoneMat);
    archHole.rotation.z = Math.PI / 2;
    archHole.position.set(0, 5.5, 3.5);
    centerWallGroup.add(archHole);

    // Imposing Brass-studded Wooden Double Doors
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.8, 0.3), brassGateMat);
    doorL.position.set(-0.85, 3.2, 2.2);
    centerWallGroup.add(doorL);

    const doorR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.8, 0.3), brassGateMat);
    doorR.position.set(0.85, 3.2, 2.2);
    centerWallGroup.add(doorR);

    // Decorative cusped arch trim
    const archTrim = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.25, 8, 24, Math.PI), redSandstoneMat);
    archTrim.position.set(0, 5.6, 3.6);
    centerWallGroup.add(archTrim);

    this.group.add(centerWallGroup);
    this.registerExplodable(centerWallGroup, new THREE.Vector3(0, 2, 0));

    // 4. Upper Wall Gallery & Miniature Arched Arcade
    const galleryGroup = new THREE.Group();
    const galleryFloor = new THREE.Mesh(new THREE.BoxGeometry(15, 0.6, 7.6), redSandstoneMat);
    galleryFloor.position.set(0, 13.5, 0);
    galleryGroup.add(galleryFloor);

    // Miniature 7-arch arcade screen
    for (let g = 0; g < 7; g++) {
      const gx = -5.4 + g * 1.8;
      const arcCol = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8), redSandstoneMat);
      arcCol.position.set(gx, 14.7, 3.6);
      galleryGroup.add(arcCol);
    }
    const galleryLintel = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.4, 0.6), redSandstoneMat);
    galleryLintel.position.set(0, 15.8, 3.6);
    galleryGroup.add(galleryLintel);

    this.group.add(galleryGroup);
    this.registerExplodable(galleryGroup, new THREE.Vector3(0, 4.5, 0));

    // 5. Crowning White Marble Chhatris & Flagpole (Accent Detail)
    const crownGroup = new THREE.Group();

    // Build the 3 central white marble chhatris
    for (let c = -1; c <= 1; c++) {
      const cx = c * 3.8;
      const chhatriBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 2.4), marbleMat);
      chhatriBase.position.set(cx, 16.2, 0);
      crownGroup.add(chhatriBase);

      // 4 slender corner columns
      for (const [px, pz] of [[-0.9, -0.9], [-0.9, 0.9], [0.9, -0.9], [0.9, 0.9]]) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.1, 8), marbleMat);
        col.position.set(cx + px, 17.35, pz);
        crownGroup.add(col);
      }

      // Onion dome
      const domeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
        marbleMat
      );
      domeMesh.position.set(cx, 18.4, 0);
      crownGroup.add(domeMesh);

      // Golden spire / finial
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 8), marbleMat);
      finial.position.set(cx, 19.45, 0);
      crownGroup.add(finial);
    }

    // Flag Mast & Indian Tricolour (Tiranga)
    const flagpole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 7.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 })
    );
    flagpole.position.set(0, 19.8, 0);
    crownGroup.add(flagpole);

    // Tricolour 3-part banner
    const flagGroup = new THREE.Group();
    const stripeGeo = new THREE.PlaneGeometry(2.6, 0.45);
    const topStripe = new THREE.Mesh(stripeGeo, flagOrange);
    topStripe.position.set(1.3, 22.8, 0);
    flagGroup.add(topStripe);

    const midStripe = new THREE.Mesh(stripeGeo, flagWhite);
    midStripe.position.set(1.3, 22.35, 0);
    flagGroup.add(midStripe);

    const botStripe = new THREE.Mesh(stripeGeo, flagGreen);
    botStripe.position.set(1.3, 21.9, 0);
    flagGroup.add(botStripe);

    // Ashoka Chakra center circle
    const chakraGeo = new THREE.RingGeometry(0.04, 0.16, 16);
    const chakraMat = new THREE.MeshBasicMaterial({ color: 0x000080, side: THREE.DoubleSide });
    const chakra = new THREE.Mesh(chakraGeo, chakraMat);
    chakra.position.set(1.3, 22.35, 0.01);
    flagGroup.add(chakra);

    crownGroup.add(flagGroup);
    this.flagMesh = flagGroup as unknown as THREE.Mesh;

    this.group.add(crownGroup);
    this.registerExplodable(crownGroup, new THREE.Vector3(0, 7.5, 0));
  }

  private registerExplodable(mesh: THREE.Object3D, offset: THREE.Vector3) {
    this.explodables.push({
      mesh,
      origPos: mesh.position.clone(),
      targetOffset: offset,
    });
  }

  public update(time: number, explodedAmount: number) {
    // Subtle flag fluttering wave
    if (this.flagMesh) {
      this.flagMesh.rotation.y = Math.sin(time * 3) * 0.12;
      this.flagMesh.position.z = Math.cos(time * 4) * 0.08;
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
            child.material.bumpMap = null;
            child.material.roughnessMap = null;
            child.material.color.setHex(0xe8ded1);
            child.material.roughness = 0.95;
            child.material.needsUpdate = true;
          }
        } else if (style === 'blueprint') {
          child.material.wireframe = false;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.map = null;
            child.material.bumpMap = null;
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
