// Nowhere Labs Analytics v2 — event batching, scroll depth, time-on-page
// Embed: <script src="https://nowherelabs.dev/track.js" data-project="drift"></script>

(function() {
    const SUPABASE_URL = 'https://lxecuywjwasxijxgnutn.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZWN1eXdqd2FzeGlqeGdudXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDM3OTIsImV4cCI6MjA4OTcxOTc5Mn0.Wyq_doDaRZ7EfdpwM2W0_BNtaVI47yN-4cy4yTWl7jo';

    const script = document.currentScript;
    const PROJECT = script?.getAttribute('data-project') || 'unknown';

    // Skip bots
    const ua = navigator.userAgent || '';
    if (/bot|crawl|spider|headless|screenshot|vercel|prerender|lighthouse/i.test(ua)) return;

    // Persistent user ID (retention tracking)
    let userId = localStorage.getItem('nwl_uid');
    if (!userId) {
        userId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('nwl_uid', userId);
    }

    // Session ID (per-tab)
    let sessionId = sessionStorage.getItem('nwl_sid');
    if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('nwl_sid', sessionId);
    }

    // UTM capture — first-touch
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(k => {
        const v = params.get(k);
        if (v) utm[k] = v;
    });
    if (Object.keys(utm).length > 0 && !localStorage.getItem('nwl_utm')) {
        localStorage.setItem('nwl_utm', JSON.stringify(utm));
    }
    const savedUtm = JSON.parse(localStorage.getItem('nwl_utm') || '{}');

    // ============================================
    // EVENT BATCHING — queue events, flush every 5s
    // ============================================
    let eventQueue = [];

    function queueEvent(event, data) {
        eventQueue.push({
            project: PROJECT,
            event: event,
            data: { ...(data || {}), ...savedUtm },
            session_id: sessionId,
            user_id: userId,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
        });
    }

    function flushQueue() {
        if (eventQueue.length === 0) return;
        const batch = eventQueue.splice(0, 50);
        const url = `${SUPABASE_URL}/rest/v1/analytics_events`;
        // Supabase REST supports array insert — one POST for the whole batch
        fetch(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(batch),
            keepalive: true,
        }).catch(() => {});
    }

    // Flush every 5 seconds
    setInterval(flushQueue, 5000);

    // Flush on page unload
    window.addEventListener('beforeunload', flushQueue);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushQueue();
    });

    // Public track function (queues instead of sending immediately)
    function track(event, data) {
        queueEvent(event, data);
    }

    // ============================================
    // AUTO-TRACKING
    // ============================================

    // Pageview
    const pageStart = Date.now();
    track('pageview', {
        path: window.location.pathname,
        search: window.location.search,
        title: document.title,
    });

    // Scroll depth — track 25%, 50%, 75%, 100%
    const scrollMilestones = new Set();
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        const pct = Math.round((scrollTop / docHeight) * 100);
        [25, 50, 75, 100].forEach(milestone => {
            if (pct >= milestone && !scrollMilestones.has(milestone)) {
                scrollMilestones.add(milestone);
                track('scroll_depth', { depth: milestone, path: window.location.pathname });
            }
        });
    }, { passive: true });

    // Time on page — tracked via Page Visibility API
    let visibleTime = 0;
    let lastVisible = Date.now();
    let isVisible = true;

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            visibleTime += Date.now() - lastVisible;
            isVisible = false;
            // Send page_exit with accurate time
            track('page_exit', {
                path: window.location.pathname,
                duration_ms: visibleTime,
                duration_s: Math.round(visibleTime / 1000),
                max_scroll: Math.max(...scrollMilestones, 0),
            });
            flushQueue(); // flush immediately on hide
        } else {
            lastVisible = Date.now();
            isVisible = true;
        }
    });

    // Auto-track elements with data-nwl-track attribute
    // e.g., <button data-nwl-track="cta_click" data-nwl-label="start mixing">
    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-nwl-track]');
        if (el) {
            track(el.dataset.nwlTrack, {
                label: el.dataset.nwlLabel || el.textContent.trim().slice(0, 50),
                path: window.location.pathname,
            });
        }
    });

    // Expose for custom events
    window.nwlTrack = track;
})();
