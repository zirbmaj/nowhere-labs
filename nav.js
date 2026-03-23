// Nowhere Labs — Shared Navigation
// Add <script src="https://nowherelabs.dev/nav.js" defer></script> to any page

(function() {
    const links = [
        { label: 'NOWHERE LABS', href: 'https://nowherelabs.dev', home: true },
        { label: 'dashboard', href: 'https://nowherelabs.dev/dashboard/' },
        { label: 'mixer', href: 'https://drift.nowherelabs.dev' },
        { label: 'radio', href: 'https://static-fm.nowherelabs.dev' },
        { label: 'timer', href: 'https://pulse.nowherelabs.dev' },
        { label: 'chat', href: 'https://nowherelabs.dev/chat.html' },
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
            (window.location.pathname.includes('/dashboard') && link.label === 'dashboard') ||
            (window.location.pathname.includes('/chat') && link.label === 'chat')) {
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
            border-bottom: 1px solid rgba(255,255,255,0.03);
            font-family: 'Space Mono', monospace;
            position: relative;
            z-index: 1000;
        }
        .nwl-nav-left a, .nwl-nav-right a {
            font-size: 9px;
            color: rgba(255,255,255,0.15);
            text-decoration: none;
            letter-spacing: 2px;
            transition: color 0.2s;
        }
        .nwl-nav-left a:hover, .nwl-nav-right a:hover { color: rgba(255,255,255,0.4); }
        .nwl-nav-active { color: rgba(255,255,255,0.3) !important; }
        .nwl-nav-right { display: flex; gap: 16px; }
        @media (max-width: 480px) {
            #nwl-nav { flex-direction: column; gap: 6px; text-align: center; }
            .nwl-nav-right { gap: 10px; flex-wrap: wrap; justify-content: center; }
        }
    `;
    document.head.appendChild(style);
})();
