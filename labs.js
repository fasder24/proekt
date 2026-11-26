/* Дополнительные лаборатории. Параметр: [ключ, название, min, max, шаг, старт, единицы] */
const c=col,F=(v,d=2)=>v.toFixed(d),D=Math.PI/180,
dot=(g,x,y,r,f)=>{g.fillStyle=f;g.beginPath();g.arc(x,y,r,0,7);g.fill()},
rst=()=>Object.assign(S,L.init(P));

/* двойной маятник: уравнения + РК4 (L=1, m1=1, m2=r) */
const dp=(s,r)=>{const[a,b,w,v]=s,d=a-b,q=2+r-r*Math.cos(2*d);
 return[w,v,(-G*(2+r)*Math.sin(a)-r*G*Math.sin(a-2*b)-2*Math.sin(d)*r*(v*v+w*w*Math.cos(d)))/q,
 2*Math.sin(d)*(w*w*(1+r)+G*(1+r)*Math.cos(a)+v*v*r*Math.cos(d))/q]};
const rk=(s,r,h)=>{const k1=dp(s,r),k2=dp(s.map((x,i)=>x+k1[i]*h/2),r),k3=dp(s.map((x,i)=>x+k2[i]*h/2),r),k4=dp(s.map((x,i)=>x+k3[i]*h),r);
 return s.map((x,i)=>x+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]))};

const LABS=[
{id:'spring',diff:1,ic:'🌀',tag:'Колебания',t:'Пружинный маятник',d:'Жёсткость, масса и затухание.',
th:'<div class="formula">T = 2π·√(m / k)</div><p>Период не зависит от начального отклонения. Затухание c гасит колебания; при ζ ≥ 1 груз вообще не колеблется.</p>',
p:[['k','Жёсткость k',5,100,1,30,' Н/м'],['m','Масса m',.5,5,.1,1,' кг'],['c','Затухание c',0,6,.05,.2,' Н·с/м']],
init:P=>({x:1.5,v:0}),
step(P,S,dt){S.v+=(-P.k*S.x-P.c*S.v)/P.m*dt;S.x+=S.v*dt},
draw(g,P,S){const x1=350+S.x*80-30;g.strokeStyle=c('--mut');g.lineWidth=3;g.beginPath();g.moveTo(60,200);
 for(let i=1;i<=14;i++)g.lineTo(60+(x1-60)*i/15,200+(i%2?18:-18));g.lineTo(x1,200);g.stroke();
 g.fillStyle=c('--ac');g.fillRect(x1,170,60,60);g.fillStyle=c('--tx');g.fillRect(50,120,8,160)},
out:(P,S)=>[['Период T',F(2*Math.PI*Math.sqrt(P.m/P.k),3)+' с'],['Смещение',F(S.x)+' м'],['Скорость',F(S.v)+' м/с'],['Затухание ζ',F(P.c/(2*Math.sqrt(P.k*P.m)))]]},

{id:'incline',diff:1,ic:'📐',tag:'Механика',t:'Наклонная плоскость',d:'Угол, трение и ускорение бруска.',
th:'<div class="formula">a = g·(sinα − μ·cosα)</div><p>Брусок скользит, только если tgα &gt; μ. Критический угол α = arctg μ — так измеряют коэффициент трения на опыте.</p>',
p:[['a','Угол α',5,60,1,30,'°'],['mu','Трение μ',0,1,.05,.2,'']],
init:P=>({s:0,v:0}),
step(P,S,dt){const a=G*(Math.sin(P.a*D)-P.mu*Math.cos(P.a*D));if(a>0){S.v+=a*dt;S.s+=S.v*dt;if(S.s>5){S.s=0;S.v=0}}},
draw(g,P,S){const a=P.a*D,ex=80+480*Math.cos(a),ey=350-480*Math.sin(a),f=S.s/5;
 g.fillStyle=c('--bd');g.beginPath();g.moveTo(80,350);g.lineTo(ex,350);g.lineTo(ex,ey);g.fill();
 g.save();g.translate(ex+(80-ex)*f,ey+(350-ey)*f);g.rotate(-a);g.fillStyle=c('--ac');g.fillRect(-20,-36,40,36);g.restore();
 g.fillStyle=c('--tx');g.font='14px sans-serif';g.fillText(P.a+'°',110,342)},
out:(P,S)=>{const a=G*(Math.sin(P.a*D)-P.mu*Math.cos(P.a*D));return[['Ускорение',F(Math.max(a,0))+' м/с²'],['Скорость',F(S.v)+' м/с'],['Крит. угол',F(Math.atan(P.mu)/D,1)+'°'],['Движение',a>0?'скользит':'стоит']]}},

{id:'collide',diff:2,ic:'🎱',tag:'Механика',t:'Столкновения шаров',d:'Импульс и потеря энергии при ударе.',
th:'<div class="formula">m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′</div><p>Импульс сохраняется всегда. Энергия — только при упругом ударе (e = 1). При e = 0 шары слипаются и часть энергии уходит в тепло.</p>',
p:[['m1','Масса 1',1,10,1,2,' кг'],['m2','Масса 2',1,10,1,1,' кг'],['v1','Скорость 1',1,10,1,4,' м/с'],['e','Упругость e',0,1,.1,1,'']],
init:P=>({x1:90,x2:430,v1:P.v1,v2:0,h:0,t:0,E0:P.m1*P.v1*P.v1/2}),
step(P,S,dt){S.x1+=S.v1*60*dt;S.x2+=S.v2*60*dt;S.t+=dt;const r=m=>10+4*m;
 if(!S.h&&S.x2-S.x1<=r(P.m1)+r(P.m2)){const M=P.m1+P.m2,a=S.v1,b=S.v2;
  S.v1=((P.m1-P.e*P.m2)*a+(1+P.e)*P.m2*b)/M;S.v2=((P.m2-P.e*P.m1)*b+(1+P.e)*P.m1*a)/M;S.h=1}
 if(S.t>9)rst()},
draw(g,P,S){g.strokeStyle=c('--mut');g.beginPath();g.moveTo(0,290);g.lineTo(700,290);g.stroke();
 dot(g,S.x1,290-(10+4*P.m1),10+4*P.m1,c('--ac'));dot(g,S.x2,290-(10+4*P.m2),10+4*P.m2,c('--ac2'))},
out:(P,S)=>{const E=P.m1*S.v1*S.v1/2+P.m2*S.v2*S.v2/2;return[['Импульс',F(P.m1*S.v1+P.m2*S.v2,1)+' кг·м/с'],['Энергия',F(E,1)+' Дж'],['Потеря энергии',F((1-E/S.E0)*100,0)+' %'],['Удар',S.h?'был':'ещё нет']]}},

{id:'chute',diff:2,ic:'🪂',tag:'Механика',t:'Парашют',d:'Падение с сопротивлением воздуха.',
th:'<div class="formula">m·a = m·g − k·v² &nbsp; v<sub>пред</sub> = √(m·g / k)</div><p>Скорость растёт, пока сила сопротивления не сравняется с весом. Дальше человек падает равномерно. Открой парашют (большое k) — предельная скорость упадёт в разы. Время на модели ускорено в 3 раза.</p>',
p:[['m','Масса',40,120,5,80,' кг'],['k','Сопротивление k',.5,20,.5,.5,' кг/м']],
init:P=>({y:0,v:0,t:0,n:0,h:[]}),
step(P,S,dt){dt*=3;S.v+=(G-P.k/P.m*S.v*S.v)*dt;S.y+=S.v*dt;S.t+=dt;if(++S.n%15==0)S.h.push([S.t,S.v]);if(S.y>200)rst()},
draw(g,P,S){const y=30+S.y/200*330,r=10+P.k*2.5,vt=Math.sqrt(P.m*G/P.k),vm=vt*1.1,T=Math.max(5,S.t*1.05);
 g.strokeStyle=c('--tx');g.beginPath();g.moveTo(0,370);g.lineTo(240,370);g.stroke();
 if(P.k>3){g.globalAlpha=.6;g.fillStyle=c('--ac');g.beginPath();g.arc(120,y-30,r,Math.PI,0);g.fill();g.globalAlpha=1;
  g.strokeStyle=c('--mut');g.beginPath();g.moveTo(120-r,y-30);g.lineTo(120,y);g.lineTo(120+r,y-30);g.stroke()}
 dot(g,120,y,10,c('--ac2'));
 g.strokeStyle=c('--bd');g.strokeRect(300,60,380,300);g.setLineDash([5,5]);g.beginPath();g.moveTo(300,360-vt/vm*300);g.lineTo(680,360-vt/vm*300);g.stroke();g.setLineDash([]);
 g.fillStyle=c('--mut');g.fillText('v пред. = '+F(vt,1)+' м/с',305,352-vt/vm*300);g.fillText('скорость от времени',305,376);
 g.strokeStyle=c('--ac');g.lineWidth=2;g.beginPath();S.h.forEach((q,i)=>{const x=300+q[0]/T*380,yy=360-q[1]/vm*300;i?g.lineTo(x,yy):g.moveTo(x,yy)});g.stroke()},
out:(P,S)=>[['Скорость',F(S.v,1)+' м/с'],['Предельная',F(Math.sqrt(P.m*G/P.k),1)+' м/с'],['Пролетел',F(S.y,0)+' м'],['Время',F(S.t,1)+' с']]},

{id:'orbit',diff:3,ic:'🪐',tag:'Гравитация',t:'Орбита планеты',d:'Круг, эллипс или побег из системы.',
th:'<div class="formula">v<sub>кр</sub> = √(GM / r) &nbsp; v<sub>побега</sub> = √2·v<sub>кр</sub></div><p>Скорость задана в долях круговой. Меньше 1 — эллипс, ровно 1 — круг, от 1,41 — планета улетает. Заметь: у планеты ближе к звезде скорость больше (2-й закон Кеплера).</p>',
p:[['v','Скорость (×круговой)',.6,1.6,.05,1.15,'']],
init:P=>({x:1,y:0,vx:0,vy:P.v,n:0,tr:[]}),
step(P,S,dt){const r3=Math.pow(S.x*S.x+S.y*S.y,1.5);S.vx-=S.x/r3*dt;S.vy-=S.y/r3*dt;S.x+=S.vx*dt;S.y+=S.vy*dt;
 if(++S.n%8==0){S.tr.push([S.x,S.y]);if(S.tr.length>700)S.tr.shift()}if(S.x*S.x+S.y*S.y>14.4)rst()},
draw(g,P,S){g.strokeStyle=c('--ac');g.globalAlpha=.5;g.lineWidth=2;g.beginPath();S.tr.forEach((q,i)=>{const x=350+q[0]*90,y=200-q[1]*90;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();g.globalAlpha=1;
 dot(g,350,200,13,'#f5b301');dot(g,350+S.x*90,200-S.y*90,7,c('--ac2'))},
out:(P,S)=>{const e=Math.abs(P.v*P.v-1);return[['Расстояние r',F(Math.hypot(S.x,S.y))],['Скорость',F(Math.hypot(S.vx,S.vy))],['Эксцентриситет',F(e)],['Орбита',e<.03?'круг':e<.97?'эллипс':e<1.03?'парабола':'гипербола']]}},

{id:'beats',diff:2,ic:'🎵',tag:'Волны',t:'Биения и сложение волн',d:'Две волны — одна огибающая.',
th:'<div class="formula">f<sub>биений</sub> = |f₁ − f₂|</div><p>Когда две волны почти одной частоты складываются, амплитуда то растёт, то падает. Так настраивают гитару на слух: слушают биения, пока они не исчезнут.</p>',
p:[['f1','Частота 1',2,10,.1,5,' Гц'],['f2','Частота 2',2,10,.1,5.5,' Гц']],
init:P=>({t:0}),step(P,S,dt){S.t+=dt},
draw(g,P,S){[[75,'Волна 1','--ac'],[200,'Волна 2','--ac2'],[325,'Сумма','--tx']].forEach(([y,n,cl],r)=>{g.strokeStyle=c(cl);g.lineWidth=2;g.beginPath();
 for(let x=30;x<=670;x+=2){const t=S.t+(x-30)/320,v=r==2?Math.sin(2*Math.PI*P.f1*t)+Math.sin(2*Math.PI*P.f2*t):Math.sin(2*Math.PI*(r?P.f2:P.f1)*t),yy=y-v*30;x==30?g.moveTo(x,yy):g.lineTo(x,yy)}
 g.stroke();g.fillStyle=c('--mut');g.fillText(n,32,y-38)})},
out:(P,S)=>{const d=Math.abs(P.f1-P.f2);return[['Частота биений',F(d)+' Гц'],['Период биений',d<.05?'∞':F(1/d)+' с'],['Средняя частота',F((P.f1+P.f2)/2)+' Гц']]}},

{id:'lever',diff:1,ic:'⚖️',tag:'Статика',t:'Рычаг и качели',d:'Правило моментов.',
th:'<div class="formula">M = m·g·d &nbsp; равновесие: m₁d₁ = m₂d₂</div><p>Груз с большим моментом опускает свою сторону. Тяжёлый груз рядом с опорой уравновешивается лёгким на длинном плече — на этом устроены весы и ломы.</p>',
p:[['m1','Масса слева',1,10,1,4,' кг'],['d1','Плечо слева',.5,3,.1,1,' м'],['m2','Масса справа',1,10,1,2,' кг'],['d2','Плечо справа',.5,3,.1,2,' м']],
init:P=>({a:0,w:0}),
step(P,S,dt){const A=P.m1*P.d1,B=P.m2*P.d2,T=(A-B)/(A+B)*.45;S.w+=((T-S.a)*40-S.w*3)*dt;S.a+=S.w*dt},
draw(g,P,S){const cx=350,cy=190,cs=Math.cos(S.a),sn=Math.sin(S.a);
 g.strokeStyle=c('--tx');g.lineWidth=6;g.beginPath();g.moveTo(cx-270*cs,cy+270*sn);g.lineTo(cx+270*cs,cy-270*sn);g.stroke();
 g.fillStyle=c('--mut');g.beginPath();g.moveTo(cx,cy);g.lineTo(cx-25,cy+100);g.lineTo(cx+25,cy+100);g.fill();
 [[-P.d1,P.m1,'--ac'],[P.d2,P.m2,'--ac2']].forEach(([d,m,k])=>{const x=cx+d*90*cs,y=cy-d*90*sn,z=14+5*m;
  g.lineWidth=2;g.strokeStyle=c('--mut');g.beginPath();g.moveTo(x,y);g.lineTo(x,y+40);g.stroke();
  g.fillStyle=c(k);g.fillRect(x-z/2,y+40,z,z);g.fillStyle=c('--tx');g.textAlign='center';g.fillText(m+' кг',x,y+z+58)})},
out:(P,S)=>{const A=P.m1*G*P.d1,B=P.m2*G*P.d2;return[['Момент слева',F(A,1)+' Н·м'],['Момент справа',F(B,1)+' Н·м'],['Разность',F(A-B,1)+' Н·м'],['Равновесие',Math.abs(A-B)<.5?'да ✓':'нет']]}},

{id:'rc',diff:2,ic:'🔋',tag:'Электричество',t:'Конденсатор (RC-цепь)',d:'Зарядка и разрядка по экспоненте.',
th:'<div class="formula">U<sub>C</sub> = U·(1 − e<sup>−t/τ</sup>) &nbsp; τ = R·C</div><p>За время τ конденсатор заряжается до 63 %, за 5τ — почти полностью. На графике ось времени отмеряется в τ; модель показывает зарядку (0–5τ), потом разрядку (5–10τ).</p>',
p:[['R','Сопротивление R',1,100,1,10,' кОм'],['C','Ёмкость C',1,100,1,47,' мкФ'],['U','Напряжение U',1,24,1,12,' В']],
init:P=>({tn:0,uc:0,n:0,h:[]}),
step(P,S,dt){S.tn+=dt;if(S.tn>10){S.tn=0;S.h=[]}
 S.uc=S.tn<5?P.U*(1-Math.exp(-S.tn)):P.U*(1-Math.exp(-5))*Math.exp(-(S.tn-5));if(++S.n%6==0)S.h.push([S.tn,S.uc])},
draw(g,P,S){const X=t=>60+t*60,Y=v=>360-v/P.U*300;g.fillStyle=c('--mut');
 for(let i=0;i<=10;i++){g.strokeStyle=c('--bd');g.beginPath();g.moveTo(X(i),360);g.lineTo(X(i),60);g.stroke();g.fillText(i+'τ',X(i)-6,378)}
 g.fillText(P.U+' В',12,66);g.setLineDash([5,5]);g.strokeStyle=c('--mut');g.beginPath();g.moveTo(60,Y(.632*P.U));g.lineTo(660,Y(.632*P.U));g.stroke();g.setLineDash([]);g.fillText('63 %',12,Y(.632*P.U));
 g.strokeStyle=c('--ac');g.lineWidth=3;g.beginPath();S.h.forEach((q,i)=>i?g.lineTo(X(q[0]),Y(q[1])):g.moveTo(X(q[0]),Y(q[1])));g.stroke();dot(g,X(S.tn),Y(S.uc),6,c('--ac2'))},
out:(P,S)=>[['Постоянная τ',F(P.R*P.C,0)+' мс'],['Напряжение U_C',F(S.uc)+' В'],['Ток',F(Math.abs(S.tn<5?P.U-S.uc:S.uc)/P.R,2)+' мА'],['Фаза',S.tn<5?'зарядка':'разрядка']]},

{id:'buoy',diff:1,ic:'🛟',tag:'Жидкости',t:'Закон Архимеда',d:'Тонет или плавает — зависит от плотности.',
th:'<div class="formula">F<sub>А</sub> = ρ<sub>ж</sub>·g·V<sub>погр</sub></div><p>Тело плавает, если его плотность меньше плотности жидкости; доля погружения равна ρ<sub>тела</sub> / ρ<sub>ж</sub>. Попробуй 1000 кг/м³ в воде и 1200 кг/м³ в солёной воде Мёртвого моря.</p>',
p:[['r','Плотность тела',200,2500,50,600,' кг/м³'],['f','Плотность жидкости',700,1400,50,1000,' кг/м³']],
init:P=>({y:-.3,v:0}),
step(P,S,dt){const h=.3,sb=Math.min(Math.max(S.y,0),h);S.v+=((P.r*G-P.f*G*sb/h)/P.r-(sb>0?4:.2)*S.v)*dt;S.y+=S.v*dt;if(S.y>1){S.y=1;S.v=0}},
draw(g,P,S){const b=180+S.y*200;g.fillStyle=c('--mut');g.fillRect(320,b-60,60,60);
 g.fillStyle='#38bdf8';g.globalAlpha=.35;g.fillRect(150,180,400,200);g.globalAlpha=1;
 g.strokeStyle=c('--tx');g.lineWidth=3;g.strokeRect(150,60,400,320);g.fillStyle=c('--tx');g.textAlign='center';g.fillText(P.r,350,b-26)},
out:(P,S)=>{const sb=Math.min(Math.max(S.y,0),.3)/.3,V=.027;return[['Погружено',F(sb*100,0)+' %'],['Вес',F(P.r*V*G,1)+' Н'],['Сила Архимеда',F(P.f*G*V*sb,1)+' Н'],['Итог',P.r<P.f?'плавает':'тонет']]}},

{id:'chaos',diff:3,ic:'🌪',tag:'Хаос',t:'Двойной маятник',d:'Два почти одинаковых маятника расходятся.',
th:'<div class="formula">θ₁, θ₂ — углы, решаем численно (метод Рунге–Кутты 4-го порядка)</div><p>Два маятника стартуют с разницей в 0,06°. Сначала они идут вместе, потом траектории расходятся — это хаос: крошечная ошибка в начальных данных растёт экспоненциально. Поэтому погоду нельзя предсказать надолго.</p>',
p:[['a','Угол θ₁',30,170,5,120,'°'],['b','Угол θ₂',0,170,5,90,'°'],['r','Масса 2 / масса 1',.3,3,.1,1,'']],
init:P=>({A:[P.a*D,P.b*D,0,0],B:[P.a*D+.001,P.b*D,0,0],n:0,ta:[],tb:[],t:0}),
step(P,S,dt){S.A=rk(S.A,P.r,dt);S.B=rk(S.B,P.r,dt);S.t+=dt;if(++S.n%6==0){S.ta.push(pos(S.A));S.tb.push(pos(S.B));if(S.ta.length>250){S.ta.shift();S.tb.shift()}}},
draw(g,P,S){[[S.tb,S.B,'--ac2'],[S.ta,S.A,'--ac']].forEach(([tr,s,cl])=>{g.strokeStyle=c(cl);g.globalAlpha=.45;g.lineWidth=1.5;g.beginPath();tr.forEach((q,i)=>i?g.lineTo(q[2],q[3]):g.moveTo(q[2],q[3]));g.stroke();g.globalAlpha=1;
 const q=pos(s);g.lineWidth=2;g.beginPath();g.moveTo(350,120);g.lineTo(q[0],q[1]);g.lineTo(q[2],q[3]);g.stroke();dot(g,q[0],q[1],7,c(cl));dot(g,q[2],q[3],9,c(cl))})},
 out:(P,S)=>[['Время',F(S.t,1)+' с'],['Расхождение θ₂',F(Math.abs(S.A[1]-S.B[1])/D,1)+'°'],['Синий маятник','θ₁ = '+F(S.A[0]/D%360,0)+'°'],['Циан. маятник','θ₁ = '+F(S.B[0]/D%360,0)+'°']]},

{id:'atwood',diff:1,ic:'🎢',tag:'Механика',t:'Машина Атвуда',d:'Два груза на блоке: ускорение и натяжение нити.',
th:'<div class="formula">a = (m₁ − m₂)·g / (m₁ + m₂) &nbsp; T = 2·m₁·m₂·g / (m₁ + m₂)</div><p>Чем больше разница масс, тем ближе ускорение к g. Если массы равны — система в равновесии. Сила натяжения всегда меньше веса каждого из грузов.</p>',
p:[['m1','Масса 1',1,10,.5,3,' кг'],['m2','Масса 2',1,10,.5,1,' кг']],
init:P=>({s:0,v:0,t:0}),
step(P,S,dt){const a=(P.m1-P.m2)*G/(P.m1+P.m2);S.v+=a*dt;S.s+=S.v*dt;S.t+=dt;if(S.s>1.8){S.s=1.8;S.v=0}if(S.s<-1.8){S.s=-1.8;S.v=0}},
draw(g,P,S){const cx=350,cy=70,r=22,l=180+S.s*60,rr=180-S.s*60,s1=20+8*P.m1,s2=20+8*P.m2;
 g.strokeStyle=c('--mut');g.lineWidth=3;g.beginPath();g.arc(cx,cy,r,0,7);g.stroke();
 g.strokeStyle=c('--tx');g.beginPath();g.moveTo(cx-r,cy);g.lineTo(cx-r,l);g.stroke();
 g.beginPath();g.moveTo(cx+r,cy);g.lineTo(cx+r,rr);g.stroke();
 g.fillStyle=c('--ac');g.fillRect(cx-r-s1/2,l,s1,s1);
 g.fillStyle=c('--ac2');g.fillRect(cx+r-s2/2,rr,s2,s2);
 g.fillStyle=c('--tx');g.font='13px sans-serif';g.textAlign='center';g.fillText(P.m1+' кг',cx-r,l+s1+16);g.fillText(P.m2+' кг',cx+r,rr+s2+16)},
out:(P,S)=>{const a=(P.m1-P.m2)*G/(P.m1+P.m2),T=2*P.m1*P.m2*G/(P.m1+P.m2);return[['Ускорение',F(a)+' м/с²'],['Натяжение нити',F(T,1)+' Н'],['Скорость',F(S.v)+' м/с'],['Пройдено',F(Math.abs(S.s))+' м']]}},

{id:'circular',diff:2,ic:'🎠',tag:'Механика',t:'Движение по окружности',d:'Центростремительное ускорение и сила.',
th:'<div class="formula">a = ω²·R = v² / R &nbsp; F = m·a</div><p>Даже при постоянной по модулю скорости тело движется с ускорением — оно всё время «поворачивает» к центру. Ускорение тем больше, чем быстрее вращение и меньше радиус.</p>',
p:[['R','Радиус R',.5,3,.1,1.5,' м'],['w','Угловая скорость ω',.5,6,.1,2,' рад/с'],['m','Масса m',.5,5,.5,1,' кг']],
init:P=>({a:0}),
step(P,S,dt){S.a+=P.w*dt},
draw(g,P,S){const cx=350,cy=200,r=P.R*80,x=cx+r*Math.cos(S.a),y=cy-r*Math.sin(S.a),vx=-Math.sin(S.a),vy=-Math.cos(S.a),L=P.w*15;
 g.strokeStyle=c('--bd');g.setLineDash([5,5]);g.beginPath();g.arc(cx,cy,r,0,7);g.stroke();g.setLineDash([]);
 g.strokeStyle=c('--mut');g.beginPath();g.moveTo(cx,cy);g.lineTo(x,y);g.stroke();dot(g,cx,cy,5,c('--mut'));
 g.strokeStyle=c('--ac2');g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x+vx*L,y+vy*L);g.stroke();
 g.strokeStyle=c('--ac');g.beginPath();g.moveTo(x,y);g.lineTo(x+(cx-x)*.3,y+(cy-y)*.3);g.stroke();g.lineWidth=1;
 dot(g,x,y,9,c('--ac'));g.fillStyle=c('--mut');g.font='13px sans-serif';g.fillText('R',cx+r/2+6,cy-6);g.fillText('v',x+vx*L+6,y+vy*L-6);g.fillText('a',cx+(x-cx)*.4,y+(cy-y)*.4)},
out:(P,S)=>{const v=P.w*P.R,a=P.w*P.w*P.R;return[['Скорость v',F(v)+' м/с'],['Ускорение a',F(a)+' м/с²'],['Сила F',F(P.m*a,1)+' Н'],['Период T',F(2*Math.PI/P.w)+' с']]}},

{id:'heat',diff:1,ic:'🌡',tag:'Теплота',t:'Теплообмен',d:'Смешивание горячей и холодной воды.',
th:'<div class="formula">m₁·T₁ + m₂·T₂ = (m₁ + m₂)·T<sub>уст</sub></div><p>Горячая вода отдаёт тепло, холодная получает. Теплота сохраняется, поэтому итоговая температура — средневзвешенная по массам.</p>',
p:[['m1','Масса горячей',.1,2,.1,.5,' кг'],['T1','Темп. горячей',40,95,1,80,' °C'],['m2','Масса холодной',.1,2,.1,.5,' кг'],['T2','Темп. холодной',0,40,1,20,' °C']],
init:P=>({h:P.T1,c:P.T2,t:0}),
step(P,S,dt){const dq=.6*(S.h-S.c)*dt;S.h-=dq/P.m1;S.c+=dq/P.m2;S.t+=dt},
draw(g,P,S){const base=340,top=60,sc=t=>base-t/100*(base-top);
 [[S.h,'--ac','Горячая',180],[S.c,'--ac2','Холодная',420]].forEach(([t,k,n,x])=>{
  g.strokeStyle=c('--tx');g.lineWidth=2;g.strokeRect(x-70,top,140,base-top);
  g.fillStyle=c(k);g.globalAlpha=.5;g.fillRect(x-70,sc(t),140,base-sc(t));g.globalAlpha=1;
  g.fillStyle=c('--tx');g.textAlign='center';g.font='14px sans-serif';g.fillText(n,x,top-16);g.fillText(F(t,1)+' °C',x,base+20)});
 const teq=(P.m1*P.T1+P.m2*P.T2)/(P.m1+P.m2);
 g.strokeStyle=c('--mut');g.setLineDash([5,5]);g.beginPath();g.moveTo(60,sc(teq));g.lineTo(640,sc(teq));g.stroke();g.setLineDash([]);
 g.fillStyle=c('--mut');g.textAlign='left';g.fillText('равновесие '+F(teq,1)+' °C',70,sc(teq)-6)},
out:(P,S)=>{const teq=(P.m1*P.T1+P.m2*P.T2)/(P.m1+P.m2);return[['Темп. горячей',F(S.h,1)+' °C'],['Темп. холодной',F(S.c,1)+' °C'],['Равновесие',F(teq,1)+' °C'],['Отдано теплоты',F(4200*P.m1*(P.T1-S.h),0)+' Дж']]}},

{id:'lens',diff:2,ic:'🔍',tag:'Оптика',t:'Тонкая линза',d:'Изображение предмета: действительное и мнимое.',
th:'<div class="formula">1/f = 1/d + 1/d′ &nbsp; Γ = d′ / d</div><p>Собирающая линза даёт действительное перевёрнутое изображение, если предмет дальше фокуса. Ближе фокуса — изображение мнимое и увеличенное, как в лупе.</p>',
p:[['f','Фокусное расстояние f',.5,3,.1,1.5,' м'],['d','Расстояние до предмета d',.3,6,.1,3,' м']],
init:P=>({t:0}),
step(P,S,dt){S.t+=dt},
draw(g,P,S){const axis=200,cx=350,scale=40,ox=cx-P.d*scale,oh=60,di=P.f*P.d/(P.d-P.f),m=-di/P.d;
 g.strokeStyle=c('--mut');g.beginPath();g.moveTo(20,axis);g.lineTo(680,axis);g.stroke();
 g.strokeStyle=c('--ac');g.lineWidth=2;g.beginPath();g.ellipse(cx,axis,14,120,0,0,7);g.stroke();g.lineWidth=1;
 g.fillStyle=c('--mut');[-1,1].forEach(s=>dot(g,cx+s*P.f*scale,axis,4,c('--mut')));
 g.fillText('F',cx-P.f*scale-4,axis+18);g.fillText("F'",cx+P.f*scale-4,axis+18);
 g.strokeStyle=c('--ac2');g.lineWidth=3;g.beginPath();g.moveTo(ox,axis);g.lineTo(ox,axis-oh);g.stroke();
 if(isFinite(di)&&Math.abs(di)<50&&Math.abs(m)<6){const ix=cx+di*scale,ih=oh*m;
  g.strokeStyle=c('--ac');g.beginPath();g.moveTo(ix,axis);g.lineTo(ix,axis-ih);g.stroke();
  g.strokeStyle=c('--bd');g.setLineDash([4,4]);
  g.beginPath();g.moveTo(ox,axis-oh);g.lineTo(cx,axis-oh);g.lineTo(ix,axis-ih);g.stroke();
  g.beginPath();g.moveTo(ox,axis-oh);g.lineTo(ix,axis-ih);g.stroke();g.setLineDash([]);g.lineWidth=1}
 else{g.fillStyle=c('--mut');g.textAlign='center';g.fillText('изображение очень далеко',cx,axis-140);g.textAlign='left'}},
out:(P,S)=>{const di=P.f*P.d/(P.d-P.f),m=-di/P.d;return[['Расстояние d′',F(di)+' м'],['Увеличение Γ',F(Math.abs(m))],['Тип',P.d>P.f?'действительное':'мнимое'],['Ориентация',P.d>P.f?'перевёрнутое':'прямое']]}},

{id:'wave',diff:2,ic:'🎸',tag:'Волны',t:'Стоячие волны',d:'Струна, закреплённая с двух концов.',
th:'<div class="formula">f<sub>n</sub> = n·v / (2·L)</div><p>На струне укладывается целое число полуволн. Узлы всегда на концах; с ростом n частота (и высота звука) растёт кратно — это обертоны. Так звучит гитарная струна.</p>',
p:[['n','Номер гармоники n',1,5,1,2,''],['A','Амплитуда',10,60,5,40,' см'],['v','Скорость волны',50,300,10,120,' м/с']],
init:P=>({t:0}),
step(P,S,dt){S.t+=dt},
draw(g,P,S){const y0=200,x0=60,x1=640,L=2;g.strokeStyle=c('--tx');g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y0);g.stroke();
 dot(g,x0,y0,5,c('--tx'));dot(g,x1,y0,5,c('--tx'));
 g.strokeStyle=c('--ac');g.lineWidth=2;g.beginPath();
 for(let i=0;i<=200;i++){const x=x0+(x1-x0)*i/200,X=L*i/200,y=y0-P.A*Math.sin(P.n*Math.PI*X/L)*Math.cos(2*Math.PI*P.n*P.v/(2*L)*S.t)*.8;i?g.lineTo(x,y):g.moveTo(x,y)}
 g.stroke();g.lineWidth=1;
 for(let k=0;k<=P.n;k++)dot(g,x0+(x1-x0)*k/P.n,y0,3,c('--mut'))},
 out:(P,S)=>{const L=2;return[['Частота f',F(P.n*P.v/(2*L),1)+' Гц'],['Длина волны λ',F(2*L/P.n)+' м'],['Пучности',String(P.n)],['Узлы',String(P.n+1)]]}},

{id:'gas',diff:1,ic:'💨',tag:'Теплота',t:'Идеальный газ',d:'Давление, объём и температура молекул.',
th:'<div class="formula">p·V = ν·R·T</div><p>Давление растёт с температурой и числом молей и падает с объёмом. Молекулы бьются о стенки — это и есть давление. R = 8,31 Дж/(моль·К).</p>',
p:[['n','Кол-во вещества ν',.5,5,.5,1,' моль'],['T','Температура T',100,800,10,300,' К'],['V','Объём V',1,10,.5,5,' л']],
init:P=>({ms:Array.from({length:60},()=>({x:Math.random()*660+20,y:Math.random()*260+80,vx:(Math.random()*2-1)||.5,vy:(Math.random()*2-1)||.5}))}),
step(P,S,dt){const v=Math.sqrt(P.T/300);S.ms.forEach(m=>{m.x+=m.vx*v*70*dt;m.y+=m.vy*v*70*dt;if(m.x<20||m.x>680)m.vx*=-1;if(m.y<80||m.y>340)m.vy*=-1})},
draw(g,P,S){g.strokeStyle=c('--bd');g.lineWidth=2;g.strokeRect(20,80,660,260);g.lineWidth=1;
 g.fillStyle=c('--ac2');S.ms.forEach(m=>dot(g,m.x,m.y,3,c('--ac2')));
 g.fillStyle=c('--tx');g.font='14px sans-serif';g.textAlign='left';g.fillText('T = '+P.T+' К',24,68)},
out:(P,S)=>{const R=8.31,p=P.n*R*P.T/(P.V/1000);return[['Давление p',F(p/1000,1)+' кПа'],['p·V',F(p*P.V/1000,1)+' Дж'],['Температура',P.T+' К'],['Энергия молекул',F(1.5*P.n*R*P.T,0)+' Дж']]}},

{id:'snell',diff:2,ic:'🌈',tag:'Оптика',t:'Преломление света',d:'Закон Снеллиуса и полное отражение.',
th:'<div class="formula">n₁·sinα = n₂·sinβ</div><p>На границе двух сред луч меняет направление. Из плотной среды в воздух при большом угле наступает полное внутреннее отражение — на этом работает оптоволокно.</p>',
p:[['a','Угол падения α',0,89,1,30,'°'],['n1','Показатель n₁',1,2,.05,1,''],['n2','Показатель n₂',1,2,.05,1.5,'']],
init:P=>({t:0}),step(P,S,dt){S.t+=dt},
draw(g,P,S){const cx=350,cy=200,a=P.a*D,s=P.n1*Math.sin(a)/P.n2;
 g.strokeStyle=c('--bd');g.beginPath();g.moveTo(0,cy);g.lineTo(700,cy);g.stroke();
 g.strokeStyle=c('--mut');g.setLineDash([5,5]);g.beginPath();g.moveTo(cx,0);g.lineTo(cx,400);g.stroke();g.setLineDash([]);
 const ix=cx-Math.sin(a)*180,iy=cy-Math.cos(a)*180;
 g.strokeStyle=c('--ac');g.lineWidth=2;g.beginPath();g.moveTo(ix,iy);g.lineTo(cx,cy);g.stroke();
 if(s<=1){const b=Math.asin(s),rx=cx+Math.sin(b)*180,ry=cy+Math.cos(b)*180;
  g.strokeStyle=c('--ac2');g.beginPath();g.moveTo(cx,cy);g.lineTo(rx,ry);g.stroke()}
 else{const rx=cx+Math.sin(a)*180,ry=cy-Math.cos(a)*180;
  g.strokeStyle=c('--warn');g.beginPath();g.moveTo(cx,cy);g.lineTo(rx,ry);g.stroke();
  g.fillStyle=c('--warn');g.font='14px sans-serif';g.textAlign='left';g.fillText('полное внутреннее отражение',cx+14,cy-14)}
 g.lineWidth=1},
out:(P,S)=>{const a=P.a*D,s=P.n1*Math.sin(a)/P.n2,crit=P.n1>P.n2?Math.asin(P.n2/P.n1)/D:NaN;
 return[['Угол преломления',s<=1?F(Math.asin(s)/D,1)+'°':'—'],['n₁·sinα',F(P.n1*Math.sin(a),3)],['Крит. угол',isNaN(crit)?'нет':F(crit,1)+'°'],['Явление',s<=1?'преломление':'отражение']]}},

{id:'doppler',diff:2,ic:'🚑',tag:'Волны',t:'Эффект Доплера',d:'Изменение частоты от движущегося источника.',
th:'<div class="formula">f′ = f·v / (v ∓ v<sub>ист</sub>)</div><p>Источник, летящий к нам, сжимает волны — тон выше. Удаляясь — ниже. По этому сдвигу измеряют скорость машин и далёких звёзд.</p>',
p:[['f','Частота f',200,800,10,440,' Гц'],['vs','Скорость источника',0,300,10,120,' м/с']],
init:P=>({x:80,t:0,em:[],acc:0}),
step(P,S,dt){S.t+=dt;S.x+=P.vs*dt;S.acc+=dt;if(S.acc>.12){S.acc=0;S.em.push([S.x,S.t])}if(S.x>700){S.x=0;S.em=[]}},
draw(g,P,S){const y=200,v=340;g.strokeStyle=c('--mut');g.beginPath();g.moveTo(0,y);g.lineTo(700,y);g.stroke();
 g.globalAlpha=.35;g.strokeStyle=c('--ac');
 S.em.forEach(q=>{const r=(S.t-q[1])*v;if(r<900){g.beginPath();g.arc(q[0],y,r,0,7);g.stroke()}});
 g.globalAlpha=1;dot(g,S.x,y,10,c('--ac2'));
 g.fillStyle=c('--tx');g.font='14px sans-serif';g.textAlign='left';g.fillText('источник движется →',24,60)},
out:(P,S)=>{const v=340,f1=P.f*v/(v-P.vs),f2=P.f*v/(v+P.vs);return[['Приближается',F(f1,0)+' Гц'],['Удаляется',F(f2,0)+' Гц'],['Сдвиг вверх',F(f1-P.f,0)+' Гц'],['Скорость',P.vs+' м/с']]}},

{id:'lorentz',diff:3,ic:'🧲',tag:'Электричество',t:'Сила Лоренца',d:'Заряд в магнитном поле — круговое движение.',
th:'<div class="formula">F = q·v·B &nbsp; r = m·v / (q·B)</div><p>Сила всегда перпендикулярна скорости, поэтому заряд летит по окружности. Радиус растёт со скоростью и падает с ростом поля — принцип циклотрона.</p>',
p:[['B','Магнитное поле B',.1,3,.1,1,' Тл'],['v','Скорость v',.5,5,.1,2,' усл.'],['q','Заряд q',-2,2,.5,1,' e']],
init:P=>({x:0,y:0,vx:P.v,vy:0,n:0,tr:[]}),
step(P,S,dt){const k=P.q*P.B;S.vx+=k*S.vy*dt;S.vy-=k*S.vx*dt;S.x+=S.vx*dt;S.y+=S.vy*dt;if(++S.n%4==0){S.tr.push([S.x,S.y]);if(S.tr.length>1500)S.tr.shift()}},
draw(g,P,S){g.fillStyle=c('--mut');g.font='16px sans-serif';g.textAlign='left';for(let x=40;x<700;x+=70)for(let y=40;y<400;y+=70)g.fillText('×',x,y);
 g.globalAlpha=.6;g.strokeStyle=c('--ac');g.lineWidth=2;g.beginPath();S.tr.forEach((q,i)=>{const x=350+q[0]*45,y=200-q[1]*45;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();g.globalAlpha=1;g.lineWidth=1;
 dot(g,350+S.x*45,200-S.y*45,7,c('--ac2'));
 g.fillStyle=c('--tx');g.fillText('B — в плоскость экрана (×)',20,26)},
out:(P,S)=>{const r=Math.abs(P.q)<.01?Infinity:Math.abs(P.v)/(Math.abs(P.q)*P.B);return[['Радиус r',isFinite(r)?F(r,2):'∞ (прямая)'],['Скорость',F(Math.hypot(S.vx,S.vy),2)],['Период',P.q?F(2*Math.PI/(Math.abs(P.q)*P.B),2):'—'],['Заряд',P.q>0?'+ положительный':P.q<0?'− отрицательный':'нейтральный']]}},

{id:'resonance',diff:3,ic:'📻',tag:'Колебания',t:'Резонанс',d:'Вынужденные колебания и рост амплитуды.',
th:'<div class="formula">ω₀ = √(k/m) &nbsp; амплитуда резко растёт при ω → ω₀</div><p>Если раскачивать качели в такт их собственной частоте, размах быстро растёт — это резонанс. Вдали от ω₀ колебания слабые. Опасен для мостов и зданий.</p>',
p:[['w','Частота силы ω',.2,4,.05,1,' рад/с'],['k','Жёсткость k',5,60,1,20,' Н/м'],['m','Масса m',.5,5,.5,1,' кг'],['c','Трение c',.05,2,.05,.2,'']],
init:P=>({x:0,v:0,t:0}),
step(P,S,dt){S.v+=(-P.k*S.x-P.c*S.v+2*Math.cos(P.w*S.t))/P.m*dt;S.x+=S.v*dt;S.t+=dt},
draw(g,P,S){const w0=Math.sqrt(P.k/P.m),y=140,cx=350,xx=cx+S.x*80;
 g.strokeStyle=c('--mut');g.lineWidth=3;g.beginPath();g.moveTo(80,y);
 for(let i=1;i<=16;i++)g.lineTo(80+(xx-40-80)*i/17,y+(i%2?14:-14));g.lineTo(xx-40,y);g.stroke();
 g.fillStyle=c('--ac');g.fillRect(xx-40,y-35,80,70);g.lineWidth=1;
 g.strokeStyle=c('--ac2');g.lineWidth=2;g.beginPath();g.moveTo(xx+40,y);g.lineTo(xx+40+30*Math.cos(P.w*S.t),y);g.stroke();g.lineWidth=1;
 const gx0=80,gx1=640,gy0=380,gy1=235;
 g.strokeStyle=c('--tx');g.beginPath();g.moveTo(gx0,gy0);g.lineTo(gx1,gy0);g.stroke();g.beginPath();g.moveTo(gx0,gy0);g.lineTo(gx0,gy1);g.stroke();
 g.strokeStyle=c('--ac');g.lineWidth=2;g.beginPath();
 for(let i=0;i<=200;i++){const w=.2+3.8*i/200,A=2/Math.sqrt(Math.pow(P.k-P.m*w*w,2)+Math.pow(P.c*w,2));const X=gx0+(gx1-gx0)*i/200,Y=gy0-Math.min(A,3)/3*(gy0-gy1);i?g.lineTo(X,Y):g.moveTo(X,Y)}
 g.stroke();g.lineWidth=1;
 const X=gx0+(gx1-gx0)*(P.w-.2)/3.8;dot(g,X,gy0,5,c('--ac2'));
 g.fillStyle=c('--mut');g.font='13px sans-serif';g.textAlign='left';g.fillText('амплитуда от частоты',gx0+6,gy1-6);
 const X0=gx0+(gx1-gx0)*(w0-.2)/3.8;g.strokeStyle=c('--mut');g.setLineDash([4,4]);g.beginPath();g.moveTo(X0,gy0);g.lineTo(X0,gy1);g.stroke();g.setLineDash([]);g.fillText('ω₀',X0-6,gy0+16)},
 out:(P,S)=>{const w0=Math.sqrt(P.k/P.m),A=2/Math.sqrt(Math.pow(P.k-P.m*P.w*P.w,2)+Math.pow(P.c*P.w,2));return[['Собств. частота ω₀',F(w0,2)+' рад/с'],['Амплитуда',F(A,2)+' м'],['Смещение',F(S.x,2)+' м'],['Режим',Math.abs(P.w-w0)<.25?'резонанс!':P.w<w0?'ниже ω₀':'выше ω₀']]}},

{id:'photoeffect',diff:2,ic:'⚡',tag:'Кванты',t:'Фотоэффект',d:'Свет выбивает электроны: красная граница и формула Эйнштейна.',
th:'<div class="formula">E<sub>к</sub> = h·f − A = 1240/λ − A &nbsp; (λ в нм, A в эВ)</div><p>Свет — поток квантов. Электрон вылетает, только если энергия фотона больше работы выхода A. При меньшей частоте — сколько ни свети, электронов нет. За это объяснение Эйнштейн получил Нобелевскую премию.</p>',
p:[['lam','Длина волны λ',200,700,10,400,' нм'],['A','Работа выхода A',2,5,.1,2.5,' эВ']],
init:P=>({t:0,el:[]}),
step(P,S,dt){S.t+=dt;const Ek=1240/P.lam-P.A;
 if(Ek>0&&Math.random()<dt*9)S.el.push({x:555,y:130+Math.random()*140,vx:-(40+Math.sqrt(Ek)*40),vy:(Math.random()-.5)*.5,life:2.6});
 S.el.forEach(e=>{e.x+=e.vx*dt;e.y+=e.vy*60*dt;e.life-=dt});S.el=S.el.filter(e=>e.life>0&&e.x>40)},
draw(g,P,S){const Ek=1240/P.lam-P.A;
 g.fillStyle=c('--mut');g.fillRect(50,140,20,120);
 g.strokeStyle=c('--ac2');g.lineWidth=2;g.beginPath();
 for(let i=0;i<=110;i++){const x=78+i*4.3,y=200+Math.sin(i*.5-S.t*7)*9;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();g.lineWidth=1;
 g.fillStyle=c('--bd');g.fillRect(560,90,24,220);
 g.fillStyle=c('--tx');g.font='13px sans-serif';g.textAlign='left';g.fillText('металл, A = '+F(P.A,1)+' эВ',480,80);
 S.el.forEach(e=>dot(g,e.x,e.y,4,c('--ac')));
 if(Ek<=0){g.fillStyle=c('--warn');g.font='14px sans-serif';g.fillText('h·f < A — электроны не вылетают',300,55)}
 const X=l=>120+(l-200)/500*360,Y=e=>360-Math.max(e,-1)/5*90;
 g.strokeStyle=c('--bd');g.beginPath();g.moveTo(120,360);g.lineTo(500,360);g.moveTo(120,360);g.lineTo(120,250);g.stroke();
 g.strokeStyle=c('--ac');g.lineWidth=2;g.beginPath();let st=false;
 for(let l=200;l<=700;l+=5){const e=1240/l-P.A;if(e<0)continue;const x=X(l),y=Y(e);st?g.lineTo(x,y):(g.moveTo(x,y),st=true)}g.stroke();g.lineWidth=1;
 dot(g,X(P.lam),Y(Math.max(Ek,0)),5,c('--ac2'));
 g.fillStyle=c('--mut');g.font='12px sans-serif';g.fillText('Eк(λ)',130,262);g.fillText('200 нм',108,376);g.fillText('700 нм',462,376)},
out:(P,S)=>{const Ek=1240/P.lam-P.A;return[['Энергия фотона',F(1240/P.lam)+' эВ'],['Макс. Eк',F(Math.max(Ek,0))+' эВ'],['Красная граница',F(1240/P.A,0)+' нм'],['Электроны',Ek>0?'вылетают ✓':'не вылетают']]}},

{id:'decay',diff:2,ic:'☢️',tag:'Кванты',t:'Радиоактивный распад',d:'Случайность ядер и период полураспада.',
th:'<div class="formula">N = N₀·2<sup>−t/T</sup></div><p>Каждое ядро распадается в случайный момент, но за время T распадается ровно половина всех ядер. Судьбу одного атома предсказать нельзя, поведение миллиардов — можно.</p>',
p:[['T','Период полураспада T',1,8,.5,3,' с']],
init:P=>({t:0,done:0,atoms:Array.from({length:240},(_,i)=>({x:70+(i%16)*27+(Math.random()-.5)*12,y:60+Math.floor(i/16)*20+(Math.random()-.5)*9,alive:true})),parts:[],h:[[0,240]],n:0}),
step(P,S,dt){S.t+=dt;const p=1-Math.pow(2,-dt/P.T);let alive=0;
 S.atoms.forEach(a=>{if(a.alive&&Math.random()<p){a.alive=false;const ang=Math.random()*6.283,sp=30+Math.random()*60;S.parts.push({x:a.x,y:a.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:1.1})}if(a.alive)alive++});
 S.parts.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt});S.parts=S.parts.filter(q=>q.life>0);
 if(++S.n%5==0)S.h.push([S.t,alive]);
 if(alive===0){S.done+=dt;if(S.done>1.6)rst()}else S.done=0},
draw(g,P,S){const N0=240,alive=S.atoms.filter(a=>a.alive).length;
 S.atoms.forEach(a=>{g.globalAlpha=a.alive?1:.22;dot(g,a.x,a.y,3.5,a.alive?c('--ac'):c('--mut'))});
 g.globalAlpha=1;
 g.strokeStyle=c('--ac2');g.lineWidth=1.5;
 S.parts.forEach(q=>{g.globalAlpha=q.life;g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x-q.vx*.07,q.y-q.vy*.07);g.stroke()});
 g.globalAlpha=1;g.lineWidth=1;
 const gx=510,gy=70,gw=170,gh=260,T=P.T,tmax=5*T;
 g.strokeStyle=c('--bd');g.strokeRect(gx,gy,gw,gh);
 g.strokeStyle=c('--mut');g.lineWidth=2;g.beginPath();
 for(let i=0;i<=60;i++){const t=tmax*i/60,x=gx+gw*t/tmax,y=gy+gh*(1-Math.pow(2,-t/T));i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();g.lineWidth=1;
 dot(g,gx+gw*Math.min(S.t,tmax)/tmax,gy+gh*(1-alive/N0),5,c('--ac2'));
 g.fillStyle=c('--mut');g.font='12px sans-serif';g.textAlign='left';g.fillText('N(t) — теория',gx+8,gy+16);g.fillText('0',gx-9,gy+gh+14);g.fillText('T',gx+gw/5-3,gy+gh+14);g.fillText('5T',gx+gw-14,gy+gh+14);
 g.fillStyle=c('--tx');g.font='14px sans-serif';g.fillText('Осталось: '+alive+' / '+N0,gx,gy-12)},
out:(P,S)=>{const N0=240,alive=S.atoms.filter(a=>a.alive).length,exp=N0*Math.pow(2,-S.t/P.T);return[['Осталось ядер',alive+' / '+N0],['Распалось',String(N0-alive)],['Прошло периодов',F(S.t/P.T,2)+' T'],['Теория',F(exp,0)+' ядер']]}},

{id:'coulomb',diff:1,ic:'⚛️',tag:'Электричество',t:'Закон Кулона',d:'Сила притяжения и отталкивания зарядов.',
th:'<div class="formula">F = k·|q₁·q₂| / r² &nbsp; k = 9·10⁹ Н·м²/Кл²</div><p>Одноимённые заряды отталкиваются, разноимённые притягиваются. Сила падает обратно квадрату расстояния: увеличишь r вдвое — сила станет в 4 раза меньше. Это главный закон электростатики.</p>',
p:[['q1','Заряд q₁',-5,5,.5,3,' нКл'],['q2','Заряд q₂',-5,5,.5,-3,' нКл'],['r','Расстояние r',.5,3,.1,1.5,' м']],
init:P=>({t:0}),step(P,S,dt){S.t+=dt},
draw(g,P,S){const k=9e9,q1=P.q1*1e-9,q2=P.q2*1e-9,Fe=k*q1*q2/(P.r*P.r),Fn=Math.abs(Fe)*1e9;
 const x1=350-P.r*100,x2=350+P.r*100,y=230;
 g.strokeStyle=c('--bd');g.beginPath();g.moveTo(x1,y);g.lineTo(x2,y);g.stroke();
 [[x1,P.q1],[x2,P.q2]].forEach(([x,q])=>{dot(g,x,y,18,q>=0?'#ef4444':'#38bdf8');
  g.fillStyle='#fff';g.font='bold 16px sans-serif';g.textAlign='center';g.fillText(q>=0?'+':'−',x,y+6)});
 if(Fn>1){const L=Math.min(Math.sqrt(Fn)*3.2,110),dir=Fe<0?1:-1;
  [[x1,dir],[x2,-dir]].forEach(([x,d])=>{const xa=x+d*26,xb=x+d*(26+L);
   g.strokeStyle=c('--warn');g.lineWidth=3;g.beginPath();g.moveTo(xa,y-52);g.lineTo(xb,y-52);g.stroke();
   g.fillStyle=c('--warn');g.beginPath();g.moveTo(xb+d*12,y-52);g.lineTo(xb,y-58);g.lineTo(xb,y-46);g.fill()});
  g.lineWidth=1;g.fillStyle=c('--warn');g.font='13px sans-serif';g.textAlign='center';g.fillText('F',350,y-62)}
 g.fillStyle=c('--mut');g.font='13px sans-serif';g.textAlign='center';g.fillText('r = '+F(P.r,1)+' м',350,y+44);
 g.fillStyle=c('--tx');g.font='14px sans-serif';g.fillText(Fe===0?'заряды не взаимодействуют':Fe<0?'притягиваются':'отталкиваются',350,y+70)},
out:(P,S)=>{const k=9e9,q1=P.q1*1e-9,q2=P.q2*1e-9,Fe=k*q1*q2/(P.r*P.r),E=k*Math.abs(q1)/(P.r*P.r);return[['Сила F',F(Math.abs(Fe)*1e9,1)+' нН'],['Взаимодействие',Math.abs(Fe)<1e-12?'нет':Fe<0?'притяжение':'отталкивание'],['Поле q₁ на месте q₂',F(E,1)+' Н/Кл'],['Произведение q₁·q₂',F(P.q1*P.q2,1)+' нКл²']]}},

{id:'lc',diff:3,ic:'🎚',tag:'Колебания',t:'Колебательный контур',d:'Энергия качается между катушкой и конденсатором.',
th:'<div class="formula">T = 2π·√(L·C) &nbsp; I₀ = U₀·√(C/L)</div><p>Конденсатор разряжается через катушку — и заряжается обратно. Энергия переходит из электрического поля в магнитное и наоборот. Это электрический аналог пружинного маятника: L ↔ m, C ↔ 1/k.</p>',
p:[['L','Индуктивность L',1,100,1,10,' мГн'],['C','Ёмкость C',1,100,1,40,' мкФ'],['U0','Напряжение U₀',1,20,1,12,' В']],
init:P=>({t:0}),
step(P,S,dt){S.t+=dt},
draw(g,P,S){const Ts=Math.sqrt(P.L*P.C*1e-9)*900,wa=2*Math.PI/Ts;
 const U=P.U0*Math.cos(wa*S.t),I=P.U0*Math.sqrt(P.C/P.L*1e-3)*Math.sin(wa*S.t),I0=P.U0*Math.sqrt(P.C/P.L*1e-3);
 g.strokeStyle=c('--mut');g.lineWidth=2;g.beginPath();
 g.moveTo(170,80);g.lineTo(530,80);g.moveTo(170,180);g.lineTo(530,180);
 g.moveTo(170,80);g.lineTo(170,120);g.moveTo(170,150);g.lineTo(170,180);
 g.moveTo(150,120);g.lineTo(190,120);g.moveTo(150,150);g.lineTo(190,150);
 g.stroke();g.lineWidth=1;
 g.beginPath();
 for(let i=0;i<4;i++)g.arc(530,92.5+i*25,12.5,Math.PI/2,-Math.PI/2,true);
 g.stroke();
 g.globalAlpha=.25+Math.abs(U)/P.U0*.75;
 g.strokeStyle=U>=0?'#ef4444':'#38bdf8';g.lineWidth=4;
 g.beginPath();g.moveTo(150,U>=0?120:150);g.lineTo(190,U>=0?120:150);g.stroke();g.globalAlpha=1;g.lineWidth=1;
 g.fillStyle=c('--tx');g.font='13px sans-serif';g.textAlign='left';g.fillText(U>=0?'+q':'−q',196,146);g.fillText(U>=0?'−q':'+q',196,128);
 g.fillText('C = '+P.C+' мкФ',110,205);g.fillText('L = '+P.L+' мГн',500,205);
 if(Math.abs(I)>I0*.02){const d=I>0?1:-1,Ln=Math.min(Math.abs(I)/I0,1)*60;
  g.strokeStyle=c('--ac2');g.lineWidth=3;g.beginPath();g.moveTo(350-d*Ln/2,80);g.lineTo(350+d*Ln/2,80);g.stroke();
  g.fillStyle=c('--ac2');g.beginPath();g.moveTo(350+d*(Ln/2+12),80);g.lineTo(350+d*Ln/2,74);g.lineTo(350+d*Ln/2,86);g.fill();g.lineWidth=1;
  g.fillText('I = '+F(Math.abs(I),2)+' А',350,64)}
 const cx0=80,cx1=640,cy=310,amp=55;
 g.strokeStyle=c('--bd');g.beginPath();g.moveTo(cx0,cy);g.lineTo(cx1,cy);g.stroke();
 g.strokeStyle=c('--ac');g.beginPath();
 for(let i=0;i<=120;i++){const x=cx0+(cx1-cx0)*i/120,tl=S.t-2*Ts+2*Ts*i/120,yu=cy-Math.cos(wa*tl)*amp;i?g.lineTo(x,yu):g.moveTo(x,yu)}
 g.stroke();
 g.strokeStyle=c('--ac2');g.beginPath();
 for(let i=0;i<=120;i++){const x=cx0+(cx1-cx0)*i/120,tl=S.t-2*Ts+2*Ts*i/120,v=Math.sin(wa*tl);i?g.lineTo(x,cy-v*amp):g.moveTo(x,cy-v*amp)}g.stroke();
 g.fillStyle=c('--mut');g.font='12px sans-serif';g.fillText('U (красн.) и I (голуб.) — в противофазе',cx0+4,cy-amp-8)},
out:(P,S)=>{const T=2*Math.PI*Math.sqrt(P.L*P.C*1e-9)*1000,I0=P.U0*Math.sqrt(P.C/P.L*1e-3),E=P.C*1e-6*P.U0*P.U0/2*1000;return[['Период T',F(T,2)+' мс'],['Частота f',F(1000/T,1)+' Гц'],['Ток I₀',F(I0,2)+' А'],['Энергия',F(E,2)+' мДж']]}}
];
function pos(s){const x=350+85*Math.sin(s[0]),y=120+85*Math.cos(s[0]);return[x,y,x+85*Math.sin(s[1]),y+85*Math.cos(s[1])]}

/* Общий запуск лабораторий */
let L,P={},S,last,ghost=null;
function toggleGhost(){
 if(ghost){ghost=null;$('lcmp')&&($('lcmp').textContent='👻 Сравнить');toast('Сравнение выключено');return}
 ghost=document.createElement('canvas');ghost.width=700;ghost.height=400;
 ghost.getContext('2d').drawImage($('lc'),0,0);
 $('lcmp')&&($('lcmp').textContent='👻 Выключить');
 toast('Кадр заморожен — меняй параметры и сравнивай');
}
$('lcmp')&&($('lcmp').onclick=toggleGhost);
$('allgrid').insertAdjacentHTML('beforeend',LABS.map((l,i)=>`<div class="card click labcard" data-id="${l.id}" data-name="${l.t}" data-tag="${l.tag}" data-diff="${l.diff||2}" onclick="openLab(${i})"><button class="fav" data-id="${l.id}" onclick="event.stopPropagation();toggleFav('${l.id}')">☆</button><div class="ic">${l.ic}</div><span class="tag">${l.tag} · ${'⭐'.repeat(l.diff||2)}</span><h3>${l.t}</h3><p>${l.d}</p></div>`).join(''));
function upd(){L.p.forEach((q,j)=>{P[q[0]]=+$('pr'+j).value;$('pl'+j).textContent=P[q[0]]+q[6]})}
function openLab(i,vals){if(!window.__authed){if(typeof openAuth==='function')openAuth('login');return}
 L=LABS[i];go('lab');setPaused(false);history.replaceState(null,'','#lab-'+L.id);localStorage.setItem('physlab_last','lab-'+L.id);
 ghost=null;$('lcmp')&&($('lcmp').textContent='👻 Сравнить');
 $('lt').textContent=L.ic+' '+L.t;$('ltx').innerHTML=L.th;
 $('lp').innerHTML=L.p.map((q,j)=>`<label>${q[1]} <b id="pl${j}"></b></label><input type="range" id="pr${j}" min="${q[2]}" max="${q[3]}" step="${q[4]}" value="${vals&&vals[q[0]]!=null?vals[q[0]]:q[5]}">`).join('');
 L.p.forEach((q,j)=>$('pr'+j).oninput=()=>{upd();S=L.init(P)});
 upd();S=L.init(P);last=performance.now();loop(last);
 if(typeof markProgress==='function')markProgress(L.id);}
function openLabById(id,vals){const i=LABS.findIndex(l=>l.id===id);if(i>-1)openLab(i,vals)}
function drawLab(){const g=$('lc').getContext('2d');g.clearRect(0,0,700,400);g.lineWidth=1;g.setLineDash([]);g.textAlign='left';g.font='13px sans-serif';g.globalAlpha=1;
 if(ghost){g.save();g.globalAlpha=.4;g.drawImage(ghost,0,0);g.restore()}
 L.draw(g,P,S);$('lo').innerHTML=L.out(P,S).map(o=>`<div>${o[0]}<b>${o[1]}</b></div>`).join('')}
function loop(now){const dt=Math.min((now-last)/1000,.05)*speed;last=now;
 if(!paused){const n=Math.max(1,Math.ceil(dt/.002));for(let i=0;i<n;i++)L.step(P,S,dt/n)}
 drawLab();raf=requestAnimationFrame(loop)}
$('lr').onclick=()=>{S=L.init(P)};
$('lstep')&&($('lstep').onclick=()=>{const n=8;for(let i=0;i<n;i++)L.step(P,S,.016/n);drawLab()});
$('lspeed')&&($('lspeed').oninput=e=>{speed=+e.target.value;$('lspeedv').textContent=speed+'×'});
$('lfull')&&($('lfull').onclick=()=>{const el=document.querySelector('.lab-main');if(!document.fullscreenElement){el&&el.requestFullscreen&&el.requestFullscreen()}else document.exitFullscreen()});
