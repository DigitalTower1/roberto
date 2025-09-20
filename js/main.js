document.addEventListener('DOMContentLoaded', () => {
    // === 1. CONFIGURAZIONE PARTICLES.JS ===
    const particlesConfig = {
        "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle" }, "opacity": { "value": 0.5, "random": true, "anim": { "enable": true, "speed": 0.4, "opacity_min": 0.1, "sync": false } }, "size": { "value": 2.5, "random": true, "anim": { "enable": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.2, "width": 1 }, "move": { "enable": true, "speed": 1.2, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": false }, "resize": true }, "modes": { "repulse": { "distance": 80, "duration": 0.4 } } }, "retina_detect": true
    };
    particlesJS('particles-js', particlesConfig);

    // === 2. SELETTORI DEGLI ELEMENTI DOM ===
    const cardContainer = document.getElementById('card-container');
    const cardFlipper = document.getElementById('card-flipper');
    const promptOverlay = document.getElementById('prompt-overlay');
    const shareOverlay = document.getElementById('share-overlay');
    const iosInstallPrompt = document.getElementById('ios-install-prompt');
    
    const sfxClick = document.getElementById('sfx-click');
    const sfxFlip = document.getElementById('sfx-flip');
    const sfxPrompt = document.getElementById('sfx-prompt');

    let deferredPrompt;
    const installButtons = document.querySelectorAll('.install-btn');

    // === 3. FUNZIONI PRINCIPALI ===
    const playSound = (sound) => {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {});
        }
    };

    const flipCard = () => {
        playSound(sfxFlip);
        cardFlipper.classList.toggle('is-flipped');
    };

    const handlePrompt = (shouldDownload) => {
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
    };

    const openSharePopup = () => {
        playSound(sfxClick);
        shareOverlay.classList.remove('hidden');
    };

    const closeSharePopup = () => {
        playSound(sfxClick);
        shareOverlay.classList.add('hidden');
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

    cardContainer.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
    }, { passive: true });

    cardContainer.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        if (Math.abs(touchendX - touchstartX) >= swipeThreshold) {
            flipCard();
        }
    }, { passive: true });

    // === 4. EVENT LISTENER ===
    document.getElementById('prompt-yes').addEventListener('click', () => handlePrompt(true));
    document.getElementById('prompt-no').addEventListener('click', () => handlePrompt(false));
    
    document.getElementById('close-share-btn').addEventListener('click', closeSharePopup);
    shareOverlay.addEventListener('click', closeSharePopup);
    document.querySelector('.share-box').addEventListener('click', (e) => e.stopPropagation());
    
    const closeIosPromptBtn = document.getElementById('close-ios-prompt');
    if(closeIosPromptBtn) {
        closeIosPromptBtn.addEventListener('click', () => {
            if(iosInstallPrompt) iosInstallPrompt.classList.remove('is-visible');
        });
    }

    document.querySelectorAll('.flip-btn').forEach(btn => btn.addEventListener('click', flipCard));
    document.querySelectorAll('.open-share-btn').forEach(btn => btn.addEventListener('click', openSharePopup));
    document.querySelectorAll('.add-contact-btn').forEach(btn => btn.addEventListener('click', () => playSound(sfxClick)));
    installButtons.forEach(btn => btn.addEventListener('click', installPWA));

    // === 5. INIZIALIZZAZIONE ===
    updateShareLinks();
    
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service worker registrato.'))
                .catch(err => console.error('Errore registrazione service worker:', err));
        });
    }
});
