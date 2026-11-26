const H0=location.hash.slice(1);
const $=id=>document.getElementById(id),G=9.81;
const col=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let cur='home',raf;
let paused=false,speed=1;
function setPaused(v){paused=v;document.querySelectorAll('.pausebtn').forEach(b=>b.textContent=paused?'▶ Продолжить':'⏸ Пауза')}
function togglePause(){setPaused(!paused)}
function go(v){if(['proj','pend','ohm','lab'].includes(v)&&!window.__authed){if(typeof openAuth==='function')openAuth('login');return}
 cancelAnimationFrame(raf);setPaused(false);cur=v;document.querySelectorAll('.view').forEach(e=>e.classList.toggle('on',e.id==='v-'+v));
 const nv={home:'home',catalog:'catalog',proj:'catalog',pend:'catalog',ohm:'catalog',lab:'catalog',about:'about'}[v];
 document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===nv));
 location.hash=v;scrollTo(0,0);if(v==='proj')runProj();if(v==='pend')runPend();if(v==='ohm')calcOhm();
 if(['proj','pend','ohm'].includes(v)){localStorage.setItem('physlab_last',v);if(typeof markProgress==='function')markProgress(v);}}
document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>go(a.dataset.v));
const THM=['auto','light','dark'],THL={auto:'🌓 Авто',light:'☀️ Светлая',dark:'🌙 Тёмная'};
function applyTheme(m){document.documentElement.dataset.theme=m==='auto'?'':m;$('th').textContent=THL[m];localStorage.setItem('physlab_theme',m);if(cur==='proj')drawProj(pi);}
$('th').onclick=()=>{const m=THM[(THM.indexOf(localStorage.getItem('physlab_theme')||'auto')+1)%3];applyTheme(m);};
applyTheme(localStorage.getItem('physlab_theme')||'auto');

/* ---- Бросок ---- */
let pts=[],pi=0,PJ={},ghostProj=null;
function labels(){$('pvv').textContent=$('pv').value+' м/с';$('pav').textContent=$('pa').value+'°';$('phv').textContent=$('ph').value+' м';$('pkv').textContent=$('pk').value==0?'выкл':$('pk').value/10;}
function simProj(){
 const v=+$('pv').value,a=$('pa').value*Math.PI/180,h=+$('ph').value,k=$('pk').value/10,dt=0.001;
 let x=0,y=h,vx=v*Math.cos(a),vy=v*Math.sin(a),t=0,mh=h;pts=[[0,h]];
 while(y>=0&&t<60){const s=Math.hypot(vx,vy);vx-=k*s*vx*dt;vy-=(G+k*s*vy)*dt;x+=vx*dt;y+=vy*dt;t+=dt;mh=Math.max(mh,y);if(Math.round(t/dt)%20==0)pts.push([x,y]);}
 pts.push([x,0]);
 const T=(v*Math.sin(a)+Math.sqrt((v*Math.sin(a))**2+2*G*h))/G,L=v*Math.cos(a)*T;
 PJ={L:x,T:t,H:mh,Lt:L};
 $('rL').textContent=x.toFixed(1)+' м';$('rT').textContent=t.toFixed(2)+' с';$('rH').textContent=mh.toFixed(1)+' м';
 $('rE').textContent=k==0?(Math.abs(x-L)/L*100).toFixed(2)+' %':'воздух ≠ формула';
}
function drawProj(n){
 const c=$('cp'),g=c.getContext('2d'),W=c.width,H=c.height,m=40;
 g.clearRect(0,0,W,H);
 const gX=ghostProj?Math.max.apply(null,ghostProj.pts.map(p=>p[0])):0,
       gY=ghostProj?Math.max.apply(null,ghostProj.pts.map(p=>p[1])):0;
 const xm=Math.max(PJ.L,gX,10)*1.1,ym=Math.max(PJ.H,gY,5)*1.2,sx=(W-2*m)/xm,sy=(H-2*m)/ym,X=x=>m+x*sx,Y=y=>H-m-y*sy;
 g.strokeStyle=col('--bd');g.fillStyle=col('--mut');g.font='12px sans-serif';
 for(let i=0;i<=xm;i+=Math.ceil(xm/8/5)*5){g.beginPath();g.moveTo(X(i),Y(0));g.lineTo(X(i),m/2);g.stroke();g.fillText(i+' м',X(i)-8,H-m+16);}
 g.strokeStyle=col('--tx');g.beginPath();g.moveTo(0,Y(0));g.lineTo(W,Y(0));g.stroke();
 if(ghostProj){g.strokeStyle=col('--mut');g.lineWidth=2;g.setLineDash([3,4]);g.beginPath();ghostProj.pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.stroke();g.setLineDash([]);
  g.fillStyle=col('--mut');g.fillText('первый запуск: '+ghostProj.label,m+6,m+12);}
 g.strokeStyle=col('--ac');g.lineWidth=2;g.setLineDash([6,5]);g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.stroke();g.setLineDash([]);
 const p=pts[Math.min(n,pts.length-1)];
 g.fillStyle=col('--ac2');g.beginPath();g.arc(X(p[0]),Y(p[1]),9,0,7);g.fill();
}
function projCompare(){
 if(ghostProj){ghostProj=null;$('pcmp').textContent='👻 Сравнить';toast('Сравнение выключено');return}
 ghostProj={pts:pts.map(p=>[p[0],p[1]]),label:'v='+$('pv').value+' м/с, α='+$('pa').value+'°, h='+$('ph').value+' м, k='+($('pk').value==0?'выкл':$('pk').value/10)};
 $('pcmp').textContent='👻 Выключить';
 toast('Первый запуск заморожен — меняй параметры и жми «Запуск»');
}
$('pcmp')&&($('pcmp').onclick=projCompare);
function runProj(){cancelAnimationFrame(raf);labels();simProj();pi=0;(function f(){drawProj(pi);if(pi<pts.length-1&&!paused)pi+=2;if(pi<pts.length-1)raf=requestAnimationFrame(f);})();}
['pv','pa','ph','pk'].forEach(i=>$(i).oninput=()=>{labels();simProj();cancelAnimationFrame(raf);pi=pts.length;drawProj(pi);});
$('pgo').onclick=runProj;

/* ---- Маятник ---- */
let th,om,tm,cross=[],prev;
function runPend(){cancelAnimationFrame(raf);
 const L=+$('ml').value,a0=+$('ma').value;$('mlv').textContent=L+' м';$('mav').textContent=a0+'°';
 th=a0*Math.PI/180;om=0;tm=0;cross=[];prev=th;
 $('mT').textContent=(2*Math.PI*Math.sqrt(L/G)).toFixed(3)+' с';$('mS').textContent='…';$('mE').textContent='…';
 let last=performance.now();
 (function f(now){const dtf=Math.min((now-last)/1000,0.05);last=now;const n=Math.ceil(dtf/0.001),dt=dtf/n;
  if(!paused)for(let i=0;i<n;i++){om-=G/L*Math.sin(th)*dt;th+=om*dt;tm+=dt;
   if(prev>0&&th<=0){cross.push(tm);if(cross.length>=2){const T=cross[cross.length-1]-cross[cross.length-2],Tf=2*Math.PI*Math.sqrt(L/G);$('mS').textContent=T.toFixed(3)+' с';$('mE').textContent=(Math.abs(T-Tf)/Tf*100).toFixed(2)+' %';}}
   prev=th;}
  $('mt').textContent=tm.toFixed(1)+' с';drawPend(L);raf=requestAnimationFrame(f);})(last);
}
function drawPend(L){
 const c=$('cm'),g=c.getContext('2d'),W=c.width,H=c.height,ox=W/2,oy=40,len=(H-100)*L/3;
 g.clearRect(0,0,W,H);const x=ox+len*Math.sin(th),y=oy+len*Math.cos(th);
 g.strokeStyle=col('--mut');g.lineWidth=2;g.beginPath();g.moveTo(ox-60,oy);g.lineTo(ox+60,oy);g.stroke();
 g.strokeStyle=col('--tx');g.beginPath();g.moveTo(ox,oy);g.lineTo(x,y);g.stroke();
 g.fillStyle=col('--ac');g.beginPath();g.arc(x,y,18,0,7);g.fill();
}
['ml','ma'].forEach(i=>$(i).oninput=runPend);$('mgo').onclick=runPend;

/* ---- Ом ---- */
function calcOhm(){
 const U=+$('ou').value,a=+$('o1').value,b=+$('o2').value,s=$('om').value==='s';
 $('ouv').textContent=U+' В';$('o1v').textContent=a+' Ом';$('o2v').textContent=b+' Ом';
 const R=s?a+b:a*b/(a+b),I=U/R,I1=s?I:U/a,I2=s?I:U/b,U1=s?I*a:U;
 $('oR').textContent=R.toFixed(1)+' Ом';$('oI').textContent=I.toFixed(2)+' А';$('oI1').textContent=I1.toFixed(2)+' А';$('oI2').textContent=I2.toFixed(2)+' А';$('oU1').textContent=U1.toFixed(1)+' В';$('oP').textContent=(U*I).toFixed(1)+' Вт';
}
['ou','o1','o2','om'].forEach(i=>$(i).oninput=calcOhm);

const _h=location.hash.slice(1);
go((_h&&$('v-'+_h)&&!['proj','pend','ohm','lab'].includes(_h))?_h:'home');

window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h!==cur&&$('v-'+h))go(h)});

/* ---- Горячие клавиши ---- */
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,select,textarea'))return;
 const inLab=['proj','pend','ohm','lab'].includes(cur);
 if(e.key==='Escape'&&inLab&&!document.fullscreenElement){go('catalog')}
 else if(e.code==='Space'&&inLab){e.preventDefault();togglePause()}
});
