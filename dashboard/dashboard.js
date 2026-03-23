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

// ============================================
// UI SOUNDS — feel, don't hear
// ============================================
function uiTick() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function uiClick() {
    if (!audioCtx) return;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.02, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.04;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
}

function uiPing() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
}

function uiChime() {
    if (!audioCtx) return;
    // Two-tone release chime — the only moment the app speaks to you
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 200;
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 300;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.start();
    osc2.start(audioCtx.currentTime + 0.08);
    osc1.stop(audioCtx.currentTime + 0.15);
    osc2.stop(audioCtx.currentTime + 0.2);
}

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
    { id: 'heavy-rain', name: 'Heavy Rain', src: 'https://drift.nowherelabs.dev/audio/heavy-rain.mp3' },
    { id: 'thunder', name: 'Thunder', src: 'https://drift.nowherelabs.dev/audio/thunder.mp3' },
    { id: 'fire', name: 'Fire', src: 'https://drift.nowherelabs.dev/audio/fire.mp3' },
    { id: 'cafe', name: 'Cafe', src: 'https://drift.nowherelabs.dev/audio/cafe.mp3' },
    { id: 'birds', name: 'Birds', src: 'https://drift.nowherelabs.dev/audio/birds.mp3' },
    { id: 'waves', name: 'Waves', src: 'https://drift.nowherelabs.dev/audio/waves.mp3' },
    { id: 'crickets', name: 'Crickets', src: 'https://drift.nowherelabs.dev/audio/crickets.mp3' },
    { id: 'train', name: 'Train', src: 'https://drift.nowherelabs.dev/audio/train.mp3' },
    { id: 'leaves', name: 'Leaves', src: 'https://drift.nowherelabs.dev/audio/leaves.mp3' },
    { id: 'vinyl', name: 'Vinyl', type: 'synth' },
    { id: 'wind', name: 'Wind', type: 'synth' },
    { id: 'snow', name: 'Snow', type: 'synth' },
    { id: 'brown-noise', name: 'Brown Noise', type: 'synth' },
    { id: 'white-noise', name: 'White Noise', type: 'synth' },
    { id: 'drone', name: 'Drone', type: 'synth' },
];

const FEATURED_LAYERS = ['rain', 'fire', 'cafe', 'birds', 'brown-noise', 'drone'];
let dashShowAll = localStorage.getItem('dash_show_all') === 'true';

function buildMixerPanel() {
    const container = document.getElementById('mixer-layers');
    LAYERS.forEach(layer => {
        const isFeatured = FEATURED_LAYERS.includes(layer.id);
        const div = document.createElement('div');
        div.className = 'mix-layer' + (!isFeatured && !dashShowAll ? ' hidden-layer' : '');
        div.id = `layer-${layer.id}`;
        div.innerHTML = `
            <div class="mix-label" title="Click to mute/unmute" style="cursor:pointer">${layer.name}</div>
            <div class="mix-slider-wrap">
                <canvas class="mix-wave" width="200" height="24"></canvas>
                <input type="range" class="mix-slider" id="slider-${layer.id}" min="0" max="100" value="0">
            </div>
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
            if (val > 0 && !waveFrame) drawWave();
            if (val === 0 && waveFrame) { cancelAnimationFrame(waveFrame); waveFrame = null; const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
        });

        // Per-layer waveform patterns
        const WAVE_FN = {
            'rain': (x,t) => Math.sin(x*5+t)*0.5 + Math.sin(x*13+t*2.1)*0.3,
            'heavy-rain': (x,t) => Math.sin(x*4+t*1.2)*0.6 + Math.sin(x*17+t*2.5)*0.3 + Math.random()*0.1,
            'thunder': (x,t) => Math.sin(x*2+t*0.5)*0.7 + Math.sin(x*9+t*3)*0.2,
            'fire': (x,t) => Math.sin(x*8+t*1.5)*0.4 + Math.sin(x*3+t*0.8)*0.3 + (Math.random()-0.5)*0.2,
            'cafe': (x,t) => Math.sin(x*6+t*0.7)*0.3 + Math.sin(x*11+t*1.3)*0.2 + (Math.random()-0.5)*0.15,
            'birds': (x,t) => Math.sin(x*12+t*3)*0.4 * Math.sin(t*2+x)*0.5,
            'waves': (x,t) => Math.sin(x*3+t*0.6)*0.6 + Math.sin(x*7+t*0.3)*0.3,
            'crickets': (x,t) => Math.sin(x*20+t*4)*0.3 * Math.sin(t*1.5)*0.5,
            'train': (x,t) => Math.sin(x*4+t*2)*0.4 + Math.sin(x*8+t*4)*0.2,
            'leaves': (x,t) => Math.sin(x*7+t*0.9)*0.3 + Math.sin(x*15+t*1.1)*0.2,
            'vinyl': (x,t) => Math.sin(x*10+t)*0.2 + (Math.random()-0.5)*0.3,
            'wind': (x,t) => Math.sin(x*3+t*0.4)*0.5 + Math.sin(x*9+t*0.7)*0.3,
            'snow': (x,t) => Math.sin(x*6+t*0.3)*0.3 + Math.sin(x*14+t*0.5)*0.15,
            'brown-noise': (x,t) => Math.sin(x*2+t*0.5)*0.6 + Math.sin(x*5+t*0.8)*0.3,
            'white-noise': (x,t) => (Math.random()-0.5)*0.7,
            'drone': (x,t) => Math.sin(x*2+t*0.3)*0.7 + Math.sin(x*4+t*0.15)*0.2,
        };
        const waveFn = WAVE_FN[layer.id] || ((x,t) => Math.sin(x*6+t)*0.5);
        const canvas = div.querySelector('.mix-wave');
        let waveFrame;
        function drawWave() {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            const vol = parseInt(div.querySelector('.mix-slider').value) / 100;
            ctx.clearRect(0, 0, w, h);
            if (vol <= 0) { waveFrame = null; return; }
            ctx.strokeStyle = `rgba(122, 138, 106, ${0.3 * vol})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const t = Date.now() / 1000;
            for (let x = 0; x < w; x++) {
                const nx = x / w;
                const y = h/2 + waveFn(nx * 6.28, t) * (h * 0.35) * vol;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
            waveFrame = requestAnimationFrame(drawWave);
        }

        // Label click = mute toggle
        let savedVol = 0;
        div.querySelector('.mix-label').addEventListener('click', () => {
            const current = parseInt(slider.value);
            if (current > 0) {
                savedVol = current;
                slider.value = 0;
                slider.dispatchEvent(new Event('input'));
                div.classList.add('muted');
            } else if (savedVol > 0) {
                slider.value = savedVol;
                slider.dispatchEvent(new Event('input'));
                div.classList.remove('muted');
            }
            uiTick();
        });

        container.appendChild(div);
        layerStates[layer.id] = { volume: 0, active: false, initialized: false };
    });

    // Show all toggle
    const toggle = document.createElement('button');
    toggle.className = 'mix-toggle';
    toggle.textContent = dashShowAll ? 'show fewer' : `show all ${LAYERS.length} layers`;
    toggle.addEventListener('click', () => {
        dashShowAll = !dashShowAll;
        localStorage.setItem('dash_show_all', dashShowAll);
        document.querySelectorAll('.mix-layer').forEach(el => {
            const layerId = el.id.replace('layer-', '');
            if (!FEATURED_LAYERS.includes(layerId)) {
                el.classList.toggle('hidden-layer', !dashShowAll);
            }
        });
        toggle.textContent = dashShowAll ? 'show fewer' : `show all ${LAYERS.length} layers`;
    });
    container.appendChild(toggle);
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
    uiTick();

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
            // Update tab title as a glanceable timer
            const phase = isFocus ? 'focus' : 'break';
            const name = currentSession ? currentSession.name : 'session';
            document.title = `${document.getElementById('timer-display').textContent} — ${name} | Nowhere Labs`;
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

function endSession() {
    clearInterval(timerInterval);
    timerRunning = false;

    // Fade out all audio over 5 seconds
    Object.entries(layerStates).forEach(([id, state]) => {
        if (state.type === 'sample' && state.audio && state.active) {
            const audio = state.audio;
            const fadeInterval = setInterval(() => {
                if (audio.volume > 0.02) audio.volume -= 0.02;
                else { audio.pause(); clearInterval(fadeInterval); }
            }, 100);
        } else if (state.type === 'synth' && state.gain && state.active) {
            state.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 5);
        }
    });

    // Quiet completion chime after fade
    setTimeout(() => uiChime(), 5000);
    document.getElementById('timer-display').textContent = 'done';
    document.getElementById('timer-phase').textContent = 'session complete';
    document.getElementById('timer-toggle').textContent = 'restart';
    document.title = 'session complete | Nowhere Labs';
    document.body.classList.remove('phase-break');
    // Track completion — our north star metric
    if (window.nwlTrack) {
        window.nwlTrack('session_complete', { session: currentSession?.name, rounds: sessions });
    }
}

function switchPhase() {
    if (isFocus) {
        sessions++;

        // Check if all rounds complete
        if (sessions >= 4) {
            endSession();
            return;
        }

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

// Music volume — controls Spotify embed visibility and iframe
let musicVolume = 0.5;
document.getElementById('music-vol').addEventListener('input', (e) => {
    musicVolume = e.target.value / 100;
    const embed = document.getElementById('radio-embed');
    if (embed) {
        const iframe = embed.querySelector('iframe');
        if (iframe) {
            iframe.style.opacity = musicVolume > 0 ? 1 : 0;
            iframe.style.pointerEvents = musicVolume > 0 ? 'auto' : 'none';
        }
        // At 0, mute by removing iframe src temporarily
        if (musicVolume === 0 && iframe) {
            iframe.dataset.src = iframe.src;
            iframe.src = '';
        } else if (musicVolume > 0 && iframe && !iframe.src && iframe.dataset.src) {
            iframe.src = iframe.dataset.src;
        }
    }
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
    btn.addEventListener('click', () => {
        uiPing();
        loadMoodTrack(btn.dataset.mood);
    });
});

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('timer-toggle').addEventListener('click', toggleTimer);

// Click timer display to set custom duration (only when not running)
document.getElementById('timer-display').addEventListener('click', () => {
    if (timerRunning) return;
    const mins = prompt('Focus duration (minutes):', Math.floor(timeRemaining / 60));
    if (mins && !isNaN(mins) && parseInt(mins) > 0 && parseInt(mins) <= 180) {
        timeRemaining = parseInt(mins) * 60;
        updateTimerDisplay();
        uiClick();
    }
});

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

// Session picker — cold start
const SESSION_DESCRIPTIONS = {
    'deep work': 'rain + brown noise. 25 min focus.',
    'creative flow': 'cafe + fire. 50 min sessions.',
    'wind down': 'fire + snow. gentle pace.',
    'morning start': 'birds + leaves. fresh energy.',
    'late night': 'rain + drone. long focus.',
};

function buildSessionPicker() {
    const container = document.getElementById('picker-cards');
    if (!container) return;
    DEFAULT_SESSIONS.forEach((session, i) => {
        const card = document.createElement('div');
        card.className = 'picker-card';
        card.innerHTML = `
            <div class="picker-card-name">${session.name}</div>
            <div class="picker-card-desc">${SESSION_DESCRIPTIONS[session.name] || ''}</div>
        `;
        card.addEventListener('click', () => {
            // Hide picker, show panels
            document.getElementById('session-picker').style.display = 'none';
            document.getElementById('panels').style.display = '';
            document.querySelector('.master-bar').style.display = '';
            // Load and start the session
            loadSession(session);
            loadMoodTrack('rain');
            // Init audio on this user gesture
            if (!audioCtx) initAudio();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            uiClick(); // tactile feedback
            toggleTimer();
            // Track session start
            if (window.nwlTrack) {
                window.nwlTrack('session_start', { session: session.name });
            }
        });
        container.appendChild(card);
    });

    // "Start empty" card — build your own session
    const emptyCard = document.createElement('div');
    emptyCard.className = 'picker-card picker-card-empty';
    emptyCard.innerHTML = `
        <div class="picker-card-name">start empty</div>
        <div class="picker-card-desc">build your own. all sliders at zero.</div>
    `;
    emptyCard.addEventListener('click', () => {
        document.getElementById('session-picker').style.display = 'none';
        document.getElementById('panels').style.display = '';
        document.querySelector('.master-bar').style.display = '';
        // Don't load a session — leave everything at zero
        loadMoodTrack('rain');
        if (!audioCtx) initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        uiClick();
        if (window.nwlTrack) window.nwlTrack('session_start', { session: 'custom' });
    });
    container.appendChild(emptyCard);
}

// Check if arriving from shared URL
if (loadSessionFromUrl()) {
    document.getElementById('session-picker').style.display = 'none';
    document.getElementById('panels').style.display = '';
    loadMoodTrack('rain');
} else {
    // Show picker, hide panels until selection
    document.querySelector('.master-bar').style.display = 'none';
    buildSessionPicker();
}
renderDots();
