import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CyberWatch } from './watch-model.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    bloom: {
        strength: 0.6,  // Reduced for less blur
        radius: 0.3,
        threshold: 0.8
    },
    camera: {
        fov: 45,
        near: 0.1,
        far: 1000,
        startPos: { x: 0, y: 0, z: 14 }  // Good distance
    },
    rotation: {
        sensitivity: 0.4,
        dampening: 0.05,
        maxAngle: 0.5
    },
    effects: {
        floatAmplitude: 0.1,
        floatSpeed: 0.5,
        breathingSpeed: 0.2,
        breathingAmount: 0.015
    }
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
scene.fog = new THREE.FogExp2(0x050508, 0.008);

// Background
scene.background = new THREE.Color(0x0a0a0f);

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
webglRenderer.toneMappingExposure = 1.0;
webglRenderer.shadowMap.enabled = true;
webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
webglContainer.appendChild(webglRenderer.domElement);

// CSS3D Renderer
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssContainer.appendChild(cssRenderer.domElement);

// ========================================
// POST-PROCESSING (Simplified - less blur)
// ========================================

const composer = new EffectComposer(webglRenderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Subtle Bloom
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    CONFIG.bloom.strength,
    CONFIG.bloom.radius,
    CONFIG.bloom.threshold
);
composer.addPass(bloomPass);

// Output
const outputPass = new OutputPass();
composer.addPass(outputPass);

// ========================================
// LIGHTING
// ========================================

// Ambient
const ambientLight = new THREE.AmbientLight(0x333344, 0.8);
scene.add(ambientLight);

// Key light (warm)
const keyLight = new THREE.SpotLight(0xffa050, 500);
keyLight.position.set(8, 6, 10);
keyLight.angle = 0.6;
keyLight.penumbra = 0.6;
keyLight.decay = 2;
keyLight.castShadow = true;
scene.add(keyLight);

// Rim light (cool cyan)
const rimLight = new THREE.SpotLight(0x00ccff, 400);
rimLight.position.set(-8, 4, 6);
rimLight.angle = 0.7;
rimLight.penumbra = 0.5;
scene.add(rimLight);

// Fill light
const fillLight = new THREE.PointLight(0xff00aa, 80, 20);
fillLight.position.set(-4, -3, 8);
scene.add(fillLight);

// Front light for visibility
const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
frontLight.position.set(0, 0, 10);
scene.add(frontLight);

// ========================================
// WATCH MODEL
// ========================================

updateLoadingProgress('Creating watch model...', 20);

const watch = new CyberWatch();
const watchGroup = watch.getMesh();
scene.add(watchGroup);

updateLoadingProgress('Initializing display...', 50);

// ========================================
// TERMINAL SCREEN (CSS3D)
// ========================================

const terminalDiv = document.getElementById('terminal-source');
terminalDiv.style.visibility = 'visible';

const cssObject = new CSS3DObject(terminalDiv);
// Scale to fit watch screen (3.4 units wide, terminal is 300px)
cssObject.scale.set(0.0113, 0.0113, 0.0113);
cssObject.position.set(0, 0, 0.55);
watchGroup.add(cssObject);

updateLoadingProgress('Connecting systems...', 80);

// ========================================
// PARTICLE SYSTEM
// ========================================

const particleCount = 100;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 30;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
    color: 0x00f0ff,
    size: 0.05,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// ========================================
// RAIN EFFECT
// ========================================

const rainCanvas = document.getElementById('rain-canvas');
const rainCtx = rainCanvas.getContext('2d');
rainCanvas.width = window.innerWidth;
rainCanvas.height = window.innerHeight;

const raindrops = [];
const rainCount = 100;

for (let i = 0; i < rainCount; i++) {
    raindrops.push({
        x: Math.random() * rainCanvas.width,
        y: Math.random() * rainCanvas.height,
        length: Math.random() * 15 + 8,
        speed: Math.random() * 6 + 3,
        opacity: Math.random() * 0.2 + 0.05
    });
}

function updateRain() {
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    
    raindrops.forEach(drop => {
        rainCtx.beginPath();
        rainCtx.strokeStyle = `rgba(0, 200, 255, ${drop.opacity})`;
        rainCtx.lineWidth = 1;
        rainCtx.moveTo(drop.x, drop.y);
        rainCtx.lineTo(drop.x, drop.y + drop.length);
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
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 10; col++) {
            html += chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)] + ' ';
        }
        html += '\n';
    }
    hexGrid.textContent = html;
}
setInterval(updateHexGrid, 400);

// ========================================
// HUD UPDATES
// ========================================

function updateHUD() {
    const now = new Date();
    document.getElementById('hud-time').textContent = now.toTimeString().split(' ')[0];
    
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    document.getElementById('hud-date').textContent = dateStr;
    
    const cpu = Math.floor(Math.random() * 25 + 35);
    const mem = Math.floor(Math.random() * 15 + 55);
    const net = Math.floor(Math.random() * 10 + 80);
    
    document.getElementById('cpu-bar').style.width = `${cpu}%`;
    document.getElementById('cpu-val').textContent = `${cpu}%`;
    document.getElementById('mem-bar').style.width = `${mem}%`;
    document.getElementById('mem-val').textContent = `${mem}%`;
    document.getElementById('net-bar').style.width = `${net}%`;
    document.getElementById('net-val').textContent = `${net}%`;
}
setInterval(updateHUD, 1000);
updateHUD();

// Mini console
function addMiniLog(msg, type = '') {
    const log = document.getElementById('mini-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `> ${msg}`;
    log.insertBefore(entry, log.firstChild);
    if (log.children.length > 6) log.removeChild(log.lastChild);
}
window.addMiniLog = addMiniLog;

const randomLogs = [
    ['PKT_RECV: OK', ''],
    ['HEARTBEAT: OK', 'success'],
    ['PING: 22ms', ''],
    ['ENCRYPT: AES', ''],
];
setInterval(() => {
    const [msg, type] = randomLogs[Math.floor(Math.random() * randomLogs.length)];
    addMiniLog(msg, type);
}, 4000);

// ========================================
// INTERACTION - MOUSE & BUTTONS
// ========================================

let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;
let isDragging = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Get clickable button meshes
const clickableMeshes = watch.getClickableMeshes();

document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.x = mouseX;
    mouse.y = mouseY;
    
    // Rotate watch based on mouse position
    if (!isDragging) {
        targetRotationX = mouseY * CONFIG.rotation.sensitivity;
        targetRotationY = mouseX * CONFIG.rotation.sensitivity;
    }
    
    // Check hover on buttons
    checkButtonHover();
});

function checkButtonHover() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableMeshes, false);
    
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = 'crosshair';
    }
}

// Button click handling
document.addEventListener('click', (e) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableMeshes, false);
    
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        
        if (clickedMesh.userData && clickedMesh.userData.isButton) {
            const buttonType = clickedMesh.userData.buttonType;
            
            // Visual feedback
            watch.pressButton(buttonType === 'send' ? 'sendButton' : 'disconnectButton');
            
            if (buttonType === 'send') {
                addMiniLog('SEND pressed', 'success');
                // Trigger terminal send
                if (window.terminalSend) {
                    window.terminalSend();
                }
            } else if (buttonType === 'disconnect') {
                addMiniLog('DISC pressed', 'error');
                // Trigger disconnect
                if (window.terminalDisconnect) {
                    window.terminalDisconnect();
                }
            }
        }
    }
});

// ========================================
// RESIZE
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
// LOADING COMPLETE
// ========================================

function updateLoadingProgress(status, progress) {
    if (loadingStatus) loadingStatus.textContent = status;
    if (loadingProgress) loadingProgress.style.width = `${progress}%`;
}

setTimeout(() => {
    updateLoadingProgress('Ready', 100);
    setTimeout(() => {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }, 400);
}, 1200);

// ========================================
// ANIMATION LOOP
// ========================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    
    // Smooth rotation
    currentRotationX += (targetRotationX - currentRotationX) * CONFIG.rotation.dampening;
    currentRotationY += (targetRotationY - currentRotationY) * CONFIG.rotation.dampening;
    
    // Clamp
    currentRotationX = Math.max(-CONFIG.rotation.maxAngle, Math.min(CONFIG.rotation.maxAngle, currentRotationX));
    currentRotationY = Math.max(-CONFIG.rotation.maxAngle, Math.min(CONFIG.rotation.maxAngle, currentRotationY));
    
    watchGroup.rotation.x = currentRotationX;
    watchGroup.rotation.y = currentRotationY;
    
    // Float animation
    watchGroup.position.y = Math.sin(time * CONFIG.effects.floatSpeed) * CONFIG.effects.floatAmplitude;
    watchGroup.rotation.z = Math.sin(time * CONFIG.effects.breathingSpeed) * CONFIG.effects.breathingAmount;
    
    // Update pulse ring
    watch.updatePulseRing(time);
    
    // Particles
    particles.rotation.y += 0.0001;
    
    // Rain
    updateRain();
    
    // Render
    composer.render();
    cssRenderer.render(scene, camera);
}

animate();

window.cyberWatch = watch;
