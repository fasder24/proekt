function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);
 requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},2600)}

let soundOn=localStorage.getItem('physlab_snd')==='1';
function paintSnd(){const b=$('snd');if(b){b.textContent=soundOn?'🔊':'🔇';b.classList.toggle('on',soundOn)}}
function beep(freq,dur=.18,type='sine'){if(!soundOn)return;try{const ac=window._ac||(window._ac=new(window.AudioContext||window.webkitAudioContext)());const o=ac.createOscillator(),gn=ac.createGain();o.type=type;o.frequency.value=freq;o.connect(gn);gn.connect(ac.destination);gn.gain.setValueAtTime(.07,ac.currentTime);gn.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.start();o.stop(ac.currentTime+dur)}catch(e){}}

const favSet=()=>new Set(JSON.parse(localStorage.getItem('physlab_fav')||'[]'));
function toggleFav(id){const s=favSet();const on=!s.has(id);on?s.add(id):s.delete(id);localStorage.setItem('physlab_fav',JSON.stringify([...s]));paintFav();applyFilters();
 if(typeof pushFav==='function')pushFav(id,on);}
function paintFav(){const s=favSet();document.querySelectorAll('.fav').forEach(b=>{const on=s.has(b.dataset.id);b.textContent=on?'★':'☆';b.classList.toggle('on',on)})}

/* Все лаборатории, специальные (proj/pend/ohm) открываются через go(), остальные через openLabById */
const ALL_IDS=['proj','pend','ohm','spring','incline','collide','chute','orbit','beats','lever','rc','buoy','chaos','atwood','circular','heat','lens','wave','gas','snell','doppler','lorentz','resonance','photoeffect','decay','coulomb','lc'];
const SPECIAL=['proj','pend','ohm'];
function openRandom(){const id=ALL_IDS[Math.floor(Math.random()*ALL_IDS.length)];SPECIAL.includes(id)?go(id):openLabById(id)}

/* Поиск, фильтр, сортировка */
function applyFilters(){
 const q=($('srch').value||'').trim().toLocaleLowerCase('ru'),active=$('chips').querySelector('.on'),tag=active?active.dataset.tag:'',favOnly=active&&active.dataset.tag==='__fav__',favs=favSet();
 const cards=[...document.querySelectorAll('.labcard')];
 cards.forEach(c=>{
  const name=(c.dataset.name||'').toLocaleLowerCase('ru');
  const okQ=name.includes(q),okTag=!tag||favOnly||c.dataset.tag===tag,okFav=!favOnly||favs.has(c.dataset.id);
  c.style.display=(okQ&&okTag&&okFav)?'':'none'});
 sortCards();
 const visible=cards.filter(c=>c.style.display!=='none').length;
 const status=$('catalogStatus'),empty=$('catalogEmpty');
 if(status)status.textContent='Показано '+visible+' из '+cards.length+' лабораторий';
 if(empty)empty.hidden=visible!==0;
 if($('clearSearch'))$('clearSearch').disabled=!q&&!tag;
}
function sortCards(){const grid=$('allgrid'),mode=$('sortSel').value,cards=[...grid.children];
 if(mode==='0')cards.sort((a,b)=>ALL_IDS.indexOf(a.dataset.id)-ALL_IDS.indexOf(b.dataset.id));
 else if(mode==='1')cards.sort((a,b)=>a.dataset.diff-b.dataset.diff);
 else if(mode==='2')cards.sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name,'ru'));
 cards.forEach(c=>grid.appendChild(c));
}
(function initChips(){const tags=[...new Set(ALL_IDS.map(id=>{const c=document.querySelector('.labcard[data-id="'+id+'"]');return c&&c.dataset.tag}))].filter(Boolean);
 const make=(tag,label,on=false)=>'<button type="button" class="chip'+(on?' on':'')+'" data-tag="'+tag+'" aria-pressed="'+on+'">'+label+'</button>';
 $('chips').innerHTML=make('','Все',true)+tags.map(t=>make(t,t)).join('')+make('__fav__','★ Избранное');
 $('chips').onclick=e=>{const chip=e.target.closest('.chip');if(!chip)return;
  $('chips').querySelectorAll('.chip').forEach(c=>{const on=c===chip;c.classList.toggle('on',on);c.setAttribute('aria-pressed',String(on))});
  applyFilters()};
})();
$('srch').oninput=applyFilters;$('sortSel').onchange=sortCards;
$('clearSearch')&&($('clearSearch').onclick=()=>{$('srch').value='';$('chips').querySelectorAll('.chip').forEach(c=>{const on=c.dataset.tag==='';c.classList.toggle('on',on);c.setAttribute('aria-pressed',String(on))});$('sortSel').value='0';applyFilters();$('srch').focus()});
$('luck').onclick=openRandom;

/* Экспорт в CSV */
function csvFrom(pairs,name){const csv='Показатель;Значение\n'+pairs.map(p=>p.map(x=>String(x).replace(/(\d)\.(\d)/g,'$1,$2')).join(';')).join('\n'),blob=new Blob(['\ufeff'+csv],{type:'text/csv'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=name+'.csv';a.click();toast('Файл '+name+'.csv скачан')}
$('pcsv')&&($('pcsv').onclick=()=>csvFrom([['Дальность,м',$('rL').textContent],['Время полёта,с',$('rT').textContent],['Макс. высота,м',$('rH').textContent],['Отклонение,%',$('rE').textContent]],'brosok'));
$('lcsv')&&($('lcsv').onclick=()=>csvFrom([...$('lo').children].map(d=>[d.firstChild.textContent,d.querySelector('b').textContent]),L?L.id:'lab'));

/* Печать отчёта по лаборатории */
function printReport(title,params,results,theory,canvasId){
 const img=canvasId&&$(canvasId)?'<img src="'+$(canvasId).toDataURL('image/png')+'" alt="Результат симуляции">':'';
 const tbl=pairs=>'<table><tbody>'+pairs.map(p=>'<tr><td>'+p[0]+'</td><td><b>'+p[1]+'</b></td></tr>').join('')+'</tbody></table>';
 $('report').innerHTML='<h1>PhysLab — отчёт по лабораторной работе</h1>'
  +'<p class="rdate"><b>'+title+'</b> · '+new Date().toLocaleString('ru-RU')+'</p>'
  +(params&&params.length?'<h2>Параметры опыта</h2>'+tbl(params):'')
  +(results&&results.length?'<h2>Результаты</h2>'+tbl(results):'')
 +(img?'<h2>График / модель</h2>'+img:'')
  +(theory?'<h2>Теория</h2><div class="rtheory">'+theory+'</div>':'')
  +'<p class="rfoot">Сформировано сайтом PhysLab · интерактивная лаборатория физики</p>';
 toast('Отчёт готов — откроется окно печати');
 setTimeout(()=>window.print(),350);
}
function resPairs(sel){const box=document.querySelector(sel);return box?[...box.children].map(d=>[d.firstChild.textContent,d.querySelector('b').textContent]):[]}
function theoryOf(viewId){const cards=document.querySelectorAll('#'+viewId+' .card');return cards.length?cards[cards.length-1].innerHTML:''}
$('lprn')&&($('lprn').onclick=()=>printReport($('lt').textContent,L.p.map((q,j)=>[q[1],$('pl'+j).textContent]),resPairs('#lo'),'',$('ltx').innerHTML,'lc'));
$('pprn')&&($('pprn').onclick=()=>printReport('🏹 Бросок под углом',[['Скорость v₀',$('pvv').textContent],['Угол α',$('pav').textContent],['Высота h',$('phv').textContent],['Сопротивление воздуха',$('pkv').textContent]],resPairs('#v-proj .res'),theoryOf('v-proj'),'cp'));
$('mprn')&&($('mprn').onclick=()=>printReport('⏱ Маятник',[['Длина L',$('mlv').textContent],['Начальный угол',$('mav').textContent]],resPairs('#v-pend .res'),theoryOf('v-pend'),'cm'));
$('oprn')&&($('oprn').onclick=()=>printReport('💡 Закон Ома',[['Напряжение U',$('ouv').textContent],['R₁',$('o1v').textContent],['R₂',$('o2v').textContent],['Соединение',$('om').selectedOptions[0].textContent]],resPairs('#v-ohm .res'),theoryOf('v-ohm'),''));

/* Ссылка «поделиться» */
function shareParams(pairs,section){const u=new URL(location.href);u.search='';pairs.forEach(([k,v])=>u.searchParams.set(k,v));u.hash=section;
 navigator.clipboard?navigator.clipboard.writeText(u.toString()).then(()=>toast('Ссылка скопирована ✓')):prompt('Скопируй ссылку:',u.toString())}
$('pshr')&&($('pshr').onclick=()=>shareParams([['v',$('pv').value],['a',$('pa').value],['h',$('ph').value],['k',$('pk').value]],'proj'));
$('mshr')&&($('mshr').onclick=()=>shareParams([['l',$('ml').value],['a',$('ma').value]],'pend'));
$('oshr')&&($('oshr').onclick=()=>shareParams([['u',$('ou').value],['r1',$('o1').value],['r2',$('o2').value],['m',$('om').value]],'ohm'));
$('lshr')&&($('lshr').onclick=()=>shareParams(L.p.map((q,j)=>[q[0],$('pr'+j).value]),'lab-'+L.id));

/* Параметры из URL при загрузке */
(function loadFromURL(){const q=new URLSearchParams(location.search),h=H0;if(![...q].length&&!h.startsWith('lab-'))return;
 if(h==='proj'){if(q.get('v'))$('pv').value=q.get('v');if(q.get('a'))$('pa').value=q.get('a');if(q.get('h'))$('ph').value=q.get('h');if(q.get('k'))$('pk').value=q.get('k');runProj();}
 else if(h==='pend'){if(q.get('l'))$('ml').value=q.get('l');if(q.get('a'))$('ma').value=q.get('a');runPend();}
 else if(h==='ohm'){if(q.get('u'))$('ou').value=q.get('u');if(q.get('r1'))$('o1').value=q.get('r1');if(q.get('r2'))$('o2').value=q.get('r2');if(q.get('m'))$('om').value=q.get('m');calcOhm();}
 else if(h.startsWith('lab-')){const id=h.slice(4),i=LABS.findIndex(l=>l.id===id),vals={};if(i>-1){LABS[i].p.forEach(p=>{if(q.has(p[0]))vals[p[0]]=q.get(p[0])});openLab(i,vals);}}
})();

paintFav();applyFilters();

$('snd')&&($('snd').onclick=()=>{soundOn=!soundOn;localStorage.setItem('physlab_snd',soundOn?'1':'0');paintSnd();if(soundOn)beep(660)});
paintSnd();

$('resetFav')&&($('resetFav').onclick=()=>{if(confirm('Очистить избранное?')){if(typeof clearFavsServer==='function')clearFavsServer();localStorage.removeItem('physlab_fav');paintFav();applyFilters();toast('Избранное очищено')}});

/* Кнопка «Продолжить» */
 (function initContinue(){const b=$('contBtn');if(!b)return;const last=localStorage.getItem('physlab_last');if(!last)return;
 const names={proj:'Бросок под углом',pend:'Маятник',ohm:'Закон Ома'};let name=names[last];
 if(!name&&last.indexOf('lab-')===0){const l=(typeof LABS!=='undefined'?LABS:[]).find(x=>x.id===last.slice(4));name=l&&l.t}
 if(!name)return;b.style.display='';b.textContent='▶ Продолжить: '+name;
 b.onclick=()=>{if(last.indexOf('lab-')===0)openLabById(last.slice(4));else go(last)}})();

/* Командная палитра (Ctrl+K) */
(function initPalette(){const box=$('palette'),inp=$('paletteInput'),list=$('paletteList');if(!box)return;
 const labs=[...document.querySelectorAll('.labcard')].map(c=>({id:c.dataset.id,name:c.dataset.name,tag:c.dataset.tag}));
 let sel=0,shown=labs;
 function render(){const q=(inp.value||'').toLowerCase();shown=labs.filter(l=>l.name.toLowerCase().includes(q)||l.tag.toLowerCase().includes(q));
  sel=0;list.innerHTML=shown.length?shown.map((l,i)=>`<li data-i="${i}" class="${i===sel?'sel':''}"><span class="em">${document.querySelector('.labcard[data-id="'+l.id+'"] .ic')?.textContent||'🧪'}</span>${l.name}<span class="tg">${l.tag}</span></li>`).join(''):'<div class="empty">Ничего не найдено</div>'}
 function open(){box.classList.add('open');inp.value='';render();inp.focus()}
 function close(){box.classList.remove('open')}
  function pick(i){const l=shown[i];if(!l)return;close();SPECIAL.includes(l.id)?go(l.id):openLabById(l.id)}
  function move(d){if(!shown.length)return;sel=(sel+d+shown.length)%shown.length;list.querySelectorAll('li').forEach((el,i)=>el.classList.toggle('sel',i===sel));list.children[sel]&&list.children[sel].scrollIntoView({block:'nearest'})}
  inp.oninput=render;
  inp.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();move(1)}else if(e.key==='ArrowUp'){e.preventDefault();move(-1)}else if(e.key==='Enter'){e.preventDefault();pick(sel)}};
  list.onclick=e=>{const li=e.target.closest('li');if(li)pick(+li.dataset.i)};
  box.onclick=e=>{if(e.target===box)close()};
  $('paletteBtn')&&($('paletteBtn').onclick=open);
  document.addEventListener('keydown',e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();box.classList.contains('open')?close():open()}
   else if(e.key==='Escape'&&box.classList.contains('open')){close()}});
  window.openPalette=open;
})();

/* Ночное небо: звёзды, кометы, параллакс */
(function sky(){const cv=$('sky');if(!cv)return;const g=cv.getContext('2d');let W,H,stars=[],comets=[],nextComet=4,mx=-9999,my=-9999,active=false,sy=0;
 function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight;const n=Math.min(170,Math.round(W*H/11000));
  stars=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.9,vy:(Math.random()-.5)*.9,depth:.15+Math.random()*.85,r:Math.random()*1.8+.5}))}
 addEventListener('resize',resize);resize();
 addEventListener('scroll',()=>{sy=window.scrollY||window.pageYOffset||0},{passive:true});
 addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;active=true});
 addEventListener('mouseleave',()=>{active=false;mx=my=-9999});
 addEventListener('touchmove',e=>{const t=e.touches[0];if(t){mx=t.clientX;my=t.clientY;active=true}},{passive:true});
 const R=180;
 function frame(){requestAnimationFrame(frame);if(document.hidden)return;
  g.clearRect(0,0,W,H);
  const dot=col('--tx')||'#fff',line=col('--ac2')||'#22d3ee',turbo=window.__turbo?6:1;
  const P=[];
  for(const s of stars){
   s.x+=s.vx*turbo;s.y+=s.vy*turbo;
   if(s.x<-20)s.x=W+20;else if(s.x>W+20)s.x=-20;
   if(s.y<-20)s.y=H+20;else if(s.y>H+20)s.y=-20;
   let dy=(s.y-sy*s.depth)%H;if(dy<0)dy+=H;
   P.push({x:s.x,y:dy,r:s.r});
  }
  g.fillStyle=dot;
  for(const p of P){g.globalAlpha=.5;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill()}
  g.globalAlpha=1;
  /* Кометы */
  nextComet-=1/60*turbo;
  if(nextComet<=0){nextComet=7+Math.random()*13;const dir=Math.random()<.5?1:-1;
   comets.push({x:dir>0?-80:W+80,y:-40-Math.random()*140,vx:dir*(2.6+Math.random()*2.2),vy:1+Math.random()*.9,life:9,len:90+Math.random()*90})}
  for(const q of comets){
   q.x+=q.vx*turbo;q.y+=q.vy*turbo;q.life-=1/60;
   const sp=Math.hypot(q.vx,q.vy)||1,ux=q.vx/sp,uy=q.vy/sp;
   const grd=g.createLinearGradient(q.x,q.y,q.x-ux*q.len,q.y-uy*q.len);
   grd.addColorStop(0,'rgba(255,255,255,.95)');grd.addColorStop(.35,'rgba(139,124,255,.55)');grd.addColorStop(1,'rgba(139,124,255,0)');
   g.strokeStyle=grd;g.lineWidth=2;g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x-ux*q.len,q.y-uy*q.len);g.stroke();
   g.fillStyle='#fff';g.beginPath();g.arc(q.x,q.y,2.4,0,7);g.fill()}
  comets=comets.filter(q=>q.life>0&&q.x>-260&&q.x<W+260&&q.y<H+260);
  if(active){
   for(let i=0;i<P.length;i++){const a=P[i],da=Math.hypot(a.x-mx,a.y-my);
    if(da<R){g.globalAlpha=(1-da/R)*.9;g.strokeStyle=line;g.lineWidth=1;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(mx,my);g.stroke()}
    for(let j=i+1;j<P.length;j++){const b=P[j],db=Math.hypot(b.x-mx,b.y-my);
     if(da<R&&db<R){const d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d<120){g.globalAlpha=(1-d/120)*.35;g.strokeStyle=line;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}}}}
   g.globalAlpha=.9;g.fillStyle=line;g.beginPath();g.arc(mx,my,3,0,7);g.fill();g.globalAlpha=1}
  }
 frame();
})();

/* Опыт дня */
(function initDaily(){const box=$('dailyCard');if(!box)return;
 const d=new Date(),seed=d.getFullYear()*372+(d.getMonth()+1)*31+d.getDate();
 const id=ALL_IDS[seed%ALL_IDS.length];
 const card=document.querySelector('.labcard[data-id="'+id+'"]');if(!card)return;
 const name=card.querySelector('h3').textContent,desc=card.querySelector('p').textContent,ic=card.querySelector('.ic').textContent;
 box.style.display='';
 box.innerHTML='<span class="daily-ic">'+ic+'</span><div class="daily-txt"><span class="daily-tag">☀️ Опыт дня</span><b>'+name+'</b><p>'+desc+'</p></div><button class="p" id="dailyGo">Открыть →</button>';
  $('dailyGo').onclick=()=>{SPECIAL.includes(id)?go(id):openLabById(id)};
})();

/* Пасхалка: Konami code */
 (function konami(){const seq=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'],buf=[];
 addEventListener('keydown',e=>{
  const k=e.code||(e.key&&e.key.length===1?'Key'+e.key.toUpperCase():e.key);
  buf.push(k);if(buf.length>seq.length)buf.shift();
  if(buf.length===seq.length&&buf.every((x,j)=>x===seq[j])){buf.length=0;
   window.__turbo=true;
   toast('🎮 Секретный код! Звёзды сошли с ума…');
   setTimeout(()=>{window.__turbo=false;toast('✨ Секретный режим выключен')},9000)}});
 })();

/* Service worker для офлайн-режима */
if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js'))}


