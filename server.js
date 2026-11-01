const express=require("express"),http=require("http"),path=require("path");
const app=express(),server=http.createServer(app),{Server}=require("socket.io");
const io=new Server(server,{cors:{origin:"*"},pingInterval:10000,pingTimeout:20000});
app.use(express.static(path.join(__dirname,"public")));app.get("/health",(_,res)=>res.json({ok:true}));
const PORT=process.env.PORT||3000;
const roster=["Yogi","Modi","Putin","Trump","Nitin Gadkari","Mamta Banerjee","Rahul","Mbapu","IShowSpeed","Xi Jinping","Kim Jong Un"];
const dialogue={
"Yogi":{intro:["Gorakhpur se seedha arena tak!","Aaj faisla dangal mein hoga."],taunt:["Bulldozer nahi, footwork dekho!","Abhi toh trailer tha."],special:["Yeh hai asli power!"],win:["Vijay ka shankhnaad!"],lose:["Agli baar poori taiyari se."]},
"Modi":{intro:["Mitron, taiyaar ho?","Aaj ka मुकाबला ऐतिहासिक hoga!"],taunt:["Ek aur kadam aage!","Yeh game ab badlega."],special:["Masterstroke!"],win:["Yeh jeet janata ko samarpit!"],lose:["Main phir lautunga."]},
"Putin":{intro:["Let's see your strength.","The arena is mine."],taunt:["Is that all?","Stay focused."],special:["Full force!"],win:["Victory. As expected."],lose:["Interesting. Rematch."]},
"Trump":{intro:["Nobody fights like me. Nobody!","This will be a tremendous fight."],taunt:["Very weak!","You're fired!"],special:["The biggest super move!"],win:["A tremendous victory!"],lose:["Fake result. I want a rematch."]},
"Nitin Gadkari":{intro:["Ab speed aur strategy dono!","Road se ring tak, ready?"],taunt:["Overtake kar ke dikhao!","Abhi acceleration baaki hai."],special:["Expressway attack!"],win:["Superfast victory!"],lose:["Agli baar traffic clear hoga."]},
"Mamta Banerjee":{intro:["Khela hobe!","Ami ready. Tumi ready?"],taunt:["Eto shohoj noy!","Abar dekha hobe!"],special:["Khela shuru!"],win:["Joy Bangla!"],lose:["Abar khela hobe."]},
"Rahul":{intro:["Let's have a fair fight.","I'm ready to learn and fight."],taunt:["Come on, let's go!","That's not the whole story."],special:["Surprise move!"],win:["We did it!"],lose:["I will come back stronger."]},
"Mbapu":{intro:["The boss has arrived.","You need more than courage."],taunt:["You cannot stop me.","Feel the power."],special:["BOSS MODE!"],win:["The arena belongs to me!"],lose:["Impossible... for now."]},
"IShowSpeed":{intro:["SIIIIUUU! LET'S GOOOO!","CHAT, WATCH THIS!"],taunt:["YOU'RE TOO SLOW!","RONALDOOO!"],special:["MAXIMUM SPEED!"],win:["SIUUUUUU!"],lose:["BROOO! RUN IT BACK!"]},
"Xi Jinping":{intro:["A measured move wins the match.","Let the contest begin."],taunt:["Patience is power.","Think before you strike."],special:["Strategic strike!"],win:["A calculated victory."],lose:["The strategy will be revised."]},
"Kim Jong Un":{intro:["The supreme challenger enters.","Prepare for the big match."],taunt:["You underestimate me.","Observe this move."],special:["Rocket power!"],win:["A glorious victory!"],lose:["We demand a rematch."]}
};
const cap=m=>m==="2v2"?4:2,clean=s=>String(s||"").replace(/[^a-z0-9]/gi,"").slice(0,8).toUpperCase();
function makePlayer(id,name,char,slot,mode){return{id,name,character:roster.includes(char)?char:"Yogi",team:mode==="2v2"?slot%2:slot,ready:false,x:slot%2===0?260:700,y:0,vx:0,vy:0,hp:100,energy:0,facing:slot%2===0?1:-1,grounded:true,action:"idle",actionUntil:0,cooldown:0,invuln:0};}
function view(r){return{code:r.code,mode:r.mode,stage:r.stage,started:r.started,state:r.state,round:r.round,scores:r.scores,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,character:p.character,team:p.team,ready:p.ready}))};}
function emit(r){io.to(r.code).emit("room:update",view(r));}
function say(r,type){const ps=[...r.players.values()];const lines=ps.map(p=>{const pool=dialogue[p.character]?.[type]||["Let's fight!"];return{id:p.id,character:p.character,text:pool[Math.floor(Math.random()*pool.length)]};});io.to(r.code).emit("dialogue",{type,lines});}
function startRound(r){if(r.started||r.matchOver||r.players.size<cap(r.mode)||![...r.players.values()].every(p=>p.ready))return;
r.round++;r.started=true;r.state="fight";for(const p of r.players.values()){p.hp=100;p.energy=0;p.x=p.team===0?250:710;p.y=0;p.vy=0;p.grounded=true;p.action="idle";p.actionUntil=0;p.cooldown=0;p.invuln=0;p.ready=false;}
io.to(r.code).emit("fight:start",view(r));say(r,"intro");}
function endRound(r){const alive=[...r.players.values()].filter(p=>p.hp>0),teams=new Set(alive.map(p=>p.team));if(teams.size>1)return;
const winner=teams.size?[...teams][0]:null;if(winner!==null)r.scores[winner]=(r.scores[winner]||0)+1;
r.started=false;const matchOver=winner!==null&&r.scores[winner]>=2||r.round>=3;
r.matchOver=matchOver;r.state=matchOver?"result":"intermission";
io.to(r.code).emit("round:over",{round:r.round,winner,scores:r.scores,matchOver,players:[...r.players.values()].map(p=>({id:p.id,hp:p.hp,team:p.team,character:p.character}))});
if(matchOver)io.to(r.code).emit("fight:over",{winner,scores:r.scores,rounds:r.round});else say(r,"taunt");
emit(r);
}
io.on("connection",s=>{
s.on("room:create",({name,character,mode})=>{mode=mode==="2v2"?"2v2":"1v1";let code;do{code=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(code));const r={code,mode,stage:"Jantar Mantar",players:new Map(),started:false,state:"lobby",round:0,scores:{0:0,1:0},matchOver:false};rooms.set(code,r);r.players.set(s.id,makePlayer(s.id,name,character,0,mode));s.join(code);s.data.room=code;s.emit("room:joined",view(r));emit(r);});
s.on("room:join",({code,name,character})=>{const r=rooms.get(clean(code));if(!r)return s.emit("error:game","Room not found. Check the code.");if(r.started||r.matchOver||r.players.size>=cap(r.mode))return s.emit("error:game","This room is full or match has ended.");r.players.set(s.id,makePlayer(s.id,name,character,r.players.size,r.mode));s.join(r.code);s.data.room=r.code;s.emit("room:joined",view(r));emit(r);});
s.on("player:select",c=>{const r=rooms.get(s.data.room),p=r?.players.get(s.id);if(p&&!r.started&&roster.includes(c)){p.character=c;emit(r);}});
s.on("stage:select",st=>{const r=rooms.get(s.data.room);if(r&&!r.started&&["Jantar Mantar","Sansad Square","Desi Street"].includes(st)){r.stage=st;emit(r);}});
s.on("player:ready",()=>{const r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.matchOver)return;p.ready=!p.ready;emit(r);startRound(r);});
s.on("input",i=>{const r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!r||!p||!r.started||p.hp<=0)return;const now=Date.now();p.vx=0;if(i.left){p.vx=-250;p.facing=-1;}if(i.right){p.vx=250;p.facing=1;}if(i.jump&&p.grounded){p.vy=-590;p.grounded=false;}if(i.block){p.action="block";p.actionUntil=now+100;}else if(i.attack&&now>p.cooldown){const t=i.attack;p.action=t;p.actionUntil=now+300;p.cooldown=now+(t==="special"?950:420);if(t==="special"&&p.energy<100){p.action="heavy";p.cooldown=now+500;}else{if(t==="special")p.energy=0;else p.energy=Math.min(100,p.energy+12);const foe=[...r.players.values()].find(q=>q.team!==p.team&&q.hp>0&&Math.abs(q.x-p.x)<145&&Math.abs(q.y-p.y)<90);if(foe&&now>foe.invuln){const blocked=foe.action==="block",d=blocked?(t==="special"?7:2):(t==="special"?32:t==="heavy"?17:10);foe.hp=Math.max(0,foe.hp-d);foe.invuln=now+260;foe.action=blocked?"block":"hit";foe.actionUntil=now+280;foe.x+=p.facing*(blocked?4:22);if(t==="special")say(r,"special");}}}else if(now>p.actionUntil&&p.action!=="idle")p.action="idle";p.x=Math.max(65,Math.min(895,p.x+p.vx*.033));});
s.on("disconnect",()=>{const r=rooms.get(s.data.room);if(!r)return;r.players.delete(s.id);if(!r.players.size)rooms.delete(r.code);else{r.started=false;r.state="lobby";emit(r);}});
});
const rooms=new Map();
setInterval(()=>{const now=Date.now();for(const r of rooms.values()){if(!r.started)continue;for(const p of r.players.values()){if(!p.grounded){p.vy+=1450*.033;p.y+=p.vy*.033;if(p.y>=0){p.y=0;p.vy=0;p.grounded=true;}}if(now>p.actionUntil&&p.action!=="idle"&&p.action!=="hit")p.action="idle";}io.to(r.code).emit("state",[...r.players.values()].map(p=>({id:p.id,x:p.x,y:p.y,hp:p.hp,energy:p.energy,facing:p.facing,action:p.action,team:p.team})));endRound(r);}},33);
server.listen(PORT,()=>console.log("Sansad Showdown V2 on "+PORT));
