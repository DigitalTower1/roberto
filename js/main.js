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

  // ===== BASE URL FUNZIONI (solo per il form) =====
  const FUNCS_BASE = document.querySelector('meta[name="functions-base"]')?.content?.trim() || '/.netlify/functions';
  const fnUrl = (name) => `${FUNCS_BASE.replace(/\/+$/,'')}/${name}`;

  // UTILI
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const play = (el) => { if(!el) return; el.currentTime=0; el.play().catch(()=>{}); };

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

  const sfxClick  = $('#sfx-click');
  const sfxFlip   = $('#sfx-flip');
  const sfxPrompt = $('#sfx-prompt');
  let deferredPrompt;
  const installButtons = $$('.install-btn');

  // FUNZIONI UI
  const flip = () => { play(sfxFlip); cardFlipper.classList.toggle('is-flipped'); };
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = () => ('standalone' in navigator) && navigator.standalone;

  const updateShareLinks = () => {
    const pageUrl = encodeURIComponent(location.href);
    const shareText = encodeURIComponent("Scopri la business card di Digital Tower!");
    const emailSubject = encodeURIComponent('Digital Tower - Business Card');
    const emailBody = encodeURIComponent(`Dai un'occhiata alla Digital Business Card: ${location.href}`);

    $('#share-whatsapp').href = `https://api.whatsapp.com/send?text=${shareText}%20${pageUrl}`;
    $('#share-telegram').href = `https://t.me/share/url?url=${pageUrl}&text=${shareText}`;
    $('#share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
    $('#share-email').href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
  };

  const showInstallPrompt = () => {
    installButtons.forEach(btn => btn.style.display='flex');
    if (isIOS() && !isStandalone()) setTimeout(()=>iosInstallPrompt?.classList.add('is-visible'), 3000);
  };

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

  // Share
  $$('.open-share-btn').forEach(btn=>btn.addEventListener('click', async ()=>{
    play(sfxClick);
    const data={title:'Digital Tower - Business Card', text:"Scopri la business card di Digital Tower!", url:location.href};
    if(navigator.share){ try{ await navigator.share(data); return; }catch(e){ if(e && e.name==='AbortError') return; } }
    shareOverlay.classList.remove('hidden');
  }));
  $('#share-copy')?.addEventListener('click', async (e)=>{
    e.preventDefault();
    try{ await navigator.clipboard.writeText(location.href); e.currentTarget.classList.add('copied'); setTimeout(()=>e.currentTarget.classList.remove('copied'),1200); }
    catch{ prompt('Copia il link:', location.href); }
  });

  // Social (mostra solo sezione richiesta)
  $$('.open-social-btn').forEach(btn=>btn.addEventListener('click',(e)=>{
    play(sfxClick);
    const target = e.currentTarget.getAttribute('data-target') || (cardFlipper.classList.contains('is-flipped') ? 'personal' : 'agency');
    if(target==='agency'){ socialTitle.textContent='Social Agenzia'; socialAgency.classList.remove('hidden-section'); socialPersonal.classList.add('hidden-section'); }
    else { socialTitle.textContent='Social Personali'; socialPersonal.classList.remove('hidden-section'); socialAgency.classList.add('hidden-section'); }
    if(socialDivider) socialDivider.style.display='none';
    socialOverlay.classList.remove('hidden');
  }));

  // Flip via bottone (click + touchend)
  document.addEventListener('click',   (e)=>{ const b=e.target.closest('.flip-btn'); if(b){ e.preventDefault(); flip(); } });
  document.addEventListener('touchend',(e)=>{ const b=e.target.closest('.flip-btn'); if(b){ e.preventDefault(); flip(); } }, {passive:false});

  // Install PWA
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; installButtons.forEach(b=>b.style.display='flex'); });
  installButtons.forEach(btn=>btn.addEventListener('click', async ()=>{
    play(sfxClick);
    if(deferredPrompt){ try{ deferredPrompt.prompt(); await deferredPrompt.userChoice; }catch{} deferredPrompt=null; return; }
    if(isIOS() && !isStandalone()){ iosInstallPrompt?.classList.add('is-visible'); return; }
    alert('Apri il menu del browser e scegli “Installa app” o “Aggiungi a schermata Home”.');
  }));

  // ICS appuntamenti
  function downloadICS(startDate, minutes, title, description){
    const end = new Date(startDate.getTime()+minutes*60000);
    const fmt = d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DigitalTower//DigitalCard//IT',
      'BEGIN:VEVENT',`UID:${Date.now()}@digitaltower.it`,`DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(startDate)}`,`DTEND:${fmt(end)}`,`SUMMARY:${title}`,`DESCRIPTION:${description}`,
      'BEGIN:VALARM','TRIGGER:-PT24H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'BEGIN:VALARM','TRIGGER:-PT3H','ACTION:DISPLAY','DESCRIPTION:Promemoria','END:VALARM',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='appuntamento.ics'; document.body.appendChild(a); a.click(); a.remove();
  }
  $$('.appointment-btn').forEach(b=>b.addEventListener('click',()=>{ play(sfxClick); appointmentOverlay.classList.remove('hidden'); }));
  $('#generate-ics-btn')?.addEventListener('click',()=>{
    const d=$('#appointment-date').value, t=$('#appointment-time').value, notes=$('#appointment-notes').value||'Appuntamento con Digital Tower';
    if(!d||!t){ alert('Per favore, seleziona data e ora.'); return; }
    downloadICS(new Date(`${d}T${t}`), 60, notes, 'Dettagli da definire.'); closeOverlay(appointmentOverlay);
  });

  // Contatti (usa Netlify Function con CORS)
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
      form.reset(); setTimeout(()=>{ closeOverlay(contactOverlay); status.textContent=''; }, 2500);
    }catch(err){ status.textContent='Oops! '+err.message; status.style.color='#ff4d4d'; }
    finally{ btn.disabled=false; }
  });

  // Init
  updateShareLinks();
  showInstallPrompt();

  // ===== Service Worker: URL dinamico (funziona su Netlify e GitHub Pages) =====
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      // calcola base path della pagina (es. /roberto/)
      const base = location.pathname.endsWith('/') ? location.pathname : location.pathname.substring(0, location.pathname.lastIndexOf('/')+1);
      const swUrl = `${base}service-worker.js`;
      navigator.serviceWorker.register(swUrl)
        .then(()=>console.log('Service worker registrato:', swUrl))
        .catch(err=>console.error('Errore registrazione service worker:', err));
    });
  }
});
