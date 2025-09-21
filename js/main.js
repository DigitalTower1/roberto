document.addEventListener('DOMContentLoaded', () => {
  // PARTICLES
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
  if (typeof particlesJS !== 'undefined') particlesJS('particles-js', particlesConfig);

  // UTILS
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const track = (type, detail = {}) => {
    try {
      const payload = JSON.stringify({ type, detail, ts: Date.now() });
      navigator.sendBeacon?.('/.netlify/functions/track', new Blob([payload], { type: 'application/json' }));
    } catch {}
  };

  // ELEMENTI
  const cardContainer = $('#card-container');
  const cardFlipper = $('#card-flipper');
  const promptOverlay = $('#prompt-overlay');
  const shareOverlay = $('#share-overlay');
  const socialOverlay = $('#social-overlay');
  const socialTitle = $('#social-title');
  const socialPersonal = $('#social-section-personal');
  const socialAgency = $('#social-section-agency');
  const socialDivider = $('#social-divider');
  const iosInstallPrompt = $('#ios-install-prompt');
  const appointmentOverlay = $('#appointment-overlay');
  const contactOverlay = $('#contact-overlay');

  const sfxClick = $('#sfx-click');
  const sfxFlip = $('#sfx-flip');
  const sfxPrompt = $('#sfx-prompt');
  let deferredPrompt;
  const installButtons = $$('.install-btn');

  // FUNZIONI
  const playSound = (el) => { if (!el) return; el.currentTime = 0; el.play().catch(()=>{}); };
  const flipCard = () => { playSound(sfxFlip); cardFlipper.classList.toggle('is-flipped'); track('flip'); };
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

  const updateShareLinks = () => {
    const pageUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent("Scopri la business card di Digital Tower!");
    const emailSubject = encodeURIComponent('Digital Tower - Business Card');
    const emailBody = encodeURIComponent(`Dai un'occhiata alla Digital Business Card: ${window.location.href}`);

    $('#share-whatsapp').href = `https://api.whatsapp.com/send?text=${shareText}%20${pageUrl}`;
    $('#share-telegram').href = `https://t.me/share/url?url=${pageUrl}&text=${shareText}`;
    $('#share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
    $('#share-email').href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
  };

  const showInstallPrompt = () => {
    // Mostra sempre il bottone (anche su iOS)
    installButtons.forEach((btn) => (btn.style.display = 'flex'));
    // Auto-istruzioni su iOS se non in standalone
    if (isIOS() && !isInStandaloneMode()) {
      setTimeout(() => { iosInstallPrompt?.classList.add('is-visible'); }, 3000);
    }
  };

  function handleInitialPrompt(shouldDownload) {
    playSound(sfxPrompt);
    if (shouldDownload) {
      const link = document.createElement('a');
      link.href = 'roberto_business.vcf';
      link.download = 'digital_tower.vcf';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      track('vcf_download', { vcf: 'business_prompt' });
    }
    promptOverlay.classList.add('hidden');
    cardContainer.classList.add('is-visible');
    showInstallPrompt();
  }

  const closeOverlay = (ov) => { playSound(sfxClick); ov.classList.add('hidden'); };

  // CHIUSURA overlay con ESC / click fuori
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') [shareOverlay, socialOverlay, appointmentOverlay, contactOverlay].forEach((o) => o?.classList.add('hidden')); });
  [shareOverlay, socialOverlay, appointmentOverlay, contactOverlay].forEach((ov) => {
    ov?.addEventListener('click', (e) => { if (e.target === ov) closeOverlay(ov); });
  });
  $('#close-social-btn')?.addEventListener('click', () => closeOverlay(socialOverlay));
  $('#close-appointment-btn')?.addEventListener('click', () => closeOverlay(appointmentOverlay));
  $('#close-contact-btn')?.addEventListener('click', () => closeOverlay(contactOverlay));
  $('#close-share-btn')?.addEventListener('click', () => closeOverlay(shareOverlay));
  $('#close-ios-prompt')?.addEventListener('click', () => iosInstallPrompt?.classList.remove('is-visible'));

  // SWIPE flip
  let touchstartX = 0, touchendX = 0;
  cardContainer.addEventListener('touchstart', (e) => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
  cardContainer.addEventListener('touchend', (e) => {
    touchendX = e.changedTouches[0].screenX;
    if (Math.abs(touchendX - touchstartX) >= 50) flipCard();
  }, { passive: true });

  // EVENTI UI
  $('#prompt-yes').addEventListener('click', () => handleInitialPrompt(true));
  $('#prompt-no').addEventListener('click', () => handleInitialPrompt(false));

  // Share: Web Share API -> overlay
  $$('.open-share-btn').forEach(btn =>
    btn.addEventListener('click', async () => {
      playSound(sfxClick);
      const shareData = { title: 'Digital Tower - Business Card', text: "Scopri la business card di Digital Tower!", url: window.location.href };
      if (navigator.share) {
        try { await navigator.share(shareData); track('share_native'); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      shareOverlay.classList.remove('hidden');
      track('share_overlay_open');
    })
  );

  // SOCIAL: mostra solo la sezione richiesta (agency|personal)
  $$('.open-social-btn').forEach(btn =>
    btn.addEventListener('click', (e) => {
      playSound(sfxClick);
      const target = e.currentTarget.getAttribute('data-target') || (cardFlipper.classList.contains('is-flipped') ? 'personal' : 'agency');

      if (target === 'agency') {
        socialTitle.textContent = 'Social Agenzia';
        socialAgency.classList.remove('hidden-section');
        socialPersonal.classList.add('hidden-section');
      } else {
        socialTitle.textContent = 'Social Personali';
        socialPersonal.classList.remove('hidden-section');
        socialAgency.classList.add('hidden-section');
      }
      if (socialDivider) socialDivider.style.display = 'none'; // separatore nascosto: mostriamo solo una sezione
      socialOverlay.classList.remove('hidden');
      track('social_overlay_open', { target });
    })
  );

  // INSTALL APP
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Rendi visibili i bottoni install
    installButtons.forEach((btn) => (btn.style.display = 'flex'));
  });

  installButtons.forEach((btn) =>
    btn.addEventListener('click', async () => {
      playSound(sfxClick);
      // Android / Chrome
      if (deferredPrompt) {
        deferredPrompt.prompt();
        try { await deferredPrompt.userChoice; } catch {}
        deferredPrompt = null;
        track('install_prompt');
        return;
      }
      // iOS: mostra suggerimenti
      if (isIOS() && !isInStandaloneMode()) {
        iosInstallPrompt?.classList.add('is-visible');
        track('install_ios_help');
        return;
      }
      // Fallback generico
      alert('Per installare l’app, apri il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”.');
      track('install_fallback_info');
    })
  );

  window.addEventListener('appinstalled', () => track('app_installed'));

  // Appuntamenti (ICS)
  function generateAndDownloadICS(startDate, durationMinutes, title, description) {
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const toUTC = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DigitalTower//DigitalCard//IT',
      'BEGIN:VEVENT',`UID:${Date.now()}@digitaltower.it`,`DTSTAMP:${toUTC(new Date())}`,
      `DTSTART:${toUTC(startDate)}`,`DTEND:${toUTC(endDate)}`,`SUMMARY:${title}`,`DESCRIPTION:${description}`,
      'BEGIN:VALARM','TRIGGER:-PT24H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'BEGIN:VALARM','TRIGGER:-PT3H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'appuntamento.ics';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  $$('.appointment-btn').forEach((btn) =>
    btn.addEventListener('click', () => { playSound(sfxClick); appointmentOverlay.classList.remove('hidden'); track('appointment_open'); })
  );
  $('#generate-ics-btn')?.addEventListener('click', () => {
    const dateValue = $('#appointment-date').value;
    const timeValue = $('#appointment-time').value;
    const notes = $('#appointment-notes').value || 'Appuntamento con Digital Tower';
    if (!dateValue || !timeValue) { alert('Per favore, seleziona data e ora.'); return; }
    const startDate = new Date(`${dateValue}T${timeValue}`);
    generateAndDownloadICS(startDate, 60, notes, 'Dettagli da definire.');
    closeOverlay(appointmentOverlay);
    track('appointment_create', { duration: 60 });
  });

  // Contatti (Netlify)
  $$('.contact-me-btn').forEach((btn) => btn.addEventListener('click', () => { playSound(sfxClick); contactOverlay.classList.remove('hidden'); track('contact_open'); }));
  const contactForm = $('#contact-form');
  const formStatus = $('#form-status');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formStatus.textContent = 'Invio in corso...';
    formStatus.style.color = 'white';
    const submitBtn = contactForm.querySelector('button'); submitBtn.disabled = true;

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
        track('contact_submit_success');
      } else {
        throw new Error(result.message || 'Si è verificato un errore.');
      }
    } catch (err) {
      formStatus.textContent = `Oops! ${err.message}`;
      formStatus.style.color = '#ff4d4d';
      track('contact_submit_error', { error: err.message });
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Click analytics su link
  $$('.contact-info a,[data-analytics="social"]').forEach(a => {
    a.addEventListener('click', () => {
      const type = a.getAttribute('data-analytics') || 'link';
      const label = a.getAttribute('data-label') || a.textContent.trim();
      track(`click_${type}`, { label, href: a.href });
    });
  });

  // INIT
  updateShareLinks();
  showInstallPrompt(); // rende visibile "Installa App" e mostra hint iOS se serve

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('Service worker registrato.'))
        .catch((err) => console.error('Errore registrazione service worker:', err));
    });
  }
});
