/* js/main.js — Digital Tower Card (champagne accent) */
(() => {
  'use strict';

  /* ========================
   * Helpers (DOM & Utils)
   * ====================== */
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts || {passive:true});
  const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);

  const CANON = (()=>{
    const u = new URL(window.location.href);
    u.search = ''; u.hash = '';
    return u.toString();
  })();

  const withUTM = (url, params={}) => {
    const u = new URL(url);
    Object.entries(params).forEach(([k,v]) => {
      if (v != null && v !== '') u.searchParams.set(k, v);
    });
    return u.toString();
  };

  const toastEl = $('#toast');
  function showToast(msg, type='info', ms=1800){
    if(!toastEl) return;
    toastEl.className = '';
    toastEl.textContent = msg;
    toastEl.classList.add('show', type);
    setTimeout(()=>toastEl.classList.remove('show', type), ms);
  }

  const ga = (type, name, params={}) => {
    try { if (window.gtag) window.gtag(type, name, params); } catch(_) {}
  };

  const sfxClick = $('#sfx-click');
  const sfxFlip  = $('#sfx-flip');
  const sfxPrompt= $('#sfx-prompt');
  const play = (a)=>{ if(!a) return; try{ a.currentTime=0; a.play().catch(()=>{});}catch(_){} };

  /* ========================
   * Particles
   * ====================== */
  const particlesConfig = {
    "particles":{"number":{"value":80,"density":{"enable":true,"value_area":800}},"color":{"value":"#ffffff"},
    "shape":{"type":"circle"},"opacity":{"value":0.5,"random":true,"anim":{"enable":true,"speed":0.4,"opacity_min":0.1,"sync":false}},
    "size":{"value":2.5,"random":true,"anim":{"enable":false}},
    "line_linked":{"enable":true,"distance":150,"color":"#ffffff","opacity":0.2,"width":1},
    "move":{"enable":true,"speed":1.2,"direction":"none","random":true,"straight":false,"out_mode":"out","bounce":false}},
    "interactivity":{"detect_on":"canvas","events":{"onhover":{"enable":true,"mode":"repulse"},"onclick":{"enable":false},"resize":true},
    "modes":{"repulse":{"distance":80,"duration":0.4}}},"retina_detect":true
  };
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.particlesJS !== 'undefined') {
      window.particlesJS('particles-js', particlesConfig);
    }
  }, {once:true});

  /* ========================
   * Cached DOM
   * ====================== */
  const cardContainer = $('#card-container');
  const cardFlipper   = $('#card-flipper');

  const promptOverlay = $('#prompt-overlay');
  const shareOverlay  = $('#share-overlay');
  const saveOverlay   = $('#save-overlay');
  const consultOverlay= $('#consult-overlay');
  const iosInstall    = $('#ios-install-prompt');

  const promptYes = $('#prompt-yes');
  const promptNo  = $('#prompt-no');

  // Top actions — front/back
  const shareFrontBtn = $('#share-trigger-front');
  const saveFrontBtn  = $('#save-trigger-front');
  const shareBackBtn  = $('#share-trigger-back');
  const saveBackBtn   = $('#save-trigger-back');

  // Overlay buttons
  const closeShareBtn = $('#close-share-btn');
  const closeSaveBtn  = $('#close-save-btn');
  const closeConsultBtn = $('#close-consult-btn');

  // Save chips
  const chipWallet   = $('#chip-add-wallet');
  const chipSaveVCF  = $('#chip-save-contact');
  const chipInstall  = $('#chip-install-app');
  const chipCopyLink = $('#chip-copy-link');

  // CTA
  const ctas = $$('.cta-consulenza');
  const flipBtns = $$('.flip-btn');

  // Consult form fields
  const durationChipsWrap = $('#duration-chips');
  const consultDate   = $('#consult-date');
  const consultTime   = $('#consult-time');
  const consultForm   = $('#consult-form');
  const consultName   = $('#consult-name');
  const consultEmail  = $('#consult-email');
  const consultPhone  = $('#consult-phone');
  const consultSubject= $('#consult-subject');
  const consultMsg    = $('#consult-message');
  const consultStatus = $('#consult-status');
  const originField   = $('#origin-field');

  // Share overlay links
  const shareWhatsApp = $('#share-whatsapp');
  const shareTelegram = $('#share-telegram');
  const shareFacebook = $('#share-facebook');
  const shareEmail    = $('#share-email');
  const shareCopy     = $('#share-copy');

  // Quick contact chips (hrefs)
  const chipWaAgency   = $('#chip-wa-agency');
  const chipMailAgency = $('#chip-mail-agency');
  const chipCallAgency = $('#chip-call-agency');

  const chipWaPersonal   = $('#chip-wa-personal');
  const chipMailPersonal = $('#chip-mail-personal');
  const chipCallPersonal = $('#chip-call-personal');

  /* ========================
   * State
   * ====================== */
  let deferredPrompt = null;
  let selectedDuration = 30;
  const params = new URLSearchParams(location.search);
  const srcParam = params.get('src') || '';

  /* ========================
   * PWA Install (no warning banner)
   * ====================== */
  // Non chiamiamo preventDefault: lasciamo al browser la gestione del banner.
  window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e; // in alcuni browser sarà null se non si chiama preventDefault; gestiamo fallback.
  });

  const promptInstall = async () => {
    try {
      if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          showToast('Installazione avviata. Grazie!','success');
          ga('event','pwa_install_prompt',{accepted:true});
        } else {
          showToast('Installazione annullata.','info');
          ga('event','pwa_install_prompt',{accepted:false});
        }
        deferredPrompt = null;
      } else {
        // iOS / o banner già gestito dal browser
        if (iosInstall) iosInstall.classList.add('is-visible');
        showToast('Su iOS usi “Aggiungi a Home”.','info');
      }
    } catch(_) {
      showToast('Installazione non disponibile.','error');
    }
  };

  on($('#close-ios-prompt'), 'click', () => iosInstall && iosInstall.classList.remove('is-visible'), {passive:true});

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
    });
  }

  /* ========================
   * Initial prompt (add contact)
   * ====================== */
  const handleInitialPrompt = (shouldDownload) => {
    play(sfxPrompt);
    if (shouldDownload) downloadFile('roberto_business.vcf');
    if (promptOverlay) promptOverlay.classList.add('hidden');
    cardContainer?.classList.add('is-visible');
  };

  on(promptYes, 'click', () => handleInitialPrompt(true), {passive:true});
  on(promptNo, 'click',  () => handleInitialPrompt(false), {passive:true});

  if (window.innerWidth <= 480) {
    cardContainer?.classList.add('is-visible');
    if (promptOverlay) promptOverlay.style.display = 'none';
  }

  /* ========================
   * Overlays show/hide
   * ====================== */
  const showOverlay = (el) => { el && el.classList.remove('hidden'); };
  const hideOverlay = (el) => { el && el.classList.add('hidden'); };

  on(closeShareBtn, 'click', () => hideOverlay(shareOverlay));
  on(closeSaveBtn,  'click', () => hideOverlay(saveOverlay));
  on(closeConsultBtn, 'click', () => hideOverlay(consultOverlay));

  /* ========================
   * Share (Web Share API + fallback)
   * ====================== */
  const updateShareLinks = () => {
    const shareBase = CANON;
    const wa   = withUTM(shareBase, {utm_source:'whatsapp',utm_medium:'share',utm_campaign:'business-card',src:'whatsapp'});
    const tg   = withUTM(shareBase, {utm_source:'telegram',utm_medium:'share',utm_campaign:'business-card',src:'telegram'});
    const fb   = withUTM(shareBase, {utm_source:'facebook',utm_medium:'share',utm_campaign:'business-card',src:'facebook'});
    const mail = withUTM(shareBase, {utm_source:'email',utm_medium:'share',utm_campaign:'business-card',src:'email'});
    const copy = withUTM(shareBase, {utm_source:'copy',utm_medium:'share',utm_campaign:'business-card',src:'copy'});

    const text = encodeURIComponent('Scopra la business card di Digital Tower.');
    if (shareWhatsApp) shareWhatsApp.href = `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(wa)}`;
    if (shareTelegram) shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(tg)}&text=${text}`;
    if (shareFacebook) shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fb)}`;
    if (shareEmail)    shareEmail.href    = `mailto:?subject=${encodeURIComponent('Richiesta consulenza strategica')}&body=${encodeURIComponent('Guardi la card: '+mail)}`;

    if (shareCopy) {
      on(shareCopy, 'click', (e)=>{
        e.preventDefault();
        navigator.clipboard.writeText(copy).then(()=>{
          showToast('Link copiato negli appunti','success');
          shareCopy.classList.add('copied');
          setTimeout(()=>shareCopy.classList.remove('copied'), 1200);
        }).catch(()=> showToast('Copia non disponibile','error'));
      }, {passive:false});
    }
  };

  const webShare = async () => {
    const shareUrl = withUTM(CANON, {utm_source:'system',utm_medium:'share',utm_campaign:'business-card'});
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          text: 'Digital Tower — Consulenza strategica.',
          url: shareUrl
        });
        showToast('Grazie per la condivisione!','success');
        ga('event','share',{method:'web-share'});
      } else {
        showOverlay(shareOverlay);
      }
    } catch(_) {}
  };

  on(shareFrontBtn, 'click', (e)=>{ e.preventDefault(); webShare(); }, {passive:false});
  on(shareBackBtn,  'click', (e)=>{ e.preventDefault(); webShare(); }, {passive:false});

  on(saveFrontBtn, 'click', (e)=>{ e.preventDefault(); showOverlay(saveOverlay); }, {passive:false});
  on(saveBackBtn,  'click', (e)=>{ e.preventDefault(); showOverlay(saveOverlay); }, {passive:false});

  on($('#chip-copy-link'), 'click', (e)=>{
    e.preventDefault();
    const copy = withUTM(CANON, {utm_source:'copy',utm_medium:'share',utm_campaign:'business-card',src:'copy'});
    navigator.clipboard.writeText(copy).then(()=>{
      showToast('Link copiato negli appunti','success');
      $('#chip-copy-link')?.classList?.add('copied');
      setTimeout(()=>$('#chip-copy-link')?.classList?.remove('copied'), 1200);
    }).catch(()=> showToast('Copia non disponibile','error'));
  }, {passive:false});

  /* ========================
   * Save / Wallet / VCF / Install
   * ====================== */
  const downloadFile = (file) => {
    const a = document.createElement('a');
    a.href = file;
    a.download = file.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  on(chipSaveVCF, 'click', (e)=>{
    e.preventDefault();
    const isBack = cardFlipper?.classList?.contains('is-flipped');
    downloadFile(isBack ? 'roberto_personal.vcf' : 'roberto_business.vcf');
    showToast('Contatto scaricato','success');
    hideOverlay(saveOverlay);
  }, {passive:false});

  on(chipInstall, 'click', (e)=>{
    e.preventDefault();
    promptInstall();
  }, {passive:false});

  on(chipWallet, 'click', (e)=>{
    e.preventDefault();
    showToast('Funzione in arrivo','info');
    hideOverlay(saveOverlay);
  }, {passive:false});

  /* ========================
   * Flip (niente scroll, niente jump)
   * ====================== */
  const flip = () => {
    // Niente scrollIntoView: lasciamo la card stabile
    play(sfxFlip);
    const flipped = cardFlipper?.classList?.toggle('is-flipped');
    ga('event','flip_card',{to: flipped ? 'personal':'agency'});
  };

  // Buttons flip
  flipBtns.forEach(btn => on(btn, 'click', (e)=>{ e.preventDefault(); flip(); }, {passive:false}));

  // Swipe flip (mobile)
  let touchstartX = 0, touchendX = 0;
  const swipeThreshold = 50;
  on(cardContainer, 'touchstart', e => { touchstartX = e.changedTouches[0].screenX; });
  on(cardContainer, 'touchend',   e => {
    touchendX = e.changedTouches[0].screenX;
    if (Math.abs(touchendX - touchstartX) >= swipeThreshold) flip();
  });

  /* ========================
   * Quick contact chips hrefs
   * ====================== */
  const AGENCY_PHONE = '+393770439955';
  const AGENCY_MAIL  = 'info@digitaltower.it';
  const AGENCY_WA_MSG = 'Gentile Digital Tower, desidero valutare una collaborazione strategica.';

  if (chipWaAgency)   chipWaAgency.href   = `https://wa.me/${AGENCY_PHONE.replace(/\D/g,'')}?text=${encodeURIComponent(AGENCY_WA_MSG)}`;
  if (chipMailAgency) chipMailAgency.href = `mailto:${AGENCY_MAIL}?subject=${encodeURIComponent('Richiesta consulenza strategica')}`;
  if (chipCallAgency) chipCallAgency.href = `tel:${AGENCY_PHONE}`;

  const PERS_PHONE = '+393278525595';
  const PERS_MAIL  = 'roberto.esposito.er@gmail.com';
  const PERS_WA_MSG= 'Salve Roberto, desidero un confronto per valutare un progetto ad alta priorità.';

  if (chipWaPersonal)   chipWaPersonal.href   = `https://wa.me/${PERS_PHONE.replace(/\D/g,'')}?text=${encodeURIComponent(PERS_WA_MSG)}`;
  if (chipMailPersonal) chipMailPersonal.href = `mailto:${PERS_MAIL}?subject=${encodeURIComponent('Richiesta consulenza strategica')}`;
  if (chipCallPersonal) chipCallPersonal.href = `tel:${PERS_PHONE}`;

  /* ========================
   * Consult overlay
   * ====================== */
  const openConsult = () => {
    showOverlay(consultOverlay);
    setTimeout(()=>{
      consultName?.focus();
      if (window.innerWidth <= 480) consultOverlay?.scrollIntoView({behavior:'smooth', block:'center'});
    }, 0);

    if ((srcParam || '').toLowerCase() === 'nfc') setDuration(30);
    else setDuration(selectedDuration);
  };

  ctas.forEach(btn => on(btn, 'click', (e)=>{ e.preventDefault(); openConsult(); }, {passive:false}));

  const setDuration = (min) => {
    selectedDuration = Number(min) || 30;
    $$('.chip-select', durationChipsWrap).forEach(c=>{
      const isSel = Number(c.getAttribute('data-min')) === selectedDuration;
      c.setAttribute('aria-pressed', isSel ? 'true' : 'false');
    });
  };

  $$('.chip-select', durationChipsWrap).forEach(c=>{
    c.setAttribute('aria-pressed','false');
    on(c, 'click', (e)=>{
      e.preventDefault();
      setDuration(c.getAttribute('data-min'));
    }, {passive:false});
  });

  originField && (originField.value = srcParam || params.get('utm_source') || '');

  function toUTC(date){ return date.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'; }
  function generateICS({start, durationMin, title, description}){
    const end = new Date(start.getTime() + durationMin*60000);
    return [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DigitalTower//Card//IT',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@digitaltower.it`,
      `DTSTAMP:${toUTC(new Date())}`,
      `DTSTART:${toUTC(start)}`,
      `DTEND:${toUTC(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      'BEGIN:VALARM','TRIGGER:-PT24H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'BEGIN:VALARM','TRIGGER:-PT3H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
  }

  on(consultForm, 'submit', async (e)=>{
    e.preventDefault();
    const required = [consultName, consultEmail, consultPhone, consultSubject, consultMsg, consultDate, consultTime];
    for (const f of required) {
      if (!f || !f.value || (f.type==='email' && !f.validity.valid) || (f.type==='tel' && f.pattern && !(new RegExp(f.pattern).test(f.value)))) {
        showToast('Completi tutti i campi obbligatori','error');
        f && f.focus?.();
        return;
      }
    }
    const start = new Date(`${consultDate.value}T${consultTime.value}`);
    const title = 'Richiesta consulenza strategica';
    const desc  = `Da: ${consultName.value}\nEmail: ${consultEmail.value}\nTel: ${consultPhone.value}\nOggetto: ${consultSubject.value}\n\nMessaggio:\n${consultMsg.value}\n\nOrigine: ${originField?.value || '-'}`;

    try{
      const ics = generateICS({start, durationMin:selectedDuration, title, description:desc});
      const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'consulenza.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Promemoria calendario scaricato','success');
      ga('event','consult_submit',{duration:selectedDuration});
      hideOverlay(consultOverlay);
    }catch(_){
      showToast('Impossibile generare il promemoria','error');
    }
  }, {passive:false});

  /* ========================
   * Share links update
   * ====================== */
  updateShareLinks();

  /* ========================
   * Save button pulse (una volta)
   * ====================== */
  setTimeout(()=>{
    saveFrontBtn?.classList?.add('save-trigger','pulse');
    setTimeout(()=>saveFrontBtn?.classList?.remove('pulse'), 1600);
  }, 400);

  /* ========================
   * Accessibility
   * ====================== */
  on(document, 'keydown', (e)=>{
    if (e.key === 'Escape') {
      if (!saveOverlay?.classList?.contains('hidden')) hideOverlay(saveOverlay);
      else if (!shareOverlay?.classList?.contains('hidden')) hideOverlay(shareOverlay);
      else if (!consultOverlay?.classList?.contains('hidden')) hideOverlay(consultOverlay);
      else if (iosInstall?.classList?.contains('is-visible')) iosInstall.classList.remove('is-visible');
    }
  }, {passive:true});
})();
