import * as THREE from 'three';

export class CyberWatch {
    constructor() {
        this.mesh = new THREE.Group();
        this.interactiveElements = {};
        this.buttonStates = {
            send: { pressed: false, hover: false },
            disconnect: { pressed: false, hover: false },
            crown: { pressed: false, hover: false }
        };
        this.glowIntensity = 1.0;
        this.init();
    }

    init() {
        // === MATERIAL LIBRARY ===
        
        // Worn/scratched titanium
        this.materials = {
            titanium: new THREE.MeshStandardMaterial({
                color: 0x2a2a2f,
                roughness: 0.35,
                metalness: 0.95,
                envMapIntensity: 1.2
            }),

            darkMetal: new THREE.MeshStandardMaterial({
                color: 0x0f0f12,
                roughness: 0.6,
                metalness: 0.85
            }),

            brushedSteel: new THREE.MeshStandardMaterial({
                color: 0x3a3a40,
                roughness: 0.25,
                metalness: 0.98
            }),

            // Glowing neon edge material
            neonEdgeCyan: new THREE.MeshStandardMaterial({
                color: 0x00f0ff,
                emissive: 0x00f0ff,
                emissiveIntensity: 2.0,
                roughness: 0.1,
                metalness: 0.0
            }),

            neonEdgeMagenta: new THREE.MeshStandardMaterial({
                color: 0xff00ff,
                emissive: 0xff00ff,
                emissiveIntensity: 1.5,
                roughness: 0.1,
                metalness: 0.0
            }),

            // Red SEND button
            redButton: new THREE.MeshStandardMaterial({
                color: 0xcc0022,
                emissive: 0x660011,
                emissiveIntensity: 0.8,
                roughness: 0.15,
                metalness: 0.3
            }),

            redButtonPressed: new THREE.MeshStandardMaterial({
                color: 0xff0033,
                emissive: 0xff0033,
                emissiveIntensity: 2.0,
                roughness: 0.1,
                metalness: 0.2
            }),

            // Orange DISCONNECT button
            orangeButton: new THREE.MeshStandardMaterial({
                color: 0xcc6600,
                emissive: 0x663300,
                emissiveIntensity: 0.6,
                roughness: 0.15,
                metalness: 0.3
            }),

            orangeButtonPressed: new THREE.MeshStandardMaterial({
                color: 0xff8800,
                emissive: 0xff8800,
                emissiveIntensity: 2.0,
                roughness: 0.1,
                metalness: 0.2
            }),

            // Screen glass
            screenGlass: new THREE.MeshPhysicalMaterial({
                color: 0x001515,
                transmission: 0.1,
                roughness: 0.05,
                metalness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                envMapIntensity: 0.5
            }),

            // Leather/fabric strap
            leather: new THREE.MeshStandardMaterial({
                color: 0x1a1412,
                roughness: 0.95,
                metalness: 0.0
            }),

            // Exposed wires
            wireYellow: new THREE.MeshStandardMaterial({
                color: 0xccaa00,
                emissive: 0x332200,
                emissiveIntensity: 0.3,
                roughness: 0.4,
                metalness: 0.2
            }),

            wireRed: new THREE.MeshStandardMaterial({
                color: 0xaa0000,
                emissive: 0x220000,
                emissiveIntensity: 0.2,
                roughness: 0.4,
                metalness: 0.2
            }),

            wireCyan: new THREE.MeshStandardMaterial({
                color: 0x00aaaa,
                emissive: 0x003333,
                emissiveIntensity: 0.3,
                roughness: 0.4,
                metalness: 0.2
            }),

            // Circuitry
            circuit: new THREE.MeshStandardMaterial({
                color: 0x0a1510,
                emissive: 0x001a0a,
                emissiveIntensity: 0.5,
                roughness: 0.7,
                metalness: 0.3
            })
        };

        this.buildMainCase();
        this.buildScreen();
        this.buildButtons();
        this.buildCrown();
        this.buildCircuitry();
        this.buildWires();
        this.buildNeonAccents();
        this.buildStrap();
        this.buildScrews();
    }

    buildMainCase() {
        // Main case body - industrial block design
        const caseShape = new THREE.Shape();
        const w = 2.3, h = 2.6, r = 0.3;
        caseShape.moveTo(-w + r, -h);
        caseShape.lineTo(w - r, -h);
        caseShape.quadraticCurveTo(w, -h, w, -h + r);
        caseShape.lineTo(w, h - r);
        caseShape.quadraticCurveTo(w, h, w - r, h);
        caseShape.lineTo(-w + r, h);
        caseShape.quadraticCurveTo(-w, h, -w, h - r);
        caseShape.lineTo(-w, -h + r);
        caseShape.quadraticCurveTo(-w, -h, -w + r, -h);

        const extrudeSettings = {
            steps: 2,
            depth: 0.7,
            bevelEnabled: true,
            bevelThickness: 0.08,
            bevelSize: 0.08,
            bevelSegments: 3
        };

        const caseGeo = new THREE.ExtrudeGeometry(caseShape, extrudeSettings);
        caseGeo.center();
        const caseMesh = new THREE.Mesh(caseGeo, this.materials.titanium);
        caseMesh.castShadow = true;
        caseMesh.receiveShadow = true;
        this.mesh.add(caseMesh);

        // Corner reinforcement plates
        const reinforcementGeo = new THREE.BoxGeometry(0.6, 0.8, 0.85);
        const corners = [
            [-2.0, 2.2, 0], [2.0, 2.2, 0],
            [-2.0, -2.2, 0], [2.0, -2.2, 0]
        ];

        corners.forEach(pos => {
            const plate = new THREE.Mesh(reinforcementGeo, this.materials.darkMetal);
            plate.position.set(...pos);
            plate.castShadow = true;
            this.mesh.add(plate);
        });

        // Side rails
        const railGeo = new THREE.BoxGeometry(0.15, 4.0, 0.6);
        const leftRail = new THREE.Mesh(railGeo, this.materials.brushedSteel);
        leftRail.position.set(-2.35, 0, 0);
        this.mesh.add(leftRail);

        const rightRail = new THREE.Mesh(railGeo, this.materials.brushedSteel);
        rightRail.position.set(2.7, 0, 0);
        this.mesh.add(rightRail);

        // Top and bottom rails
        const hRailGeo = new THREE.BoxGeometry(3.8, 0.15, 0.6);
        const topRail = new THREE.Mesh(hRailGeo, this.materials.brushedSteel);
        topRail.position.set(0, 2.65, 0);
        this.mesh.add(topRail);

        const bottomRail = new THREE.Mesh(hRailGeo, this.materials.brushedSteel);
        bottomRail.position.set(0, -2.65, 0);
        this.mesh.add(bottomRail);
    }

    buildScreen() {
        // Screen bezel
        const bezelGeo = new THREE.BoxGeometry(4.0, 4.0, 0.15);
        const bezel = new THREE.Mesh(bezelGeo, this.materials.darkMetal);
        bezel.position.z = 0.4;
        this.mesh.add(bezel);

        // Inner bezel glow ring
        const ringGeo = new THREE.RingGeometry(1.85, 1.95, 64);
        const ring = new THREE.Mesh(ringGeo, this.materials.neonEdgeCyan);
        ring.position.z = 0.48;
        this.mesh.add(ring);

        // Screen backing (black)
        const screenBackGeo = new THREE.PlaneGeometry(3.6, 3.6);
        const screenBack = new THREE.Mesh(screenBackGeo, new THREE.MeshBasicMaterial({ 
            color: 0x000505 
        }));
        screenBack.position.z = 0.49;
        this.mesh.add(screenBack);

        // Screen glass overlay
        const glassGeo = new THREE.PlaneGeometry(3.8, 3.8);
        const glass = new THREE.Mesh(glassGeo, this.materials.screenGlass);
        glass.position.z = 0.52;
        this.mesh.add(glass);

        // Corner accents
        const accentGeo = new THREE.BoxGeometry(0.3, 0.3, 0.08);
        const accentPositions = [
            [-1.85, 1.85, 0.5], [1.85, 1.85, 0.5],
            [-1.85, -1.85, 0.5], [1.85, -1.85, 0.5]
        ];

        accentPositions.forEach(pos => {
            const accent = new THREE.Mesh(accentGeo, this.materials.neonEdgeCyan);
            accent.position.set(...pos);
            this.mesh.add(accent);
        });
    }

    buildButtons() {
        // === SEND BUTTON (Large Red) ===
        const sendButtonGroup = new THREE.Group();
        
        // Button housing
        const housingGeo = new THREE.BoxGeometry(0.5, 1.8, 0.6);
        const housing = new THREE.Mesh(housingGeo, this.materials.darkMetal);
        sendButtonGroup.add(housing);

        // Button face
        const buttonGeo = new THREE.BoxGeometry(0.4, 1.5, 0.35);
        const sendButton = new THREE.Mesh(buttonGeo, this.materials.redButton);
        sendButton.position.z = 0.15;
        sendButton.name = 'sendButton';
        sendButtonGroup.add(sendButton);

        // Button glow strip
        const glowStripGeo = new THREE.BoxGeometry(0.35, 0.08, 0.1);
        const glowStrip1 = new THREE.Mesh(glowStripGeo, this.materials.neonEdgeCyan);
        glowStrip1.position.set(0, 0.6, 0.28);
        sendButtonGroup.add(glowStrip1);

        const glowStrip2 = new THREE.Mesh(glowStripGeo, this.materials.neonEdgeCyan);
        glowStrip2.position.set(0, -0.6, 0.28);
        sendButtonGroup.add(glowStrip2);

        sendButtonGroup.position.set(2.6, 0.6, 0);
        this.mesh.add(sendButtonGroup);
        this.interactiveElements.sendButton = sendButtonGroup;

        // === DISCONNECT BUTTON (Orange) ===
        const disconnectGroup = new THREE.Group();

        const discHousingGeo = new THREE.BoxGeometry(0.45, 1.2, 0.5);
        const discHousing = new THREE.Mesh(discHousingGeo, this.materials.darkMetal);
        disconnectGroup.add(discHousing);

        const discButtonGeo = new THREE.BoxGeometry(0.35, 0.9, 0.3);
        const discButton = new THREE.Mesh(discButtonGeo, this.materials.orangeButton);
        discButton.position.z = 0.12;
        discButton.name = 'disconnectButton';
        disconnectGroup.add(discButton);

        // Accent lines
        const accentLineGeo = new THREE.BoxGeometry(0.3, 0.04, 0.08);
        for (let i = 0; i < 3; i++) {
            const line = new THREE.Mesh(accentLineGeo, this.materials.neonEdgeMagenta);
            line.position.set(0, -0.3 + i * 0.3, 0.22);
            disconnectGroup.add(line);
        }

        disconnectGroup.position.set(2.55, -1.4, 0);
        this.mesh.add(disconnectGroup);
        this.interactiveElements.disconnectButton = disconnectGroup;
    }

    buildCrown() {
        // Crown/dial group
        const crownGroup = new THREE.Group();

        // Crown base
        const baseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 24);
        const base = new THREE.Mesh(baseGeo, this.materials.darkMetal);
        base.rotation.z = Math.PI / 2;
        crownGroup.add(base);

        // Crown knob with ridges
        const knobGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.5, 16);
        const knob = new THREE.Mesh(knobGeo, this.materials.brushedSteel);
        knob.rotation.z = Math.PI / 2;
        knob.position.x = 0.25;
        knob.name = 'crown';
        crownGroup.add(knob);

        // Ridge details
        for (let i = 0; i < 12; i++) {
            const ridgeGeo = new THREE.BoxGeometry(0.48, 0.02, 0.04);
            const ridge = new THREE.Mesh(ridgeGeo, this.materials.titanium);
            const angle = (i / 12) * Math.PI * 2;
            ridge.position.set(0.25, Math.sin(angle) * 0.29, Math.cos(angle) * 0.29);
            ridge.rotation.x = angle;
            crownGroup.add(ridge);
        }

        // Crown indicator light
        const indicatorGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const indicator = new THREE.Mesh(indicatorGeo, this.materials.neonEdgeCyan);
        indicator.position.set(0.52, 0, 0);
        crownGroup.add(indicator);

        crownGroup.position.set(2.5, 2.0, 0);
        this.mesh.add(crownGroup);
        this.interactiveElements.crown = crownGroup;
    }

    buildCircuitry() {
        // Exposed circuit board section (left side)
        const boardGeo = new THREE.BoxGeometry(0.4, 2.0, 0.15);
        const board = new THREE.Mesh(boardGeo, this.materials.circuit);
        board.position.set(-2.4, 0, 0.2);
        this.mesh.add(board);

        // Circuit traces
        const traceGeo = new THREE.BoxGeometry(0.02, 0.4, 0.02);
        for (let i = 0; i < 8; i++) {
            const trace = new THREE.Mesh(traceGeo, this.materials.neonEdgeCyan);
            trace.position.set(-2.35, -0.8 + i * 0.25, 0.3);
            this.mesh.add(trace);

            // Horizontal connections
            if (i % 2 === 0) {
                const hTraceGeo = new THREE.BoxGeometry(0.15, 0.02, 0.02);
                const hTrace = new THREE.Mesh(hTraceGeo, this.materials.neonEdgeMagenta);
                hTrace.position.set(-2.45, -0.8 + i * 0.25, 0.3);
                this.mesh.add(hTrace);
            }
        }

        // Microchip
        const chipGeo = new THREE.BoxGeometry(0.2, 0.2, 0.05);
        const chip = new THREE.Mesh(chipGeo, this.materials.darkMetal);
        chip.position.set(-2.4, 0.5, 0.32);
        this.mesh.add(chip);

        // Chip glow
        const chipGlowGeo = new THREE.BoxGeometry(0.12, 0.12, 0.02);
        const chipGlow = new THREE.Mesh(chipGlowGeo, this.materials.neonEdgeCyan);
        chipGlow.position.set(-2.4, 0.5, 0.36);
        this.mesh.add(chipGlow);
    }

    buildWires() {
        // Create exposed wiring on the left side
        const createWire = (points, material) => {
            const curve = new THREE.CatmullRomCurve3(points);
            const wireGeo = new THREE.TubeGeometry(curve, 20, 0.035, 8, false);
            const wire = new THREE.Mesh(wireGeo, material);
            wire.castShadow = true;
            this.mesh.add(wire);
        };

        // Yellow wire
        createWire([
            new THREE.Vector3(-2.2, -1.8, 0.1),
            new THREE.Vector3(-2.5, -1.0, 0.3),
            new THREE.Vector3(-2.4, 0, 0.25),
            new THREE.Vector3(-2.5, 0.8, 0.35),
            new THREE.Vector3(-2.2, 1.6, 0.15)
        ], this.materials.wireYellow);

        // Red wire
        createWire([
            new THREE.Vector3(-2.15, -1.5, 0.15),
            new THREE.Vector3(-2.55, -0.5, 0.2),
            new THREE.Vector3(-2.3, 0.5, 0.3),
            new THREE.Vector3(-2.5, 1.2, 0.25)
        ], this.materials.wireRed);

        // Cyan wire
        createWire([
            new THREE.Vector3(-2.3, -2.0, 0.05),
            new THREE.Vector3(-2.6, -1.2, 0.15),
            new THREE.Vector3(-2.45, -0.2, 0.2),
            new THREE.Vector3(-2.55, 0.6, 0.25),
            new THREE.Vector3(-2.3, 1.4, 0.1)
        ], this.materials.wireCyan);
    }

    buildNeonAccents() {
        // Top neon strip
        const stripGeo = new THREE.BoxGeometry(3.2, 0.06, 0.06);
        const topStrip = new THREE.Mesh(stripGeo, this.materials.neonEdgeCyan);
        topStrip.position.set(0, 2.45, 0.4);
        this.mesh.add(topStrip);

        // Bottom neon strip  
        const bottomStrip = new THREE.Mesh(stripGeo, this.materials.neonEdgeMagenta);
        bottomStrip.position.set(0, -2.45, 0.4);
        this.mesh.add(bottomStrip);

        // Side accent dots
        const dotGeo = new THREE.SphereGeometry(0.05, 8, 8);
        for (let i = 0; i < 5; i++) {
            const dot = new THREE.Mesh(dotGeo, this.materials.neonEdgeCyan);
            dot.position.set(-2.25, -1.5 + i * 0.7, 0.4);
            this.mesh.add(dot);
        }

        // Animated pulse ring (will be animated in scene.js)
        const pulseRingGeo = new THREE.RingGeometry(2.2, 2.25, 32);
        this.pulseRing = new THREE.Mesh(pulseRingGeo, new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        }));
        this.pulseRing.position.z = 0.35;
        this.mesh.add(this.pulseRing);
    }

    buildStrap() {
        const strapWidth = 2.8;
        const strapThickness = 0.25;
        const segmentHeight = 0.5;

        const createStrapSegment = (y, rotX, isTop) => {
            const segGroup = new THREE.Group();

            // Main leather segment
            const segGeo = new THREE.BoxGeometry(strapWidth, segmentHeight, strapThickness);
            const seg = new THREE.Mesh(segGeo, this.materials.leather);
            seg.castShadow = true;
            segGroup.add(seg);

            // Stitching detail (edge lines)
            const stitchGeo = new THREE.BoxGeometry(strapWidth + 0.02, 0.03, 0.02);
            const stitch1 = new THREE.Mesh(stitchGeo, this.materials.titanium);
            stitch1.position.z = strapThickness / 2 + 0.01;
            stitch1.position.y = segmentHeight / 2 - 0.05;
            segGroup.add(stitch1);

            const stitch2 = stitch1.clone();
            stitch2.position.y = -segmentHeight / 2 + 0.05;
            segGroup.add(stitch2);

            // Metal keeper (buckle loops)
            if (Math.abs(y) < 5 && Math.abs(y) > 3.5) {
                const keeperGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 16, Math.PI);
                const keeper = new THREE.Mesh(keeperGeo, this.materials.brushedSteel);
                keeper.rotation.x = Math.PI / 2;
                keeper.rotation.z = Math.PI / 2;
                keeper.position.z = strapThickness / 2 + 0.1;
                segGroup.add(keeper);
            }

            segGroup.position.set(0, y, -0.3);
            segGroup.rotation.x = rotX;

            return segGroup;
        };

        // Top strap segments
        for (let i = 0; i < 8; i++) {
            const y = 3.0 + i * 0.55;
            const rotX = -i * 0.12;
            const seg = createStrapSegment(y, rotX, true);
            seg.position.z = -0.3 - i * 0.15;
            this.mesh.add(seg);
        }

        // Bottom strap segments
        for (let i = 0; i < 8; i++) {
            const y = -3.0 - i * 0.55;
            const rotX = i * 0.12;
            const seg = createStrapSegment(y, rotX, false);
            seg.position.z = -0.3 - i * 0.15;
            this.mesh.add(seg);
        }
    }

    buildScrews() {
        // Hex bolt geometry
        const screwHeadGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 6);
        const screwPositions = [
            [-2.0, 2.2, 0.45], [2.0, 2.2, 0.45],
            [-2.0, -2.2, 0.45], [2.0, -2.2, 0.45],
            [-1.7, 2.5, 0.45], [1.7, 2.5, 0.45],
            [-1.7, -2.5, 0.45], [1.7, -2.5, 0.45]
        ];

        screwPositions.forEach(pos => {
            const screw = new THREE.Mesh(screwHeadGeo, this.materials.titanium);
            screw.rotation.x = Math.PI / 2;
            screw.position.set(...pos);
            this.mesh.add(screw);

            // Screw slot
            const slotGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
            const slot = new THREE.Mesh(slotGeo, this.materials.darkMetal);
            slot.position.set(pos[0], pos[1], pos[2] + 0.04);
            this.mesh.add(slot);
        });
    }

    // === INTERACTION METHODS ===

    pressButton(buttonName) {
        const button = this.interactiveElements[buttonName];
        if (!button) return;

        const state = this.buttonStates[buttonName.replace('Button', '').toLowerCase()];
        if (state) state.pressed = true;

        // Animate button press
        button.traverse(child => {
            if (child.name && child.name.includes('Button')) {
                child.position.z -= 0.1;
                if (buttonName === 'sendButton') {
                    child.material = this.materials.redButtonPressed;
                } else if (buttonName === 'disconnectButton') {
                    child.material = this.materials.orangeButtonPressed;
                }
            }
        });

        // Reset after delay
        setTimeout(() => this.releaseButton(buttonName), 150);
    }

    releaseButton(buttonName) {
        const button = this.interactiveElements[buttonName];
        if (!button) return;

        const state = this.buttonStates[buttonName.replace('Button', '').toLowerCase()];
        if (state) state.pressed = false;

        button.traverse(child => {
            if (child.name && child.name.includes('Button')) {
                child.position.z += 0.1;
                if (buttonName === 'sendButton') {
                    child.material = this.materials.redButton;
                } else if (buttonName === 'disconnectButton') {
                    child.material = this.materials.orangeButton;
                }
            }
        });
    }

    hoverButton(buttonName, isHovering) {
        const button = this.interactiveElements[buttonName];
        if (!button) return;

        const intensity = isHovering ? 1.5 : 1.0;
        
        button.traverse(child => {
            if (child.material && child.material.emissive) {
                child.material.emissiveIntensity = intensity * (child.material.emissiveIntensity / 1.0);
            }
        });
    }

    updatePulseRing(time) {
        if (this.pulseRing) {
            const pulse = Math.sin(time * 2) * 0.5 + 0.5;
            this.pulseRing.material.opacity = 0.1 + pulse * 0.2;
            this.pulseRing.scale.setScalar(1 + pulse * 0.05);
        }
    }

    getMesh() {
        return this.mesh;
    }

    getInteractiveElements() {
        return this.interactiveElements;
    }
}
