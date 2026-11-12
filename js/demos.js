'use strict';

function makeProgram(build){
  const words=[];
  const labels=new Map();
  const fixups=[];
  const emit=word=>words.push(word>>>0);
  const p={
    label(name){labels.set(name,words.length*4);},
    lui(rd,imm20){emit(((imm20&0xFFFFF)<<12)|(rd<<7)|0x37);},
    addi(rd,rs1,imm){emit(((imm&0xFFF)<<20)|(rs1<<15)|(rd<<7)|0x13);},
    slli(rd,rs1,shamt){emit(((shamt&31)<<20)|(rs1<<15)|(1<<12)|(rd<<7)|0x13);},
    op(rd,rs1,rs2,funct3,funct7=0){emit((funct7<<25)|(rs2<<20)|(rs1<<15)|(funct3<<12)|(rd<<7)|0x33);},
    load(rd,rs1,imm,funct3=2){emit(((imm&0xFFF)<<20)|(rs1<<15)|(funct3<<12)|(rd<<7)|0x03);},
    store(rs2,rs1,imm,funct3=2){
      emit((((imm>>5)&0x7F)<<25)|(rs2<<20)|(rs1<<15)|(funct3<<12)|((imm&0x1F)<<7)|0x23);
    },
    ecall(){emit(0x73);},
    branch(funct3,rs1,rs2,label){fixups.push({type:'B',index:words.length,funct3,rs1,rs2,label});emit(0);},
    jal(rd,label){fixups.push({type:'J',index:words.length,rd,label});emit(0);},
    jalr(rd,rs1,imm=0){emit(((imm&0xFFF)<<20)|(rs1<<15)|(rd<<7)|0x67);}
  };
  build(p);
  for(const f of fixups){
    if(!labels.has(f.label))throw new Error(`Etiqueta desconocida en demo: ${f.label}`);
    const offset=labels.get(f.label)-f.index*4;
    if(f.type==='B'){
      const imm=offset&0x1FFF;
      words[f.index]=(((imm>>>12)&1)<<31)|(((imm>>>5)&0x3F)<<25)|(f.rs2<<20)|
        (f.rs1<<15)|(f.funct3<<12)|(((imm>>>1)&0xF)<<8)|(((imm>>>11)&1)<<7)|0x63;
    }else{
      const imm=offset&0x1FFFFF;
      words[f.index]=(((imm>>>20)&1)<<31)|(((imm>>>1)&0x3FF)<<21)|
        (((imm>>>11)&1)<<20)|(((imm>>>12)&0xFF)<<12)|(f.rd<<7)|0x6F;
    }
  }
  const bytes=new Uint8Array(words.length*4);
  words.forEach((word,index)=>{
    bytes[index*4]=word&0xFF;
    bytes[index*4+1]=(word>>>8)&0xFF;
    bytes[index*4+2]=(word>>>16)&0xFF;
    bytes[index*4+3]=(word>>>24)&0xFF;
  });
  return bytes;
}

const DEMO_RISCVTEST=makeProgram(p=>{
  p.addi(5,0,20);
  p.addi(6,0,5);
  p.op(7,5,6,0);
  p.op(28,7,6,0,0x20);
  p.op(29,7,5,7);
  p.op(30,29,6,6);
  p.op(31,6,5,2);
  p.store(7,0,0x64);
  p.load(10,0,0x64);
  p.branch(0,10,7,'test.pass');
  p.addi(11,0,0);
  p.jal(0,'test.exit');
  p.label('test.pass');
  p.addi(11,0,1);
  p.label('test.exit');
  p.jal(1,'test.return');
  p.addi(10,0,0);
  p.ecall();
  p.label('test.return');
  p.addi(17,0,10);
  p.jalr(0,1);
});

const DEMO_QUICKSORT=makeProgram(p=>{
  p.lui(10,1);
  p.addi(11,0,0);
  p.addi(12,0,6);
  p.jal(1,'sort');
  p.addi(10,0,0);
  p.addi(17,0,10);
  p.ecall();

  p.label('sort');
  p.branch(5,11,12,'sort.return');
  p.addi(2,2,-24);
  p.store(1,2,20);
  p.store(11,2,16);
  p.store(12,2,12);
  p.slli(5,12,2);
  p.op(5,10,5,0);
  p.load(6,5,0);
  p.addi(7,11,-1);
  p.addi(28,11,0);

  p.label('sort.partition');
  p.branch(5,28,12,'sort.partition.done');
  p.slli(29,28,2);
  p.op(29,10,29,0);
  p.load(30,29,0);
  p.branch(4,30,6,'sort.swap.left');
  p.jal(0,'sort.next');
  p.label('sort.swap.left');
  p.addi(7,7,1);
  p.slli(31,7,2);
  p.op(31,10,31,0);
  p.load(5,31,0);
  p.store(30,31,0);
  p.store(5,29,0);
  p.label('sort.next');
  p.addi(28,28,1);
  p.jal(0,'sort.partition');

  p.label('sort.partition.done');
  p.addi(7,7,1);
  p.slli(31,7,2);
  p.op(31,10,31,0);
  p.slli(5,12,2);
  p.op(5,10,5,0);
  p.load(6,5,0);
  p.load(30,31,0);
  p.store(6,31,0);
  p.store(30,5,0);
  p.store(7,2,8);
  p.load(11,2,16);
  p.addi(12,7,-1);
  p.jal(1,'sort');
  p.load(7,2,8);
  p.addi(11,7,1);
  p.load(12,2,12);
  p.jal(1,'sort');
  p.load(1,2,20);
  p.addi(2,2,24);
  p.label('sort.return');
  p.jalr(0,1);
});

const DEMO_TREE=makeProgram(p=>{
  p.lui(5,1);
  p.load(6,5,4);
  p.load(7,5,8);
  p.branch(1,6,7,'tree.no');
  p.load(6,5,12);
  p.load(7,5,24);
  p.branch(1,6,7,'tree.no');
  p.load(6,5,16);
  p.load(7,5,20);
  p.branch(1,6,7,'tree.no');
  p.addi(10,0,1);
  p.jal(0,'tree.exit');
  p.label('tree.no');
  p.addi(10,0,0);
  p.label('tree.exit');
  p.addi(17,0,10);
  p.ecall();
});

const DEMO_ECALL=makeProgram(p=>{
  p.lui(5,1);
  p.addi(6,0,25);
  p.store(6,5,0);
  p.load(10,5,0);
  p.addi(17,0,1);
  p.ecall();
  p.addi(10,0,0);
  p.addi(17,0,10);
  p.ecall();
});
