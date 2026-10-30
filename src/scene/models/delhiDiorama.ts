/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ProceduralTextureGenerator } from '../proceduralTextures';
import { IndiaGateModel } from './indiaGate';
import { QutubMinarModel } from './qutubMinar';
import { LotusTempleModel } from './lotusTemple';
import { RedFortModel } from './redFort';

export class DelhiDioramaModel {
  public group: THREE.Group;
  private metroTrain: THREE.Group;
  private autos: { group: THREE.Group; speed: number; laneZ: number; dir: number }[] = [];
  private waterMesh: THREE.Mesh;
  private indiaGate: IndiaGateModel;
  private qutubMinar: QutubMinarModel;
  private lotusTemple: LotusTempleModel;
  private redFort: RedFortModel;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'DelhiDioramaModel';

    const paverTex = ProceduralTextureGenerator.createPaverTexture();
    const waterNormal = ProceduralTextureGenerator.createWaterNormalTexture();

    // 1. Terrain Base Ground (Delhi Urban Grid & Floodplains)
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x3b6e3f, // Delhi greenery / parks
      roughness: 0.9,
      metalness: 0.05,
    });

    const groundMesh = new THREE.Mesh(new THREE.BoxGeometry(90, 1.2, 80), terrainMat);
    groundMesh.position.y = -0.6;
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // 2. Kartavya Path Central Ceremonial Boulevard
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x42464d,
      roughness: 0.8,
      metalness: 0.1,
    });
    const mainBoulevard = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 70), roadMat);
    mainBoulevard.position.set(0, 0.05, 0);
    mainBoulevard.receiveShadow = true;
    this.group.add(mainBoulevard);

    // Lateral Cross Avenues
    const crossAvenue = new THREE.Mesh(new THREE.BoxGeometry(70, 0.1, 5), roadMat);
    crossAvenue.position.set(0, 0.05, 14);
    crossAvenue.receiveShadow = true;
    this.group.add(crossAvenue);

    // Central Hexagonal Plaza around India Gate
    const plazaMat = new THREE.MeshStandardMaterial({
      map: paverTex,
      roughness: 0.75,
      metalness: 0.1,
    });
    const plazaGeo = new THREE.CylinderGeometry(14, 14, 0.15, 6);
    const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
    plazaMesh.position.set(0, 0.08, 0);
    plazaMesh.receiveShadow = true;
    this.group.add(plazaMesh);

    // 3. Yamuna River Flowing Along Eastern Edge
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x1976d2,
      roughness: 0.15,
      metalness: 0.8,
      normalMap: waterNormal,
      transparent: true,
      opacity: 0.88,
    });
    // Curved river bed
    const riverGeo = new THREE.PlaneGeometry(16, 76, 24, 24);
    this.waterMesh = new THREE.Mesh(riverGeo, riverMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(34, 0.06, 0);
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);

    // River embankment stones
    const ghatMat = new THREE.MeshStandardMaterial({ color: 0x9e8e7a, roughness: 0.9 });
    const ghatL = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 76), ghatMat);
    ghatL.position.set(25.5, 0.15, 0);
    this.group.add(ghatL);

    // 4. Position Landmark Scale Models
    // (a) India Gate at Center (Scale 0.65)
    this.indiaGate = new IndiaGateModel();
    this.indiaGate.group.scale.setScalar(0.65);
    this.indiaGate.group.position.set(0, 0.1, 0);
    this.group.add(this.indiaGate.group);

    // (b) Qutub Minar in South / South-West (Scale 0.42)
    this.qutubMinar = new QutubMinarModel();
    this.qutubMinar.group.scale.setScalar(0.42);
    this.qutubMinar.group.position.set(-24, 0.1, 22);
    this.group.add(this.qutubMinar.group);

    // (c) Lotus Temple in South-East (Scale 0.42)
    this.lotusTemple = new LotusTempleModel();
    this.lotusTemple.group.scale.setScalar(0.42);
    this.lotusTemple.group.position.set(18, 0.1, 24);
    this.group.add(this.lotusTemple.group);

    // (d) Red Fort in North (Old Delhi / Shahjahanabad) (Scale 0.48)
    this.redFort = new RedFortModel();
    this.redFort.group.scale.setScalar(0.48);
    this.redFort.group.position.set(-6, 0.1, -26);
    this.group.add(this.redFort.group);

    // 5. Delhi Metro Elevated Viaduct & Sleek Train
    const metroGroup = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
    const railTrackMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });

    // Elevated viaduct bridge
    const viaductDeck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 74), concreteMat);
    viaductDeck.position.set(-18, 3.8, 0);
    viaductDeck.castShadow = true;
    metroGroup.add(viaductDeck);

    // Two steel rail tracks
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 74), railTrackMat);
    rail1.position.set(-18.5, 4.05, 0);
    metroGroup.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 74), railTrackMat);
    rail2.position.set(-17.5, 4.05, 0);
    metroGroup.add(rail2);

    // Concrete Support Pillars
    for (let pz = -32; pz <= 32; pz += 8) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 3.8, 12), concreteMat);
      pillar.position.set(-18, 1.9, pz);
      pillar.castShadow = true;
      metroGroup.add(pillar);

      // Pier cap
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.35, 1.0), concreteMat);
      cap.position.set(-18, 3.65, pz);
      metroGroup.add(cap);
    }

    // Modern 3-Coach Delhi Metro Train (Silver body with red stripe)
    this.metroTrain = new THREE.Group();
    const trainBodyMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f5, metalness: 0.65, roughness: 0.25 });
    const trainStripeMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4 });
    const trainGlassMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1 });

    for (let coach = 0; coach < 3; coach++) {
      const coachZ = (coach - 1) * 3.4;
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3.1), trainBodyMat);
      body.position.set(0, 0.65, coachZ);
      body.castShadow = true;
      this.metroTrain.add(body);

      // Red line accent
      const redStripe = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.15, 3.12), trainStripeMat);
      redStripe.position.set(0, 0.4, coachZ);
      this.metroTrain.add(redStripe);

      // Windows
      const windows = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.35, 2.5), trainGlassMat);
      windows.position.set(0, 0.75, coachZ);
      this.metroTrain.add(windows);
    }
    this.metroTrain.position.set(-18, 4.05, 0);
    metroGroup.add(this.metroTrain);

    this.group.add(metroGroup);

    // 6. Classic Delhi Green & Yellow CNG Auto-Rickshaws
    const autoGreenMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.4 });
    const autoYellowMat = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.3 });
    const blackRubberMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    const createAuto = () => {
      const autoGroup = new THREE.Group();
      // Lower green chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 1.4), autoGreenMat);
      chassis.position.y = 0.35;
      autoGroup.add(chassis);

      // Upper yellow canopy
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.1), autoYellowMat);
      roof.position.set(0, 0.75, -0.1);
      autoGroup.add(roof);

      // 3 wheels (1 front, 2 rear)
      const wheelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12);
      const wFront = new THREE.Mesh(wheelGeo, blackRubberMat);
      wFront.rotation.z = Math.PI / 2;
      wFront.position.set(0, 0.14, 0.5);
      autoGroup.add(wFront);

      const wRearL = new THREE.Mesh(wheelGeo, blackRubberMat);
      wRearL.rotation.z = Math.PI / 2;
      wRearL.position.set(-0.4, 0.14, -0.4);
      autoGroup.add(wRearL);

      const wRearR = new THREE.Mesh(wheelGeo, blackRubberMat);
      wRearR.rotation.z = Math.PI / 2;
      wRearR.position.set(0.4, 0.14, -0.4);
      autoGroup.add(wRearR);

      // Headlight
      const light = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), new THREE.MeshBasicMaterial({ color: 0xfff9c4 }));
      light.rotation.x = Math.PI / 2;
      light.position.set(0, 0.4, 0.72);
      autoGroup.add(light);

      return autoGroup;
    };

    // Spawn 4 moving auto-rickshaws along the boulevard and cross avenue
    const autoConfigs = [
      { speed: 5.5, laneZ: 0, dir: 1, pos: new THREE.Vector3(1.8, 0.1, -20) },
      { speed: 4.8, laneZ: 0, dir: -1, pos: new THREE.Vector3(-1.8, 0.1, 18) },
      { speed: 6.0, laneZ: 14, dir: 1, pos: new THREE.Vector3(-25, 0.1, 15.5) },
      { speed: 5.2, laneZ: 14, dir: -1, pos: new THREE.Vector3(20, 0.1, 12.5) },
    ];

    for (const cfg of autoConfigs) {
      const a = createAuto();
      a.position.copy(cfg.pos);
      if (cfg.laneZ === 14) {
        a.rotation.y = cfg.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        a.rotation.y = cfg.dir === 1 ? 0 : Math.PI;
      }
      this.group.add(a);
      this.autos.push({ group: a, speed: cfg.speed, laneZ: cfg.laneZ, dir: cfg.dir });
    }

    // 7. Delhi Foliage: Instanced Trees (Neem & Gulmohar Avenues)
    this.createInstancedTrees();
  }

  private createInstancedTrees() {
    const treeCount = 60;
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.0, 6);
    const foliageGeo = new THREE.DodecahedronGeometry(1.2, 1);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.95 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e6b34, roughness: 0.85 });

    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
    trunkInst.castShadow = true;
    foliageInst.castShadow = true;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const greenTints = [0x2e6b34, 0x3d7e44, 0x478c4d, 0x25592a];

    let idx = 0;
    // Boulevard flanking avenues
    for (let z = -32; z <= 32; z += 4) {
      if (Math.abs(z) < 10) continue; // clear around central plaza

      for (const x of [-4.2, 4.2]) {
        if (idx >= treeCount) break;
        const scale = 0.8 + Math.random() * 0.4;
        dummy.position.set(x + (Math.random() - 0.5) * 0.4, 1.0 * scale, z);
        dummy.scale.set(scale, scale, scale);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        trunkInst.setMatrixAt(idx, dummy.matrix);

        dummy.position.y = 2.4 * scale;
        dummy.updateMatrix();
        foliageInst.setMatrixAt(idx, dummy.matrix);

        color.setHex(greenTints[idx % greenTints.length]);
        foliageInst.setColorAt(idx, color);
        idx++;
      }
    }

    // Scattered park trees
    while (idx < treeCount) {
      const rx = (Math.random() - 0.5) * 60;
      const rz = (Math.random() - 0.5) * 60;
      if (Math.abs(rx) < 8 || Math.abs(rz - 14) < 6 || rx > 24) continue; // don't place on roads or river

      const scale = 0.9 + Math.random() * 0.5;
      dummy.position.set(rx, 1.0 * scale, rz);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(idx, dummy.matrix);

      dummy.position.y = 2.4 * scale;
      dummy.updateMatrix();
      foliageInst.setMatrixAt(idx, dummy.matrix);
      color.setHex(greenTints[idx % greenTints.length]);
      foliageInst.setColorAt(idx, color);
      idx++;
    }

    trunkInst.instanceMatrix.needsUpdate = true;
    foliageInst.instanceMatrix.needsUpdate = true;
    if (foliageInst.instanceColor) foliageInst.instanceColor.needsUpdate = true;

    trunkInst.computeBoundingSphere();
    foliageInst.computeBoundingSphere();

    this.group.add(trunkInst);
    this.group.add(foliageInst);
  }

  public update(time: number, _exploded: number) {
    // 1. Delhi Metro Train continuous loop along the viaduct
    if (this.metroTrain) {
      const metroZ = ((time * 8) % 72) - 36;
      this.metroTrain.position.z = metroZ;
    }

    // 2. Auto-rickshaw traffic movement
    for (const auto of this.autos) {
      if (auto.laneZ === 14) {
        // moving along X axis
        auto.group.position.x += auto.speed * 0.016 * auto.dir;
        if (auto.group.position.x > 32) auto.group.position.x = -32;
        if (auto.group.position.x < -32) auto.group.position.x = 32;
      } else {
        // moving along Z axis
        auto.group.position.z += auto.speed * 0.016 * auto.dir;
        if (auto.group.position.z > 32) auto.group.position.z = -32;
        if (auto.group.position.z < -32) auto.group.position.z = 32;
      }
    }

    // 3. Yamuna river surface ripples
    if (this.waterMesh && (this.waterMesh.material as THREE.MeshStandardMaterial).normalMap) {
      (this.waterMesh.material as THREE.MeshStandardMaterial).normalMap!.offset.x = (time * 0.03) % 1;
      (this.waterMesh.material as THREE.MeshStandardMaterial).normalMap!.offset.y = (time * 0.06) % 1;
    }

    // Sub-models update
    this.indiaGate.update(time, 0);
    this.qutubMinar.update(time, 0);
    this.lotusTemple.update(time, 0);
    this.redFort.update(time, 0);
  }

  public setRenderStyle(style: string) {
    this.indiaGate.setRenderStyle(style);
    this.qutubMinar.setRenderStyle(style);
    this.lotusTemple.setRenderStyle(style);
    this.redFort.setRenderStyle(style);
  }
}
