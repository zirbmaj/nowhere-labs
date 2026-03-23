// Nowhere Labs Analytics — lightweight event tracking
// Embed on any project: <script src="https://nowherelabs.dev/track.js" data-project="drift"></script>

(function() {
    const SUPABASE_URL = 'https://lxecuywjwasxijxgnutn.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZWN1eXdqd2FzeGlqeGdudXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDM3OTIsImV4cCI6MjA4OTcxOTc5Mn0.Wyq_doDaRZ7EfdpwM2W0_BNtaVI47yN-4cy4yTWl7jo';

    const script = document.currentScript;
    const PROJECT = script?.getAttribute('data-project') || 'unknown';

    // Skip bots and automated tools
    const ua = navigator.userAgent || '';
    if (/bot|crawl|spider|headless|screenshot|vercel|prerender|lighthouse/i.test(ua)) return;

    // Persistent user ID for retention tracking (survives tab close)
    let userId = localStorage.getItem('nwl_uid');
    if (!userId) {
        userId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('nwl_uid', userId);
    }

    // Session ID per tab (for session-level analytics)
    let sessionId = sessionStorage.getItem('nwl_sid');
    if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('nwl_sid', sessionId);
    }

    // UTM capture — first-touch attribution
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(k => {
        const v = params.get(k);
        if (v) utm[k] = v;
    });
    // Store first-touch UTMs (never overwrite)
    if (Object.keys(utm).length > 0 && !localStorage.getItem('nwl_utm')) {
        localStorage.setItem('nwl_utm', JSON.stringify(utm));
    }
    const savedUtm = JSON.parse(localStorage.getItem('nwl_utm') || '{}');

    function track(event, data) {
        const payload = {
            project: PROJECT,
            event: event,
            data: { ...(data || {}), ...savedUtm },
            session_id: sessionId,
            user_id: userId,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
        };

        // Use sendBeacon for reliability (survives page unload)
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const url = `${SUPABASE_URL}/rest/v1/analytics_events`;

        if (navigator.sendBeacon) {
            const headers = new Headers({
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            });
            // sendBeacon doesn't support custom headers, fall back to fetch
            fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify(payload),
                keepalive: true,
            }).catch(() => {});
        }
    }

    // Auto-track pageview
    track('pageview', {
        path: window.location.pathname,
        search: window.location.search,
        title: document.title,
    });

    // Expose for custom events
    window.nwlTrack = track;
})();
