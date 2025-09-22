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
  const installButtons = $$('.install-btn'); // dichiarata UNA SOLA VOLTA

  // ===== UI =====
  const flip = () => {
    play(sfxFlip);
    const flipped = cardFlipper.classList.toggle('is-flipped');
    ga('event','flip_card',{to: flipped ? 'personal':'agency'});
  };
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = () => ('standalone' in navigator) && navigator.standalone;
  const isMobile = () => window.matchMedia('(max-width: 480px)').matches;

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
    ca
