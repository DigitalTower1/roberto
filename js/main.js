document.addEventListener('DOMContentLoaded', () => {
    // ... all'interno dell'evento DOMContentLoaded ...

// --- Logica Installazione PWA (REVISIONATA) ---

// Funzione per rilevare se siamo su iOS
const isIOS = () => {
    return [
        'iPad Simulator', 'iPhone Simulator', 'iPod Simulator',
        'iPad', 'iPhone', 'iPod'
    ].includes(navigator.platform)
    // Inoltre, controlliamo che non sia già in modalità standalone (app installata)
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};

// Funzione per rilevare se l'app è in esecuzione come PWA installata
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

// Logica che si avvia dopo la comparsa della card
function showInstallPrompt() {
    // Se l'evento per l'installazione personalizzata è disponibile (Chrome etc.)
    if (deferredPrompt) {
        installButtons.forEach(btn => btn.style.display = 'flex');
        return; // Non facciamo altro
    }
    
    // Se siamo su iOS e l'app NON è ancora stata installata
    if (isIOS() && !isInStandaloneMode()) {
        const iosPrompt = document.getElementById('ios-install-prompt');
        // Mostra il banner dopo un breve ritardo per non essere troppo aggressivo
        setTimeout(() => {
            if (iosPrompt) iosPrompt.classList.add('is-visible');
        }, 3000); // 3 secondi
    }
}

// Chiameremo showInstallPrompt() dopo che l'utente ha interagito con il primo prompt
// Modifica la tua funzione handlePrompt
const handlePrompt = (shouldDownload) => {
    // ... codice esistente ...
    promptOverlay.classList.add('hidden');
    cardContainer.classList.add('is-visible');
    
    // === NUOVO: Avvia la logica di installazione QUI ===
    showInstallPrompt();
};

// ... e aggiungi un listener per chiudere il banner iOS
const closeIosPromptBtn = document.getElementById('close-ios-prompt');
const iosPrompt = document.getElementById('ios-install-prompt');
if(closeIosPromptBtn && iosPrompt) {
    closeIosPromptBtn.addEventListener('click', () => {
        iosPrompt.classList.remove('is-visible');
    });
}
    // === NUOVO: Logica per lo swipe della card ===
let touchstartX = 0;
let touchendX = 0;
const swipeThreshold = 50; // La distanza minima in pixel per considerare uno swipe

const handleSwipe = () => {
    const swipeDistance = touchendX - touchstartX;
    if (Math.abs(swipeDistance) >= swipeThreshold) {
        // Se lo swipe è sufficientemente lungo, gira la card
        flipCard();
    }
};

cardContainer.addEventListener('touchstart', e => {
    // Registra la posizione iniziale del tocco sull'asse X
    touchstartX = e.changedTouches[0].screenX;
}, { passive: true }); // passive: true per migliori performance di scrolling (anche se qui non serve)

cardContainer.addEventListener('touchend', e => {
    // Registra la posizione finale del tocco
    touchendX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });
    // === OTTIMIZZAZIONE: Caching dei selettori DOM ===
    const particlesConfig = {
    "particles": {
        "number": {
            "value": 80, // Aumentato leggermente per un effetto più pieno con le linee
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": "#ffffff"
        },
        "shape": {
            "type": "circle"
        },
        "opacity": {
            "value": 0.5, // Opacità ridotta per un effetto più "soft"
            "random": true,
            "anim": {
                "enable": true,
                "speed": 0.4,
                "opacity_min": 0.1,
                "sync": false
            }
        },
        "size": {
            "value": 2.5, // Particelle molto più piccole
            "random": true,
            "anim": {
                "enable": false // L'animazione della dimensione può appesantire
            }
        },
        "line_linked": {
            "enable": true, // La magia è qui: le linee che collegano
            "distance": 150,
            "color": "#ffffff",
            "opacity": 0.2, // Linee molto tenui
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 1.2, // Movimento lento e costante
            "direction": "none",
            "random": true,
            "straight": false,
            "out_mode": "out",
            "bounce": false
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "repulse" // Un piccolo effetto interattivo al passaggio del mouse
            },
            "onclick": {
                "enable": false // Disabilitato per non interferire con la card
            },
            "resize": true
        },
        "modes": {
            "repulse": {
                "distance": 80,
                "duration": 0.4
            }
        }
    },
    "retina_detect": true
};

    const cardContainer = document.getElementById('card-container');
    const cardFlipper = document.getElementById('card-flipper');
    const promptOverlay = document.getElementById('prompt-overlay');
    const shareOverlay = document.getElementById('share-overlay');
    
    const sfxClick = document.getElementById('sfx-click');
    const sfxFlip = document.getElementById('sfx-flip');
    const sfxPrompt = document.getElementById('sfx-prompt');

    const music = document.getElementById('bg-music');
    const musicIcons = [document.getElementById('music-icon-front'), document.getElementById('music-icon-back')];

    let deferredPrompt;
    const installButtons = document.querySelectorAll('.install-btn');

    // --- Funzioni di Utilità ---
    const playSound = (sound) => {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.warn("Interazione utente richiesta per l'audio."));
        }
    };

    // --- Logica della Card ---
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
    };

    // --- Logica di Condivisione ---
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

    // --- Logica Musica (se presente) ---
    const toggleMusic = () => {
        playSound(sfxClick);
        if (!music) return;
        
        const isPlaying = !music.paused;
        if (isPlaying) {
            music.pause();
        } else {
            music.play().catch(e => console.warn("Impossibile riprodurre la musica di sottofondo."));
        }
        
        const iconClassAdd = isPlaying ? 'fa-play' : 'fa-pause';
        const iconClassRemove = isPlaying ? 'fa-pause' : 'fa-play';
        musicIcons.forEach(icon => {
            if (icon) {
                icon.classList.remove(iconClassRemove);
                icon.classList.add(iconClassAdd);
            }
        });
    };

    // --- Logica Installazione PWA ---
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButtons.forEach(btn => btn.style.display = 'flex');
    });

    const installPWA = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installButtons.forEach(b => b.style.display = 'none');
        }
    };
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        deferredPrompt = null;
        installButtons.forEach(btn => btn.style.display = 'none');
    });

    // === OTTIMIZZAZIONE: Event Listener centralizzati ===
    document.getElementById('prompt-yes').addEventListener('click', () => handlePrompt(true));
    document.getElementById('prompt-no').addEventListener('click', () => handlePrompt(false));
    
    document.getElementById('close-share-btn').addEventListener('click', closeSharePopup);
    shareOverlay.addEventListener('click', closeSharePopup);
    document.querySelector('.share-box').addEventListener('click', (e) => e.stopPropagation());

    document.querySelectorAll('.flip-btn').forEach(btn => btn.addEventListener('click', flipCard));
    document.querySelectorAll('.open-share-btn').forEach(btn => btn.addEventListener('click', openSharePopup));
    document.querySelectorAll('.music-toggle').forEach(btn => btn.addEventListener('click', toggleMusic));
    document.querySelectorAll('.add-contact-btn').forEach(btn => btn.addEventListener('click', () => playSound(sfxClick)));
    installButtons.forEach(btn => btn.addEventListener('click', installPWA));
    
    // --- Inizializzazione ---
    updateShareLinks();
    
    // Registrazione del Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service worker registrato con successo.', reg))
                .catch(err => console.log('Errore nella registrazione del service worker.', err));
        });
    }

});

