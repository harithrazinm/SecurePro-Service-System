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

  function go(dir){
    const list=steps();
    if(dir>0){
      const cur=list[currentIdx];
      if(cur.q.required&&!answered(cur.card)){
        const e=cur.card.querySelector('.wz-error');
        if(e){e.textContent=T.req;e.classList.add('show')}
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
      setTimeout(render,0);                          // conditional questions may have appeared / disappeared
    });
    // category-form.js renders on DOMContentLoaded too; run after it
    setTimeout(render,0);setTimeout(render,250);
  });
})();
