/* ═══════════════════════════════════════════════════════════════
   ADMAV SEDE — Main JavaScript v2.0
   Unified PWA Shell + Interactions
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    initNavbar();
    initDrawer();
    initBottomNavActive();
    initCounterAnimation();
    initScrollReveal();
    initSmoothScroll();
    initPwaInstall();
    registerServiceWorker();
});

/* ─── Service Worker ─── */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered', reg.scope))
                .catch(err => console.log('SW error:', err));
        });
    }
}

/* ─── Installable App ─── */
function initPwaInstall() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    document.documentElement.classList.toggle('pwa-standalone', Boolean(isStandalone));

    let deferredPrompt = null;
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.className = 'btn btn-glass btn-sm pwa-install-button';
    installButton.hidden = true;
    installButton.innerHTML = '<i data-lucide="download"></i><span>Instalar</span>';
    navActions.prepend(installButton);
    if (window.lucide) lucide.createIcons();

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        installButton.hidden = false;
    });

    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        installButton.hidden = true;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        installButton.hidden = true;
        document.documentElement.classList.add('pwa-standalone');
    });
}

/* ─── Navbar Scroll Behavior ─── */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ─── PWA Drawer (Side Menu) ─── */
function initDrawer() {
    const toggle = document.getElementById('navToggle');
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const close = document.getElementById('closeDrawer');

    if (!drawer) return;

    const toggleDrawer = () => {
        const isOpen = drawer.classList.toggle('active');
        overlay?.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    const closeDrawer = () => {
        drawer.classList.remove('active');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
    };

    toggle?.addEventListener('click', toggleDrawer);
    close?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);

    // Close drawer on link click
    drawer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });
}

/* ─── Bottom Nav Active State ─── */
function initBottomNavActive() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        const href = item.getAttribute('href');
        item.classList.toggle('active', href === currentPage);
    });

    document.querySelectorAll('.drawer-nav .nav-link').forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === currentPage);
    });
}

/* ─── Counter Animation ─── */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    entry.target.dataset.animated = 'true';
                    animateCounter(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 2000;
    const startTime = performance.now();
    const suffix = target >= 100 ? '+' : target >= 10 ? '+' : '';

    const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        el.textContent = current + (progress < 1 ? '' : suffix);

        if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
}

/* ─── Scroll Reveal ─── */
function initScrollReveal() {
    const targets = document.querySelectorAll(
        '.about-card, .branch-card, .schedule-card, .about-verse, .agenda-card, .glass-card, .neu-card, .casados-section, .casados-pillar, .rede-card'
    );

    if (!targets.length) return;

    targets.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = `opacity 0.5s ease ${(i % 4) * 0.08}s, transform 0.5s ease ${(i % 4) * 0.08}s`;
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(el => observer.observe(el));
}

/* ─── Smooth Scroll ─── */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const id = anchor.getAttribute('href');
            if (id === '#') return;

            const target = document.querySelector(id);
            if (!target) return;

            e.preventDefault();
            const navHeight = document.getElementById('navbar')?.offsetHeight || 64;
            const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}
