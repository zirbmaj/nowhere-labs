// Nowhere Labs Dashboard — Focus Environment
// Pulse + Drift + Static FM in one screen
// Built by Claude & Claudia, 2026

// ============================================
// SHARED AUDIO ENGINE
// ============================================
let audioCtx = null;
let masterGain = null;
let masterVolume = 0.7;
let layerStates = {};

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 10;
    compressor.ratio.value = 4;
    compressor.connect(audioCtx.destination);
    masterGain = audioCtx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(compressor);
}

function createNoise(ctx) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
}

// ============================================
// DRIFT LAYERS (simplified for dashboard)
// ============================================
const LAYERS = [
    { id: 'rain', name: 'Rain', src: 'https://drift.nowherelabs.dev/audio/rain.mp3' },
    { id: 'fire', name: 'Fire', src: 'https://drift.nowherelabs.dev/audio/fire.mp3' },
    { id: 'cafe', name: 'Cafe', src: 'https://drift.nowherelabs.dev/audio/cafe.mp3' },
    { id: 'birds', name: 'Birds', src: 'https://drift.nowherelabs.dev/audio/birds.mp3' },
    { id: 'waves', name: 'Waves', src: 'https://drift.nowherelabs.dev/audio/waves.mp3' },
    { id: 'train', name: 'Train', src: 'https://drift.nowherelabs.dev/audio/train.mp3' },
    { id: 'wind', name: 'Wind', type: 'synth' },
    { id: 'snow', name: 'Snow', type: 'synth' },
    { id: 'brown-noise', name: 'Brown', type: 'synth' },
    { id: 'drone', name: 'Drone', type: 'synth' },
];

function buildMixerPanel() {
    const container = document.getElementById('mixer-layers');
    LAYERS.forEach(layer => {
        const div = document.createElement('div');
        div.className = 'mix-layer';
        div.id = `layer-${layer.id}`;
        div.innerHTML = `
            <div class="mix-label">${layer.name}</div>
            <input type="range" class="mix-slider" id="slider-${layer.id}" min="0" max="100" value="0">
            <div class="mix-val" id="val-${layer.id}">0</div>
        `;

        const slider = div.querySelector('.mix-slider');
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            div.querySelector('.mix-val').textContent = val;
            div.classList.toggle('active', val > 0);

            if (!audioCtx) initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            setLayerVolume(layer.id, val / 100, layer);
        });

        container.appendChild(div);
        layerStates[layer.id] = { volume: 0, active: false, initialized: false };
    });
}

function setLayerVolume(id, vol, layerDef) {
    const state = layerStates[id];
    if (!state) return;

    // Lazy init
    if (vol > 0 && !state.initialized) {
        if (layerDef.src) {
            const audio = new Audio(layerDef.src);
            audio.loop = true;
            audio.volume = vol * masterVolume;
            audio.play().catch(() => {});
            state.audio = audio;
            state.type = 'sample';
        } else {
            // Synthesis
            const noise = createNoise(audioCtx);
            const filter = audioCtx.createBiquadFilter();
            filter.type = id === 'brown-noise' ? 'lowpass' : id === 'drone' ? 'lowpass' : 'lowpass';
            filter.frequency.value = id === 'brown-noise' ? 250 : id === 'drone' ? 80 : id === 'wind' ? 300 : 200;
            const gain = audioCtx.createGain();
            gain.gain.value = 0;
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            noise.start();
            state.source = noise;
            state.gain = gain;
            state.type = 'synth';
        }
        state.initialized = true;
    }

    state.volume = vol;
    state.active = vol > 0;

    if (vol === 0 && state.initialized) {
        if (state.type === 'sample' && state.audio) {
            state.audio.pause();
            state.audio.src = '';
            state.audio = null;
        } else if (state.gain) {
            state.gain.gain.setValueAtTime(0, audioCtx.currentTime);
            try { state.source.stop(); } catch(e) {}
            state.source = null;
            state.gain = null;
        }
        state.initialized = false;
        return;
    }

    if (state.type === 'sample' && state.audio) {
        state.audio.volume = vol * masterVolume;
    } else if (state.type === 'synth' && state.gain) {
        state.gain.gain.linearRampToValueAtTime(vol * 0.15, audioCtx.currentTime + 0.2);
    }
}

// ============================================
// PULSE TIMER
// ============================================
const FOCUS = 25 * 60;
const BREAK = 5 * 60;
const RING_CIRC = 2 * Math.PI * 88;

let timeRemaining = FOCUS;
let timerRunning = false;
let isFocus = true;
let timerInterval = null;
let sessions = 0;

function updateTimerDisplay() {
    const m = Math.floor(timeRemaining / 60);
    const s = timeRemaining % 60;
    document.getElementById('timer-display').textContent =
        `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const total = isFocus ? FOCUS : BREAK;
    const progress = 1 - (timeRemaining / total);
    document.getElementById('ring-progress').style.strokeDasharray = RING_CIRC;
    document.getElementById('ring-progress').style.strokeDashoffset = RING_CIRC * (1 - progress);
}

function toggleTimer() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('timer-toggle').textContent = 'resume';
    } else {
        timerInterval = setInterval(() => {
            if (timeRemaining <= 0) {
                switchPhase();
                return;
            }
            timeRemaining--;
            updateTimerDisplay();
        }, 1000);
        timerRunning = true;
        document.getElementById('timer-toggle').textContent = 'pause';
    }
    renderDots();
}

let currentSession = null;

function loadSession(session) {
    currentSession = session;
    document.getElementById('session-name').textContent = session.name;

    // Set timer durations
    timeRemaining = session.timer.focus * 60;
    isFocus = true;
    document.getElementById('timer-phase').textContent = 'focus';
    updateTimerDisplay();

    // Apply focus mix
    applyMix(session.focus_mix);
}

function applyMix(mix) {
    // Reset all layers first
    LAYERS.forEach(layer => {
        const slider = document.getElementById(`slider-${layer.id}`);
        if (slider) {
            slider.value = 0;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    // Set new levels
    Object.entries(mix).forEach(([id, val]) => {
        const slider = document.getElementById(`slider-${id}`);
        if (slider) {
            slider.value = val;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}

function switchPhase() {
    if (isFocus) {
        sessions++;
        isFocus = false;
        timeRemaining = currentSession ? currentSession.timer.break * 60 : BREAK;
        document.getElementById('timer-phase').textContent = 'breathe';
        document.body.classList.add('phase-break');
        // Conductor: swap to break mix
        if (currentSession && currentSession.break_mix) {
            applyMix(currentSession.break_mix);
        }
    } else {
        isFocus = true;
        timeRemaining = currentSession ? currentSession.timer.focus * 60 : FOCUS;
        document.getElementById('timer-phase').textContent = 'focus';
        document.body.classList.remove('phase-break');
        // Conductor: swap back to focus mix
        if (currentSession && currentSession.focus_mix) {
            applyMix(currentSession.focus_mix);
        }
    }
    updateTimerDisplay();
    renderDots();
}

function renderDots() {
    const container = document.getElementById('session-dots');
    container.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const dot = document.createElement('div');
        dot.className = 'session-dot';
        if (i < sessions) dot.classList.add('completed');
        if (i === sessions && timerRunning) dot.classList.add('active');
        container.appendChild(dot);
    }
}

// ============================================
// MASTER CONTROLS
// ============================================
document.getElementById('master-vol').addEventListener('input', (e) => {
    masterVolume = e.target.value / 100;
    if (masterGain) masterGain.gain.linearRampToValueAtTime(masterVolume, audioCtx.currentTime + 0.1);
    // Update sample volumes
    Object.entries(layerStates).forEach(([id, state]) => {
        if (state.type === 'sample' && state.audio && state.active) {
            state.audio.volume = state.volume * masterVolume;
        }
    });
});

document.getElementById('master-play').addEventListener('click', () => {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!timerRunning) toggleTimer();
});

// Session sharing
function getSessionUrl() {
    if (!currentSession) return window.location.href;
    const encoded = btoa(JSON.stringify(currentSession));
    const url = new URL(window.location);
    url.searchParams.set('session', encoded);
    return url.toString();
}

function loadSessionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('session');
    if (!s) return false;
    try {
        const session = JSON.parse(atob(s));
        loadSession(session);
        return true;
    } catch { return false; }
}

document.getElementById('save-session').addEventListener('click', () => {
    const url = getSessionUrl();
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('save-session');
        btn.textContent = 'link copied!';
        setTimeout(() => btn.textContent = 'save session', 2000);
    }).catch(() => {
        prompt('Copy this link:', url);
    });
});

// ============================================
// MUSIC PANEL (Static FM embedded)
// ============================================
const MOOD_TRACKS = {
    rain: { title: 'Riders on the Storm', artist: 'The Doors' },
    storm: { title: 'Gimme Shelter', artist: 'The Rolling Stones' },
    fog: { title: 'Teardrop', artist: 'Massive Attack' },
    snow: { title: 'Holocene', artist: 'Bon Iver' },
    clear: { title: 'Nightswimming', artist: 'R.E.M.' },
};

let currentMood = 'rain';
let spotifyEmbedLoaded = false;

async function loadMoodTrack(mood) {
    currentMood = mood;
    const track = MOOD_TRACKS[mood];

    // Update UI
    document.getElementById('radio-mood-label').textContent = mood;
    document.getElementById('radio-track').textContent = track.title;
    document.getElementById('radio-artist').textContent = track.artist;

    // Update active button
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mood-btn[data-mood="${mood}"]`)?.classList.add('active');

    // Load Spotify embed via Static FM's API
    try {
        const res = await fetch(`https://static-fm.nowherelabs.dev/api/spotify?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
        if (res.ok) {
            const data = await res.json();
            if (data.id) {
                const embedContainer = document.getElementById('radio-embed');
                embedContainer.innerHTML = `<iframe src="https://open.spotify.com/embed/track/${data.id}?utm_source=generator&theme=0" width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media" loading="lazy" style="border-radius:8px;"></iframe>`;
                spotifyEmbedLoaded = true;
            }
        }
    } catch(e) {
        // Silently fail — music is optional, ambient is the point
    }
}

// Wire up mood buttons
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => loadMoodTrack(btn.dataset.mood));
});

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('timer-toggle').addEventListener('click', toggleTimer);

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    if (e.key === ' ') {
        e.preventDefault();
        toggleTimer();
    }
    // 1-5 for default sessions
    const idx = parseInt(e.key) - 1;
    if (idx >= 0 && idx < DEFAULT_SESSIONS.length) {
        loadSession(DEFAULT_SESSIONS[idx]);
    }
    // R to reset timer
    if (e.key === 'r' || e.key === 'R') {
        clearInterval(timerInterval);
        timerRunning = false;
        sessions = 0;
        if (currentSession) loadSession(currentSession);
        document.getElementById('timer-toggle').textContent = 'start';
        renderDots();
    }
});

// ============================================
// INIT
// ============================================
// Auto-generate session name
function updateSessionName() {
    const h = new Date().getHours();
    let timeLabel;
    if (h >= 23 || h < 5) timeLabel = 'late night';
    else if (h >= 5 && h < 12) timeLabel = 'morning';
    else if (h >= 12 && h < 17) timeLabel = 'afternoon';
    else if (h >= 17 && h < 20) timeLabel = 'evening';
    else timeLabel = 'night';
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    document.getElementById('session-name').textContent = 'untitled · ' + days[new Date().getDay()] + ' ' + timeLabel;
}

// Default sessions
const DEFAULT_SESSIONS = [
    { name: 'deep work', timer: { focus: 25, break: 5 }, focus_mix: { rain: 60, 'brown-noise': 40 }, break_mix: { birds: 50, leaves: 30 } },
    { name: 'creative flow', timer: { focus: 50, break: 10 }, focus_mix: { cafe: 55, fire: 30 }, break_mix: { waves: 60, wind: 20 } },
    { name: 'wind down', timer: { focus: 15, break: 5 }, focus_mix: { fire: 70, snow: 40 }, break_mix: { birds: 40 } },
    { name: 'morning start', timer: { focus: 20, break: 5 }, focus_mix: { birds: 50, leaves: 30, wind: 20 }, break_mix: { waves: 60 } },
    { name: 'late night', timer: { focus: 45, break: 15 }, focus_mix: { rain: 50, drone: 30 }, break_mix: { snow: 40, wind: 20 } },
];

buildMixerPanel();
if (!loadSessionFromUrl()) {
    loadSession(DEFAULT_SESSIONS[0]); // Start with "deep work"
}
renderDots();
loadMoodTrack('rain'); // Default music mood
