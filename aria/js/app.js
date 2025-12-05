import { checkConnection, sendMessage } from './firebase.js';

// ========================================
// DOM ELEMENTS
// ========================================

const terminal = document.getElementById('terminal');
const input = document.getElementById('command-input');
const promptLabel = document.getElementById('prompt-label');
const connectionStatus = document.getElementById('connection-status');

// ========================================
// STATE
// ========================================

let state = 'BOOT'; // BOOT, AUTH, CHAT
let userPin = '';
const SYSTEM_PIN = '6005';

// ========================================
// AUDIO (Cyberpunk style beeps)
// ========================================

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playBeep(frequency = 800, duration = 50, type = 'square') {
    if (!audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration / 1000);
}

function playKeystroke() {
    playBeep(1200 + Math.random() * 400, 20, 'sine');
}

function playSuccess() {
    playBeep(800, 80, 'sine');
    setTimeout(() => playBeep(1200, 80, 'sine'), 100);
}

function playError() {
    playBeep(200, 200, 'square');
}

function playBoot() {
    playBeep(400, 100, 'sine');
    setTimeout(() => playBeep(600, 100, 'sine'), 120);
    setTimeout(() => playBeep(800, 100, 'sine'), 240);
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio on first interaction
    document.addEventListener('click', () => {
        initAudio();
    }, { once: true });
    
    document.addEventListener('keydown', () => {
        initAudio();
    }, { once: true });
    
    startBootSequence();
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleInput(input.value.trim());
        input.value = '';
    }
    playKeystroke();
});

// ========================================
// BOOT SEQUENCE
// ========================================

async function startBootSequence() {
    input.disabled = true;
    
    await wait(800);
    playBoot();
    
    await typeTextGlitch('▀▄▀▄ TOBY WATCH_OS v3.0.77 ▄▀▄▀', 'system');
    await wait(300);
    await typeText('BUILD: 2077.12.05 // NIGHT_CITY_EDITION', 'info');
    await wait(400);
    
    await typeText('', 'system');
    await typeText('┌─────────────────────────────────────┐', 'dim');
    await typeText('│  INITIALIZING NEURAL INTERFACE...   │', 'dim');
    await typeText('└─────────────────────────────────────┘', 'dim');
    await wait(300);
    
    await typeText('', '');
    await typeText('[BOOT] Loading kernel modules...', 'info');
    await simulateProgress('kernel_init', 5);
    
    await typeText('[BOOT] Initializing encryption layer...', 'info');
    await simulateProgress('crypto_init', 4);
    
    await typeText('[BOOT] Establishing neural handshake...', 'info');
    await simulateProgress('neural_sync', 3);
    
    // Check Firebase connection
    await typeText('', '');
    await typeText('[NET] Connecting to ARIA uplink...', 'warning');
    
    const connected = await checkConnection();
    if (connected) {
        updateConnectionStatus(true);
        await typeTextGlitch('◆ UPLINK ESTABLISHED: ARIA_CORE', 'success');
        if (window.addMiniLog) window.addMiniLog('UPLINK: ONLINE', 'success');
    } else {
        updateConnectionStatus(false);
        await typeTextGlitch('◆ UPLINK FAILED: OFFLINE_MODE', 'error');
        if (window.addMiniLog) window.addMiniLog('UPLINK: OFFLINE', 'error');
    }
    
    await wait(400);
    await typeText('', '');
    await typeText('[SYS] All subsystems operational.', 'success');
    
    // Check for saved PIN
    const savedPin = localStorage.getItem('userPin');
    if (savedPin === SYSTEM_PIN) {
        userPin = savedPin;
        state = 'CHAT';
        await wait(300);
        await typeTextGlitch('◆ BIOMETRIC CACHE VALID', 'success');
        await typeText('Welcome back, Netrunner.', 'system');
        if (window.addMiniLog) window.addMiniLog('AUTH: cached', 'success');
    } else {
        state = 'AUTH';
        await wait(300);
        await typeText('', '');
        await typeTextGlitch('◆ AUTHENTICATION REQUIRED', 'warning');
        await typeText('Enter access PIN to continue...', 'info');
    }
    
    updatePrompt();
    input.disabled = false;
    input.focus();
}

// ========================================
// INPUT HANDLERS
// ========================================

async function handleInput(cmd) {
    if (!cmd) return;
    
    // Echo the command
    const displayCmd = state === 'AUTH' ? '••••' : cmd;
    printLog(`${promptLabel.innerText} ${displayCmd}`, 'user');
    
    if (state === 'AUTH') {
        await processAuth(cmd);
    } else if (state === 'CHAT') {
        await processChat(cmd);
    }
}

async function processAuth(pin) {
    input.disabled = true;
    
    await typeText('[AUTH] Verifying credentials...', 'info');
    await wait(600);
    
    if (pin === SYSTEM_PIN) {
        playSuccess();
        await typeTextGlitch('◆ ACCESS GRANTED', 'success');
        await typeText('Identity confirmed. Neural link synchronized.', 'success');
        
        userPin = pin;
        localStorage.setItem('userPin', pin);
        state = 'CHAT';
        
        if (window.addMiniLog) window.addMiniLog('AUTH: verified', 'success');
        
        await wait(300);
        await typeText('', '');
        await typeText('Available commands:', 'system');
        await typeText('  /clear  - Clear terminal', 'info');
        await typeText('  /logout - End session', 'info');
        await typeText('  /status - System status', 'info');
        await typeText('  /help   - Show commands', 'info');
        await typeText('', '');
        await typeText('Ready for transmission.', 'system');
        
    } else {
        playError();
        await typeTextGlitch('◆ ACCESS DENIED', 'error');
        await typeText('Invalid credentials. Intrusion logged.', 'error');
        if (window.addMiniLog) window.addMiniLog('AUTH: failed', 'error');
        
        // Glitch effect on failure
        applyGlitchEffect();
    }
    
    updatePrompt();
    input.disabled = false;
    input.focus();
}

async function processChat(msg) {
    // Handle special commands
    const cmd = msg.toLowerCase();
    
    if (cmd === '/clear') {
        terminal.innerHTML = '';
        await typeText('Terminal cleared.', 'info');
        return;
    }
    
    if (cmd === '/logout') {
        state = 'AUTH';
        userPin = '';
        localStorage.removeItem('userPin');
        await typeTextGlitch('◆ SESSION TERMINATED', 'warning');
        await typeText('Neural link disconnected.', 'system');
        updatePrompt();
        if (window.addMiniLog) window.addMiniLog('SESSION: ended', '');
        return;
    }
    
    if (cmd === '/status') {
        await showStatus();
        return;
    }
    
    if (cmd === '/help') {
        await showHelp();
        return;
    }
    
    if (cmd === '/glitch') {
        applyGlitchEffect();
        return;
    }
    
    // Send message to Firebase
    input.disabled = true;
    
    await typeText('[TX] Encrypting packet...', 'info');
    await wait(300);
    await typeText('[TX] Transmitting to ARIA...', 'info');
    
    try {
        const response = await sendMessage(msg, userPin);
        const refId = response.name ? response.name.substring(0, 12) : 'unknown';
        
        playSuccess();
        await typeTextGlitch(`◆ PACKET SENT: ${refId}...`, 'success');
        
        if (window.addMiniLog) window.addMiniLog(`TX: ${refId}...`, 'success');
        
    } catch (err) {
        playError();
        await typeTextGlitch('◆ TRANSMISSION FAILED', 'error');
        await typeText(`Error: ${err.message}`, 'error');
        
        if (window.addMiniLog) window.addMiniLog(`ERR: ${err.message}`, 'error');
    }
    
    input.disabled = false;
    input.focus();
}

// ========================================
// SPECIAL COMMANDS
// ========================================

async function showStatus() {
    await typeText('', '');
    await typeText('┌─────── SYSTEM STATUS ───────┐', 'system');
    await typeText('│                             │', 'dim');
    await typeText(`│  UPLINK:     ${connectionStatus.textContent.includes('CONNECTED') ? 'ONLINE ' : 'OFFLINE'}       │`, 'info');
    await typeText(`│  AUTH:       ${state === 'CHAT' ? 'VERIFIED' : 'PENDING '}      │`, 'info');
    await typeText(`│  LATENCY:    ${Math.floor(Math.random() * 30 + 10)}ms          │`, 'info');
    await typeText(`│  ENCRYPTION: AES-256        │`, 'info');
    await typeText(`│  BUFFER:     ${Math.floor(Math.random() * 100)}%           │`, 'info');
    await typeText('│                             │', 'dim');
    await typeText('└─────────────────────────────┘', 'system');
}

async function showHelp() {
    await typeText('', '');
    await typeText('┌─────── COMMAND REFERENCE ───────┐', 'system');
    await typeText('│                                 │', 'dim');
    await typeText('│  /clear   Clear terminal buffer │', 'info');
    await typeText('│  /logout  End current session   │', 'info');
    await typeText('│  /status  Show system status    │', 'info');
    await typeText('│  /help    Display this message  │', 'info');
    await typeText('│  /glitch  Test visual effects   │', 'info');
    await typeText('│                                 │', 'dim');
    await typeText('│  [TEXT]   Send message to ARIA  │', 'success');
    await typeText('│                                 │', 'dim');
    await typeText('└─────────────────────────────────┘', 'system');
}

// ========================================
// UI HELPERS
// ========================================

function updatePrompt() {
    if (state === 'AUTH') {
        promptLabel.innerText = 'ACCESS_PIN>';
        input.type = 'password';
        input.placeholder = 'Enter PIN...';
    } else {
        promptLabel.innerText = 'toby@aria:~$';
        input.type = 'text';
        input.placeholder = 'Type message...';
    }
}

function updateConnectionStatus(isConnected) {
    if (isConnected) {
        connectionStatus.textContent = '● CONNECTED';
        connectionStatus.classList.remove('offline');
    } else {
        connectionStatus.textContent = '● OFFLINE';
        connectionStatus.classList.add('offline');
    }
}

// ========================================
// TEXT OUTPUT UTILITIES
// ========================================

function printLog(text, type = '') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

async function typeText(text, type = '') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    terminal.appendChild(line);
    
    for (let i = 0; i < text.length; i++) {
        line.textContent += text[i];
        terminal.scrollTop = terminal.scrollHeight;
        await wait(15 + Math.random() * 25);
    }
    
    // Ensure empty lines still have height
    if (text === '') {
        line.innerHTML = '&nbsp;';
    }
}

async function typeTextGlitch(text, type = '') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    terminal.appendChild(line);
    
    // Initial glitch
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:<>?█▓▒░';
    for (let i = 0; i < 3; i++) {
        let glitched = '';
        for (let j = 0; j < Math.min(text.length, 10); j++) {
            glitched += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
        line.textContent = glitched;
        await wait(50);
    }
    
    // Type out real text
    line.textContent = '';
    for (let i = 0; i < text.length; i++) {
        // Occasional glitch
        if (Math.random() < 0.1) {
            const original = line.textContent;
            line.textContent += glitchChars[Math.floor(Math.random() * glitchChars.length)];
            await wait(30);
            line.textContent = original + text[i];
        } else {
            line.textContent += text[i];
        }
        terminal.scrollTop = terminal.scrollHeight;
        await wait(20 + Math.random() * 15);
    }
}

async function simulateProgress(taskName, steps) {
    const progressChars = ['░', '▒', '▓', '█'];
    const line = document.createElement('div');
    line.className = 'log-line info';
    line.style.fontFamily = 'monospace';
    terminal.appendChild(line);
    
    for (let i = 0; i <= steps; i++) {
        let bar = '    [';
        for (let j = 0; j < steps; j++) {
            if (j < i) {
                bar += '█';
            } else if (j === i) {
                bar += progressChars[Math.floor(Math.random() * progressChars.length)];
            } else {
                bar += '░';
            }
        }
        bar += `] ${Math.floor((i / steps) * 100)}%`;
        line.textContent = bar;
        terminal.scrollTop = terminal.scrollHeight;
        await wait(100 + Math.random() * 150);
    }
}

function applyGlitchEffect() {
    const container = document.querySelector('.crt-container');
    container.style.animation = 'none';
    container.offsetHeight; // Trigger reflow
    
    // Add intense glitch class
    container.style.filter = 'hue-rotate(90deg) saturate(2)';
    
    setTimeout(() => {
        container.style.filter = 'hue-rotate(180deg) brightness(1.5)';
    }, 50);
    
    setTimeout(() => {
        container.style.filter = 'hue-rotate(270deg) contrast(1.5)';
    }, 100);
    
    setTimeout(() => {
        container.style.filter = '';
    }, 150);
    
    // Shake effect
    const terminal = document.getElementById('terminal-source');
    terminal.style.transform = 'translateX(-3px)';
    
    setTimeout(() => {
        terminal.style.transform = 'translateX(3px)';
    }, 30);
    
    setTimeout(() => {
        terminal.style.transform = 'translateY(-2px)';
    }, 60);
    
    setTimeout(() => {
        terminal.style.transform = 'translateY(2px)';
    }, 90);
    
    setTimeout(() => {
        terminal.style.transform = '';
    }, 120);
}

// ========================================
// UTILITIES
// ========================================

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Expose for external use (button clicks)
window.terminalSend = () => {
    if (input && !input.disabled && input.value.trim()) {
        handleInput(input.value.trim());
        input.value = '';
    }
};

window.terminalDisconnect = () => {
    if (state === 'CHAT') {
        handleInput('/logout');
    }
};
