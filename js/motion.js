/* Dra. Laíssa Gava · manual de marca — abertura, motion de rolagem e visualizador de fotos */
(function(){
  var doc=document.documentElement, ld=document.getElementById('ld'), bar=document.getElementById('ldBar');
  var G=window.gsap, ST=window.ScrollTrigger;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fast=ld && ld.classList.contains('fast');
  var t0=performance.now();

  /* ---------- 1. abertura: espera a animação e as fontes, não as fotos ---------- */
  // As fotos carregam sozinhas conforme a pessoa rola (lazy) e em miniatura leve;
  // durante a abertura só adiantamos as primeiras, sem travar nada.
  var imgs=[].slice.call(document.querySelectorAll('.page img[loading="lazy"]'));
  var warm=imgs.slice(0,6);
  setTimeout(function(){ warm.forEach(function(im){ var p=new Image(); p.decoding='async'; p.src=im.getAttribute('src'); }); },600);
  var fonts=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();
  var MIN=reduce?400:(fast?2400:5000), MAX=reduce?1500:(fast?3000:6000);
  var prog=0, pt=setInterval(function(){ prog=Math.min(1,(performance.now()-(window.__ldStart||0))/MIN); if(bar) bar.style.transform='scaleX('+prog+')'; if(prog>=1) clearInterval(pt); },120);
  window.__motionReady=true;
  var since=performance.now()-(window.__ldStart||0);
  var minWait=new Promise(function(r){ setTimeout(r,Math.max(0,MIN-since)) });
  var cap=new Promise(function(r){ setTimeout(r,Math.max(0,MAX-since)) });
  Promise.race([Promise.all([fonts,minWait]),cap]).then(exit);

  function exit(){
    if(!ld) return start(false);
    try{sessionStorage.setItem('lgSeen','1')}catch(e){}
    if(bar) bar.style.transform='scaleX(1)';
    var mono=document.getElementById('ldMono'), hm=document.querySelector('.hero-mono');
    doc.classList.remove('ld-lock');
    var canFly=G && !reduce && mono && hm && window.scrollY<10 && !location.hash;
    if(canFly){
      doc.classList.add('ld-fly');
      var a=mono.getBoundingClientRect(), b=hm.getBoundingClientRect();
      var s=b.width/a.width, dx=(b.left+b.width/2)-(a.left+a.width/2), dy=(b.top+b.height/2)-(a.top+a.height/2);
      var tl=G.timeline({onComplete:function(){ doc.classList.remove('ld-fly'); ld.remove(); }});
      tl.to('#ldTxt',{y:-18,opacity:0,duration:.55,ease:'power2.in'},0)
        .to('.ld-bar',{opacity:0,duration:.3},0)
        .to(mono,{x:dx,y:dy,scale:s,duration:1.35,ease:'expo.inOut',transformOrigin:'50% 50%'},.15)
        .to('#ldBg',{opacity:0,duration:1.05,ease:'power2.inOut'},.5)
        .add(function(){ start(true) },.75);
    } else if(G && !reduce){
      var t2=G.timeline({onComplete:function(){ ld.remove(); }});
      t2.to('.ld-in',{y:-24,opacity:0,duration:.6,ease:'power2.in'})
        .to(ld,{clipPath:'inset(0 0 100% 0)',duration:.9,ease:'expo.inOut'},'-=.15')
        .add(function(){ start(false) },'-=.75');
    } else {
      ld.classList.add('out'); ld.style.transition='opacity .5s'; ld.style.opacity='0';
      setTimeout(function(){ ld.remove() },500); start(false);
    }
  }

  // quebra um título em palavras com máscara, para subirem uma a uma
  function splitWords(el){
    if(!el || el.dataset.split) return [];
    el.dataset.split='1'; var out=[];
    [].slice.call(el.childNodes).forEach(function(n){
      if(n.nodeType===3){
        var parts=n.textContent.split(/(\s+)/), frag=document.createDocumentFragment();
        parts.forEach(function(t){
          if(!t) return;
          if(/^\s+$/.test(t)){ frag.appendChild(document.createTextNode(' ')); return; }
          var w=document.createElement('span'); w.className='w'; var i=document.createElement('span'); i.className='wi'; i.textContent=t; w.appendChild(i); frag.appendChild(w); out.push(i);
        });
        el.replaceChild(frag,n);
      } else if(n.nodeType===1 && n.tagName!=='BR'){
        var w=document.createElement('span'); w.className='w'; var i=document.createElement('span'); i.className='wi';
        el.replaceChild(w,n); i.appendChild(n); w.appendChild(i); out.push(i);
      }
    });
    return out;
  }

  /* ---------- 2. motion ---------- */
  function start(flew){
    if(location.hash){ var t=document.getElementById(location.hash.slice(1)); if(t) t.scrollIntoView(); }
    if(!G || !ST || reduce){ doc.classList.remove('js-motion'); return lightbox(); }
    G.registerPlugin(ST);
    doc.classList.remove('js-motion');

    // capa
    var hero=G.timeline({defaults:{ease:'power3.out'}});
    var h1w=splitWords(document.querySelector('.hero h1'));
    if(!flew) hero.from('.hero-mono',{opacity:0,scale:.9,y:20,duration:1.4,ease:'expo.out'},0);
    hero.from('.nav-pill',{y:-26,opacity:0,duration:1,ease:'expo.out'},flew?.35:.2)
        .from('.hero-meta > .lbl',{opacity:0,letterSpacing:'.5em',duration:1.2,ease:'expo.out'},flew?.25:.3)
        .from(h1w,{yPercent:115,rotate:3,duration:1.2,ease:'expo.out',stagger:.08},flew?.35:.4)
        .from('.hero-meta > :not(.lbl):not(h1)',{opacity:0,y:24,duration:.9,stagger:.08},flew?.6:.7)
        .from('#inicio .toc',{opacity:0,y:30,scale:.97,duration:.8,stagger:.05},flew?.8:.9);

    // títulos das seções
    G.utils.toArray('.page:not(#inicio) .sh').forEach(function(sh){
      var tl=G.timeline({scrollTrigger:{trigger:sh,start:'top 82%',once:true},defaults:{ease:'power3.out'}});
      var ws=splitWords(sh.querySelector('h2'));
      tl.from(sh.querySelector('.lbl'),{opacity:0,letterSpacing:'.45em',duration:1,ease:'expo.out'})
        .from(ws,{yPercent:115,rotate:2.5,duration:1.1,ease:'expo.out',stagger:.07},'-=.85')
        .from(sh.querySelector('.lead'),{opacity:0,y:20,duration:.8},'-=.75');
    });

    // blocos e cartões entram em cascata
    var SEL=['.block > .lbl','.block > .h3','.block > .lead','.block0 > .lbl','.block0 > .h3','.toc','.tx','.gr','.sw','.cb','.tp-card','.el','.radii > div','.metric','.panel','.lk','.cw','.dg','.gc','.rules > *','.grid2 > *','.grid3 > *','.mk','.ig-wrap > *','.tbl','.avoid','.note','.ph','.ms','.concept > *','.ba > *','.pillars > *','.mu','.dl-cta'];
    var cand=[].slice.call(document.querySelectorAll(SEL.join(','))).filter(function(el){ return !el.closest('#inicio') });
    var set=new Set(cand);
    var items=cand.filter(function(el){ var p=el.parentElement; while(p){ if(set.has(p)) return false; p=p.parentElement; } return true; });
    G.set(items,{opacity:0,y:34});
    ST.batch(items,{start:'top 90%',once:true,interval:.1,batchMax:6,
      onEnter:function(b){ G.to(b,{opacity:1,y:0,duration:.9,ease:'power3.out',stagger:.08,overwrite:true,clearProps:'transform'}); }});

    // fotos: abrem de dentro para fora
    G.utils.toArray('.ph-slot img, .ms-slot img').forEach(function(im){
      G.fromTo(im,{scale:1.16},{scale:1,duration:1.6,ease:'expo.out',scrollTrigger:{trigger:im.parentElement,start:'top 92%',once:true}});
    });
    G.utils.toArray('.ph-slot, .ms-slot').forEach(function(sl){
      G.fromTo(sl,{clipPath:'inset(10% 6% 10% 6% round 28px)'},{clipPath:'inset(0% 0% 0% 0% round 0px)',duration:1.3,ease:'expo.out',clearProps:'clipPath',scrollTrigger:{trigger:sl,start:'top 92%',once:true}});
    });

    // texturas: leve deriva no scroll (desktop)
    var mm=G.matchMedia();
    mm.add('(min-width: 821px)',function(){
      G.utils.toArray('.tx-img').forEach(function(im){
        G.fromTo(im,{objectPosition:'50% 30%'},{objectPosition:'50% 70%',ease:'none',scrollTrigger:{trigger:im,start:'top bottom',end:'bottom top',scrub:.6}});
      });
      G.to('.hero-mono',{yPercent:12,ease:'none',scrollTrigger:{trigger:'#inicio',start:'top top',end:'bottom top',scrub:.6}});
    });

    var rt=null; function soon(){ clearTimeout(rt); rt=setTimeout(function(){ ST.refresh() },200); }
    imgs.forEach(function(im){ if(!im.complete) im.addEventListener('load',soon,{once:true}); });
    window.addEventListener('load',soon);
    lightbox();
  }

  /* ---------- 3. visualizador das fotos ---------- */
  function lightbox(){
    var lb=document.getElementById('lb'), lbImg=document.getElementById('lbImg'), lbCap=document.getElementById('lbCap');
    if(!lb) return;
    var group=[], gi=0, busy=false, last=null;
    function thumbImg(i){ return group[i].querySelector('img'); }
    function setCap(){ lbCap.innerHTML=group[gi].getAttribute('data-cap')+'<small>'+(gi+1<10?'0':'')+(gi+1)+' / '+(group.length<10?'0':'')+group.length+'</small>'; }
    function load(i){ var im=thumbImg(i), full=im.getAttribute('data-full');
      lbImg.src=im.currentSrc||im.src; lbImg.alt=im.alt;
      if(full){ var hi=new Image(); hi.onload=function(){ if(thumbImg(gi)===im) lbImg.src=full; }; hi.src=full; }
      return lbImg.decode?lbImg.decode().catch(function(){}):Promise.resolve(); }
    function flipFrom(el){
      var a=el.getBoundingClientRect(), b=lbImg.getBoundingClientRect();
      if(!b.width) return null;
      return {x:a.left-b.left,y:a.top-b.top,scaleX:a.width/b.width,scaleY:a.height/b.height};
    }
    function open(btn){
      if(busy) return; busy=true; last=btn;
      group=[].slice.call(btn.closest('.phs,.mss').querySelectorAll('.zoomable')); gi=group.indexOf(btn);
      document.body.classList.add('lb-open'); lb.hidden=false; setCap();
      load(gi).then(function(){
        if(G && !reduce){
          var f=flipFrom(thumbImg(gi));
          G.set(lb,{backgroundColor:'rgba(36,17,20,0)'});
          G.set([lb.querySelectorAll('button'),lbCap],{opacity:0});
          var tl=G.timeline({onComplete:function(){busy=false}});
          tl.to(lb,{backgroundColor:'rgba(36,17,20,.94)',duration:.5,ease:'power2.out'},0);
          if(f) tl.fromTo(lbImg,{x:f.x,y:f.y,scaleX:f.scaleX,scaleY:f.scaleY,borderRadius:28,transformOrigin:'0 0'},{x:0,y:0,scaleX:1,scaleY:1,borderRadius:18,duration:.75,ease:'expo.out'},0);
          tl.to([lb.querySelectorAll('button'),lbCap],{opacity:1,duration:.4,stagger:.04},.3);
        } else busy=false;
        lb.querySelector('.lb-x').focus({preventScroll:true});
      });
    }
    function close(){
      if(busy) return; busy=true;
      var target=thumbImg(gi), r=target.getBoundingClientRect(), vis=r.bottom>0&&r.top<innerHeight;
      function end(){ lb.hidden=true; document.body.classList.remove('lb-open'); G&&G.set(lbImg,{clearProps:'all'}); lbImg.removeAttribute('src'); busy=false; try{(group[gi]||last).focus({preventScroll:true})}catch(e){} }
      if(G && !reduce){
        var tl=G.timeline({onComplete:end});
        tl.to([lb.querySelectorAll('button'),lbCap],{opacity:0,duration:.2},0);
        if(vis){ var f=flipFrom(target); tl.to(lbImg,{x:f.x,y:f.y,scaleX:f.scaleX,scaleY:f.scaleY,borderRadius:28,transformOrigin:'0 0',duration:.6,ease:'expo.inOut'},0); }
        else tl.to(lbImg,{opacity:0,scale:.94,duration:.35,ease:'power2.in'},0);
        tl.to(lb,{backgroundColor:'rgba(36,17,20,0)',duration:.45},.15);
      } else end();
    }
    function go(dir){
      if(busy||group.length<2) return; busy=true;
      var ni=(gi+dir+group.length)%group.length;
      if(!G||reduce){ gi=ni; load(gi).then(function(){ setCap(); busy=false; }); return; }
      G.to(lbImg,{x:-dir*60,opacity:0,duration:.25,ease:'power2.in',onComplete:function(){
        gi=ni; load(gi).then(function(){ setCap();
          G.fromTo(lbImg,{x:dir*60,opacity:0},{x:0,opacity:1,duration:.5,ease:'expo.out',onComplete:function(){busy=false}});
          G.fromTo(lbCap,{opacity:0,y:6},{opacity:1,y:0,duration:.4});
        });
      }});
    }
    document.querySelectorAll('.zoomable').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); open(b); }); });
    lb.querySelector('.lb-x').addEventListener('click',function(e){ e.stopPropagation(); close(); });
    lb.querySelector('.lb-p').addEventListener('click',function(e){ e.stopPropagation(); go(-1); });
    lb.querySelector('.lb-n').addEventListener('click',function(e){ e.stopPropagation(); go(1); });
    lb.addEventListener('click',function(e){ if(e.target===lb) close(); });
    document.addEventListener('keydown',function(e){ if(lb.hidden) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') go(-1); if(e.key==='ArrowRight') go(1); });
    // arrastar no celular: a foto acompanha o dedo
    var sx=null, dx=0;
    lb.addEventListener('touchstart',function(e){ if(busy) return; sx=e.touches[0].clientX; dx=0; },{passive:true});
    lb.addEventListener('touchmove',function(e){ if(sx===null) return; dx=e.touches[0].clientX-sx; if(G) G.set(lbImg,{x:dx*.6,opacity:1-Math.min(.5,Math.abs(dx)/600)}); },{passive:true});
    lb.addEventListener('touchend',function(){ if(sx===null) return; sx=null;
      if(Math.abs(dx)>60) go(dx<0?1:-1); else if(G) G.to(lbImg,{x:0,opacity:1,duration:.35,ease:'power3.out'}); });
  }
})();
