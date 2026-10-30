/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ProceduralTextureGenerator } from '../proceduralTextures';
import { ExplodableComponent } from './indiaGate';

export class QutubMinarModel {
  public group: THREE.Group;
  private explodables: ExplodableComponent[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'QutubMinarModel';

    const { map: redStoneMap, bumpMap: redStoneBump } = ProceduralTextureGenerator.createSandstoneTexture(0x9a3f2d);
    const { map: marbleMap, roughnessMap: marbleRough } = ProceduralTextureGenerator.createMarbleTexture();
    const ironTex = ProceduralTextureGenerator.createIronPillarTexture();
    const contactShadowMap = ProceduralTextureGenerator.createContactShadowTexture();

    const redSandstoneMat = new THREE.MeshStandardMaterial({
      map: redStoneMap,
      bumpMap: redStoneBump,
      bumpScale: 0.05,
      roughness: 0.9,
      metalness: 0.04,
    });

    const marbleMat = new THREE.MeshStandardMaterial({
      map: marbleMap,
      roughnessMap: marbleRough,
      roughness: 0.28,
      metalness: 0.12,
    });

    const ironPillarMat = new THREE.MeshStandardMaterial({
      map: ironTex,
      roughness: 0.5,
      metalness: 0.75,
    });

    const ruinStoneMat = new THREE.MeshStandardMaterial({
      color: 0x826955,
      roughness: 0.95,
      metalness: 0.02,
    });

    // 0. Contact Shadow Disc
    const shadowGeo = new THREE.PlaneGeometry(28, 28);
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

    // 1. Archaeological Courtyard Plinth & Ancient Quwwat-ul-Islam Arches
    const baseGroup = new THREE.Group();
    const plinthMesh = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 0.8, 32), ruinStoneMat);
    plinthMesh.position.y = 0.4;
    plinthMesh.receiveShadow = true;
    baseGroup.add(plinthMesh);

    // Ancient Ruined Arches around the complex
    for (let a = 0; a < 5; a++) {
      const archPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.5, 0.6), ruinStoneMat);
      archPillar1.position.set(-10 + a * 2.2, 2.15, -7);
      archPillar1.castShadow = true;
      baseGroup.add(archPillar1);

      const archLintel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 0.7), ruinStoneMat);
      archLintel.position.set(-9.1 + a * 2.2, 4.15, -7);
      archLintel.castShadow = true;
      baseGroup.add(archLintel);
    }
    this.group.add(baseGroup);
    this.registerExplodable(baseGroup, new THREE.Vector3(0, -2, 0));

    // 2. The 4th-Century Rustless Iron Pillar of Chandragupta II
    const ironPillarGroup = new THREE.Group();
    // Iron pillar shaft (tapers from 42cm to 30cm, 6.7m tall)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.35, 6.2, 16), ironPillarMat);
    shaft.position.set(-6.5, 3.9, 3.5);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    ironPillarGroup.add(shaft);

    // Capital bell & fluted disc top
    const capitalBell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.24, 0.6, 16), ironPillarMat);
    capitalBell.position.set(-6.5, 7.3, 3.5);
    capitalBell.castShadow = true;
    ironPillarGroup.add(capitalBell);

    const capitalDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.25, 16), ironPillarMat);
    capitalDisc.position.set(-6.5, 7.7, 3.5);
    ironPillarGroup.add(capitalDisc);

    // Protective stone fence surround
    const fenceGeo = new THREE.TorusGeometry(1.6, 0.08, 8, 24);
    const fenceMesh = new THREE.Mesh(fenceGeo, ruinStoneMat);
    fenceMesh.rotation.x = Math.PI / 2;
    fenceMesh.position.set(-6.5, 1.2, 3.5);
    ironPillarGroup.add(fenceMesh);

    this.group.add(ironPillarGroup);
    this.registerExplodable(ironPillarGroup, new THREE.Vector3(-6, 0, 3));

    // 3. Storey 1: Alternating Angular & Rounded Flutes (Height ~10 units)
    const s1Group = new THREE.Group();
    const s1Height = 9.5;
    const s1BottomR = 4.2;
    const s1TopR = 3.6;

    // Core cone
    const s1Core = new THREE.Mesh(new THREE.CylinderGeometry(s1TopR, s1BottomR, s1Height, 32), redSandstoneMat);
    s1Core.position.y = 0.8 + s1Height / 2;
    s1Core.castShadow = true;
    s1Core.receiveShadow = true;
    s1Group.add(s1Core);

    // Alternating 24 vertical flutes (angular vs semicircular)
    const fluteCount = 24;
    for (let i = 0; i < fluteCount; i++) {
      const angle = (i / fluteCount) * Math.PI * 2;
      const rMid = (s1BottomR + s1TopR) / 2;
      const fx = Math.cos(angle) * (rMid + 0.1);
      const fz = Math.sin(angle) * (rMid + 0.1);

      const fluteGeo = i % 2 === 0
        ? new THREE.CylinderGeometry(0.25, 0.32, s1Height, 8, 1, false, 0, Math.PI) // rounded
        : new THREE.BoxGeometry(0.4, s1Height, 0.4); // angular / triangular

      const fluteMesh = new THREE.Mesh(fluteGeo, redSandstoneMat);
      fluteMesh.position.set(fx, 0.8 + s1Height / 2, fz);
      fluteMesh.rotation.y = -angle;
      s1Group.add(fluteMesh);
    }

    // Calligraphic inscription rings around Storey 1
    for (const ringY of [3.2, 5.8, 8.4]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.95 - (ringY / s1Height) * 0.5, 0.12, 8, 32), redSandstoneMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = ringY;
      s1Group.add(ring);
    }
    this.group.add(s1Group);
    this.registerExplodable(s1Group, new THREE.Vector3(0, 0, 0));

    // Balcony 1 (Projecting gallery with stalactite corbels)
    const bal1Group = new THREE.Group();
    const bal1Mesh = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 3.4, 0.9, 32), redSandstoneMat);
    bal1Mesh.position.y = 10.75;
    bal1Mesh.castShadow = true;
    bal1Group.add(bal1Mesh);

    // Corbel brackets underneath
    for (let c = 0; c < 24; c++) {
      const ca = (c / 24) * Math.PI * 2;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.5), redSandstoneMat);
      bracket.position.set(Math.cos(ca) * 3.7, 10.2, Math.sin(ca) * 3.7);
      bracket.rotation.y = -ca;
      bal1Group.add(bracket);
    }
    this.group.add(bal1Group);
    this.registerExplodable(bal1Group, new THREE.Vector3(0, 2.5, 0));

    // 4. Storey 2: Exclusively Rounded Flutes (Height ~7 units)
    const s2Group = new THREE.Group();
    const s2Height = 7.0;
    const s2BottomR = 3.3;
    const s2TopR = 2.8;

    const s2Core = new THREE.Mesh(new THREE.CylinderGeometry(s2TopR, s2BottomR, s2Height, 32), redSandstoneMat);
    s2Core.position.y = 11.2 + s2Height / 2;
    s2Core.castShadow = true;
    s2Core.receiveShadow = true;
    s2Group.add(s2Core);

    // All rounded flutes
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const rMid = (s2BottomR + s2TopR) / 2;
      const fx = Math.cos(angle) * (rMid + 0.08);
      const fz = Math.sin(angle) * (rMid + 0.08);
      const fluteMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, s2Height, 8), redSandstoneMat);
      fluteMesh.position.set(fx, 11.2 + s2Height / 2, fz);
      s2Group.add(fluteMesh);
    }
    this.group.add(s2Group);
    this.registerExplodable(s2Group, new THREE.Vector3(0, 5, 0));

    // Balcony 2
    const bal2Group = new THREE.Group();
    const bal2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 2.7, 0.8, 32), redSandstoneMat);
    bal2Mesh.position.y = 18.6;
    bal2Mesh.castShadow = true;
    bal2Group.add(bal2Mesh);
    this.group.add(bal2Group);
    this.registerExplodable(bal2Group, new THREE.Vector3(0, 7.5, 0));

    // 5. Storey 3: Exclusively Angular Flutes (Height ~6 units)
    const s3Group = new THREE.Group();
    const s3Height = 6.0;
    const s3BottomR = 2.6;
    const s3TopR = 2.2;

    const s3Core = new THREE.Mesh(new THREE.CylinderGeometry(s3TopR, s3BottomR, s3Height, 32), redSandstoneMat);
    s3Core.position.y = 19.0 + s3Height / 2;
    s3Core.castShadow = true;
    s3Group.add(s3Core);

    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const rMid = (s3BottomR + s3TopR) / 2;
      const fx = Math.cos(angle) * (rMid + 0.06);
      const fz = Math.sin(angle) * (rMid + 0.06);
      const fluteMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, s3Height, 0.3), redSandstoneMat);
      fluteMesh.position.set(fx, 19.0 + s3Height / 2, fz);
      fluteMesh.rotation.y = -angle + Math.PI / 4;
      s3Group.add(fluteMesh);
    }
    this.group.add(s3Group);
    this.registerExplodable(s3Group, new THREE.Vector3(0, 10, 0));

    // Balcony 3
    const bal3Group = new THREE.Group();
    const bal3Mesh = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.1, 0.7, 32), redSandstoneMat);
    bal3Mesh.position.y = 25.35;
    bal3Group.add(bal3Mesh);
    this.group.add(bal3Group);
    this.registerExplodable(bal3Group, new THREE.Vector3(0, 12.5, 0));

    // 6. Storeys 4 & 5: White Makrana Marble & Sandstone Apex (Height ~7 units)
    const upperGroup = new THREE.Group();
    // Storey 4 - White Marble
    const s4Marble = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.1, 3.4, 32), marbleMat);
    s4Marble.position.y = 27.4;
    s4Marble.castShadow = true;
    upperGroup.add(s4Marble);

    // Marble balcony
    const s4Balcony = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 1.8, 0.5, 32), marbleMat);
    s4Balcony.position.y = 29.35;
    upperGroup.add(s4Balcony);

    // Storey 5 - Marble & Sandstone banded pinnacle
    const s5Core = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.7, 3.2, 32), marbleMat);
    s5Core.position.y = 31.2;
    s5Core.castShadow = true;
    upperGroup.add(s5Core);

    // Red sandstone bands
    const s5Band = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 0.4, 32), redSandstoneMat);
    s5Band.position.y = 31.2;
    upperGroup.add(s5Band);

    // Summit lantern cupola base & finial
    const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 1.2, 24), marbleMat);
    cupola.position.y = 33.4;
    upperGroup.add(cupola);

    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 16), redSandstoneMat);
    finial.position.y = 34.7;
    upperGroup.add(finial);

    this.group.add(upperGroup);
    this.registerExplodable(upperGroup, new THREE.Vector3(0, 15, 0));
  }

  private registerExplodable(mesh: THREE.Object3D, offset: THREE.Vector3) {
    this.explodables.push({
      mesh,
      origPos: mesh.position.clone(),
      targetOffset: offset,
    });
  }

  public update(_time: number, explodedAmount: number) {
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
