/* js/main.js */
document.addEventListener('DOMContentLoaded', () => {
  // === 1) PARTICELLE ===
  const particlesConfig = {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: '#ffffff' },
      shape: { type: 'circle' },
      opacity: { value: 0.5, random: true, anim: { enable: true, speed: 0.4, opacity_min: 0.1, sync: false } },
      size: { value: 2.5, random: true, anim: { enable: false } },
      line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.2, width: 1 },
      move: { enable: true, speed: 1.2, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: { detect_on: 'canvas', events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: false }, resize: true }, modes: { repulse: { distance: 80, duration: 0.4 } } },
    retina_detect: true
  };
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', particlesConfig);
  }

  // === 2) SELETTORI ===
  const $ = (sel) => document.querySelector(sel);
  const cardContainer = $('#card-container');
  const cardFlipper = $('#card-flipper');
  const promptOverlay = $('#prompt-overlay');
  const shareOverlay = $('#share-overlay');
  const iosInstallPrompt = $('#ios-install-prompt');
  const appointmentOverlay = $('#appointment-overlay');
  const contactOverlay = $('#contact-overlay');

  const sfxClick = $('#sfx-click');
  const sfxFlip = $('#sfx-flip');
  const sfxPrompt = $('#sfx-prompt');

  let deferredPrompt;
  const installButtons = document.querySelectorAll('.install-btn');

  // === 3) FUNZIONI ===
  const playSound = (audioEl) => {
    if (!audioEl) return;
    audioEl.currentTime = 0;
    audioEl.play().catch(() => {});
  };

  const flipCard = () => {
    playSound(sfxFlip);
    cardFlipper.classList.toggle('is-flipped');
  };

  const updateShareLinks = () => {
    const pageUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent("Dai un'occhiata alla business card di Roberto Esposito!");
    const emailSubject = encodeURIComponent('Business Card di Roberto Esposito');
    const emailBody = encodeURIComponent(`Dai un'occhiata alla sua business card: ${window.location.href}`);

    $('#share-whatsapp').href = `https://api.whatsapp.com/send?text=${shareText}%20${pageUrl}`;
    $('#share-telegram').href = `https://t.me/share/url?url=${pageUrl}&text=${shareText}`;
    $('#share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
    $('#share-email').href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
  };

  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

  const showInstallPrompt = () => {
    if (deferredPrompt) {
      installButtons.forEach((btn) => (btn.style.display = 'flex'));
      return;
    }
    if (isIOS() && !isInStandaloneMode()) {
      setTimeout(() => { iosInstallPrompt?.classList.add('is-visible'); }, 3000);
    }
  };

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

  const closeOverlay = (overlay) => {
    playSound(sfxClick);
    overlay.classList.add('hidden');
  };

  // Chiudi overlay con ESC o click fuori
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [shareOverlay, appointmentOverlay, contactOverlay].forEach((ov) => ov?.classList.add('hidden'));
    }
  });
  [shareOverlay, appointmentOverlay, contactOverlay].forEach((ov) => {
    ov?.addEventListener('click', (e) => {
      if (e.target === ov) closeOverlay(ov);
    });
  });

  // Swipe per flip
  let touchstartX = 0, touchendX = 0;
  const swipeThreshold = 50;
  cardContainer.addEventListener('touchstart', (e) => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
  cardContainer.addEventListener('touchend', (e) => {
    touchendX = e.changedTouches[0].screenX;
    if (Math.abs(touchendX - touchstartX) >= swipeThreshold) flipCard();
  }, { passive: true });

  // === 4) EVENTI ===
  $('#prompt-yes').addEventListener('click', () => handleInitialPrompt(true));
  $('#prompt-no').addEventListener('click', () => handleInitialPrompt(false));

  document.querySelectorAll('.open-share-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      playSound(sfxClick);
      shareOverlay.classList.remove('hidden');
    })
  );
  $('#close-share-btn').addEventListener('click', () => closeOverlay(shareOverlay));

  const closeIosPromptBtn = $('#close-ios-prompt');
  closeIosPromptBtn?.addEventListener('click', () => iosInstallPrompt?.classList.remove('is-visible'));

  document.querySelectorAll('.flip-btn').forEach((btn) => btn.addEventListener('click', flipCard));
  document.querySelectorAll('.add-contact-btn').forEach((btn) => btn.addEventListener('click', () => playSound(sfxClick)));

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButtons.forEach((btn) => (btn.style.display = 'flex'));
  });

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
  installButtons.forEach((btn) => btn.addEventListener('click', installPWA));

  // Appuntamenti (ICS)
  function generateAndDownloadICS(startDate, durationMinutes, title, description) {
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const toUTC = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RobertoEsposito//DigitalCard//IT',
      'BEGIN:VEVENT',`UID:${Date.now()}@robertoesposito.com`,`DTSTAMP:${toUTC(new Date())}`,
      `DTSTART:${toUTC(startDate)}`,`DTEND:${toUTC(endDate)}`,`SUMMARY:${title}`,`DESCRIPTION:${description}`,
      'BEGIN:VALARM','TRIGGER:-PT24H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'BEGIN:VALARM','TRIGGER:-PT3H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'appuntamento.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  document.querySelectorAll('.appointment-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      playSound(sfxClick);
      appointmentOverlay.classList.remove('hidden');
    })
  );
  $('#close-appointment-btn').addEventListener('click', () => closeOverlay(appointmentOverlay));
  $('#generate-ics-btn').addEventListener('click', () => {
    const dateValue = $('#appointment-date').value;
    const timeValue = $('#appointment-time').value;
    const notes = $('#appointment-notes').value || 'Appuntamento con Roberto Esposito';
    if (!dateValue || !timeValue) {
      alert('Per favore, seleziona data e ora.');
      return;
    }
    const startDate = new Date(`${dateValue}T${timeValue}`);
    generateAndDownloadICS(startDate, 60, notes, 'Dettagli da definire.');
    closeOverlay(appointmentOverlay);
  });

  // Form contatti (Netlify Function)
  document.querySelectorAll('.contact-me-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      playSound(sfxClick);
      contactOverlay.classList.remove('hidden');
    })
  );
  $('#close-contact-btn').addEventListener('click', () => closeOverlay(contactOverlay));

  const contactForm = $('#contact-form');
  const formStatus = $('#form-status');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    formStatus.textContent = 'Invio in corso...';
    formStatus.style.color = 'white';
    const submitBtn = contactForm.querySelector('button');
    submitBtn.disabled = true;

    try {
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      const res = await fetch('/.netlify/functions/send-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        formStatus.textContent = result.message || 'Messaggio inviato con successo!';
        formStatus.style.color = 'var(--primary-color)';
        contactForm.reset();
        setTimeout(() => { closeOverlay(contactOverlay); formStatus.textContent = ''; }, 3000);
      } else {
        throw new Error(result.message || 'Si è verificato un errore.');
      }
    } catch (err) {
      formStatus.textContent = `Oops! ${err.message}`;
      formStatus.style.color = '#ff4d4d';
    } finally {
      submitBtn.disabled = false;
    }
  });

  // === 5) INIT ===
  updateShareLinks();

  // PWA SW
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js')
        .then(() => console.log('Service worker registrato.'))
        .catch((err) => console.error('Errore registrazione service worker:', err));
    });
  }
});

// Card visibile subito su mobile
if (window.innerWidth <= 480) {
  document.getElementById('card-container')?.classList.add('is-visible');
}
