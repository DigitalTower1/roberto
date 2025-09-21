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

  const CANON = location.origin + location.pathname.replace(/index\.html$/,'');
  const withUTM = (base, params) => {
    const u = new URL(base, location.origin);
    Object.entries(params||{}).forEach(([k,v]) => u.searchParams.set(k, v));
    return u.toString();
  };

  // Origine per prefill
  const params = new URLSearchParams(location.search);
  const source = params.get('src') || params.get('utm_source') || 'direct';
  const originFieldHidden = $('#origin-field'); // (usata nell'overlay consult)
  if (originFieldHidden) originFieldHidden.value = source;

  // ELEMENTI
  const cardContainer = $('#card-container');
  const cardFlipper   = $('#card-flipper');
  const promptOverlay = $('#prompt-overlay');
  const shareOverlay  = $('#share-overlay');

  const consultOverlay = $('#consult-overlay');
  const consultForm    = $('#consult-form');
  const consultStatus  = $('#consult-status');
  const durationChips  = $$('#duration-chips .chip-select');
  const consultDate    = $('#consult-date');
  const consultTime    = $('#consult-time');
  const consultName    = $('#consult-name');
  const consultEmail   = $('#consult-email');
  const consultPhone   = $('#consult-phone');
  const consultSubject = $('#consult-subject');
  const consultMessage = $('#consult-message');

  const sfxClick  = $('#sfx-click');
  const sfxFlip   = $('#sfx-flip');
  const sfxPrompt = $('#sfx-prompt');
  let deferredPrompt;
  const installButtons = $$('.install-btn');

  // ===== UI =====
  const flip = () => {
    play(sfxFlip);
    const flipped = cardFlipper.classList.toggle('is-flipped');
    ga('event','flip_card',{to: flipped ? 'personal':'agency'});
  };
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = () => ('standalone' in navigator) && navigator.standalone;

  // Share UTM
  const updateShareLinks = () => {
    const shareBase = CANON;
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
    if (isIOS() && !isStandalone()) setTimeout(()=>$('#ios-install-prompt')?.classList.add('is-visible'), 3000);
  };

  // Prompt iniziale
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
  $('#prompt-yes').addEventListener('click', ()=>handleInitialPrompt(true));
  $('#prompt-no').addEventListener('click',  ()=>handleInitialPrompt(false));

  // Click fuori / ESC
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') [shareOverlay,consultOverlay].forEach(o=>o?.classList.add('hidden')); });
  [shareOverlay,consultOverlay].forEach(ov=>{
    ov?.addEventListener('click', (e)=>{ if(e.target===ov) { play(sfxClick); ov.classList.add('hidden'); } });
  });
  $('#close-share-btn')?.addEventListener('click', ()=>{ play(sfxClick); shareOverlay.classList.add('hidden'); });
  $('#close-consult-btn')?.addEventListener('click', ()=>{ play(sfxClick); consultOverlay.classList.add('hidden'); });

  // Swipe flip
  let x0=0,x1=0;
  cardContainer.addEventListener('touchstart', e=>{ x0=e.changedTouches[0].screenX; }, {passive:true});
  cardContainer.addEventListener('touchend',   e=>{ x1=e.changedTouches[0].screenX; if(Math.abs(x1-x0)>=50) flip(); }, {passive:true});
  document.addEventListener('click',   (e)=>{
    const b=e.target.closest('.flip-btn');
    if(b){
      e.preventDefault();
      flip();
      b.blur(); // evita highlight persistente sul bottone profilo
    }
  });

  // Share overlay / native
  $$('.open-share-btn').forEach(btn=>btn.addEventListener('click', async ()=>{
    play(sfxClick);
    const data={title:'Digital Tower - Business Card', text:"Scopri la business card di Digital Tower!", url:withUTM(CANON,{utm_source:'native-share',utm_medium:'share',utm_campaign:'business-card',src:'native'})};
    if(navigator.share){ try{ await navigator.share(data); ga('event','share_native'); return; }catch(e){ if(e && e.name==='AbortError') return; } }
    shareOverlay.classList.remove('hidden');
  }));

  // Install PWA
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; installButtons.forEach(b=>b.style.display='flex'); });
  installButtons.forEach(btn=>btn.addEventListener('click', async ()=>{
    play(sfxClick);
    if(deferredPrompt){ try{ deferredPrompt.prompt(); await deferredPrompt.userChoice; }catch{} deferredPrompt=null; ga('event','install_prompt'); return; }
    if(isIOS() && !isStandalone()){ $('#ios-install-prompt')?.classList.add('is-visible'); return; }
    alert('Apri il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”.');
  }));

  // ===== CHIPS RAPIDI (UTM + messaggi) =====
  const buildMsg = (who, link) => {
    if (who==='agency')  return `Ciao Digital Tower! Vorrei prenotare una consulenza gratuita. Possiamo sentirci? ${link}`;
    return `Ciao Roberto! Vorrei lavorare con te. Possiamo sentirci? ${link}`;
    };
  const waUrl = (phone, who, utmMedium) => {
    const link = withUTM(CANON,{utm_source:'whatsapp',utm_medium:utmMedium,utm_campaign:'business-card',src:'whatsapp'});
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildMsg(who, link))}`;
  };
  const mailUrl = (to, who, utmMedium) => {
    const link = withUTM(CANON,{utm_source:'email',utm_medium:utmMedium,utm_campaign:'business-card',src:'email'});
    const subject = 'Consulenza gratuita';
    const body = (who==='agency'
      ? `Ciao Digital Tower,%0D%0A%0D%0Avorrei prenotare una consulenza gratuita.%0D%0A%0D%0AGrazie!%0D%0A%0D%0ALink: ${link}`
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

  // ===== CTA CONSULENZA (full width) =====
  const openConsult = () => {
    // default durata selezionata 15min
    durationChips.forEach(c => c.setAttribute('aria-pressed','false'));
    const first = durationChips[0]; if (first) first.setAttribute('aria-pressed','true');
    consultOverlay.classList.remove('hidden');
  };

  $$('.cta-consulenza').forEach(btn => btn.addEventListener('click', () => {
    if (CALENDLY_URL) {
      const url = withUTM(CALENDLY_URL,{utm_source:'cta',utm_medium:'scheduler',utm_campaign:'business-card',src:'cta'});
      window.open(url, '_blank', 'noopener');
      ga('event','cta_scheduler');
      return;
    }
    openConsult(); ga('event','cta_overlay');
  }));

  // Selezione durata (centrata da CSS; allineiamo stato aria)
  durationChips.forEach(chip => {
    chip.addEventListener('click', () => {
      durationChips.forEach(c => c.setAttribute('aria-pressed','false'));
      chip.setAttribute('aria-pressed','true');
    });
  });
  const getSelectedMinutes = () => Number([...durationChips].find(c => c.getAttribute('aria-pressed')==='true')?.dataset.min || 15);

  // Prefill messaggio in base all’origine
  const prefillBySource = {
    nfc: "Ti contatto dopo aver toccato la tua card NFC.",
    whatsapp: "Ti contatto da WhatsApp.",
    telegram: "Ti contatto da Telegram.",
    facebook: "Ti contatto da Facebook.",
    email: "Ti contatto dalla tua email.",
    direct: "Vorrei maggiori informazioni su una consulenza."
  };
  if (!consultMessage.value) consultMessage.value = prefillBySource[source] || prefillBySource.direct;

  // ICS helper
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
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='consulenza.ics'; document.body.appendChild(a); a.click(); a.remove();
  }

  // Submit "Invia richiesta & Scarica .ics"
  consultForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    consultStatus.textContent='Invio in corso...'; consultStatus.style.color='white';
    const btn=consultForm.querySelector('button'); btn.disabled=true;

    try{
      // Validazione extra: tutti i campi richiesti
      if(!consultName.value.trim() || !consultEmail.value.trim() || !consultPhone.value.trim() || !consultSubject.value.trim() || !consultMessage.value.trim()){
        consultStatus.textContent='Compila tutti i campi obbligatori.'; consultStatus.style.color='#ff4d4d'; btn.disabled=false; return;
      }
      const d = consultDate.value, t = consultTime.value;
      if(!d || !t){ alert('Seleziona data e ora.'); btn.disabled=false; consultStatus.textContent=''; return; }
      const minutes = getSelectedMinutes();
      const start = new Date(`${d}T${t}`);

      // invio email (aggiungo telefono e durata nel messaggio)
      const payload = Object.fromEntries(new FormData(consultForm).entries());
      const subject = consultSubject.value || `Consulenza gratuita (${minutes} min)`;
      const msg = `Oggetto: ${subject}\nNome: ${payload.name}\nEmail: ${payload.email}\nTelefono: ${payload.phone}\n\n${payload.message}\n\nDurata: ${minutes} min\nData: ${d}\nOra: ${t}`;
      const body = { name: payload.name, email: payload.email, message: msg, origin: payload.origin || source };
      const res = await fetch(fnUrl('send-contact'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), mode:'cors' });
      const json = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(json.message||'Errore di invio.');

      // ICS
      downloadICS(start, minutes, subject, 'Call di consulenza gratuita');
      consultStatus.textContent = 'Richiesta inviata! Promemoria scaricato.'; consultStatus.style.color='var(--primary-color)';
      consultForm.reset(); setTimeout(()=>{ consultOverlay.classList.add('hidden'); consultStatus.textContent=''; }, 2400);
      ga('event','consult_submit',{status:'success',minutes});
    }catch(err){
      consultStatus.textContent='Oops! '+err.message; consultStatus.style.color='#ff4d4d';
      ga('event','consult_submit',{status:'error'});
    }finally{ btn.disabled=false; }
  });

  // SHARE init + install + page_ready
  const installButtons = $$('.install-btn'); // reselect safe
  updateShareLinks();
  showInstallPrompt();
  ga('event','page_ready',{ page_location: location.href });

  // Service Worker: path dinamico
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
