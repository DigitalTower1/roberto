document.addEventListener('DOMContentLoaded', () => {
    // === 1. CONFIGURAZIONE PARTICLES.JS ===
    const particlesConfig = { "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true, "anim": { "enable": true, "speed": 0.4, "opacity_min": 0.1, "sync": false } }, "size": { "value": 2.5, "random": true, "anim": { "enable": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.2, "width": 1 }, "move": { "enable": true, "speed": 1.2, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": false }, "resize": true }, "modes": { "repulse": { "distance": 80, "duration": 0.4 } } }, "retina_detect": true };
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', particlesConfig);
    }

    // === 2. SELETTORI DEGLI ELEMENTI DOM ===
    const cardContainer = document.getElementById('card-container');
    const cardFlipper = document.getElementById('card-flipper');
    const promptOverlay = document.getElementById('prompt-overlay');
    const shareOverlay = document.getElementById('share-overlay');
    const iosInstallPrompt = document.getElementById('ios-install-prompt');
    const appointmentOverlay = document.getElementById('appointment-overlay');
    const contactOverlay = document.getElementById('contact-overlay');
    
    const sfxClick = document.getElementById('sfx-click');
    const sfxFlip = document.getElementById('sfx-flip');
    const sfxPrompt = document.getElementById('sfx-prompt');

    let deferredPrompt;
    const installButtons = document.querySelectorAll('.install-btn');

    // === 3. FUNZIONI PRINCIPALI ===
    
    function handleInitialPrompt(shouldDownload) {
        playSound(sfxPrompt);
        if (shouldDownload) {
            const link = document.createElement('a');
            link.href = 'roberto_personal.vcf';
            link.download = 'roberto_personal.vcf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        promptOverlay.classList.add('hidden');
        cardContainer.classList.add('is-visible');
        showInstallPrompt();
    }
    
    const playSound = (sound) => {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {}); // Ignora errori se l'utente non ha interagito
        }
    };

    const flipCard = () => {
        playSound(sfxFlip);
        cardFlipper.classList.toggle('is-flipped');
    };

    const updateShareLinks = () => {
        const pageUrl = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent("Dai un'occhiata alla business card di Roberto Esposito!");
        const emailSubject = encodeURIComponent("Business Card di Roberto Esposito");
        const emailBody = encodeURIComponent(`Dai un'occhiata alla sua business card: ${window.location.href}`);

        document.getElementById('share-whatsapp').href = `https://api.whatsapp.com/send?text=${shareText}%20${pageUrl}`;
        document.getElementById('share-telegram').href = `https://t.me/share/url?url=${pageUrl}&text=${shareText}`;
        document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
        document.getElementById('share-email').href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    };

    // --- Logica Installazione PWA ---
    const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    const showInstallPrompt = () => {
        if (deferredPrompt) {
            installButtons.forEach(btn => btn.style.display = 'flex');
            return;
        }
        if (isIOS() && !isInStandaloneMode()) {
            setTimeout(() => {
                if (iosInstallPrompt) iosInstallPrompt.classList.add('is-visible');
            }, 3000);
        }
    };

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButtons.forEach(btn => btn.style.display = 'flex');
    });

    const installPWA = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
        }
    };

    // --- Logica Swipe ---
    let touchstartX = 0;
    let touchendX = 0;
    const swipeThreshold = 50;

    cardContainer.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
    cardContainer.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        if (Math.abs(touchendX - touchstartX) >= swipeThreshold) {
            flipCard();
        }
    }, { passive: true });

    // === 4. EVENT LISTENER ===
    
    // Prompt iniziale
    document.getElementById('prompt-yes').addEventListener('click', () => handleInitialPrompt(true));
    document.getElementById('prompt-no').addEventListener('click', () => handleInitialPrompt(false));
    
    // Gestione chiusura overlay generica
    const closeOverlay = (overlay) => {
        playSound(sfxClick);
        overlay.classList.add('hidden');
    }
    
    // Share Overlay
    document.querySelectorAll('.open-share-btn').forEach(btn => btn.addEventListener('click', () => {
        playSound(sfxClick);
        shareOverlay.classList.remove('hidden');
    }));
    document.getElementById('close-share-btn').addEventListener('click', () => closeOverlay(shareOverlay));
    
    // iOS Prompt
    const closeIosPromptBtn = document.getElementById('close-ios-prompt');
    if(closeIosPromptBtn) {
        closeIosPromptBtn.addEventListener('click', () => {
            if(iosInstallPrompt) iosInstallPrompt.classList.remove('is-visible');
        });
    }

    // Bottoni principali
    document.querySelectorAll('.flip-btn').forEach(btn => btn.addEventListener('click', flipCard));
    document.querySelectorAll('.add-contact-btn').forEach(btn => btn.addEventListener('click', () => playSound(sfxClick)));
    installButtons.forEach(btn => btn.addEventListener('click', installPWA));

    // === 5. NUOVE FUNZIONALITÀ ===

    // --- Funzionalità Calendario (.ics) ---
    function generateAndDownloadICS(startDate, durationMinutes, title, description) {
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        const toUTCString = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const icsContent = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RobertoEsposito//DigitalCard//IT',
            'BEGIN:VEVENT', `UID:${Date.now()}@robertoesposito.com`, `DTSTAMP:${toUTCString(new Date())}`,
            `DTSTART:${toUTCString(startDate)}`, `DTEND:${toUTCString(endDate)}`, `SUMMARY:${title}`, `DESCRIPTION:${description}`,
            'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', 'DESCRIPTION:Promemoria', 'END:VALARM',
            'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', 'DESCRIPTION:Promemoria', 'END:VALARM',
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'appuntamento.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    document.querySelectorAll('.appointment-btn').forEach(btn => btn.addEventListener('click', () => {
        playSound(sfxClick);
        appointmentOverlay.classList.remove('hidden');
    }));
    document.getElementById('close-appointment-btn').addEventListener('click', () => closeOverlay(appointmentOverlay));
    document.getElementById('generate-ics-btn').addEventListener('click', () => {
        const dateValue = document.getElementById('appointment-date').value;
        const timeValue = document.getElementById('appointment-time').value;
        const notes = document.getElementById('appointment-notes').value || 'Appuntamento con Roberto Esposito';
        if (!dateValue || !timeValue) { alert('Per favore, seleziona data e ora.'); return; }
        const startDate = new Date(`${dateValue}T${timeValue}`);
        generateAndDownloadICS(startDate, 60, notes, 'Dettagli da definire.');
        closeOverlay(appointmentOverlay);
    });
    
    // --- Funzionalità Modulo di Contatto ---
    document.querySelectorAll('.contact-me-btn').forEach(btn => btn.addEventListener('click', () => {
        playSound(sfxClick);
        contactOverlay.classList.remove('hidden');
    }));
    document.getElementById('close-contact-btn').addEventListener('click', () => closeOverlay(contactOverlay));

    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        formStatus.textContent = 'Invio in corso...';
        formStatus.style.color = 'white';

        try {
            const response = await fetch(form.action, {
                method: form.method, body: formData, headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                formStatus.textContent = 'Grazie! Messaggio inviato con successo.';
                formStatus.style.color = 'var(--primary-color)';
                form.reset();
                setTimeout(() => { closeOverlay(contactOverlay); formStatus.textContent = ''; }, 3000);
            } else { throw new Error('Errore di rete o del server.'); }
        } catch (error) {
            formStatus.textContent = 'Oops! C\'è stato un problema. Riprova più tardi.';
            formStatus.style.color = '#ff4d4d';
        }
    });

    // === 6. INIZIALIZZAZIONE ===
    updateShareLinks();
    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service worker registrato.'))
                .catch(err => console.error('Errore registrazione service worker:', err));
        });
    }
});
