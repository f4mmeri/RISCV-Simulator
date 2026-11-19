// ── Tipo → color de mnemónico ──────────────────────────────
function mnColor(type){
  return{L:'kw-load',S:'kw-store',B:'kw-branch',J:'kw-jump',R:'kw-arith',I:'kw-arith',U:'kw-arith',SYS:'kw-load','?':'co-err'}[type]||'';
}

// ── Render registros ───────────────────────────────────────
function renderRegs(){
  const c=document.getElementById('regs-list');
  let h=`<div class="reg-row"><span class="rn">pc</span><span class="rx"></span><span class="rv pc-val">${ph(cpu.pc)}</span></div>`;
  for(let i=0;i<32;i++){
    const v=cpu.regs[i]>>>0,ch=v!==(prev[i]>>>0);
    h+=`<div class="reg-row${ch?' changed':''}"><span class="rn">${RN[i]}</span><span class="rx">x${i}</span><span class="rv">${ph(v)}</span></div>`;
  }
  c.innerHTML=h;
}

// ── Render desensamblado ───────────────────────────────────
function renderDisasm(){
  const c=document.getElementById('disasm-list');
  const pc=cpu.pc>>>0,start=Math.max(0,pc-10*4);
  document.getElementById('dis-pc-lbl').textContent='PC = 0x'+(pc>>>0).toString(16).padStart(8,'0');
  let h='';
  for(let i=0;i<36;i++){
    const a=(start+i*4)>>>0;if(a>=MEM)break;
    const I=cpu.r32(a),[mn,ops,tp]=cpu.disasm(I,a);
    const cur=a===pc;
    h+=`<div class="di-row${cur?' cur':''}">
      <span class="di-mark">${cur?'▶':''}</span>
      <span class="di-addr">${ph(a)}</span>
      <span class="di-hex">${ph(I)}</span>
      <span class="di-mn"><span class="${mnColor(tp)}">${mn}</span> <span class="di-ops">${ops}</span></span>
    </div>`;
  }
  c.innerHTML=h;
  const el=c.querySelector('.cur');if(el)el.scrollIntoView({block:'nearest'});
}

// ── Render memoria (estilo CPUlator) ────────────────────────
function renderMem(addr){
  memAddr=addr>>>0;
  document.getElementById('mem-addr').value='0x'+(memAddr>>>0).toString(16).padStart(8,'0');
  const c=document.getElementById('mem-content');
  const pcBytes=new Set([cpu.pc,cpu.pc+1,cpu.pc+2,cpu.pc+3].map(x=>x>>>0));
  let h='';
  for(let r=0;r<12;r++){
    const a=(memAddr+r*16)>>>0;if(a>=MEM)break;
    let words='',ascii='';
    for(let w=0;w<4;w++){
      let wordBytes='';
      for(let b=0;b<4;b++){
        const ba=(a+w*4+b)>>>0,cv=ba<MEM?cpu.mem[ba]:0;
        const hi=pcBytes.has(ba);
        wordBytes+=`<span${hi?' class="hi"':''}>${cv.toString(16).padStart(2,'0')}</span>`;
        ascii+=(cv>=32&&cv<127)?String.fromCharCode(cv):'<span class="asc-dot">·</span>';
      }
      words+=`<span class="m-word">${wordBytes}</span>`;
    }
    h+=`<div class="mem-row"><span class="ma">${ph(a)}</span><span class="mb">${words}</span><span class="mc">${ascii}</span></div>`;
  }
  c.innerHTML=h;
}

// ── Bottom bar & Status badge ──────────────────────────────
function renderStatus(){
  document.getElementById('bb-pc').textContent=p8(cpu.pc);
  document.getElementById('bb-ic').textContent=cpu.count.toLocaleString();
  document.getElementById('bb-sp').textContent=p8(cpu.regs[2]);
  document.getElementById('bb-a0').textContent=p8(cpu.regs[10]);
  document.getElementById('bb-ra').textContent=p8(cpu.regs[1]);

  const badge=document.getElementById('status-badge');
  if(badge){
    if(cpu.halted){
      badge.textContent='Stopped';
      badge.className='state-stopped';
    }else if(cpu.count>0){
      badge.textContent='Ready';
      badge.className='state-running';
    }else{
      badge.textContent='Stopped';
      badge.className='state-stopped';
    }
  }

  const s=document.getElementById('status-txt');
  if(s){
    s.textContent=cpu.halted?`DETENIDO (exit ${cpu.exitCode})`:'Listo';
  }
}

function renderAll(){renderRegs();renderDisasm();renderMem(memAddr);renderStatus();}
