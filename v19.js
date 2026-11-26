/* PhysLab Black Edition — research tools, notebook and achievements */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const read=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const home=$('v-home'); if(!home)return;
const tools=document.createElement('section');tools.className='black-workbench';tools.innerHTML=`
 <div class="bw-head"><div><span class="bw-kicker">ЛИЧНЫЙ ИССЛЕДОВАТЕЛЬСКИЙ ЦЕНТР</span><h2>Работай как <em>физик</em></h2><p>Формулируй гипотезы, фиксируй результаты и отслеживай прогресс.</p></div><div class="bw-stamp">FIELD NOTES<br><b>№ 019</b></div></div>
 <div class="bw-grid">
  <article class="bw-panel bw-mission"><span class="bw-label">ЗАДАНИЕ ИССЛЕДОВАТЕЛЯ</span><div class="bw-mission-no">01 / CHALLENGE</div><h3>Проверь гипотезу</h3><p id="bwChallenge">Как изменится дальность полёта, если увеличить угол броска с 30° до 60° при одинаковой начальной скорости?</p><div class="bw-hint">Подсказка: сравни результаты в лаборатории «Бросок под углом».</div><button class="bw-button" id="bwOpenChallenge">Открыть эксперимент <span>↗</span></button><button class="bw-quiet" id="bwCompleteChallenge">Отметить как выполненное</button><div class="bw-done" id="bwChallengeState"></div></article>
  <article class="bw-panel"><div class="bw-panel-top"><span class="bw-label">ЛАБОРАТОРНЫЙ ЖУРНАЛ</span><span class="bw-count" id="bwNoteCount">0 ЗАПИСЕЙ</span></div><h3>Твои наблюдения</h3><p>Сохраняй параметры, результаты и собственные выводы после опытов.</p><button class="bw-button" id="bwAddNote">＋ Новая запись</button><div class="bw-notes" id="bwNotes"></div></article>
  <article class="bw-panel bw-progress"><span class="bw-label">ПРОГРЕСС</span><h3>Путь исследователя</h3><div class="bw-progress-line"><div id="bwProgressBar"></div></div><div class="bw-progress-meta"><b id="bwProgressText">0 / 27</b><span>лабораторий изучено</span></div><div class="bw-achievements" id="bwAchievements"></div></article>
 </div>`;
const feat=home.querySelector('.feat');(feat||home.lastElementChild).after(tools);
const notes=()=>read('physlab_notebook',[]), done=()=>read('physlab_done',[]);
function render(){const ns=notes();$('bwNoteCount').textContent=`${ns.length} ЗАПИСЕЙ`;$('bwNotes').innerHTML=ns.length?ns.slice(-3).reverse().map(n=>`<div class="bw-note"><b>${esc(n.title)}</b><span>${esc(n.date)}</span><p>${esc(n.text||'Без комментария')}</p></div>`).join(''):'<div class="bw-empty">Журнал пока пуст. Сохрани первое наблюдение из лаборатории.</div>';
 const d=done(),count=d.length,percent=Math.min(100,count/27*100);$('bwProgressBar').style.width=percent+'%';$('bwProgressText').textContent=`${count} / 27`;
 const badges=[['FIRST','Первый опыт',count>=1],['CURIOUS','Любознательный',count>=5],['RESEARCHER','Исследователь',count>=10],['MASTER','Мастер лаборатории',count>=20],['COMPLETE','Физик-практик',count>=27]];
 $('bwAchievements').innerHTML=badges.map(([id,name,on])=>`<div class="bw-ach ${on?'earned':''}"><span>${on?'✦':'◇'}</span><b>${name}</b></div>`).join('');
 const c=read('physlab_challenge_done',false);$('bwChallengeState').textContent=c?'✓ Задание отмечено как выполненное':'';$('bwCompleteChallenge').textContent=c?'Снять отметку':'Отметить как выполненное';}
$('bwOpenChallenge').onclick=()=>{if(typeof go==='function')go('proj')};
$('bwCompleteChallenge').onclick=()=>{write('physlab_challenge_done',!read('physlab_challenge_done',false));render()};
$('bwAddNote').onclick=()=>saveNote(true);
function saveNote(standalone=false){const active=document.querySelector('.view.on');const title=$('lt')?.textContent||active?.querySelector('h2')?.textContent||'Свободная запись';const result=$('lo')?.innerText||active?.querySelector('.res')?.innerText||'';const text=prompt('Запиши наблюдение или вывод:',result.trim().slice(0,500));if(text===null)return;const ns=notes();ns.push({title,date:new Date().toLocaleString('ru-RU'),text:text.trim()});write('physlab_notebook',ns.slice(-100));render();if(standalone)tools.scrollIntoView({behavior:'smooth',block:'center'});}
// Add a journal action to experiment pages without altering the simulation engine.
['v-lab','v-proj','v-pend','v-ohm'].forEach(id=>{const view=$(id);const row=view?.querySelector('.ctrls,.btnrow');if(row&&!row.querySelector('.bw-journal-action')){const b=document.createElement('button');b.className='bw-journal-action';b.textContent='✎ В журнал';b.onclick=()=>saveNote();row.append(b)}});
render();window.addEventListener('storage',e=>{if(['physlab_done','physlab_notebook'].includes(e.key))render()});
})();
