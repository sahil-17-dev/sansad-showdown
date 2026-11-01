const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const crypto=require("crypto");

const app=express(), server=http.createServer(app);
const io=new Server(server,{cors:{origin:true},pingInterval:20000,pingTimeout:45000});
const PORT=process.env.PORT||3000;
app.use(express.static("public"));
app.get("/health",(_,res)=>res.json({ok:true,rooms:rooms.size,uptime:Math.round(process.uptime())}));

const W=1000,FLOOR=520,GRAVITY=0.72,MAX_HP=100;
const CHARS={
  modi:{name:"Modi",title:"The Campaigner",color:"#ef8b2c",skin:"#bd805c",speed:4.5,power:1,guard:1.1,super:"Jan Sabha"},
  rahul:{name:"Rahul",title:"The Challenger",color:"#3284cb",skin:"#c98d6b",speed:5.2,power:.95,guard:1,super:"Yuva Charge"},
  didi:{name:"Mamta",title:"Didi",color:"#39a7a1",skin:"#b8795c",speed:5.1,power:.9,guard:1.15,super:"Dharna Dash"},
  trump:{name:"Trump",title:"The Deal Maker",color:"#c33b42",skin:"#efc19b",speed:4.1,power:1.15,guard:.9,super:"Big Deal"},
  yogi:{name:"Yogi",title:"The Bulldozer",color:"#f3a52b",skin:"#a96f4f",speed:4.2,power:1.2,guard:1.1,super:"Bulldozer"},
  nitin:{name:"Nitin Gadkari",title:"The Highway Boss",color:"#397d59",skin:"#b77f5c",speed:3.9,power:1.25,guard:1.1,super:"Expressway"},
  putin:{name:"Putin",title:"The Strongman",color:"#607b9c",skin:"#e0b38e",speed:4.4,power:1.15,guard:1.2,super:"Kremlin Grip"},
  xi:{name:"Xi Jinping",title:"The Chairman",color:"#bd3434",skin:"#e3b48c",speed:3.8,power:1.15,guard:1.3,super:"Red Wave"},
  kim:{name:"Kim Jong Un",title:"The Rocket Man",color:"#252a32",skin:"#e0b18a",speed:4,power:1.1,guard:1,super:"Rocket Launch"},
  speed:{name:"IShowSpeed",title:"The Streamer",color:"#e9df44",skin:"#965e43",speed:6.2,power:.85,guard:.8,super:"Siu Sprint"},
  mbapu:{name:"Mbapu",title:"THE FINAL BOSS",color:"#a64ae0",skin:"#d6a17e",speed:4.8,power:1.55,guard:1.4,super:"Bapu's Wrath",boss:true}
};
const STAGES=["sansad","jantar","sadak"];
const rooms=new Map(),socketRoom=new Map();
const randCode=()=>crypto.randomBytes(3).toString("hex").toUpperCase();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function makeFighter(id,slot,team,char,bot=false){
 const c=CHARS[char]||CHARS.modi;
 return {id,slot,team,char:CHARS[char]?char:"modi",bot,name:bot?"CPU":`Player ${slot+1}`,
 x:team===0?250+slot*40:750-slot*40,y:FLOOR,vy:0,hp:MAX_HP,energy:0,facing:team===0?1:-1,
 action:"idle",actionTime:0,cooldown:0,invuln:0,block:false,crouch:false,stun:0,grounded:true,
 wins:0,score:0,guarding:false};
}
function capacity(mode){return mode==="2v2"?4:2}
function pub(room){
 return {code:room.code,mode:room.mode,status:room.status,stage:room.stage,round:room.round,winner:room.winner,
  players:room.players.map(p=>({id:p.id,slot:p.slot,team:p.team,char:p.char,name:p.name,bot:p.bot,hp:p.hp,energy:p.energy,x:p.x,y:p.y,facing:p.facing,action:p.action,block:p.block,crouch:p.crouch,grounded:p.grounded,wins:p.wins})),
  countdown:room.countdown,host:room.host};
}
function send(room){io.to(room.code).emit("state",pub(room))}
function newRoom(code,mode,stage){return {code,mode,stage:STAGES.includes(stage)?stage:"sansad",status:"lobby",players:[],inputs:new Map(),round:1,winner:null,countdown:0,host:null,lastBroadcast:0};}
function getRoom(s){return rooms.get(socketRoom.get(s.id))}
function startRound(r){r.status="countdown";r.countdown=3;r.winner=null;r.players.forEach(p=>{p.hp=MAX_HP;p.energy=0;p.x=p.team===0?230+p.slot*38:770-p.slot*38;p.y=FLOOR;p.vy=0;p.action="idle";p.actionTime=0;p.cooldown=0;p.invuln=0;p.stun=0;p.block=false;p.crouch=false;});send(r)}
function readyToStart(r){return r.players.length===capacity(r.mode)&&r.players.every(p=>p.ready||p.bot)}
function finish(r){const alive=new Set(r.players.filter(p=>p.hp>0).map(p=>p.team));if(alive.size<=1){r.status="finished";r.winner=alive.size?[...alive][0]:null;r.players.forEach(p=>{if(p.team===r.winner)p.wins++});send(r)}}
function attack(p,kind,r,now){
 if(p.cooldown>0||p.stun>0||p.hp<=0)return;
 const c=CHARS[p.char];let cost=0,range=kind==="super"?220:kind==="grab"?82:kind==="kick"?115:95;
 let damage=kind==="super"?31:kind==="grab"?16:kind==="kick"?13:9;
 if(kind==="super"){if(p.energy<100)return;cost=100;damage*=c.power}
 p.energy=Math.max(0,p.energy-cost);p.cooldown=kind==="super"?950:kind==="grab"?700:kind==="kick"?520:420;
 p.action=kind;p.actionTime=kind==="super"?550:260;
 const foes=r.players.filter(t=>t.team!==p.team&&t.hp>0&&!t.botSpectator);
 let target=foes.filter(t=>Math.abs(t.x-p.x)<range&&Math.abs(t.y-p.y)<95).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
 if(target){
   let amount=damage*c.power;
   if(target.block&&kind!=="grab"&&kind!=="super")amount*=.18;
   if(target.block&&kind==="super")amount*=.55;
   if(target.invuln>0)amount=0;
   target.hp=clamp(target.hp-amount,0,MAX_HP);
   target.energy=clamp(target.energy+Math.ceil(amount*.8),0,100);
   target.stun=kind==="super"?30:kind==="grab"?20:10;
   target.invuln=kind==="super"?22:10;
   target.action="hit";target.actionTime=230;
   target.x=clamp(target.x+p.facing*(kind==="super"?42:kind==="grab"?24:14),45,W-45);
   p.energy=clamp(p.energy+(kind==="super"?0:kind==="grab"?12:9),0,100);
 }else p.energy=clamp(p.energy+5,0,100);
 finish(r);
}
function updateRoom(r,dt){
 if(r.status==="countdown"){r.countdown-=dt;if(r.countdown<=0)r.status="playing";return}
 if(r.status!=="playing")return;
 const now=Date.now();
 for(const p of r.players){
  if(p.hp<=0)continue;
  p.cooldown=Math.max(0,p.cooldown-dt*1000);p.actionTime=Math.max(0,p.actionTime-dt*1000);p.stun=Math.max(0,p.stun-dt*60);p.invuln=Math.max(0,p.invuln-dt*60);
  if(p.actionTime===0&&["hit","punch","kick","grab","super"].includes(p.action))p.action="idle";
  const input=r.inputs.get(p.id)||{};
  let inp=input;
  if(p.bot){
   const foe=r.players.filter(t=>t.team!==p.team&&t.hp>0).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
   inp={left:foe&&foe.x<p.x-65,right:foe&&foe.x>p.x+65,block:foe&&Math.abs(foe.x-p.x)<110&&Math.random()<.035,
    punch:foe&&Math.abs(foe.x-p.x)<100&&Math.random()<.12,kick:foe&&Math.abs(foe.x-p.x)<130&&Math.random()<.07,
    jump:Math.random()<.008,super:p.energy>=100&&Math.random()<.025};
  }
  p.block=!!inp.block;p.crouch=!!inp.crouch;
  if(p.stun<=0){
   const dir=(inp.right?1:0)-(inp.left?1:0);
   if(!p.block){p.x=clamp(p.x+dir*CHARS[p.char].speed*(p.crouch?.45:1),45,W-45)}
   if(inp.jump&&p.grounded){p.vy=-13;p.grounded=false}
   if(inp.punch)attack(p,"punch",r,now);
   else if(inp.kick)attack(p,"kick",r,now);
   else if(inp.grab)attack(p,"grab",r,now);
   else if(inp.super)attack(p,"super",r,now);
  }
  p.vy+=GRAVITY;p.y+=p.vy;
  if(p.y>=FLOOR){p.y=FLOOR;p.vy=0;p.grounded=true}
  const nearest=r.players.filter(t=>t.team!==p.team&&t.hp>0).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(nearest)p.facing=nearest.x>=p.x?1:-1;
  if(p.hp<=0)p.action="ko";
 }
 finish(r);
}
io.on("connection",s=>{
 s.on("room:create",(opts={},ack=()=>{})=>{
  const mode=["1v1","2v2","solo"].includes(opts.mode)?opts.mode:"1v1";
  let code=randCode();while(rooms.has(code))code=randCode();
  const r=newRoom(code,mode,opts.stage);r.host=s.id;
  const p=makeFighter(s.id,0,0,opts.char);p.name=String(opts.name||"Player 1").slice(0,18);p.ready=false;r.players.push(p);
  if(mode==="solo"){const bot=makeFighter("BOT_"+code,1,1,opts.cpuChar||"trump",true);bot.name="CPU";bot.ready=true;r.players.push(bot)}
  rooms.set(code,r);socketRoom.set(s.id,code);s.join(code);ack({room:pub(r)});send(r);
 });
 s.on("room:join",(o={},ack=()=>{})=>{
  const r=rooms.get(String(o.code||"").toUpperCase());
  if(!r)return ack({error:"Room not found."});
  if(r.mode==="solo"||r.status!=="lobby")return ack({error:"This room is not accepting players."});
  if(r.players.length>=capacity(r.mode))return ack({error:"Room is full."});
  if(r.players.some(p=>p.id===s.id))return ack({room:pub(r)});
  const slot=r.players.length,team=r.mode==="2v2"?slot%2:1;
  const p=makeFighter(s.id,slot,team,o.char);p.name=String(o.name||`Player ${slot+1}`).slice(0,18);
  r.players.push(p);socketRoom.set(s.id,r.code);s.join(r.code);ack({room:pub(r)});send(r);
 });
 s.on("player:select",({char,stage}={})=>{
  const r=getRoom(s);if(!r||r.status!=="lobby")return;
  const p=r.players.find(x=>x.id===s.id);if(!p)return;
  if(CHARS[char])p.char=char;if(STAGES.includes(stage))r.stage=stage;send(r);
 });
 s.on("player:ready",()=>{
  const r=getRoom(s);if(!r||r.status!=="lobby")return;
  const p=r.players.find(x=>x.id===s.id);if(!p)return;p.ready=!p.ready;
  if(readyToStart(r))startRound(r);else send(r);
 });
 s.on("input",input=>{
  const r=getRoom(s);if(!r||r.status!=="playing")return;
  const p=r.players.find(x=>x.id===s.id);if(!p)return;
  const safe={};for(const k of ["left","right","jump","crouch","block","punch","kick","grab","super"])safe[k]=!!(input&&input[k]);
  r.inputs.set(s.id,safe);
 });
 s.on("match:rematch",()=>{
  const r=getRoom(s);if(!r||r.status!=="finished")return;
  r.round++;r.players.forEach(p=>p.ready=!!p.bot);
  if(readyToStart(r))startRound(r);else{r.status="lobby";send(r)}
 });
 s.on("room:leave",()=>leave(s));
 s.on("disconnect",()=>leave(s));
});
function leave(s){
 const code=socketRoom.get(s.id);if(!code)return;socketRoom.delete(s.id);
 const r=rooms.get(code);if(!r)return;
 r.players=r.players.filter(p=>p.id!==s.id);r.inputs.delete(s.id);
 if(!r.players.length){rooms.delete(code);return}
 r.players.forEach((p,i)=>{p.slot=i;p.ready=!!p.bot;p.team=r.mode==="2v2"?i%2:i});
 r.status="lobby";r.winner=null;if(r.host===s.id)r.host=r.players.find(p=>!p.bot)?.id||null;
 send(r);
}
setInterval(()=>{
 const dt=1/30;
 for(const r of rooms.values()){
  updateRoom(r,dt);
  if(Date.now()-r.lastBroadcast>50){r.lastBroadcast=Date.now();send(r)}
 }
},1000/30);
server.listen(PORT,()=>console.log(`Sansad Showdown listening on ${PORT}`));
