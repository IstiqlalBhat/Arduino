import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CyberWatch } from './watch-model.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    bloom: {
        strength: 1.8,
        radius: 0.5,
        threshold: 0.6
    },
    camera: {
        fov: 40,
        near: 0.1,
        far: 1000,
        startPos: { x: 0, y: 0, z: 18 }
    },
    rotation: {
        sensitivity: 0.5,
        dampening: 0.03,
        maxAngle: 0.6
    },
    effects: {
        floatAmplitude: 0.15,
        floatSpeed: 0.5,
        breathingSpeed: 0.2,
        breathingAmount: 0.02
    }
};

// ========================================
// CHROMATIC ABERRATION SHADER
// ========================================

const ChromaticAberrationShader = {
    uniforms: {
        tDiffuse: { value: null },
        amount: { value: 0.003 },
        angle: { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        uniform float angle;
        varying vec2 vUv;
        
        void main() {
            vec2 offset = amount * vec2(cos(angle), sin(angle));
            vec4 cr = texture2D(tDiffuse, vUv + offset);
            vec4 cg = texture2D(tDiffuse, vUv);
            vec4 cb = texture2D(tDiffuse, vUv - offset);
            gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
        }
    `
};

// ========================================
// VIGNETTE SHADER
// ========================================

const VignetteShader = {
    uniforms: {
        tDiffuse: { value: null },
        darkness: { value: 0.6 },
        offset: { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float darkness;
        uniform float offset;
        varying vec2 vUv;
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            vec2 uv = (vUv - 0.5) * 2.0;
            float vignette = 1.0 - dot(uv, uv) * darkness;
            vignette = clamp(vignette, 0.0, 1.0);
            color.rgb *= vignette;
            gl_FragColor = color;
        }
    `
};

// ========================================
// SCENE SETUP
// ========================================

const webglContainer = document.getElementById('webgl-container');
const cssContainer = document.getElementById('css3d-container');
const loadingOverlay = document.getElementById('loading');
const loadingProgress = document.getElementById('loading-progress');
const loadingStatus = document.getElementById('loading-status');

// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050508, 0.012);

// Background with gradient
const bgCanvas = document.createElement('canvas');
bgCanvas.width = 512;
bgCanvas.height = 512;
const bgCtx = bgCanvas.getContext('2d');
const bgGradient = bgCtx.createRadialGradient(256, 256, 0, 256, 256, 400);
bgGradient.addColorStop(0, '#0a0a12');
bgGradient.addColorStop(0.5, '#050508');
bgGradient.addColorStop(1, '#000000');
bgCtx.fillStyle = bgGradient;
bgCtx.fillRect(0, 0, 512, 512);
const bgTexture = new THREE.CanvasTexture(bgCanvas);
scene.background = bgTexture;

// Camera
const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
);
camera.position.set(
    CONFIG.camera.startPos.x,
    CONFIG.camera.startPos.y,
    CONFIG.camera.startPos.z
);

// ========================================
// RENDERERS
// ========================================

// WebGL Renderer
const webglRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
});
webglRenderer.setSize(window.innerWidth, window.innerHeight);
webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
webglRenderer.toneMappingExposure = 1.2;
webglRenderer.shadowMap.enabled = true;
webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
webglContainer.appendChild(webglRenderer.domElement);

// CSS3D Renderer
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssContainer.appendChild(cssRenderer.domElement);

// ========================================
// POST-PROCESSING
// ========================================

const composer = new EffectComposer(webglRenderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Bloom
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    CONFIG.bloom.strength,
    CONFIG.bloom.radius,
    CONFIG.bloom.threshold
);
composer.addPass(bloomPass);

// Chromatic Aberration
const chromaticPass = new ShaderPass(ChromaticAberrationShader);
composer.addPass(chromaticPass);

// Vignette
const vignettePass = new ShaderPass(VignetteShader);
composer.addPass(vignettePass);

// Output
const outputPass = new OutputPass();
composer.addPass(outputPass);

// ========================================
// LIGHTING
// ========================================

// Ambient
const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
scene.add(ambientLight);

// Key light (warm, cinematic)
const keyLight = new THREE.SpotLight(0xffa040, 800);
keyLight.position.set(8, 6, 10);
keyLight.angle = 0.6;
keyLight.penumbra = 0.8;
keyLight.decay = 2;
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.bias = -0.0001;
scene.add(keyLight);

// Rim light (cool cyan)
const rimLight = new THREE.SpotLight(0x00f0ff, 600);
rimLight.position.set(-10, 3, 5);
rimLight.angle = 0.7;
rimLight.penumbra = 0.6;
rimLight.decay = 2;
scene.add(rimLight);

// Fill light (magenta accent)
const fillLight = new THREE.PointLight(0xff00ff, 150, 20);
fillLight.position.set(-5, -4, 8);
scene.add(fillLight);

// Under-glow (neon)
const underGlow = new THREE.PointLight(0x00ff88, 80, 15);
underGlow.position.set(0, -6, 5);
scene.add(underGlow);

// Backlight
const backLight = new THREE.PointLight(0x4400ff, 100, 25);
backLight.position.set(0, 0, -10);
scene.add(backLight);

// ========================================
// WATCH MODEL
// ========================================

let loadProgress = 0;
updateLoadingProgress('Creating neural pathways...', 10);

const watch = new CyberWatch();
const watchGroup = watch.getMesh();
scene.add(watchGroup);

updateLoadingProgress('Initializing holographics...', 40);

// ========================================
// TERMINAL SCREEN (CSS3D)
// ========================================

const terminalDiv = document.getElementById('terminal-source');
terminalDiv.style.visibility = 'visible';

const cssObject = new CSS3DObject(terminalDiv);
// Scale: terminal is 380px, watch screen is ~3.6 units
// 3.6 / 380 ≈ 0.00947
cssObject.scale.set(0.0095, 0.0095, 0.0095);
cssObject.position.set(0, 0, 0.55);
watchGroup.add(cssObject);

updateLoadingProgress('Calibrating display matrix...', 60);

// ========================================
// PARTICLE SYSTEM (Floating debris)
// ========================================

const particleCount = 200;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 40;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    particleSizes[i] = Math.random() * 0.05 + 0.01;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

const particleMaterial = new THREE.PointsMaterial({
    color: 0x00f0ff,
    size: 0.08,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

updateLoadingProgress('Connecting to uplink...', 80);

// ========================================
// RAIN EFFECT
// ========================================

const rainCanvas = document.getElementById('rain-canvas');
const rainCtx = rainCanvas.getContext('2d');
rainCanvas.width = window.innerWidth;
rainCanvas.height = window.innerHeight;

const raindrops = [];
const rainCount = 150;

for (let i = 0; i < rainCount; i++) {
    raindrops.push({
        x: Math.random() * rainCanvas.width,
        y: Math.random() * rainCanvas.height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 8 + 4,
        opacity: Math.random() * 0.3 + 0.1
    });
}

function updateRain() {
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    
    raindrops.forEach(drop => {
        rainCtx.beginPath();
        rainCtx.strokeStyle = `rgba(0, 240, 255, ${drop.opacity})`;
        rainCtx.lineWidth = 1;
        rainCtx.moveTo(drop.x, drop.y);
        rainCtx.lineTo(drop.x + 1, drop.y + drop.length);
        rainCtx.stroke();
        
        drop.y += drop.speed;
        
        if (drop.y > rainCanvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * rainCanvas.width;
        }
    });
}

// ========================================
// HEX GRID BACKGROUND
// ========================================

const hexGrid = document.getElementById('hex-grid');
function updateHexGrid() {
    const chars = '0123456789ABCDEF';
    let html = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 12; col++) {
            let byte = '';
            for (let i = 0; i < 2; i++) {
                byte += chars[Math.floor(Math.random() * 16)];
            }
            html += byte + ' ';
        }
        html += '\n';
    }
    hexGrid.textContent = html;
}
setInterval(updateHexGrid, 300);

// ========================================
// HUD UPDATES
// ========================================

function updateHUD() {
    // Time
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    document.getElementById('hud-time').textContent = timeStr;
    
    // Date
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    document.getElementById('hud-date').textContent = dateStr;
    
    // Stats
    const cpu = Math.floor(Math.random() * 30 + 30);
    const mem = Math.floor(Math.random() * 20 + 50);
    const net = Math.floor(Math.random() * 15 + 75);
    
    document.getElementById('cpu-bar').style.width = `${cpu}%`;
    document.getElementById('cpu-val').textContent = `${cpu}%`;
    document.getElementById('mem-bar').style.width = `${mem}%`;
    document.getElementById('mem-val').textContent = `${mem}%`;
    document.getElementById('net-bar').style.width = `${net}%`;
    document.getElementById('net-val').textContent = `${net}%`;
}
setInterval(updateHUD, 1000);
updateHUD();

// Mini console logs
function addMiniLog(msg, type = '') {
    const log = document.getElementById('mini-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `> ${msg}`;
    log.insertBefore(entry, log.firstChild);
    if (log.children.length > 8) {
        log.removeChild(log.lastChild);
    }
}

// Export for use in app.js
window.addMiniLog = addMiniLog;

const randomLogs = [
    ['PKT_RECV: 0x4A2F', ''],
    ['HEARTBEAT: OK', 'success'],
    ['SCAN: ports 80,443', ''],
    ['PING: 24ms', ''],
    ['CACHE_HIT: auth_token', 'success'],
    ['ENCRYPT: AES-256', ''],
    ['HANDSHAKE: verified', 'success'],
    ['BUFFER: cleared', ''],
];

setInterval(() => {
    const [msg, type] = randomLogs[Math.floor(Math.random() * randomLogs.length)];
    addMiniLog(msg, type);
}, 3000);

// ========================================
// INTERACTION STATE
// ========================================

let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;
let isMouseDown = false;
let mouseDownX = 0;
let mouseDownY = 0;

// Raycaster for button interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;

document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    
    mouse.x = mouseX;
    mouse.y = mouseY;
    
    if (isMouseDown) {
        const deltaX = (e.clientX - mouseDownX) * 0.002;
        const deltaY = (e.clientY - mouseDownY) * 0.002;
        targetRotationY = deltaX * 2;
        targetRotationX = deltaY * 2;
    } else {
        targetRotationX = mouseY * CONFIG.rotation.sensitivity;
        targetRotationY = mouseX * CONFIG.rotation.sensitivity;
    }
});

document.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    
    // Check for button clicks
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(watchGroup.children, true);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.name === 'sendButton') {
            watch.pressButton('sendButton');
            addMiniLog('SEND: triggered', 'success');
            // Trigger form submit if focused
            const input = document.getElementById('command-input');
            if (input && !input.disabled && input.value.trim()) {
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            }
        } else if (obj.name === 'disconnectButton') {
            watch.pressButton('disconnectButton');
            addMiniLog('DISC: initiated', 'error');
        }
    }
});

document.addEventListener('mouseup', () => {
    isMouseDown = false;
});

// Hover effects
function checkHover() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(watchGroup.children, true);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.name && obj.name.includes('Button')) {
            if (hoveredObject !== obj) {
                if (hoveredObject) {
                    watch.hoverButton(hoveredObject.name, false);
                }
                hoveredObject = obj;
                watch.hoverButton(obj.name, true);
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (hoveredObject) {
                watch.hoverButton(hoveredObject.name, false);
                hoveredObject = null;
            }
            document.body.style.cursor = 'crosshair';
        }
    } else {
        if (hoveredObject) {
            watch.hoverButton(hoveredObject.name, false);
            hoveredObject = null;
        }
        document.body.style.cursor = 'crosshair';
    }
}

// ========================================
// RESIZE HANDLER
// ========================================

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    webglRenderer.setSize(width, height);
    composer.setSize(width, height);
    cssRenderer.setSize(width, height);
    
    rainCanvas.width = width;
    rainCanvas.height = height;
    
    bloomPass.resolution.set(width, height);
});

// ========================================
// LOADING COMPLETION
// ========================================

function updateLoadingProgress(status, progress) {
    if (loadingStatus) loadingStatus.textContent = status;
    if (loadingProgress) loadingProgress.style.width = `${progress}%`;
}

setTimeout(() => {
    updateLoadingProgress('System ready.', 100);
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }, 500);
}, 1500);

// ========================================
// ANIMATION LOOP
// ========================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    const delta = clock.getDelta();
    
    // Smooth rotation
    currentRotationX += (targetRotationX - currentRotationX) * CONFIG.rotation.dampening;
    currentRotationY += (targetRotationY - currentRotationY) * CONFIG.rotation.dampening;
    
    // Clamp rotation
    currentRotationX = Math.max(-CONFIG.rotation.maxAngle, Math.min(CONFIG.rotation.maxAngle, currentRotationX));
    currentRotationY = Math.max(-CONFIG.rotation.maxAngle, Math.min(CONFIG.rotation.maxAngle, currentRotationY));
    
    watchGroup.rotation.x = currentRotationX;
    watchGroup.rotation.y = currentRotationY;
    
    // Floating animation
    watchGroup.position.y = Math.sin(time * CONFIG.effects.floatSpeed) * CONFIG.effects.floatAmplitude;
    
    // Breathing rotation
    watchGroup.rotation.z = Math.sin(time * CONFIG.effects.breathingSpeed) * CONFIG.effects.breathingAmount;
    
    // Update pulse ring
    watch.updatePulseRing(time);
    
    // Particle animation
    const positions = particleGeometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] -= 0.01; // Fall down slowly
        if (positions[i * 3 + 1] < -20) {
            positions[i * 3 + 1] = 20;
        }
    }
    particleGeometry.attributes.position.needsUpdate = true;
    
    // Rotate particles
    particles.rotation.y += 0.0002;
    
    // Light animations
    fillLight.intensity = 150 + Math.sin(time * 2) * 30;
    underGlow.intensity = 80 + Math.sin(time * 1.5) * 20;
    
    // Chromatic aberration pulse
    chromaticPass.uniforms.amount.value = 0.002 + Math.sin(time) * 0.001;
    
    // Check hover state
    checkHover();
    
    // Update rain
    updateRain();
    
    // Render
    composer.render();
    cssRenderer.render(scene, camera);
}

animate();

// Export watch for external access
window.cyberWatch = watch;
