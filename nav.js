// Nowhere Labs — Shared Navigation
// Add <script src="https://nowherelabs.dev/nav.js" defer></script> to any page

(function() {
    const links = [
        { label: 'NOWHERE LABS', href: 'https://nowherelabs.dev', home: true },
        { label: 'dashboard', href: 'https://nowherelabs.dev/dashboard/' },
        { label: 'mixer', href: 'https://drift.nowherelabs.dev' },
        { label: 'radio', href: 'https://static-fm.nowherelabs.dev' },
        { label: 'timer', href: 'https://pulse.nowherelabs.dev' },
        { label: 'letters', href: 'https://letters.nowherelabs.dev' },
        { label: 'sleep', href: 'https://drift.nowherelabs.dev/sleep.html' },
        // { label: 'chat', href: 'https://nowherelabs.dev/chat.html' }, // hidden for PH launch — re-enable when chat is reliably online
        { label: 'support', href: 'https://nowherelabs.dev/support.html' },
    ];

    const current = window.location.hostname + window.location.pathname;

    const nav = document.createElement('nav');
    nav.id = 'nwl-nav';

    const left = document.createElement('div');
    left.className = 'nwl-nav-left';
    const right = document.createElement('div');
    right.className = 'nwl-nav-right';

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.label;
        if (!link.href.includes(window.location.hostname)) a.target = '_blank';
        // Highlight current product
        if (link.href.includes(current) ||
            (window.location.hostname === 'drift.nowherelabs.dev' && link.label === 'mixer') ||
            (window.location.hostname === 'static-fm.nowherelabs.dev' && link.label === 'radio') ||
            (window.location.hostname === 'pulse.nowherelabs.dev' && link.label === 'timer') ||
            (window.location.hostname === 'letters.nowherelabs.dev' && link.label === 'letters') ||
            (window.location.pathname.includes('/sleep') && link.label === 'sleep') ||
            (window.location.pathname.includes('/dashboard') && link.label === 'dashboard')) {
            a.classList.add('nwl-nav-active');
        }
        if (link.home) left.appendChild(a);
        else right.appendChild(a);
    });

    nav.appendChild(left);
    nav.appendChild(right);
    document.body.prepend(nav);

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        #nwl-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            font-family: 'Space Mono', monospace;
            position: relative;
            z-index: 1000;
            background: rgba(6, 6, 10, 0.95);
        }
        #nwl-nav.nwl-sticky {
            position: sticky;
            top: 0;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }
        .nwl-nav-left a, .nwl-nav-right a {
            font-size: 9px;
            color: rgba(255,255,255,0.25);
            text-decoration: none;
            letter-spacing: 2px;
            transition: color 0.2s;
        }
        .nwl-nav-left a:hover, .nwl-nav-right a:hover { color: rgba(255,255,255,0.5); }
        .nwl-nav-active { color: rgba(255,255,255,0.4) !important; }
        .nwl-nav-right { display: flex; gap: 16px; }
        @media (max-width: 480px) {
            #nwl-nav { flex-direction: column; gap: 6px; text-align: center; }
            .nwl-nav-right { gap: 10px; flex-wrap: wrap; justify-content: center; }
            .nwl-nav-right a:nth-child(1),
            .nwl-nav-right a:nth-child(5),
            .nwl-nav-right a:nth-child(8) { display: none; }
        }
    `;
    document.head.appendChild(style);

    // Sticky nav on pages that scroll, not on single-screen app pages
    requestAnimationFrame(() => {
        if (document.body.scrollHeight > window.innerHeight + 100) {
            nav.classList.add('nwl-sticky');
        }
    });
})();
