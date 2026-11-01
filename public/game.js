const socket=io();
const roster=[["Yogi","🧘"],["Modi","🕴️"],["Putin","🥋"],["Trump","🦅"],["Nitin Gadkari","🚗"],["Mamta Banerjee","🌺"],["Rahul","🎒"],["Mbapu","👹"],["IShowSpeed","⚡"],["Xi Jinping","🐉"],["Kim Jong Un","🚀"]];
let selected="Yogi",mode="1v1",stage="Jantar Mantar",room=null,me=null,game=null,keys={},lastInput=0,localCPU=false;
const $=id=>document.getElementById(id);
function toast(s){$("toast").textContent=s;$("toast").style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>$("toast").style.display="none",2600)}
function show(id){["menu","lobby","game"].forEach(x=>$(x).classList.toggle("hidden",x!==id))}
function portrait(n){const palettes={"Yogi":["#e9b36e","#25202a","#d5a16b"],"Modi":["#e5b68f","#d7d5cf","#f0c89f"],"Putin":["#e9c4a2","#b9c5d2","#e9c4a2"],"Trump":["#f0c49a","#e5a33a","#efc49a"],"Nitin Gadkari":["#d9a67e","#25252b","#d9a67e"],"Mamta Banerjee":["#e7b995","#171d2a","#e7b995"],"Rahul":["#d6a27d","#292a2e","#d6a27d"],"Mbapu":["#a7c1d5","#282f4d","#a7c1d5"],"IShowSpeed":["#8e5c42","#15151b","#8e5c42"],"Xi Jinping":["#e8bd9a","#17191f","#e8bd9a"],"Kim Jong Un":["#e8bc98","#17191f","#e8bc98"]};const [skin,hair]=palettes[n]||["#d9aa87","#222","#d9aa87"];const hairShape=n==="Trump"?`<path d="M13 30 Q8 3 34 9 Q54 7 48 25 Q39 13 27 20Z" fill="${hair}"/>`:n==="Yogi"?`<path d="M13 30 Q9 10 29 9 Q48 7 49 28 L43 23 Q31 28 13 30" fill="${hair}"/>`:n==="Modi"?`<path d="M12 30 Q12 8 31 8 Q50 10 49 30 L43 22 Q30 18 18 26Z" fill="${hair}"/>`:`<path d="M12 31 Q10 8 30 8 Q50 8 50 31 L44 23 Q30 18 18 26Z" fill="${hair}"/>`;const beard=["Modi","Yogi","Putin","Nitin Gadkari"].includes(n)?`<path d="M18 39 Q30 57 43 39 L40 49 Q30 56 21 48Z" fill="${hair}" opacity=".9"/>`:"";return `<svg viewBox="0 0 62 62" aria-label="${n} cartoon portrait"><path d="M4 62 Q7 42 18 44 L44 44 Q56 43 59 62" fill="#334d68"/> <ellipse cx="31" cy="31" rx="19" ry="23" fill="${skin}"/>${hairShape}<ellipse cx="24" cy="32" rx="2.2" ry="3" fill="#17202b"/><ellipse cx="38" cy="32" rx="2.2" ry="3" fill="#17202b"/><path d="M26 41 Q31 45 37 41" stroke="#713e39" stroke-width="2" fill="none" stroke-linecap="round"/>${beard}<path d="M13 27 Q20 19 27 22 M35 22 Q43 19 49 27" stroke="${hair}" stroke-width="3" fill="none"/></svg>`}
$("roster").innerHTML=roster.map(([n])=>`<button class="fighter ${n===selected?"selected":""}" data-char="${n}"><div class="avatar">${portrait(n)}</div><small>${n}</small></button>`).join("");
$("roster").addEventListener("click",e=>{const b=e.target.closest("[data-char]");if(!b)return;selected=b.dataset.char;document.querySelectorAll(".fighter").forEach(x=>x.classList.toggle("selected",x.dataset.char===selected));if(room)socket.emit("player:select",selected)});
document.querySelectorAll(".mode").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll(".mode").forEach(x=>x.classList.toggle("active",x===b))});
document.querySelectorAll(".stage").forEach(b=>b.onclick=()=>{stage=b.dataset.stage;document.querySelectorAll(".stage").forEach(x=>x.classList.toggle("active",x===b));if(room)socket.emit("stage:select",stage)});
const name=()=>($("playerName").value.trim()||"Challenger").slice(0,14);
$("createBtn").onclick=()=>{localCPU=false;socket.emit("room:create",{name:name(),character:selected,mode:mode==="cpu"?"1v1":mode})};
$("cpuBtn").onclick=()=>{localCPU=true;socket.emit("room:create",{name:name(),character:selected,mode:"1v1"})};
$("joinBtn").onclick=()=>{localCPU=false;socket.emit("room:join",{code:$("roomCode").value,name:name(),character:selected})};
$("readyBtn").onclick=()=>socket.emit("player:ready");
$("backBtn").onclick=()=>location.reload();
$("copyBtn").onclick=async()=>{const link=location.origin+"?room="+room.code;try{await navigator.clipboard.writeText(link);toast("Invite link copied! Room code: "+room.code)}catch{toast("Share room code: "+room.code)}};
$("pauseBtn").onclick=()=>{show("lobby");toast("Fight paused locally. Return to the lobby to rematch.")};
socket.on("room:joined",r=>{room=r;me=socket.id;renderLobby(r);show("lobby");if(location.search.includes("room=")){}});
socket.on("room:update",r=>{room=r;renderLobby(r)});
socket.on("error:game",toast);
socket.on("fight:start",r=>{room=r;show("game");$("stageLabel").textContent=r.stage.toUpperCase();startGame();$("gameStatus").textContent="FIGHT!"});
socket.on("state",players=>{if(game)game.updatePlayers(players)});
function banner(text){const el=$("roundBanner");el.textContent=text;el.classList.remove("hidden");clearTimeout(banner.t);banner.t=setTimeout(()=>el.classList.add("hidden"),2100)}
function dialogue(d){const line=d.lines?.[0];if(!line)return;$("dialogueName").textContent=line.character.toUpperCase();$("dialogueText").textContent="“"+line.text+"”";$("dialogueBox").classList.remove("hidden");clearTimeout(dialogue.t);dialogue.t=setTimeout(()=>$("dialogueBox").classList.add("hidden"),3000)}
socket.on("dialogue",dialogue);
socket.on("round:over",r=>{if(game)game.end();$("gameStatus").textContent=r.winner===null?"ROUND DRAW":`ROUND ${r.round} — TEAM ${r.winner+1} WINS`;banner(r.matchOver?"MATCH POINT / RESULT":`ROUND ${r.round} COMPLETE  •  ${r.scores[0]} - ${r.scores[1]}`);if(!r.matchOver){setTimeout(()=>{if(room){show("lobby");renderLobby(room);$("readyBtn").textContent="READY FOR ROUND "+(r.round+1)}},2300)}});
socket.on("fight:over",result=>{if(game)game.end();const label=result.winner===null?"MATCH DRAW":`TEAM ${result.winner+1} WINS THE MATCH`;$("gameStatus").textContent=label;banner(label);toast(label+" — best of three complete");setTimeout(()=>{if(room){show("lobby");renderLobby(room);$("readyBtn").textContent="MATCH COMPLETE — CREATE NEW ROOM"}},3000)});
function renderLobby(r){$("roomCodeLabel").textContent=r.code;$("players").innerHTML=r.players.map((p,i)=>`<div class="player-card"><div class="big">${roster.find(x=>x[0]===p.character)?.[1]||"🥊"}</div><b>${p.name}</b><small>${p.character} · TEAM ${p.team+1}<br>${p.ready?"✓ READY":"WAITING"}</small></div>`).join("")+Array.from({length:Math.max(0,(r.mode==="2v2"?4:2)-r.players.length)},()=>`<div class="player-card"><div class="big">＋</div><b>OPEN SLOT</b><small>SHARE ROOM CODE</small></div>`).join("");$("readyBtn").textContent=r.players.find(p=>p.id===socket.id)?.ready?"CANCEL READY":(r.round?`READY FOR ROUND ${r.round+1}`:"I'M READY")}
function startGame(){
 if(game)game.destroy();
 const W=960,H=420;
 class Arena extends Phaser.Scene{
  constructor(){super("arena");this.fighters={};this.remote=[];this.running=true}
  create(){
   const g=this.add.graphics();g.fillGradientStyle(0x162d48,0x162d48,0x293e53,0x101b2b,1);g.fillRect(0,0,W,H);
   for(let i=0;i<12;i++){g.fillStyle(0x91b4d0,0.08);g.fillRect(i*88+15,90,35,180)}
   g.fillStyle(0x111c2b,1);g.fillRect(0,330,W,90);g.lineStyle(3,0x7c9ab0,.4);g.lineBetween(0,330,W,330);
   g.fillStyle(0xffc45b,.12);g.fillCircle(480,100,85);
   this.add.text(480,22,room?.stage?.toUpperCase()||stage.toUpperCase(),{fontFamily:"Oxanium",fontSize:"13px",color:"#d8e8f7",letterSpacing:4}).setOrigin(.5);
   this.players={};this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys("A,D,W,J,K,L,Q,SPACE");
   this.lastSent=0;
   this.events.on("update",this.tick,this);
  }
  drawFighter(p){
   const c=this.add.container(p.x,330+p.y);
   const color=p.team===0?0x40d9dc:0xff6479;
   const glow=this.add.circle(0,-45,38,color,.12);const shadow=this.add.ellipse(0,0,68,13,0x000000,.35);
   const body=this.add.ellipse(0,-55,37,57,color,1);body.setStrokeStyle(2,0xeaf4ff,.7);
   const cfg={"Yogi":[0xe7b887,0x25202a],"Modi":[0xe7b887,0xd7d5cf],"Putin":[0xe9c4a2,0xb9c5d2],"Trump":[0xf0c49a,0xe5a33a],"Nitin Gadkari":[0xd9a67e,0x25252b],"Mamta Banerjee":[0xe7b995,0x171d2a],"Rahul":[0xd6a27d,0x292a2e],"Mbapu":[0xa7c1d5,0x282f4d],"IShowSpeed":[0x8e5c42,0x15151b],"Xi Jinping":[0xe8bd9a,0x17191f],"Kim Jong Un":[0xe8bc98,0x17191f]}[p.character]||[0xf0c59d,0x1a2230];
   const head=this.add.ellipse(0,-98,34,43,cfg[0],1);head.setStrokeStyle(2,0x17263b);
   const hair=this.add.ellipse(0,-111,35,18,cfg[1],1);
   const eye1=this.add.circle(-7,-100,2,0x101722),eye2=this.add.circle(7,-100,2,0x101722);
   const nose=this.add.line(0,-98,0,0,0,10,0x9b6658);
   const mouth=this.add.arc(0,-86,7,.15,Math.PI-.15,false,0x743c3b,1);
   const beard=["Yogi","Modi","Putin","Nitin Gadkari"].includes(p.character)?this.add.ellipse(0,-80,25,17,cfg[1],.9):this.add.circle(0,-80,1,cfg[0],0);
   const arm1=this.add.rectangle(-25,-58,13,38,color);arm1.setAngle(-25);
   const arm2=this.add.rectangle(25,-58,13,38,color);arm2.setAngle(25);
   const leg1=this.add.rectangle(-11,-20,14,39,0x202e46);const leg2=this.add.rectangle(11,-20,14,39,0x202e46);
   const fist1=this.add.circle(-31,-43,8,0xf0c59d),fist2=this.add.circle(31,-43,8,0xf0c59d);
   const label=this.add.text(0,-133,p.character,{fontFamily:"Oxanium",fontSize:"12px",color:"#ffffff",stroke:"#07101d",strokeThickness:4}).setOrigin(.5);
   c.add([glow,shadow,body,head,hair,eye1,eye2,nose,mouth,beard,arm1,arm2,leg1,leg2,fist1,fist2,label]);
   c.parts={body,arm1,arm2,leg1,leg2,fist1,fist2,glow};return c;
  }
  updatePlayers(ps){this.remote=ps;ps.forEach(p=>{let f=this.players[p.id];if(!f){f=this.drawFighter(p);this.players[p.id]=f}f.x=p.x;f.y=330+p.y;f.setScale(p.facing===-1?-1:1,1);const a=p.action,parts=f.parts;parts.arm1.rotation=a==="punch"?-1.8:a==="heavy"?-2.3:a==="block"?-.9:-.35;parts.arm2.rotation=a==="kick"?1.6:a==="block"?-.9:.35;parts.body.setScale(a==="hit"?.85:1,a==="hit"?.9:1);parts.glow.setAlpha(a==="special"?.8:.12);parts.glow.setScale(a==="special"?1.9:1);});}
  tick(time){
   if(!this.running)return;
   const left=this.keys.A.isDown||this.cursors.left.isDown||keys.left,right=this.keys.D.isDown||this.cursors.right.isDown||keys.right;
   const inp={left,right,jump:this.keys.W.isDown||this.cursors.up.isDown||keys.jump,block:this.keys.Q.isDown||keys.block,attack:null};
   if(Phaser.Input.Keyboard.JustDown(this.keys.J)||keys.punch){inp.attack="punch";keys.punch=false}
   else if(Phaser.Input.Keyboard.JustDown(this.keys.K)||keys.kick){inp.attack="kick";keys.kick=false}
   else if(Phaser.Input.Keyboard.JustDown(this.keys.L)||Phaser.Input.Keyboard.JustDown(this.keys.SPACE)||keys.special){inp.attack="special";keys.special=false}
   else if(keys.heavy){inp.attack="heavy";keys.heavy=false}
   if(time-this.lastSent>32){socket.emit("input",inp);this.lastSent=time}
   this.remote.forEach(p=>{const f=this.players[p.id];if(f){f.x=p.x;f.y=330+p.y}});
  }
  end(){this.running=false}
 }
 const config={type:Phaser.CANVAS,parent:"phaser",width:W,height:H,transparent:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:Arena};
 game=new Phaser.Game(config);game.updatePlayers=ps=>{const s=game.scene.getScene("arena");if(s&&s.updatePlayers)s.updatePlayers(ps)};game.end=()=>{const s=game.scene.getScene("arena");if(s&&s.end)s.end()};game.destroy=()=>{game.destroy(true);};
}
document.querySelectorAll("[data-key]").forEach(b=>{const k=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();keys[k]=true});["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false))});
const params=new URLSearchParams(location.search);if(params.get("room"))$("roomCode").value=params.get("room");
