'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const context={Uint8Array};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'js','cpu.js'),'utf8')+'\nglobalThis.CPU=CPU;',context);
vm.runInContext(
  fs.readFileSync(path.join(root,'js','demos.js'),'utf8')+
    '\nglobalThis.DEMOS=[DEMO_RISCVTEST,DEMO_QUICKSORT,DEMO_TREE,DEMO_ECALL];',
  context
);
const {CPU,DEMOS}=context;

function iType(rd,rs1,funct3,imm,opcode=0x13){
  return ((imm&0xFFF)<<20)|(rs1<<15)|(funct3<<12)|(rd<<7)|opcode;
}
function rType(rd,rs1,rs2,funct3,funct7=0){
  return (funct7<<25)|(rs2<<20)|(rs1<<15)|(funct3<<12)|(rd<<7)|0x33;
}
function sType(rs2,rs1,funct3,imm){
  return (((imm>>5)&0x7F)<<25)|(rs2<<20)|(rs1<<15)|(funct3<<12)|((imm&0x1F)<<7)|0x23;
}
function bType(rs1,rs2,funct3,imm){
  const value=imm&0x1FFF;
  return (((value>>>12)&1)<<31)|(((value>>>5)&0x3F)<<25)|(rs2<<20)|(rs1<<15)|
    (funct3<<12)|(((value>>>1)&0xF)<<8)|(((value>>>11)&1)<<7)|0x63;
}
function jType(rd,imm){
  const value=imm&0x1FFFFF;
  return (((value>>>20)&1)<<31)|(((value>>>1)&0x3FF)<<21)|(((value>>>11)&1)<<20)|
    (((value>>>12)&0xFF)<<12)|(rd<<7)|0x6F;
}
function instructionBytes(word){
  return new Uint8Array([word&0xFF,(word>>>8)&0xFF,(word>>>16)&0xFF,(word>>>24)&0xFF]);
}
function execute(word,registers={},prepare){
  const cpu=new CPU();
  cpu.load(instructionBytes(word));
  Object.entries(registers).forEach(([register,value])=>{cpu.regs[Number(register)]=value;});
  if(prepare)prepare(cpu);
  cpu.step();
  return cpu;
}
function runDemo(index,initialData=[]){
  const cpu=new CPU();
  cpu.load(DEMOS[index]);
  initialData.forEach((value,i)=>cpu.w32(0x1000+i*4,value));
  for(let i=0;i<10000&&!cpu.halted;i++)cpu.step();
  return cpu;
}

test('RV32I arithmetic and immediate operations use signed and unsigned semantics',()=>{
  assert.equal(execute(iType(3,1,0,1),{1:0x7FFFFFFF}).regs[3],-0x80000000);
  assert.equal(execute(iType(3,1,2,-1),{1:-2}).regs[3],1);
  assert.equal(execute(iType(3,1,3,1),{1:-1}).regs[3],0);
  assert.equal(execute(iType(3,1,4,0xFF),{1:-1}).regs[3],-256);
  assert.equal(execute(iType(3,1,6,0x80),{1:0x100}).regs[3],0x180);
  assert.equal(execute(iType(3,1,7,0x0F),{1:0x35}).regs[3],5);
  assert.equal(execute(iType(3,1,1,2),{1:3}).regs[3],12);
  assert.equal(execute(iType(3,1,5,0x401),{1:-1}).regs[3],-1);
  assert.equal(execute(iType(3,1,5,1),{1:-1}).regs[3],0x7FFFFFFF);

  assert.equal(execute(rType(3,1,2,0),{1:20,2:5}).regs[3],25);
  assert.equal(execute(rType(3,1,2,0,0x20),{1:20,2:5}).regs[3],15);
  assert.equal(execute(rType(3,1,2,1),{1:3,2:2}).regs[3],12);
  assert.equal(execute(rType(3,1,2,2),{1:-1,2:1}).regs[3],1);
  assert.equal(execute(rType(3,1,2,3),{1:-1,2:1}).regs[3],0);
  assert.equal(execute(rType(3,1,2,4),{1:0xF0,2:0xCC}).regs[3],0x3C);
  assert.equal(execute(rType(3,1,2,5),{1:-1,2:1}).regs[3],0x7FFFFFFF);
  assert.equal(execute(rType(3,1,2,5,0x20),{1:-2,2:1}).regs[3],-1);
  assert.equal(execute(rType(3,1,2,6),{1:0xF0,2:0xCC}).regs[3],0xFC);
  assert.equal(execute(rType(3,1,2,7),{1:0xF0,2:0xCC}).regs[3],0xC0);
});

test('loads and stores preserve little-endian bytes and sign extension',()=>{
  const signedByte=execute(iType(3,1,0,0,0x03),{1:0x100},cpu=>cpu.w8(0x100,0x80));
  assert.equal(signedByte.regs[3],-128);
  const unsignedByte=execute(iType(3,1,4,0,0x03),{1:0x100},cpu=>cpu.w8(0x100,0xFF));
  assert.equal(unsignedByte.regs[3],255);
  const signedHalf=execute(iType(3,1,1,0,0x03),{1:0x100},cpu=>cpu.w16(0x100,0x8001));
  assert.equal(signedHalf.regs[3],-32767);
  const unsignedHalf=execute(iType(3,1,5,0,0x03),{1:0x100},cpu=>cpu.w16(0x100,0xFFFF));
  assert.equal(unsignedHalf.regs[3],65535);
  const word=execute(iType(3,1,2,0,0x03),{1:0x100},cpu=>cpu.w32(0x100,0x89ABCDEF));
  assert.equal(word.regs[3]>>>0,0x89ABCDEF);

  const storedByte=execute(sType(2,1,0,1),{1:0x100,2:0x1234});
  assert.equal(storedByte.r8(0x101),0x34);
  const storedHalf=execute(sType(2,1,1,2),{1:0x100,2:0x1234});
  assert.deepEqual([storedHalf.r8(0x102),storedHalf.r8(0x103)],[0x34,0x12]);
  const storedWord=execute(sType(2,1,2,0),{1:0x100,2:0x89ABCDEF});
  assert.deepEqual([0,1,2,3].map(offset=>storedWord.r8(0x100+offset)),[0xEF,0xCD,0xAB,0x89]);
});

test('branches, jumps and upper-immediate instructions update PC and registers',()=>{
  assert.equal(execute(bType(1,2,4,8),{1:-1,2:1}).pc,8);
  assert.equal(execute(bType(1,2,6,8),{1:-1,2:1}).pc,4);
  assert.equal(execute(jType(1,8)).regs[1],4);
  assert.equal(execute(jType(1,8)).pc,8);
  const jalr=execute(iType(3,1,0,0,0x67),{1:0x41});
  assert.equal(jalr.pc,0x40);
  assert.equal(jalr.regs[3],4);

  const lui=execute((1<<12)|(3<<7)|0x37);
  assert.equal(lui.regs[3],0x1000);
  const auipc=execute((1<<12)|(3<<7)|0x17);
  assert.equal(auipc.regs[3],0x1000);
});

test('invalid instruction encodings stop with an explicit diagnostic',()=>{
  const cpu=execute(iType(3,1,1,0x401));
  assert.equal(cpu.halted,true);
  assert.match(cpu.out[0],/instrucción inválida/);
  assert.equal(cpu.regs[3],0);
});

test('raw program loading rejects data that does not fit memory',()=>{
  const cpu=new CPU();
  assert.throws(()=>cpu.load(new Uint8Array(2),cpu.mem.length-1),error=>error.name==='RangeError');
  assert.throws(()=>cpu.load([1,2,3]),error=>error.name==='TypeError');
});

test('the four built-in machine-code demos produce their documented results',()=>{
  const riscvtest=runDemo(0);
  assert.equal(riscvtest.halted,true);
  assert.equal(riscvtest.regs[10],0);
  assert.equal(riscvtest.r32(0x64),25);
  assert.equal(riscvtest.regs[11],1);
  assert.deepEqual([0,1,2,3].map(offset=>riscvtest.r8(0x64+offset)),[25,0,0,0]);

  const quicksort=runDemo(1,[6,4,3,2,1,8,9]);
  assert.equal(quicksort.halted,true);
  assert.deepEqual(Array.from({length:7},(_,i)=>quicksort.r32(0x1000+i*4)),[1,2,3,4,6,8,9]);
  for(const values of [[1,2,3,4,6,8,9],[9,8,6,4,3,2,1],[4,2,4,2,1,1,3]]){
    const sorted=runDemo(1,values);
    assert.deepEqual(Array.from({length:7},(_,i)=>sorted.r32(0x1000+i*4)),values.slice().sort((a,b)=>a-b));
  }

  const tree=runDemo(2,[6,4,4,1,2,2,1]);
  assert.equal(tree.halted,true);
  assert.equal(tree.regs[10],1);
  const asymmetricTree=runDemo(2,[6,4,5,1,2,2,1]);
  assert.equal(asymmetricTree.regs[10],0);

  const ecall=runDemo(3);
  assert.equal(ecall.halted,true);
  assert.deepEqual(Array.from(ecall.out),['25']);
});
