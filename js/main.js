document.addEventListener('DOMContentLoaded', () => {
  // === PARTICLES ===
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

  // === UTILS ===
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const track = (type, detail = {}) => {
    try {
      const payload = JSON.stringify({ type, detail, ts: Date.now() });
      navigator.sendBeacon?.('/.netlify/functions/track', new Blob([payload], { type: 'application/json' }));
    } catch {}
  };

  // === ELEMENTI ===
  const cardContainer = $('#card-container');
  const cardFlipper = $('#card-flipper');
  const promptOverlay = $('#prompt-overlay');
  const shareOverlay = $('#share-overlay');
  const socialOverlay = $('#social-overlay');
  const iosInstallPrompt = $('#ios-install-prompt');
  const appointmentOverlay = $('#appointment-overlay');
  const contactOverlay = $('#contact-overlay');

  const sfxClick = $('#sfx-click');
  const sfxFlip = $('#sfx-flip');
  const sfxPrompt = $('#sfx-prompt');
  let deferredPrompt;
  const installButtons = $$('.install-btn');

  // === FUNZIONI ===
  const playSound = (audioEl) => { if (!audioEl) return; audioEl.currentTime = 0; audioEl.play().catch(() => {}); };
  const flipCard = () => { playSound(sfxFlip); cardFlipper.classList.toggle('is-flipped'); };
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
    if (deferredPrompt) { installButtons.forEach((btn) => (btn.style.display = 'flex')); return; }
    if (isIOS() && !isInStandaloneMode()) { setTimeout(() => { iosInstallPrompt?.classList.add('is-visible'); }, 3000); }
  };

  function handleInitialPrompt(shouldDownload) {
    playSound(sfxPrompt);
    if (shouldDownload) {
      const link = document.createElement('a');
      link.href = 'roberto_business.vcf';
      link.download = 'digital_tower.vcf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      track('vcf_download', { vcf: 'business_prompt' });
    }
    promptOverlay.classList.add('hidden');
    cardContainer.classList.add('is-visible');
    showInstallPrompt();
  }

  const closeOverlay = (overlay) => { playSound(sfxClick); overlay.classList.add('hidden'); };

  // Close on ESC/click outside
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') [shareOverlay, socialOverlay, appointmentOverlay, contactOverlay].forEach((ov) => ov?.classList.add('hidden'));
  });
  [shareOverlay, socialOverlay, appointmentOverlay, contactOverlay].forEach((ov) => {
    ov?.addEventListener('click', (e) => { if (e.target === ov) closeOverlay(ov); });
  });

  // Swipe flip
  let touchstartX = 0, touchendX = 0;
  cardContainer.addEventListener('touchstart', (e) => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
  cardContainer.addEventListener('touchend', (e) => {
    touchendX = e.changedTouches[0].screenX;
    if (Math.abs(touchendX - touchstartX) >= 50) flipCard();
  }, { passive: true });

  // === EVENTI UI ===
  $('#prompt-yes').addEventListener('click', () => handleInitialPrompt(true));
  $('#prompt-no').addEventListener('click', () => handleInitialPrompt(false));

  // Share: Web Share API -> fallback overlay
  $$('.open-share-btn').forEach(btn =>
    btn.addEventListener('click', async () => {
      playSound(sfxClick);
      const shareData = {
        title: 'Digital Tower - Business Card',
        text: "Scopri la business card di Digital Tower!",
        url: window.location.href
      };
      if (navigator.share) {
        try { await navigator.share(shareData); track('share_native'); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      shareOverlay.classList.remove('hidden');
      track('share_overlay_open');
    })
  );
  $('#close-share-btn').addEventListener('click', () => closeOverlay(shareOverlay));

  // Copy link
  const shareCopy = $('#share-copy');
  if (shareCopy) {
    shareCopy.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(window.location.href);
        shareCopy.classList.add('copied'); shareCopy.title = 'Copiato!';
        setTimeout(() => { shareCopy.classList.remove('copied'); shareCopy.title = 'Copia link'; }, 1500);
        track('share_copy_link');
      } catch {
        prompt('Copia il link:', window.location.href);
      }
    });
  }

  // Social overlay
  $$('.open-social-btn').forEach(btn => btn.addEventListener('click', () => { playSound(sfxClick); socialOverlay.classList.remove('hidden'); track('social_overlay_open'); }));
  $('#close-social-btn').addEventListener('click', () => closeOverlay(socialOverlay));

  // Buttons
  $$('.flip-btn').forEach((btn) => btn.addEventListener('click', flipCard));
  $$('.add-contact-btn').forEach((btn) => btn.addEventListener('click', (e) => {
    playSound(sfxClick);
    const vcf = e.currentTarget.getAttribute('data-vcf') || 'unknown';
    track('vcf_download', { vcf });
  }));
  installButtons.forEach((btn) => btn.addEventListener('click', () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => { deferredPrompt = null; track('install_prompt'); });
  }));

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e; installButtons.forEach((btn) => (btn.style.display = 'flex'));
  });

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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  $$('.appointment-btn').forEach((btn) =>
    btn.addEventListener('click', () => { playSound(sfxClick); appointmentOverlay.classList.remove('hidden'); track('appointment_open'); })
  );
  $('#close-appointment-btn').addEventListener('click', () => closeOverlay(appointmentOverlay));
  $('#generate-ics-btn').addEventListener('click', () => {
    const dateValue = $('#appointment-date').value;
    const timeValue = $('#appointment-time').value;
    const notes = $('#appointment-notes').value || 'Appuntamento con Digital Tower';
    if (!dateValue || !timeValue) { alert('Per favore, seleziona data e ora.'); return; }
    const startDate = new Date(`${dateValue}T${timeValue}`);
    generateAndDownloadICS(startDate, 60, notes, 'Dettagli da definire.');
    closeOverlay(appointmentOverlay);
    track('appointment_create', { duration: 60 });
  });

  // Contatti (Netlify Function)
  $$('.contact-me-btn').forEach((btn) => btn.addEventListener('click', () => { playSound(sfxClick); contactOverlay.classList.remove('hidden'); track('contact_open'); }));
  $('#close-contact-btn').addEventListener('click', () => closeOverlay(contactOverlay));

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

  // Link analytics su click (telefono/email/whatsapp/sito/social)
  $$('.contact-info a,[data-analytics="social"]').forEach(a => {
    a.addEventListener('click', () => {
      const type = a.getAttribute('data-analytics') || 'link';
      const label = a.getAttribute('data-label') || a.textContent.trim();
      track(`click_${type}`, { label, href: a.href });
    });
  });

  // INIT
  updateShareLinks();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('Service worker registrato.'))
        .catch((err) => console.error('Errore registrazione service worker:', err));
    });
  }
});

// Card visibile subito su mobile
if (window.innerWidth <= 480) {
  document.getElementById('card-container')?.classList.add('is-visible');
}
