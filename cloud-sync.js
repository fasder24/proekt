(()=>{'use strict';
const $=id=>document.getElementById(id);
const api=async(path,options={})=>{try{const r=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...options});const data=await r.json();return {ok:r.ok,data}}catch(e){return null}};
let busy=false,dirty=false,adminAllowed=false,pendingState=null;
const defaults={answers:[],history:[],variants:[],topics:{},today:{date:'',count:0},streak:0,lastDay:''};
function mergeState(local,remote){
 const a=local||defaults,b=remote||defaults;
 const uniq=(arr)=>{const m=new Map();for(const x of [...(Array.isArray(arr)?arr:[])]){const k=x&&((x.date||'')+'|'+(x.id??'')+'|'+(x.source||'')+'|'+(x.text||''));m.set(k,x)}return [...m.values()]};
 const answers=uniq([...(a.answers||[]),...(b.answers||[])]).slice(-5000);
 const variants=uniq([...(a.variants||[]),...(b.variants||[])]).slice(-500);
 const topics={};for(const x of answers){if(!x||!x.topic)continue;topics[x.topic]??={right:0,total:0};topics[x.topic].total++;if(x.correct)topics[x.topic].right++}
 const latest=[...(a.history||[]),...(b.history||[])].sort((x,y)=>String(y.date||'').localeCompare(String(x.date||''))).slice(0,100);
 return {answers,variants,topics,history:latest,today:(a.today?.date||'')>=(b.today?.date||'')?a.today:b.today,streak:Math.max(a.streak||0,b.streak||0),lastDay:(a.lastDay||'')>(b.lastDay||'')?a.lastDay:b.lastDay};
}
async function saveExamState(state){
 if(!window.__authed)return;pendingState=state;if(busy)return;busy=true;dirty=true;
 while(pendingState){const next=pendingState;pendingState=null;const r=await api('/api/exam-state',{method:'PUT',body:JSON.stringify({state:next})});dirty=!(r&&r.ok&&r.data&&r.data.ok);}
 busy=false;const s=$('cloudStatus');if(s)s.textContent=dirty?'Не удалось синхронизировать':'Синхронизировано';
}
async function loadExamState(){
 if(!window.__authed)return;
 const r=await api('/api/exam-state');
 if(!r||!r.ok||!r.data?.ok){setStatus('Серверная синхронизация пока недоступна');return}
 if(r.data.state){
  const local=(()=>{try{return JSON.parse(localStorage.getItem('physlab_exam_state')||'null')}catch{return null}})();
  const merged=mergeState(local,r.data.state);
  localStorage.setItem('physlab_exam_state',JSON.stringify(merged));
  if(window.PHYSLAB_EXAM_API?.setCloudState)window.PHYSLAB_EXAM_API.setCloudState(merged);
  await saveExamState(merged);
  window.dispatchEvent(new CustomEvent('physlab:cloud-state-loaded',{detail:merged}));
 } else {
  const local=(()=>{try{return JSON.parse(localStorage.getItem('physlab_exam_state')||'null')}catch{return defaults}})();
  await saveExamState(local);
 }
 setStatus('Синхронизировано с D1');
}
function setStatus(t){const n=$('cloudStatus');if(n)n.textContent=t}
function achievements(s){
 const a=s.answers||[],c=a.filter(x=>x.correct).length,n=a.length,acc=n?c/n:0;
 return [['Первый шаг',n>=1],['Десятка',n>=10],['Практик',n>=50],['Точность 80%',n>=10&&acc>=.8],['Первый вариант',(s.variants||[]).length>=1],['Серия 3 дня',(s.streak||0)>=3]];
}
function renderCabinet(){
 const u=window.PHYSLAB_ME||(()=>{try{return JSON.parse(localStorage.getItem('physlab_user')||'null')}catch{return null}})();
 const s=(()=>{try{return JSON.parse(localStorage.getItem('physlab_exam_state')||'null')||defaults}catch{return defaults}})();
 if($('cabinetName'))$('cabinetName').textContent=u?.name||'Войди в аккаунт';
 if($('cabinetLogin'))$('cabinetLogin').textContent=u?'@'+u.login:'Данные доступны после входа';
 const n=(s.answers||[]).length,c=(s.answers||[]).filter(x=>x.correct).length,v=s.variants||[];
 if($('cabinetMetrics'))$('cabinetMetrics').innerHTML=[['Решено заданий',n],['Правильные',c],['Точность',n?Math.round(c/n*100)+'%':'—'],['Лучший вариант',v.length?Math.max(...v.map(x=>x.points||0))+'%':'—']].map(x=>'<article class="metric-card"><span>'+x[0]+'</span><b>'+x[1]+'</b></article>').join('');
 if($('cabinetAchievements'))$('cabinetAchievements').innerHTML=achievements(s).map(x=>'<article class="achievement-card '+(x[1]?'earned':'')+'"><span>'+(x[1]?'✦':'◇')+'</span><b>'+x[0]+'</b><small>'+(x[1]?'Получено':'Ещё впереди')+'</small></article>').join('');
}
async function loadLeaderboard(){
 const box=$('leaderboardTable');if(!box)return;box.innerHTML='<p>Загружаем рейтинг…</p>';
 const r=await api('/api/leaderboard');
 if(!r||!r.ok||!r.data?.ok){box.textContent=r?.data?.error||'Не удалось загрузить рейтинг';return}
 const rows=r.data.leaderboard||[];
 box.innerHTML=rows.length?'<div class="cloud-row cloud-head"><span>Место</span><span>Участник</span><span>Заданий</span><span>Точность</span><span>Лучший вариант</span></div>'+rows.map(x=>'<div class="cloud-row"><b>#'+x.rank+'</b><span>'+esc(x.name)+'</span><span>'+x.answers+'</span><span>'+x.accuracy+'%</span><span>'+x.best_points+'%</span></div>').join(''):'<p>Пока нет участников. Можно первым включить публикацию в личном кабинете.</p>';
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function loadAdmin(){
 const box=$('adminContent');if(!box)return;box.innerHTML='<p>Загружаем статистику…</p>';
 const r=await api('/api/admin/overview');
 if(!r||!r.ok||!r.data?.ok){box.innerHTML='<article class="panel"><b>Доступ закрыт</b><p>'+esc(r?.data?.error||'Не удалось проверить права')+'</p></article>';$('adminTop').innerHTML='';$('adminHint').textContent='Для доступа владелец проекта должен добавить свой логин в переменную Worker ADMIN_LOGINS (через Settings → Variables and Secrets).';return}
 adminAllowed=true;const d=r.data;
 box.innerHTML=[['Пользователи',d.users],['Активны за 30 дней',d.active30],['Решено заданий',d.answers],['Пробных вариантов',d.variants],['Средняя точность',d.avgAccuracy+'%']].map(x=>'<article class="metric-card"><span>'+x[0]+'</span><b>'+x[1]+'</b></article>').join('');
 $('adminTop').innerHTML=(d.top||[]).length?'<div class="cloud-row cloud-head"><span>Ученик</span><span>Решено</span><span>Лучший результат</span></div>'+d.top.map(x=>'<div class="cloud-row"><b>'+esc(x.name)+'</b><span>'+x.answers_total+'</span><span>'+x.best_points+'%</span></div>').join(''):'<p>Пока нет учебной статистики.</p>';
 $('adminHint').textContent='Сводка рассчитана по данным аккаунтов, которые синхронизировали прогресс.';
}
async function refresh(){
 if(!window.__authed){setStatus('Войди в аккаунт для синхронизации');return}
 const s=$('cloudSyncNow');if(s){s.disabled=true;s.textContent='Синхронизация…'}
 await loadExamState();renderCabinet();if(s){s.disabled=false;s.textContent='Синхронизировать сейчас'}
}
window.PHYSLAB_CLOUD={saveExamState,refresh};
window.addEventListener('physlab:auth-ready',async e=>{
 window.PHYSLAB_ME=e.detail?.user||null;
 if(window.__authed){await loadExamState();renderCabinet();const opt=$('leaderboardOptIn');if(opt){const r=await api('/api/leaderboard-optin-state');if(r?.data?.ok)opt.checked=!!r.data.enabled}}
 else setStatus('Войди в аккаунт для синхронизации');
});
window.addEventListener('physlab:cloud-state-loaded',renderCabinet);
document.addEventListener('DOMContentLoaded',()=>{
 $('cloudSyncNow')?.addEventListener('click',refresh);
 $('refreshLeaderboard')?.addEventListener('click',loadLeaderboard);
 $('refreshAdmin')?.addEventListener('click',loadAdmin);
 $('leaderboardOptIn')?.addEventListener('change',async e=>{const r=await api('/api/leaderboard-optin',{method:'POST',body:JSON.stringify({enabled:e.target.checked})});$('optInStatus').textContent=r?.data?.ok?'Настройка сохранена':'Не удалось сохранить настройку';});
 document.querySelectorAll('[data-route="cabinet"]').forEach(x=>x.addEventListener('click',renderCabinet));
 document.querySelectorAll('[data-route="leaderboard"]').forEach(x=>x.addEventListener('click',loadLeaderboard));
 document.querySelectorAll('[data-route="admin"]').forEach(x=>x.addEventListener('click',loadAdmin));
});
})();
