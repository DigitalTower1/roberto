document.addEventListener('DOMContentLoaded', () => {
  // PARTICLES
  const particlesConfig = {
    particles:{number:{value:80,density:{enable:true,value_area:800}},color:{value:'#ffffff'},shape:{type:'circle'},
      opacity:{value:0.5,random:true,anim:{enable:true,speed:0.4,opacity_min:0.1,sync:false}},
      size:{value:2.5,random:true,anim:{enable:false}},
      line_linked:{enable:true,distance:150,color:'#ffffff',opacity:0.2,width:1},
      move:{enable:true,speed:1.2,direction:'none',random:true,straight:false,out_mode:'out',bounce:false}},
    interactivity:{detect_on:'canvas',events:{onhover:{enable:true,mode:'repulse'},onclick:{enable:false},resize:true},
      modes:{repulse:{distance:80,duration:0.4}}},retina_detect:true
  };
  if (typeof particlesJS !== 'undefined') particlesJS('particles-js', particlesConfig);

  // ===== BASES =====
  const FUNCS_BASE = document.querySelector('meta[name="functions-base"]')?.content?.trim() || '/.netlify/functions';
  const CALENDLY_URL = document.querySelector('meta[name="calendly-url"]')?.content?.trim() || '';
  const fnUrl = (name) => `${FUNCS_BASE.replace(/\/+$/,'')}/${name}`;

  // Utils
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const play = (el) => { if(!el) return; el.currentTime=0; el.play().catch(()=>{}); };
  const ga = (...args) => { try { window.gtag && window.gtag(...args); } catch(_) {} };

  // Canonical URL (senza query) per UTM
  const CANON = location.origin + location.pathname.replace(/index\.html$/,'');
  const withUTM = (base, params) => {
    const u = new URL(base, location.origin);
    Object.entries(params||{}).forEach(([k,v]) => u.searchParams.set(k, v));
    return u.toString();
  };

  // Prefill origine (da NFC, share, ecc.)
  const params = new URLSearchParams(location.search);
  const source = params.get('src') || params.get('utm_source') || 'direct';
  const originField = $('#origin-field'); if (originField) originField.value = source;

  // ELEMENTI
  const cardContainer = $('#card-container');
  const cardFlipper   = $('#card-flipper');
  const promptOverlay = $('#prompt-overlay');
  const shareOverlay  = $('#share-overlay');
  const socialOverlay = $('#social-overlay');
  const socialTitle   = $('#social-title');
  const socialPersonal= $('#social-section-personal');
  const socialAgency  = $('#social-section-agency');
  const socialDivider = $('#social-divider');
  const iosInstallPrompt = $('#ios-install-prompt');
  const appointmentOverlay = $('#appointment-overlay');
  const contactOverlay = $('#contact-overlay');
  const slotSuggestions = $('#slot-suggestions');

  const sfxClick  = $('#sfx-click');
  const sfxFlip   = $('#sfx-flip');
  const sfxPrompt = $('#sfx-prompt');
  let deferredPrompt;
  const installButtons = $$('.install-btn');

  // ===== UI FUNCS =====
  const flip = () => { play(sfxFlip); const flipped = cardFlipper.classList.toggle('is-flipped'); ga('event','flip_card',{to: flipped ? 'personal':'agency'}); };
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = () => ('standalone' in navigator) && navigator.standalone;

  // UTM su share
  const updateShareLinks = () => {
    const shareBase = CANON; // senza query -> aggiungo UTM per canale
    const wa   = withUTM(shareBase, {utm_source:'whatsapp',utm_medium:'share',utm_campaign:'business-card',src:'whatsapp'});
    const tg   = withUTM(shareBase, {utm_source:'telegram',utm_medium:'share',utm_campaign:'business-card',src:'telegram'});
    const fb   = withUTM(shareBase, {utm_source:'facebook',utm_medium:'share',utm_campaign:'business-card',src:'facebook'});
    const mail = withUTM(shareBase, {utm_source:'email',utm_medium:'share',utm_campaign:'business-card',src:'email'});

    const text = encodeURIComponent("Scopri la business card di Digital Tower!");
    $('#share-whatsapp').href = `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(wa)}`;
    $('#share-telegram').href = `https://t.me/share/url?url=${encodeURIComponent(tg)}&text=${text}`;
    $('#share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fb)}`;
    $('#share-email').href    = `mailto:?subject=${encodeURIComponent('Digital Tower - Business Card')}&body=${encodeURIComponent('Guarda la card: '+mail)}`;

    $('#share-copy')?.addEventListener('click', async (e)=>{
      e.preventDefault();
      try{ await navigator.clipboard.writeText(withUTM(shareBase,{utm_source:'copy',utm_medium:'share',utm_campaign:'business-card',src:'copy'})); e.currentTarget.classList.add('copied'); setTimeout(()=>e.currentTarget.classList.remove('copied'),1200); }
      catch{ prompt('Copia il link:', shareBase); }
    });
  };

  const showInstallPrompt = () => {
    installButtons.forEach(btn => btn.style.display='flex');
    if (isIOS() && !isStandalone()) setTimeout(()=>iosInstallPrompt?.classList.add('is-visible'), 3000);
  };

  // Prompt iniziale + install
  function handleInitialPrompt(shouldDownload){
    play(sfxPrompt);
    if (shouldDownload){
      const a=document.createElement('a');
      a.href='roberto_business.vcf'; a.download='digital_tower.vcf';
      document.body.appendChild(a); a.click(); a.remove();
    }
    promptOverlay.classList.add('hidden');
    cardContainer.classList.add('is-visible');
    showInstallPrompt();
  }

  const closeOverlay = (el)=>{ play(sfxClick); el.classList.add('hidden'); };

  // ESC / click fuori
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') [shareOverlay,socialOverlay,appointmentOverlay,contactOverlay].forEach(o=>o?.classList.add('hidden')); });
  [shareOverlay,socialOverlay,appointmentOverlay,contactOverlay].forEach(ov=>{
    ov?.addEventListener('click', (e)=>{ if(e.target===ov) closeOverlay(ov); });
  });
  $('#close-social-btn')?.addEventListener('click', ()=>closeOverlay(socialOverlay));
  $('#close-appointment-btn')?.addEventListener('click', ()=>closeOverlay(appointmentOverlay));
  $('#close-contact-btn')?.addEventListener('click', ()=>closeOverlay(contactOverlay));
  $('#close-share-btn')?.addEventListener('click', ()=>closeOverlay(shareOverlay));
  $('#close-ios-prompt')?.addEventListener('click', ()=>iosInstallPrompt?.classList.remove('is-visible'));

  // Swipe flip
  let x0=0,x1=0;
  cardContainer.addEventListener('touchstart', e=>{ x0=e.changedTouches[0].screenX; }, {passive:true});
  cardContainer.addEventListener('touchend',   e=>{ x1=e.changedTouches[0].screenX; if(Math.abs(x1-x0)>=50) flip(); }, {passive:true});

  // Prompt iniziale
  $('#prompt-yes').addEventListener('click', ()=>handleInitialPrompt(true));
  $('#prompt-no').addEventListener('click',  ()=>handleInitialPrompt(false));

  // Share overlay / native
  $$('.open-share-btn').forEach(btn=>btn.addEventListener('click', async ()=>{
    play(sfxClick);
    const data={title:'Digital Tower - Business Card', text:"Scopri la business card di Digital Tower!", url:withUTM(CANON,{utm_source:'native-share',utm_medium:'share',utm_campaign:'business-card',src:'native'})};
    if(navigator.share){ try{ await navigator.share(data); ga('event','share_native'); return; }catch(e){ if(e && e.name==='AbortError') return; } }
    shareOverlay.classList.remove('hidden');
  }));

  // Social overlay (solo sezione richiesta)
  $$('.open-social-btn').forEach(btn=>btn.addEventListener('click',(e)=>{
    play(sfxClick);
    const target = e.currentTarget.getAttribute('data-target') || (cardFlipper.classList.contains('is-flipped') ? 'personal' : 'agency');
    if(target==='agency'){ socialTitle.textContent='Social Agenzia'; socialAgency.classList.remove('hidden-section'); socialPersonal.classList.add('hidden-section'); }
    else { socialTitle.textContent='Social Personali'; socialPersonal.classList.remove('hidden-section'); socialAgency.classList.add('hidden-section'); }
    if(socialDivider) socialDivider.style.display='none';
    socialOverlay.classList.remove('hidden');
  }));

  // Flip via bottoni
  document.addEventListener('click',   (e)=>{ const b=e.target.closest('.flip-btn'); if(b){ e.preventDefault(); flip(); } });
  document.addEventListener('touchend',(e)=>{ const b=e.target.closest('.flip-btn'); if(b){ e.preventDefault(); flip(); } }, {passive:false});

  // Install PWA
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; installButtons.forEach(b=>b.style.display='flex'); });
  installButtons.forEach(btn=>btn.addEventListener('click', async ()=>{
    play(sfxClick);
    if(deferredPrompt){ try{ deferredPrompt.prompt(); await deferredPrompt.userChoice; }catch{} deferredPrompt=null; ga('event','install_prompt'); return; }
    if(isIOS() && !isStandalone()){ iosInstallPrompt?.classList.add('is-visible'); return; }
    alert('Apri il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”.');
  }));

  // ===== CHIPS RAPIDI (UTM + messaggi precompilati) =====
  const buildMsg = (who, link) => {
    if (who==='agency')  return `Ciao Digital Tower! Vorrei prenotare una consulenza gratuita di 15 minuti. Possiamo sentirci? ${link}`;
    return `Ciao Roberto! Vorrei lavorare con te. Possiamo sentirci? ${link}`;
  };
  const waUrl = (phone, who, utmMedium) => {
    const link = withUTM(CANON,{utm_source:'whatsapp',utm_medium:utmMedium,utm_campaign:'business-card',src:'whatsapp'});
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildMsg(who, link))}`;
  };
  const mailUrl = (to, who, utmMedium) => {
    const link = withUTM(CANON,{utm_source:'email',utm_medium:utmMedium,utm_campaign:'business-card',src:'email'});
    const subject = 'Consulenza gratuita (15 min)';
    const body = (who==='agency'
      ? `Ciao Digital Tower,%0D%0A%0D%0Avorrei prenotare una consulenza gratuita di 15 minuti.%0D%0A%0D%0AGrazie!%0D%0A%0D%0ALink: ${link}`
      : `Ciao Roberto,%0D%0A%0D%0Avorrei lavorare con te.%0D%0A%0D%0AGrazie!%0D%0A%0D%0ALink: ${link}`);
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  // Aggancio chips AGENGY
  $('#chip-wa-agency').setAttribute('href', waUrl('393770439955','agency','chip'));
  $('#chip-mail-agency').setAttribute('href', mailUrl('info@digitaltower.it','agency','chip'));
  $('#chip-call-agency').setAttribute('href', 'tel:+393770439955');

  // Aggancio chips PERSONAL
  $('#chip-wa-personal').setAttribute('href', waUrl('393278525595','personal','chip'));
  $('#chip-mail-personal').setAttribute('href', mailUrl('roberto.esposito.er@gmail.com','personal','chip'));
  $('#chip-call-personal').setAttribute('href', 'tel:+393278525595');

  // Aggiorna il link WhatsApp anche nella lista contatti (con UTM)
  $('#wa-agency').setAttribute('href', waUrl('393770439955','agency','contact'));
  $('#wa-personal').setAttribute('href', waUrl('393278525595','personal','contact'));

  // ===== Prefill del form in base all’origine =====
  const messageEl = $('#contact-message');
  const prefillBySource = {
    nfc: "Ciao! Ti scrivo dopo aver toccato la tua card NFC. Vorrei maggiori info su una consulenza.",
    whatsapp: "Ciao! Arrivo da WhatsApp. Vorrei maggiori info su una consulenza.",
    telegram: "Ciao! Arrivo da Telegram. Vorrei maggiori info su una consulenza.",
    facebook: "Ciao! Arrivo da Facebook. Vorrei maggiori info su una consulenza.",
    email: "Ciao! Arrivo dall'email. Vorrei maggiori info su una consulenza.",
    direct: "Ciao! Vorrei maggiori info su una consulenza."
  };
  if (messageEl && !messageEl.value) messageEl.value = prefillBySource[source] || prefillBySource.direct;

  // ===== CTA Consulenza =====
  const openAppointment = () => { play(sfxClick); appointmentOverlay.classList.remove('hidden'); };
  const ctaButtons = $$('.cta-consulenza');
  ctaButtons.forEach(btn => btn.addEventListener('click', () => {
    // Se hai impostato Calendly/Tidycal, apri quello (consigliato per slot reali)
    if (CALENDLY_URL) {
      const url = withUTM(CALENDLY_URL,{utm_source:'cta',utm_medium:'scheduler',utm_campaign:'business-card',src:'cta'});
      window.open(url, '_blank', 'noopener');
      ga('event','cta_scheduler');
      return;
    }
    // Altrimenti, usa l'overlay Appuntamento con slot rapidi (non verifica conflitti reali)
    openAppointment();
    ga('event','cta_overlay');
  }));

  // ===== Suggerimenti slot rapidi (oggi/domani) =====
  function formatSlotLabel(d){
    const days = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
    const day = days[d.getDay()];
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const today = new Date(); const isToday = d.toDateString()===today.toDateString();
    return (isToday ? 'Oggi' : day) + ' ' + hh + ':' + mm;
  }
  function nextSlots(count=3){
    const now = new Date();
    const slots = [];
    // 2 orari standard: 10:00 e 15:00 (15 minuti)
    const candidates = (day) => [10,15].map(h => new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, 0, 0));
    let d = new Date(now);
    for(let i=0; slots.length < count && i<7; i++){
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()+i);
      const isWeekend = day.getDay()===0 || day.getDay()===6;
      if (isWeekend) continue;
      candidates(day).forEach(c => { if (slots.length<count && c>now) slots.push(c); });
    }
    return slots;
  }
  function renderSlots(){
    if (!slotSuggestions) return;
    slotSuggestions.innerHTML = '';
    nextSlots(3).forEach(d => {
      const a = document.createElement('a');
      a.className = 'chip';
      a.href = '#';
      a.textContent = formatSlotLabel(d);
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        $('#appointment-date').value = d.toISOString().slice(0,10);
        $('#appointment-time').value = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      });
      slotSuggestions.appendChild(a);
    });
  }
  renderSlots();

  // ===== ICS & Google Calendar (con link card) =====
  function downloadICS(startDate, minutes, title, description){
    const end = new Date(startDate.getTime()+minutes*60000);
    const fmt = d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    const cardLink = withUTM(CANON,{utm_source:'calendar',utm_medium:'ics',utm_campaign:'business-card',src:'calendar'});
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DigitalTower//DigitalCard//IT',
      'BEGIN:VEVENT',`UID:${Date.now()}@digitaltower.it`,`DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(startDate)}`,`DTEND:${fmt(end)}`,`SUMMARY:${title}`,
      `DESCRIPTION:${description} \\n\\nCard: ${cardLink}`, 'LOCATION:Online',
      'BEGIN:VALARM','TRIGGER:-PT24H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'BEGIN:VALARM','TRIGGER:-PT3H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='consulenza-15min.ics'; document.body.appendChild(a); a.click(); a.remove();
  }
  function googleCalendarUrl(startDate, minutes, title, description){
    const end = new Date(startDate.getTime()+minutes*60000);
    const fmt = d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    const details = `${description}\n\nCard: ${withUTM(CANON,{utm_source:'calendar',utm_medium:'gcal',utm_campaign:'business-card',src:'calendar'})}`;
    const base='https://calendar.google.com/calendar/render?action=TEMPLATE';
    return `${base}&text=${encodeURIComponent(title)}&dates=${fmt(startDate)}/${fmt(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent('Online')}&trp=false`;
  }

  $$('.appointment-btn').forEach(b=>b.addEventListener('click',()=>{ play(sfxClick); appointmentOverlay.classList.remove('hidden'); }));
  $('#generate-ics-btn')?.addEventListener('click',()=>{
    const d=$('#appointment-date').value, t=$('#appointment-time').value, notes=$('#appointment-notes').value||'Consulenza gratuita (15 min)';
    if(!d||!t){ alert('Per favore, seleziona data e ora.'); return; }
    const start=new Date(`${d}T${t}`);
    downloadICS(start, 15, notes, 'Call introduttiva.');
    // opzionale: mostra link gcal
    const g = $('#gcal-link'); if (g){ g.href = googleCalendarUrl(start,15,notes,'Call introduttiva.'); g.style.display='inline-block'; }
  });

  // Contatti (form)
  $$('.contact-me-btn').forEach(b=>b.addEventListener('click',()=>{ play(sfxClick); contactOverlay.classList.remove('hidden'); }));
  const form = $('#contact-form'), status = $('#form-status');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); status.textContent='Invio in corso...'; status.style.color='white';
    const btn=form.querySelector('button'); btn.disabled=true;
    try{
      const data = Object.fromEntries(new FormData(form).entries());
      const res = await fetch(fnUrl('send-contact'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), mode:'cors' });
      const json = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(json.message||'Si è verificato un errore.');
      status.textContent = json.message || 'Messaggio inviato con successo!'; status.style.color='var(--primary-color)';
      form.reset(); setTimeout(()=>{ closeOverlay(contactOverlay); status.textContent=''; }, 2400);
      ga('event','contact_submit',{status:'success'});
    }catch(err){ status.textContent='Oops! '+err.message; status.style.color='#ff4d4d'; ga('event','contact_submit',{status:'error'}); }
    finally{ btn.disabled=false; }
  });

  // Init share + install
  updateShareLinks();
  showInstallPrompt();
  ga('event','page_ready',{ page_location: location.href });

  // Service Worker: URL dinamico (funziona su Netlify e GitHub Pages)
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      const base = location.pathname.endsWith('/') ? location.pathname : location.pathname.substring(0, location.pathname.lastIndexOf('/')+1);
      const swUrl = `${base}service-worker.js`;
      navigator.serviceWorker.register(swUrl)
        .then(()=>console.log('Service worker registrato:', swUrl))
        .catch(err=>console.error('Errore registrazione service worker:', err));
    });
  }
});
