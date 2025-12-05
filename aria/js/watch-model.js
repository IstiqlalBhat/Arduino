import * as THREE from 'three';

export class CyberWatch {
    constructor() {
        this.mesh = new THREE.Group();
        this.interactiveElements = {};
        this.clickableMeshes = [];
        this.init();
    }

    init() {
        // === MATERIALS ===
        this.materials = {
            titanium: new THREE.MeshStandardMaterial({
                color: 0x3a3a42,
                roughness: 0.4,
                metalness: 0.9
            }),
            darkMetal: new THREE.MeshStandardMaterial({
                color: 0x1a1a1f,
                roughness: 0.5,
                metalness: 0.8
            }),
            brushedSteel: new THREE.MeshStandardMaterial({
                color: 0x4a4a52,
                roughness: 0.3,
                metalness: 0.95
            }),
            neonCyan: new THREE.MeshStandardMaterial({
                color: 0x00f0ff,
                emissive: 0x00f0ff,
                emissiveIntensity: 1.5,
                roughness: 0.2
            }),
            neonMagenta: new THREE.MeshStandardMaterial({
                color: 0xff00ff,
                emissive: 0xff00ff,
                emissiveIntensity: 1.2,
                roughness: 0.2
            }),
            redButton: new THREE.MeshStandardMaterial({
                color: 0xdd1133,
                emissive: 0xaa0022,
                emissiveIntensity: 0.8,
                roughness: 0.2,
                metalness: 0.3
            }),
            redButtonActive: new THREE.MeshStandardMaterial({
                color: 0xff2244,
                emissive: 0xff0033,
                emissiveIntensity: 2.0,
                roughness: 0.1
            }),
            orangeButton: new THREE.MeshStandardMaterial({
                color: 0xdd7700,
                emissive: 0xaa5500,
                emissiveIntensity: 0.7,
                roughness: 0.2,
                metalness: 0.3
            }),
            orangeButtonActive: new THREE.MeshStandardMaterial({
                color: 0xff9922,
                emissive: 0xff7700,
                emissiveIntensity: 2.0,
                roughness: 0.1
            }),
            leather: new THREE.MeshStandardMaterial({
                color: 0x1f1815,
                roughness: 0.9,
                metalness: 0.0
            }),
            wireYellow: new THREE.MeshStandardMaterial({
                color: 0xccaa00,
                emissive: 0x443300,
                emissiveIntensity: 0.4,
                roughness: 0.5
            }),
            wireRed: new THREE.MeshStandardMaterial({
                color: 0xaa2200,
                emissive: 0x330000,
                emissiveIntensity: 0.3,
                roughness: 0.5
            }),
            wireCyan: new THREE.MeshStandardMaterial({
                color: 0x00aaaa,
                emissive: 0x004444,
                emissiveIntensity: 0.4,
                roughness: 0.5
            }),
            circuit: new THREE.MeshStandardMaterial({
                color: 0x0a1510,
                emissive: 0x002210,
                emissiveIntensity: 0.3,
                roughness: 0.6
            })
        };

        this.buildCase();
        this.buildScreen();
        this.buildButtons();
        this.buildCrown();
        this.buildWires();
        this.buildNeonAccents();
        this.buildStrap();
    }

    buildCase() {
        // Main watch body
        const caseGeo = new THREE.BoxGeometry(4.2, 4.6, 0.9);
        const caseMesh = new THREE.Mesh(caseGeo, this.materials.titanium);
        caseMesh.castShadow = true;
        this.mesh.add(caseMesh);

        // Corner reinforcements
        const cornerGeo = new THREE.BoxGeometry(0.5, 0.7, 1.0);
        const corners = [
            [-1.9, 2.1, 0], [1.9, 2.1, 0],
            [-1.9, -2.1, 0], [1.9, -2.1, 0]
        ];
        corners.forEach(pos => {
            const corner = new THREE.Mesh(cornerGeo, this.materials.darkMetal);
            corner.position.set(...pos);
            this.mesh.add(corner);
        });

        // Side rails
        const sideRailGeo = new THREE.BoxGeometry(0.12, 3.8, 0.7);
        const leftRail = new THREE.Mesh(sideRailGeo, this.materials.brushedSteel);
        leftRail.position.set(-2.15, 0, 0);
        this.mesh.add(leftRail);

        // Right side rail (shorter, buttons go here)
        const rightRailGeo = new THREE.BoxGeometry(0.12, 1.2, 0.7);
        const rightRail1 = new THREE.Mesh(rightRailGeo, this.materials.brushedSteel);
        rightRail1.position.set(2.15, 1.8, 0);
        this.mesh.add(rightRail1);
        
        const rightRail2 = new THREE.Mesh(rightRailGeo, this.materials.brushedSteel);
        rightRail2.position.set(2.15, -1.8, 0);
        this.mesh.add(rightRail2);
    }

    buildScreen() {
        // Bezel
        const bezelGeo = new THREE.BoxGeometry(3.8, 3.8, 0.2);
        const bezel = new THREE.Mesh(bezelGeo, this.materials.darkMetal);
        bezel.position.z = 0.4;
        this.mesh.add(bezel);

        // Screen background
        const screenGeo = new THREE.PlaneGeometry(3.4, 3.4);
        const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ color: 0x000808 }));
        screen.position.z = 0.51;
        this.mesh.add(screen);

        // Screen glow ring
        const ringGeo = new THREE.RingGeometry(1.75, 1.82, 48);
        const ring = new THREE.Mesh(ringGeo, this.materials.neonCyan);
        ring.position.z = 0.52;
        this.mesh.add(ring);

        // Corner brackets
        const bracketGeo = new THREE.BoxGeometry(0.25, 0.25, 0.1);
        [[-1.7, 1.7], [1.7, 1.7], [-1.7, -1.7], [1.7, -1.7]].forEach(([x, y]) => {
            const bracket = new THREE.Mesh(bracketGeo, this.materials.neonCyan);
            bracket.position.set(x, y, 0.53);
            this.mesh.add(bracket);
        });
    }

    buildButtons() {
        // ==========================================
        // SEND BUTTON - Red, on right side of watch
        // ==========================================
        const sendGroup = new THREE.Group();

        // Button housing (attached to watch body)
        const sendHousingGeo = new THREE.BoxGeometry(0.7, 1.6, 0.65);
        const sendHousing = new THREE.Mesh(sendHousingGeo, this.materials.darkMetal);
        sendGroup.add(sendHousing);

        // Button face (clickable, sticks out slightly)
        const sendBtnGeo = new THREE.BoxGeometry(0.5, 1.3, 0.55);
        const sendBtn = new THREE.Mesh(sendBtnGeo, this.materials.redButton);
        sendBtn.position.set(0.12, 0, 0.08);
        sendBtn.name = 'sendButton';
        sendBtn.userData = { isButton: true, buttonType: 'send' };
        sendGroup.add(sendBtn);
        this.clickableMeshes.push(sendBtn);

        // Glow accent strips
        const stripGeo = new THREE.BoxGeometry(0.4, 0.05, 0.08);
        [-0.45, 0, 0.45].forEach(y => {
            const strip = new THREE.Mesh(stripGeo, this.materials.neonCyan);
            strip.position.set(0.12, y, 0.38);
            sendGroup.add(strip);
        });

        // Position on RIGHT side, adjacent to watch body
        sendGroup.position.set(2.5, 0.6, 0);
        this.mesh.add(sendGroup);
        this.interactiveElements.sendButton = sendGroup;

        // ==========================================
        // DISCONNECT BUTTON - Orange, below SEND
        // ==========================================
        const discGroup = new THREE.Group();

        const discHousingGeo = new THREE.BoxGeometry(0.6, 1.1, 0.55);
        const discHousing = new THREE.Mesh(discHousingGeo, this.materials.darkMetal);
        discGroup.add(discHousing);

        const discBtnGeo = new THREE.BoxGeometry(0.45, 0.85, 0.45);
        const discBtn = new THREE.Mesh(discBtnGeo, this.materials.orangeButton);
        discBtn.position.set(0.1, 0, 0.08);
        discBtn.name = 'disconnectButton';
        discBtn.userData = { isButton: true, buttonType: 'disconnect' };
        discGroup.add(discBtn);
        this.clickableMeshes.push(discBtn);

        // Accent lines
        const lineGeo = new THREE.BoxGeometry(0.35, 0.04, 0.06);
        [-0.28, 0, 0.28].forEach(y => {
            const line = new THREE.Mesh(lineGeo, this.materials.neonMagenta);
            line.position.set(0.1, y, 0.32);
            discGroup.add(line);
        });

        discGroup.position.set(2.45, -1.2, 0);
        this.mesh.add(discGroup);
        this.interactiveElements.disconnectButton = discGroup;
    }

    buildCrown() {
        const crownGroup = new THREE.Group();

        // Base
        const baseGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.15, 20);
        const base = new THREE.Mesh(baseGeo, this.materials.darkMetal);
        base.rotation.z = Math.PI / 2;
        crownGroup.add(base);

        // Knob
        const knobGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.5, 16);
        const knob = new THREE.Mesh(knobGeo, this.materials.brushedSteel);
        knob.rotation.z = Math.PI / 2;
        knob.position.x = 0.28;
        crownGroup.add(knob);

        // Ridges
        for (let i = 0; i < 12; i++) {
            const ridgeGeo = new THREE.BoxGeometry(0.45, 0.015, 0.025);
            const ridge = new THREE.Mesh(ridgeGeo, this.materials.titanium);
            const angle = (i / 12) * Math.PI * 2;
            ridge.position.set(0.28, Math.sin(angle) * 0.29, Math.cos(angle) * 0.29);
            ridge.rotation.x = angle;
            crownGroup.add(ridge);
        }

        // Indicator
        const indicatorGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const indicator = new THREE.Mesh(indicatorGeo, this.materials.neonCyan);
        indicator.position.set(0.55, 0, 0);
        crownGroup.add(indicator);

        crownGroup.position.set(2.4, 2.0, 0);
        this.mesh.add(crownGroup);
    }

    buildWires() {
        const createWire = (points, material) => {
            const curve = new THREE.CatmullRomCurve3(points);
            const geo = new THREE.TubeGeometry(curve, 16, 0.035, 6, false);
            const wire = new THREE.Mesh(geo, material);
            this.mesh.add(wire);
        };

        createWire([
            new THREE.Vector3(-2.1, -1.6, 0.15),
            new THREE.Vector3(-2.4, -0.8, 0.3),
            new THREE.Vector3(-2.3, 0.2, 0.25),
            new THREE.Vector3(-2.4, 1.0, 0.3),
            new THREE.Vector3(-2.1, 1.5, 0.15)
        ], this.materials.wireYellow);

        createWire([
            new THREE.Vector3(-2.0, -1.3, 0.2),
            new THREE.Vector3(-2.5, -0.4, 0.25),
            new THREE.Vector3(-2.2, 0.6, 0.3),
            new THREE.Vector3(-2.4, 1.2, 0.2)
        ], this.materials.wireRed);

        createWire([
            new THREE.Vector3(-2.15, -1.8, 0.1),
            new THREE.Vector3(-2.5, -1.0, 0.2),
            new THREE.Vector3(-2.35, 0, 0.25),
            new THREE.Vector3(-2.5, 0.8, 0.2),
            new THREE.Vector3(-2.15, 1.6, 0.1)
        ], this.materials.wireCyan);

        // Circuit board
        const boardGeo = new THREE.BoxGeometry(0.3, 1.6, 0.1);
        const board = new THREE.Mesh(boardGeo, this.materials.circuit);
        board.position.set(-2.25, 0, 0.25);
        this.mesh.add(board);
    }

    buildNeonAccents() {
        // Top strip
        const stripGeo = new THREE.BoxGeometry(2.8, 0.06, 0.06);
        const topStrip = new THREE.Mesh(stripGeo, this.materials.neonCyan);
        topStrip.position.set(0, 2.25, 0.45);
        this.mesh.add(topStrip);

        // Bottom strip
        const bottomStrip = new THREE.Mesh(stripGeo, this.materials.neonMagenta);
        bottomStrip.position.set(0, -2.25, 0.45);
        this.mesh.add(bottomStrip);

        // Side dots
        const dotGeo = new THREE.SphereGeometry(0.05, 6, 6);
        for (let i = 0; i < 4; i++) {
            const dot = new THREE.Mesh(dotGeo, this.materials.neonCyan);
            dot.position.set(-2.1, -1.2 + i * 0.8, 0.45);
            this.mesh.add(dot);
        }

        // Pulse ring
        const pulseGeo = new THREE.RingGeometry(2.0, 2.05, 32);
        this.pulseRing = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        }));
        this.pulseRing.position.z = 0.4;
        this.mesh.add(this.pulseRing);
    }

    buildStrap() {
        const strapWidth = 2.6;
        const thickness = 0.22;

        const createSegment = (y, rot) => {
            const geo = new THREE.BoxGeometry(strapWidth, 0.45, thickness);
            const seg = new THREE.Mesh(geo, this.materials.leather);
            seg.position.set(0, y, -0.25);
            seg.rotation.x = rot;
            this.mesh.add(seg);

            // Stitch
            const stitchGeo = new THREE.BoxGeometry(strapWidth - 0.1, 0.02, 0.02);
            const stitch = new THREE.Mesh(stitchGeo, this.materials.brushedSteel);
            stitch.position.set(0, y, thickness / 2 - 0.24);
            stitch.rotation.x = rot;
            this.mesh.add(stitch);
        };

        // Top strap
        for (let i = 0; i < 6; i++) {
            createSegment(2.8 + i * 0.5, -i * 0.1);
        }

        // Bottom strap
        for (let i = 0; i < 6; i++) {
            createSegment(-2.8 - i * 0.5, i * 0.1);
        }
    }

    // === INTERACTION ===

    pressButton(buttonName) {
        const group = this.interactiveElements[buttonName];
        if (!group) return;

        group.traverse(child => {
            if (child.userData && child.userData.isButton) {
                // Push in
                child.position.x -= 0.08;
                // Brighten
                if (child.userData.buttonType === 'send') {
                    child.material = this.materials.redButtonActive;
                } else {
                    child.material = this.materials.orangeButtonActive;
                }
            }
        });

        setTimeout(() => this.releaseButton(buttonName), 120);
    }

    releaseButton(buttonName) {
        const group = this.interactiveElements[buttonName];
        if (!group) return;

        group.traverse(child => {
            if (child.userData && child.userData.isButton) {
                child.position.x += 0.08;
                if (child.userData.buttonType === 'send') {
                    child.material = this.materials.redButton;
                } else {
                    child.material = this.materials.orangeButton;
                }
            }
        });
    }

    updatePulseRing(time) {
        if (this.pulseRing) {
            const pulse = Math.sin(time * 2) * 0.5 + 0.5;
            this.pulseRing.material.opacity = 0.1 + pulse * 0.15;
            this.pulseRing.scale.setScalar(1 + pulse * 0.03);
        }
    }

    getMesh() {
        return this.mesh;
    }

    getClickableMeshes() {
        return this.clickableMeshes;
    }
}
