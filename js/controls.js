// ── Botones ────────────────────────────────────────────────
function doStep(n=1){
  prev.set(cpu.regs);
  for(let i=0;i<n&&!cpu.halted;i++)cpu.step();
  flushOut();renderAll();
  if(cpu.halted)clog(`Detenido. Exit: ${cpu.exitCode}`,'co-info');
}
document.getElementById('btn-step').onclick=()=>doStep(1);
document.getElementById('btn-step10').onclick=()=>doStep(10);
document.getElementById('btn-step100').onclick=()=>doStep(100);
document.getElementById('btn-clear-console').onclick=clearConsole;
const consoleResizer=document.getElementById('console-resizer');
const mainPanel=document.getElementById('main');
let consoleResizeActive=false;
function setConsoleWidth(width){
  const maxWidth=Math.max(220,Math.min(720,mainPanel.clientWidth-200-240-7));
  mainPanel.style.setProperty('--console-width',`${Math.max(220,Math.min(maxWidth,width))}px`);
}
function startConsoleResize(event){
  event.preventDefault();
  consoleResizeActive=true;
  document.body.classList.add('resizing-console');
}
function resizeConsole(event){
  if(!consoleResizeActive)return;
  const bounds=mainPanel.getBoundingClientRect();
  setConsoleWidth(bounds.right-event.clientX);
}
function stopConsoleResize(){
  consoleResizeActive=false;
  document.body.classList.remove('resizing-console');
}
consoleResizer.addEventListener('pointerdown',startConsoleResize);
window.addEventListener('pointermove',resizeConsole);
window.addEventListener('pointerup',stopConsoleResize);
window.addEventListener('pointercancel',stopConsoleResize);
consoleResizer.addEventListener('mousedown',startConsoleResize);
window.addEventListener('mousemove',resizeConsole);
window.addEventListener('mouseup',stopConsoleResize);
consoleResizer.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
    event.preventDefault();
    const current=parseFloat(getComputedStyle(mainPanel).getPropertyValue('--console-width'));
    setConsoleWidth(current+(event.key==='ArrowLeft'?20:-20));
  }else if(event.key==='Home'){
    event.preventDefault();
    setConsoleWidth(300);
  }
});
document.getElementById('btn-run').onclick=()=>{
  prev.set(cpu.regs);let n=0;
  while(!cpu.halted&&n<5000000){cpu.step();n++;}
  flushOut();renderAll();
  clog(`Run: ${n.toLocaleString()} instrucciones. Exit: ${cpu.exitCode}`,'co-info');
};
document.getElementById('btn-reset').onclick=()=>{
  cpu.reset();prev.fill(0);memAddr=0;renderAll();clog('Reseteado.','co-info');
};
function loadDemo(bytes,name,hint){
  cpu.reset();prev.fill(0);cpu.load(bytes,0);
  document.getElementById('status-txt').textContent=name;
  clog(`${name} cargado.`,'co-info');
  if(hint)clog(hint,'co-dim');
  renderAll();
}
document.getElementById('btn-demo').onclick=()=>loadDemo(DEMO_RISCVTEST,'riscvtest','Resultado esperado: mem 0x64 → 19 00 00 00 (valor 25)');
document.getElementById('btn-demo-qs').onclick=()=>{
  cpu.reset();prev.fill(0);cpu.load(DEMO_QUICKSORT,0);
  [6,4,3,2,1,8,9].forEach((v,i)=>cpu.w32(0x1000+i*4,v));
  document.getElementById('status-txt').textContent='quicksort';
  clog('Quicksort cargado. Array {6,4,3,2,1,8,9} en 0x1000.','co-info');
  clog('Usa "mem 0x1000" para ver el array.','co-dim');
  renderMem(0x1000);renderAll();
};
document.getElementById('btn-demo-tree').onclick=()=>{
  loadDemo(DEMO_TREE,'árbol simétrico','Array {6,4,4,1,2,2,1} en 0x1000. Resultado: a0=1 (simétrico)');
  [6,4,4,1,2,2,1].forEach((v,i)=>cpu.w32(0x1000+i*4,v));
  renderMem(0x1000);renderAll();
};
document.getElementById('btn-demo-ecall').onclick=()=>loadDemo(
  DEMO_ECALL,'ecall / salida','El programa almacena 25, lo carga y lo imprime en la consola.'
);
document.getElementById('file-input').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    if(!(ev.target.result instanceof ArrayBuffer)){
      clog(`No se pudo leer "${f.name}".`,'co-err');
      return;
    }
    try{
      cpu.reset();prev.fill(0);
      cpu.load(new Uint8Array(ev.target.result),0);
      document.getElementById('status-txt').textContent=f.name;
      clog(`"${f.name}" cargado (${f.size} bytes).`,'co-info');
      renderAll();
    }catch(error){
      clog(`No se pudo cargar "${f.name}": ${error.message}`,'co-err');
    }
  };
  r.onerror=()=>clog(`Error al leer "${f.name}".`,'co-err');
  r.readAsArrayBuffer(f);
};
document.getElementById('btn-mem-go').onclick=()=>{
  const v=document.getElementById('mem-addr').value;
  const a=(v.startsWith('0x')||v.startsWith('0X'))?parseInt(v,16)>>>0:parseInt(v,10)>>>0;
  renderMem(a);
};
document.getElementById('btn-mem-pc').onclick=()=>renderMem(cpu.pc);
document.getElementById('btn-mem-64').onclick=()=>renderMem(0x64);
document.getElementById('btn-mem-1000').onclick=()=>renderMem(0x1000);
document.getElementById('mem-addr').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btn-mem-go').click();});
document.getElementById('console-input').addEventListener('keydown',e=>{
  if(e.key==='Enter'){const i=e.target;execCmd(i.value);i.value='';}
});
document.addEventListener('keydown',e=>{
  if(document.activeElement.id==='console-input'||document.activeElement.id==='mem-addr')return;
  if(e.key==='F7'){e.preventDefault();doStep(1);}
  else if(e.key==='F8'){e.preventDefault();document.getElementById('btn-run').click();}
  else if(e.key==='F9'){e.preventDefault();document.getElementById('btn-reset').click();}
});
