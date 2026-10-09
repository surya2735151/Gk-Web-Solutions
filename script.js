/* GK Web Solutions - script.js */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* 1. Scroll progress bar + navbar (shrinks, hides while scrolling down) */
const navbar = $('#navbar');
const bar = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'progress' }));
let lastY = 0;
addEventListener('scroll', () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    navbar.classList.toggle('scrolled', y > 50);
    navbar.classList.toggle('hide', y > lastY && y > 400 && !$('#nav-menu').classList.contains('active'));
    lastY = y;
}, { passive: true });

/* 2. Mobile menu */
const hamburger = $('#hamburger'), navMenu = $('#nav-menu');
function setMenu(open) {
    navMenu.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    const icon = $('i', hamburger);
    icon.classList.toggle('fa-bars', !open);
    icon.classList.toggle('fa-xmark', open);
    document.body.style.overflow = open ? 'hidden' : '';
}
hamburger.addEventListener('click', () => setMenu(!navMenu.classList.contains('active')));
$$('a', navMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));

/* 3. Active nav link follows the section in view */
const links = $$('.nav-link');
const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('section[id]').forEach(s => spy.observe(s));

/* 4. Hero headline: words slide up one by one */
const title = $('.hero-title');
if (title && !reduce) {
    let i = 0;
    (function wrap(node) {
        [...node.childNodes].forEach(n => {
            if (n.nodeType === 3) {
                const f = document.createDocumentFragment();
                n.textContent.split(/(\s+)/).forEach(t => {
                    if (!t.trim()) { f.append(t); return; }
                    const w = Object.assign(document.createElement('span'), { className: 'w' });
                    const inner = Object.assign(document.createElement('span'), { className: 'wi', textContent: t });
                    inner.style.setProperty('--i', i++);
                    w.append(inner); f.append(w);
                });
                n.replaceWith(f);
            } else if (n.nodeType === 1) wrap(n);
        });
    })(title);
}

/* 5. Section titles reveal once as they enter */
const rvObs = new IntersectionObserver((es, o) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); }
}), { threshold: 0.3 });
if (!reduce) $$('.section-title').forEach(t => { t.classList.add('rv'); rvObs.observe(t); });

/* 6. FAQ accordion (keyboard accessible) */
const faqs = $$('.faq-item');
const setFaq = (item, open) => {
    item.classList.toggle('active', open);
    const a = $('.faq-answer', item);
    a.style.maxHeight = open ? a.scrollHeight + 'px' : null;
    $('.faq-question', item).setAttribute('aria-expanded', String(open));
};
faqs.forEach(item => {
    const q = $('.faq-question', item);
    q.setAttribute('role', 'button'); q.tabIndex = 0; q.setAttribute('aria-expanded', 'false');
    const toggle = () => { const was = item.classList.contains('active'); faqs.forEach(f => setFaq(f, false)); if (!was) setFaq(item, true); };
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});

/* 7. Contact form -> pre-filled WhatsApp message */
function handleFormSubmit(e) {
    e.preventDefault();
    const v = id => (document.getElementById(id)?.value || '').trim();
    const text = [
        'Hi Gopal, I am interested in getting a website for my business.', '',
        `*Name:* ${v('client_name')}`, `*Business Name:* ${v('business_name')}`,
        `*Phone:* ${v('phone_number')}`, `*Type:* ${v('business_type')}`,
        `*Requirements:* ${v('message') || 'Not specified'}`
    ].join('\n');
    window.open('https://wa.me/919345220889?text=' + encodeURIComponent(text), '_blank', 'noopener');
}

/* Keep an expanded FAQ answer fully visible after viewport changes/orientation. */
let faqResizeFrame = 0;
addEventListener('resize', () => {
    cancelAnimationFrame(faqResizeFrame);
    faqResizeFrame = requestAnimationFrame(() => {
        faqs.forEach(item => {
            if (item.classList.contains('active')) {
                const answer = $('.faq-answer', item);
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
}, { passive: true });


/* Professional reveal-on-scroll: stagger related cards, animate once, and keep fallbacks visible. */
if (!reduce && 'IntersectionObserver' in window) {
    const revealTargets = $$('.section-header, .service-card, .industry-card, .feature-box, .process-card, .pricing-card, .about-box, .contact-info-card, .contact-form, .faq-item');
    revealTargets.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        // Stagger each local group, not the entire page, so later sections never wait too long.
        const siblings = [...(el.parentElement?.children || [])].filter(node => node.matches('.scroll-reveal'));
        const position = Math.max(0, siblings.indexOf(el));
        el.style.setProperty('--reveal-delay', `${Math.min(position, 4) * 65}ms`);
        if (el.matches('.contact-info-card')) el.classList.add('reveal-left');
    });
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
} else {
    $$('.scroll-reveal').forEach(el => el.classList.add('is-visible'));
}

/* Anchor navigation: account for the fixed header and close the mobile menu reliably. */
$$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        setMenu(false);
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', id);
    });
});

/* Recalculate FAQ height after fonts/layout finish changing. */
addEventListener('load', () => {
    faqs.forEach(item => {
        if (item.classList.contains('active')) {
            const answer = $('.faq-answer', item);
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
}, { once: true });
