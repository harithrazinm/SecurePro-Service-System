window.CATEGORY_FORM_CONFIG = {
  code: "audio_visual", name: { en: "Audio & Visual", ms: "Audio & Visual" }, back: { en: "← Back", ms: "← Kembali" }, continue: { en: "Continue to Customer Details →", ms: "Teruskan ke Maklumat Pelanggan →" }, translations: { en: { intro: "Tell us what you need for your Audio & Visual system." }, ms: { intro: "Beritahu kami keperluan sistem Audio & Visual anda." } }, questions: [
    { id: "av_services", type: "multi", required: true, title: { en: "What service is required?", ms: "Apakah perkhidmatan yang diperlukan?" }, options: ["PA / Sound System", "Projector & Screen", "LED Display", "TV / Commercial Display", "Meeting Room AV", "Audio Conference", "Video Conference", "Microphone System", "Live Streaming", "PTZ Camera", "Digital Signage", "Lain-lain"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },
    { id: "av_purpose", type: "multi", required: true, title: { en: "What is the system for?", ms: "Sistem ini untuk kegunaan apa?" }, options: ["Meeting Room", "Training Room", "Dewan", "Masjid / Surau", "Sekolah", "Pejabat", "Event Space", "Retail", "Lain-lain"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },

    { id: "installation_type", type: "radio", required: true, title: { en: "How is the installation?", ms: "Pemasangan bagaimana?" }, options: ["New System", "Upgrade Existing System", "Add Equipment", "Repair / Troubleshooting"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },
    { id: "room_size", type: "fields", required: true, title: { en: "Estimated room / space size", ms: "Anggaran saiz ruang?" }, fields: [{ id: "length", type: "number", label: { en: "Length (m)", ms: "Panjang (m)" } }, { id: "width", type: "number", label: { en: "Width (m)", ms: "Lebar (m)" } }, { id: "size", type: "select", label: { en: "Size", ms: "Saiz" }, options: [{ value: "small", label: { en: "Small", ms: "Small" } }, { value: "medium", label: { en: "Medium", ms: "Medium" } }, { value: "large", label: { en: "Large", ms: "Large" } }, { value: "unknown", label: { en: "Not sure", ms: "Tidak pasti" } }] }] },
    { id: "audience_capacity", type: "radio", required: true, title: { en: "Estimated users / audience", ms: "Anggaran kapasiti pengguna / audience?" }, options: ["<20", "20–50", "51–100", "101–300", ">300"].map(x => ({ value: x, label: { en: x, ms: x } })) },
    { id: "equipment_required", type: "multi", required: true, title: { en: "Equipment required", ms: "Equipment yang diperlukan" }, options: ["Speaker", "Amplifier", "Mixer", "Wired Microphone", "Wireless Microphone", "Projector", "Screen", "Display / TV", "PTZ Camera", "Video Switcher", "Conference Microphone", "DSP", "Controller", "Rack", "UPS"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },
    { id: "sound_microphone_count", type: "number", title: { en: "How many microphones are required?", ms: "Berapa mikrofon diperlukan?" }, condition: { question: "av_services", values: ["pa_sound_system", "microphone_system"] } },
    { id: "sound_microphone_type", type: "radio", title: { en: "Wired / Wireless?", ms: "Berwayar / Tanpa Wayar?" }, condition: { question: "av_services", values: ["pa_sound_system", "microphone_system"] }, options: ["Wired", "Wireless"].map(x => ({ value: x.toLowerCase(), label: { en: x, ms: x } })) },
    { id: "sound_usage", type: "radio", title: { en: "For speech, music or both?", ms: "Untuk ucapan, muzik atau kedua-duanya?" }, condition: { question: "av_services", values: ["pa_sound_system"] }, options: ["Speech", "Music", "Both"].map(x => ({ value: x.toLowerCase(), label: { en: x, ms: x } })) },
    { id: "sound_environment", type: "radio", title: { en: "Indoor / Outdoor?", ms: "Indoor / Outdoor?" }, condition: { question: "av_services", values: ["pa_sound_system"] }, options: ["Indoor", "Outdoor", "Both"].map(x => ({ value: x.toLowerCase(), label: { en: x, ms: x } })) },
    { id: "existing_speaker_system", type: "radio", title: { en: "Is there an existing speaker system?", ms: "Ada sistem speaker sedia ada?" }, condition: { question: "av_services", values: ["pa_sound_system"] }, options: ["Yes", "No", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/ /g, "_"), label: { en: x, ms: x } })) },
    { id: "display_type", type: "radio", title: { en: "Projector or TV / LED Display?", ms: "Projector atau TV / LED Display?" }, condition: { question: "av_services", values: ["projector_screen", "led_display", "tv_commercial_display"] }, options: ["Projector", "TV / LED Display", "Both"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },
    { id: "screen_size", type: "text", title: { en: "Estimated screen / display size", ms: "Anggaran saiz skrin / display" }, condition: { question: "av_services", values: ["projector_screen", "led_display", "tv_commercial_display"] } },
    { id: "presentation_source", type: "multi", title: { en: "Presentation source", ms: "Sumber presentation" }, condition: { question: "av_services", values: ["projector_screen", "led_display", "tv_commercial_display"] }, options: ["Laptop / PC", "HDMI", "Wireless Presentation"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },
    { id: "display_quantity", type: "number", title: { en: "How many displays are required?", ms: "Berapa display diperlukan?" }, condition: { question: "av_services", values: ["projector_screen", "led_display", "tv_commercial_display"] } },
    { id: "meeting_participants", type: "radio", title: { en: "How many participants?", ms: "Berapa orang peserta?" }, condition: { question: "av_services", values: ["meeting_room_av", "audio_conference", "video_conference"] }, options: ["<10", "10–20", "21–50", ">50"].map(x => ({ value: x, label: { en: x, ms: x } })) },
    { id: "individual_conference_mics", type: "radio", title: { en: "Individual conference microphone required?", ms: "Perlu individual conference microphone?" }, condition: { question: "av_services", values: ["meeting_room_av", "audio_conference", "video_conference"] }, options: ["Yes", "No", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/ /g, "_"), label: { en: x, ms: x } })) },
    { id: "meeting_platform", type: "multi", title: { en: "Zoom / Teams / Google Meet?", ms: "Zoom / Teams / Google Meet?" }, condition: { question: "av_services", values: ["meeting_room_av", "audio_conference", "video_conference"] }, options: ["Zoom", "Microsoft Teams", "Google Meet", "Others"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },
    { id: "auto_tracking_ptz", type: "radio", title: { en: "Auto-tracking / PTZ required?", ms: "Perlu auto-tracking / PTZ?" }, condition: { question: "av_services", values: ["meeting_room_av", "video_conference"] }, options: ["Yes", "No", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/ /g, "_"), label: { en: x, ms: x } })) },
    { id: "screen_sharing", type: "radio", title: { en: "Screen sharing required?", ms: "Perlu screen sharing?" }, condition: { question: "av_services", values: ["meeting_room_av", "video_conference"] }, options: ["Yes", "No", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/ /g, "_"), label: { en: x, ms: x } })) },
    { id: "streaming_platform", type: "multi", title: { en: "Streaming platform", ms: "Platform live streaming" }, condition: { question: "av_services", values: ["live_streaming"] }, options: ["Facebook", "YouTube", "Zoom", "Others"].map(x => ({ value: x.toLowerCase(), label: { en: x, ms: x } })) },
    { id: "streaming_camera_count", type: "number", title: { en: "How many cameras?", ms: "Berapa kamera?" }, condition: { question: "av_services", values: ["live_streaming"] } },
    { id: "streaming_ptz", type: "radio", title: { en: "PTZ required?", ms: "Perlu PTZ?" }, condition: { question: "av_services", values: ["live_streaming"] }, options: ["Yes", "No", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/ /g, "_"), label: { en: x, ms: x } })) },
    { id: "streaming_mixer_audio", type: "radio", title: { en: "Audio from mixer required?", ms: "Perlu audio daripada mixer?" }, condition: { question: "av_services", values: ["live_streaming"] }, options: ["Yes", "No", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/ /g, "_"), label: { en: x, ms: x } })) },
    { id: "streaming_recording", type: "radio", title: { en: "Recording required?", ms: "Perlu recording?" }, condition: { question: "av_services", values: ["live_streaming"] }, options: ["Yes", "No", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/ /g, "_"), label: { en: x, ms: x } })) },
    { id: "streaming_mode", type: "radio", title: { en: "Single platform or multi-platform?", ms: "Single platform atau multi-platform?" }, condition: { question: "av_services", values: ["live_streaming"] }, options: ["Single Platform", "Multi-platform"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },
    { id: "existing_equipment", type: "radio", required: true, title: { en: "Is there any equipment available?", ms: "Adakah equipment sedia ada?" }, options: ["None", "Yes", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/ /g, "_"), label: { en: x, ms: x } })) },
    { id: "existing_equipment_details", type: "textarea", title: { en: "Existing equipment details (optional — you may skip this question)", ms: "Butiran equipment sedia ada (pilihan,boleh langkau soalan ini)" } },
    { id: "existing_infrastructure", type: "multi", required: true, title: { en: "Existing infrastructure", ms: "Infrastruktur sedia ada" }, options: ["Network / Internet", "Electrical Point", "LAN Cabling", "Rack", "Not sure"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) },
    { id: "location_media", type: "file", title: { en: "Upload location photos (optional)", ms: "Muat naik gambar lokasi (pilihan)" }, description: { en: "Choose JPG, PNG or WebP photos. You can select multiple images; they will be carried to Customer Details and uploaded to Cloudinary when you submit the request.", ms: "Pilih gambar JPG, PNG atau WebP. Anda boleh memilih beberapa gambar; gambar akan dibawa ke Maklumat Pelanggan dan dimuat naik ke Cloudinary apabila permintaan dihantar." }, accept: ["image/jpeg", "image/png", "image/webp"], multiple: true },
    { id: "installation_location", type: "fields", required: true, title: { en: "Site visit", ms: "Lawatan Tapak" }, fields: [{ id: "site_visit", type: "select", label: { en: "Do you require a site visit?", ms: "Adakah anda memerlukan lawatan tapak?" }, options: [{ value: "required", label: { en: "Required", ms: "Diperlukan" } }, { value: "not_required", label: { en: "Not Required", ms: "Tidak Diperlukan" } }, { value: "unsure", label: { en: "Not sure", ms: "Tidak pasti" } }] }] },
    { id: "budget", type: "radio", title: { en: "Budget (optional)", ms: "Budget anggaran (optional)" }, options: ["< RM5,000", "RM5k–10k", "RM10k–30k", "RM30k–50k", "> RM50k", "Need recommendation first"].map(x => ({ value: x.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label: { en: x, ms: x } })) }
  ]
};

/* The shared renderer only draws radio / multi / fields questions.
   Render single number / text / textarea questions as a one-field "fields" question
   so they actually appear and their answers are saved. */
window.CATEGORY_FORM_CONFIG.questions = window.CATEGORY_FORM_CONFIG.questions.map(q => ['number', 'text', 'textarea'].includes(q.type) ? Object.assign({}, q, { type: 'fields', fields: [{ id: q.id, type: q.type, label: { en: '', ms: '' }, full: true, required: !!q.required, min: q.type === 'number' ? 0 : undefined }] }) : q);

/* Conditional questions: show a card only when its trigger option is selected in "av_services" */
(function () {
  const rootEl = () => document.querySelector('#categoryQuestions');
  function selected(id) {
    const root = rootEl(); if (!root) return [];
    return [...root.querySelectorAll(`input[name="${CSS.escape(id)}"]`)].filter(e => e.checked).map(e => e.value);
  }
  function card(id) {
    const root = rootEl(); if (!root) return null;
    const el = root.querySelector(`[name="${CSS.escape(id)}"],[data-answer="${CSS.escape(id)}"]`);
    return el ? el.closest('.question-card') : null;
  }
  function update() {
    window.CATEGORY_FORM_CONFIG.questions.filter(q => q.condition).forEach(q => {
      const c = card(q.id); if (!c) return;
      const chosen = selected(q.condition.question);
      const show = q.condition.values.some(v => chosen.includes(v));
      if (c.hidden === !show) return;
      c.hidden = !show;
      if (!show) c.querySelectorAll('input,select,textarea').forEach(e => { if (e.type === 'radio' || e.type === 'checkbox') e.checked = false; else e.value = '' });
    });
  }
  function ensureInlineOtherFields() {
    const definitions = [
      { question: 'av_services', field: 'av_services_other', en: 'Please specify other service', ms: 'Sila nyatakan perkhidmatan lain' },
      { question: 'av_purpose', field: 'av_purpose_other', en: 'Please specify other purpose', ms: 'Sila nyatakan kegunaan lain' }
    ];
    definitions.forEach(def => {
      const qCard = rootEl()?.querySelector(`.question-card[data-question-id="${def.question}"]`);
      if (!qCard || qCard.querySelector(`[data-inline-other="${def.field}"]`)) return;
      const wrap = document.createElement('div');
      wrap.className = 'av-inline-other';
      wrap.dataset.inlineOther = def.field;
      wrap.hidden = true;
      const label = document.createElement('label');
      label.htmlFor = def.field;
      label.textContent = localStorage.getItem('securepro_language') === 'en' ? def.en : def.ms;
      const textarea = document.createElement('textarea');
      textarea.id = def.field;
      textarea.dataset.answer = def.field;
      textarea.rows = 3;
      textarea.placeholder = localStorage.getItem('securepro_language') === 'en' ? 'Enter details here…' : 'Masukkan butiran di sini…';
      textarea.required = true;
      wrap.append(label, textarea);
      qCard.appendChild(wrap);
    });
  }
  function updateInlineOtherFields() {
    [
      { question: 'av_services', field: 'av_services_other' },
      { question: 'av_purpose', field: 'av_purpose_other' }
    ].forEach(def => {
      const chosen = selected(def.question);
      const wrap = rootEl()?.querySelector(`[data-inline-other="${def.field}"]`);
      const input = wrap?.querySelector('textarea');
      if (!wrap || !input) return;
      const show = chosen.includes('lain_lain');
      wrap.hidden = !show;
      input.disabled = !show;
      input.required = show;
      if (!show) input.value = '';
    });
  }
  window.SOPRO_AV_UPDATE_CONDITIONS = () => { update(); ensureInlineOtherFields(); updateInlineOtherFields(); };
  window.SOPRO_AV_UPDATE_INLINE_OTHER = updateInlineOtherFields;
  document.addEventListener('DOMContentLoaded', () => {
    const r = rootEl(); if (!r) return;
    ensureInlineOtherFields();
    r.addEventListener('change', e => {
      if (e.target.name === 'av_services' || e.target.name === 'av_purpose') {
        update(); ensureInlineOtherFields(); updateInlineOtherFields();
      }
    });
    update(); updateInlineOtherFields();
    setTimeout(() => { ensureInlineOtherFields(); update(); updateInlineOtherFields(); }, 0);
  });
})();

/* ================= AUDIO & VISUAL ONE-QUESTION WIZARD ================= */
/* One question per page. Sits on top of the shared category-form.js renderer:
   it only shows/hides the rendered .question-card sections and adds Back / Next. */
(function(){
  "use strict";
  const lang=localStorage.getItem('securepro_language')==='en'?'en':'ms';
  const T={
    en:{back:'← Back',next:'Next →',q:'Question',of:'of',req:'Please answer this question to continue.'},
    ms:{back:'← Kembali',next:'Seterusnya →',q:'Soalan',of:'daripada',req:'Sila jawab soalan ini untuk teruskan.'}
  }[lang];

  let root,form,nav,backBtn,nextBtn,submitBtn,fill,topL,topR,currentIdx=0,backHref='../index.html#services',busy=false;

  const questions=()=>window.CATEGORY_FORM_CONFIG.questions;
  const cards=()=>[...root.querySelectorAll('.question-card')];
  const steps=()=>{const c=cards();return questions().map((q,i)=>({q,card:c[i]})).filter(s=>s.card&&!s.card.hidden)};

  function answered(card){
    const fields=[...card.querySelectorAll('input,select,textarea')];
    if(!fields.length)return true;
    return fields.some(e=>(e.type==='radio'||e.type==='checkbox')?e.checked:String(e.value).trim()!=='');
  }

  function ensureUI(){
    if(nav&&nav.isConnected)return true;
    const actions=root.querySelector('.question-actions')||form.querySelector('.question-actions');
    if(!actions)return false;                       // renderer not finished yet
    const back=actions.querySelector('a.secondary');
    if(back)backHref=back.getAttribute('href')||backHref;
    submitBtn=actions.querySelector('button[type="submit"]');
    actions.classList.add('wz-hidden');

    document.querySelector('.wz-progress')?.remove();
    const prog=document.createElement('div');prog.className='wz-progress';
    prog.innerHTML='<div class="wz-progress-top"><span class="wz-l"></span><strong class="wz-r"></strong></div><div class="wz-track"><div class="wz-fill"></div></div>';
    form.insertBefore(prog,form.firstChild);
    topL=prog.querySelector('.wz-l');topR=prog.querySelector('.wz-r');fill=prog.querySelector('.wz-fill');

    nav=document.createElement('div');nav.className='wz-nav';
    backBtn=document.createElement('button');backBtn.type='button';backBtn.className='wz-btn wz-back';
    nextBtn=document.createElement('button');nextBtn.type='button';nextBtn.className='wz-btn wz-next';
    const sp=document.createElement('span');sp.className='wz-spacer';
    nav.append(backBtn,sp,nextBtn);
    if(submitBtn)nav.appendChild(submitBtn);        // original "Continue to Customer Details" button
    form.appendChild(nav);

    backBtn.addEventListener('click',()=>go(-1));
    nextBtn.addEventListener('click',()=>go(1));
    form.addEventListener('keydown',e=>{
      const t=e.target;
      if(e.key==='Enter'&&t.tagName==='INPUT'&&t.type!=='checkbox'&&t.type!=='radio'&&nextBtn.style.display!=='none'){e.preventDefault();go(1)}
    });
    return true;
  }

  function render(){
    if(busy||!root)return;
    busy=true;
    try{
      const list=steps();
      if(!list.length||!ensureUI())return;
      if(currentIdx>=list.length)currentIdx=list.length-1;
      if(currentIdx<0)currentIdx=0;

      cards().forEach(c=>{c.classList.add('wz-hidden');c.classList.remove('wz-current')});
      const cur=list[currentIdx];
      cur.card.classList.remove('wz-hidden');cur.card.classList.add('wz-current');

      // number the visible questions 01, 02, 03 … in the order the person sees them
      list.forEach((s,i)=>{const n=s.card.querySelector('.question-number');if(n)n.textContent=String(i+1).padStart(2,'0')});

      if(!cur.card.querySelector('.wz-error')){
        const e=document.createElement('div');e.className='wz-error';cur.card.appendChild(e);
      }
      topL.textContent=`${T.q} ${currentIdx+1} ${T.of} ${list.length}`;
      const pct=(currentIdx+1)/list.length*100;
      topR.textContent=Math.round(pct)+'%';
      fill.style.width=pct+'%';
      backBtn.textContent=T.back;nextBtn.textContent=T.next;
      const last=currentIdx===list.length-1;
      nextBtn.style.display=last?'none':'';
      if(submitBtn)submitBtn.style.display=last?'':'none';
    }finally{busy=false}
  }

  function currentQuestionValid(cur){
    if(cur.q.required&&!answered(cur.card)) return false;
    if(cur.q.id==='av_services'||cur.q.id==='av_purpose'){
      const selected=[...cur.card.querySelectorAll('input[type="checkbox"]:checked')].map(el=>el.value);
      if(selected.includes('lain_lain')){
        const details=cur.card.querySelector(`[data-answer="${cur.q.id}_other"]`);
        if(!details||!details.value.trim()) return false;
      }
    }
    return true;
  }

  function go(dir){
    const list=steps();
    if(dir>0){
      const cur=list[currentIdx];
      if(!currentQuestionValid(cur)){
        const e=cur.card.querySelector('.wz-error');
        if(e){e.textContent=T.req;e.classList.add('show')}
        const missing=cur.card.querySelector('textarea[required]:not(:disabled)');
        if(missing && !missing.value.trim()) missing.focus();
        return;
      }
      if(currentIdx<list.length-1)currentIdx++;
    }else{
      if(currentIdx===0){window.location.href=backHref;return}
      currentIdx--;
    }
    render();
    (document.querySelector('.category-question-header')||form).scrollIntoView({behavior:'smooth',block:'start'});
  }

  document.addEventListener('DOMContentLoaded',()=>{
    root=document.getElementById('categoryQuestions');form=document.getElementById('questionForm');
    if(!root||!form)return;
    root.addEventListener('change',()=>{
      root.querySelectorAll('.wz-error.show').forEach(x=>x.classList.remove('show'));
      window.SOPRO_AV_UPDATE_INLINE_OTHER?.();
      setTimeout(render,0);                          // conditional questions may have appeared / disappeared
    });
    // category-form.js renders on DOMContentLoaded too; run after it
    setTimeout(render,0);setTimeout(render,250);
  });
})();


/* Keep Q10 uploads between the question page and Customer Details.
   The existing review flow then submits these files as customer_photos to Cloudinary. */
window.SOPRO_BEFORE_CATEGORY_CONTINUE = async function () {
  const input = document.querySelector('[data-answer="location_media"]');
  const files = input && input.files ? Array.from(input.files) : [];
  if (!files.length) return;

  const maxFiles = 10;
  const maxBytes = 20 * 1024 * 1024;
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (files.length > maxFiles) {
    alert((localStorage.getItem("securepro_language") === "en")
      ? "Please select no more than 10 location photos."
      : "Sila pilih maksimum 10 gambar lokasi.");
    throw new Error("Too many location photos.");
  }
  for (const file of files) {
    if (!allowed.has(file.type)) {
      alert((localStorage.getItem("securepro_language") === "en")
        ? "Only JPG, PNG and WebP images are supported."
        : "Hanya gambar JPG, PNG dan WebP disokong.");
      throw new Error("Unsupported location photo type.");
    }
    if (file.size > maxBytes) {
      alert((localStorage.getItem("securepro_language") === "en")
        ? "Each image must be 20 MB or smaller."
        : "Setiap gambar mestilah 20 MB atau lebih kecil.");
      throw new Error("Location photo is too large.");
    }
  }

  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("SecureProPhotosDB", 1);
    request.onupgradeneeded = event => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains("photos")) {
        database.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    const store = tx.objectStore("photos");
    store.clear();
    files.forEach(file => store.add({ name: file.name, type: file.type, file, source: "av" }));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Unable to save location photos."));
  });
  db.close();
};
