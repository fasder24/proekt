/* PhysLab v15 — интерактивная демонстрация на главном экране. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('homeLabCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const speed = $('homeSpeed');
  const angle = $('homeAngle');
  const g = 9.81;
  const fmt = (n, digits = 1) => n.toLocaleString('ru-RU', {minimumFractionDigits:digits, maximumFractionDigits:digits});

  function draw() {
    const v = Number(speed.value);
    const a = Number(angle.value) * Math.PI / 180;
    const vx = v * Math.cos(a), vy = v * Math.sin(a);
    const time = 2 * vy / g;
    const range = vx * time;
    const height = vy * vy / (2 * g);
    $('homeSpeedValue').textContent = `${v} м/с`;
    $('homeAngleValue').textContent = `${angle.value}°`;
    $('homeRange').textContent = `${fmt(range)} м`;
    $('homeFlight').textContent = `${fmt(time, 2)} с`;
    $('homeHeight').textContent = `${fmt(height)} м`;

    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const pad = {l:48, r:28, t:30, b:48};
    const sx = (w-pad.l-pad.r) / Math.max(range*1.12, 12);
    const sy = (h-pad.t-pad.b) / Math.max(height*1.45, 5);
    const X = x => pad.l + x*sx;
    const Y = y => h-pad.b-y*sy;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(220,224,218,.10)';
    for (let i=0;i<=5;i++) {
      const x=pad.l+i*(w-pad.l-pad.r)/5;
      ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,h-pad.b);ctx.stroke();
    }
    for (let i=0;i<=4;i++) {
      const y=pad.t+i*(h-pad.t-pad.b)/4;
      ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();
    }
    ctx.strokeStyle='rgba(220,224,218,.38)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();
    ctx.fillStyle='rgba(177,183,175,.82)';ctx.font='16px Manrope, sans-serif';ctx.fillText('y, м',pad.l+4,pad.t-9);ctx.fillText('x, м',w-pad.r-34,h-12);

    const grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b);
    grad.addColorStop(0,'rgba(155,137,101,.22)');grad.addColorStop(1,'rgba(155,137,101,0)');
    ctx.beginPath();
    for(let i=0;i<=160;i++){const t=time*i/160,x=vx*t,y=vy*t-.5*g*t*t;i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y));}
    ctx.lineTo(X(range),Y(0));ctx.lineTo(X(0),Y(0));ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    ctx.beginPath();
    for(let i=0;i<=160;i++){const t=time*i/160,x=vx*t,y=vy*t-.5*g*t*t;i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y));}
    ctx.strokeStyle='#b4a27c';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='rgba(155,137,101,.28)';ctx.shadowBlur=14;ctx.stroke();ctx.shadowBlur=0;
    const x0=X(0),y0=Y(0),x1=X(range),y1=Y(0);
    ctx.fillStyle='#8eaa91';ctx.shadowColor='rgba(142,170,145,.38)';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x0,y0,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#d2c4a1';ctx.beginPath();ctx.arc(x1,y1,6,0,Math.PI*2);ctx.fill();
    // Initial velocity vector.
    const vecLen= Math.min(92, v*3.2);
    const ex=x0+Math.cos(a)*vecLen, ey=y0-Math.sin(a)*vecLen;
    ctx.strokeStyle='#8eaa91';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.fillStyle='#8eaa91';ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-12*Math.cos(a-.45),ey+12*Math.sin(a-.45));ctx.lineTo(ex-12*Math.cos(a+.45),ey+12*Math.sin(a+.45));ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(229,228,223,.9)';ctx.font='600 15px Manrope, sans-serif';ctx.fillText(`v₀ = ${v} м/с`,Math.min(ex+12,w-150),Math.max(ey-12,22));
    ctx.fillStyle='rgba(177,183,175,.8)';ctx.font='13px Manrope, sans-serif';ctx.fillText(`R = ${fmt(range)} м`,Math.min(x1-88,w-110),h-pad.b-12);
  }
  speed.addEventListener('input',draw);
  angle.addEventListener('input',draw);
  const themeObserver = new MutationObserver(draw);
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  draw();
})();
