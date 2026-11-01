(()=>{"use strict";
const $=id=>document.getElementById(id),socket=io();
const CHARS=[
 ["modi","MODI","The Campaigner","#ef8b2c"],["rahul","RAHUL","The Challenger","#3284cb"],["yogi","YOGI","The Bulldozer","#f3a52b"],
 ["trump","TRUMP","The Deal Maker","#c33b42"],["nitin","NITIN GADKARI","Highway Boss","#397d59"],["didi","MAMTA","Didi","#39a7a1"],
 ["putin","PUTIN","The Strongman","#607b9c"],["xi","XI JINPING","The Chairman","#bd3434"],["kim","KIM JONG UN","Rocket Man","#252a32"],
 ["speed","ISHOWSPEED","The Streamer","#e9df44"],["mbapu","MBAPU","FINAL BOSS","#a64ae0"]
];
let screen="home",mode="1v1",char="modi",stage="sansad",room=null,myId=null,held={},tick=null,paused=false,localTimer=99,renderedIds=new Set();
const show=s=>{screen=s;["home","select","lobby","game"].forEach(x=>$(x).classList.toggle("hidden",x!==s));};
const note=t=>$("notice").textContent=t;
function makeRoster(){const root=$("roster");root.innerHTML="";CHARS.forEach(([id,n,t,c])=>{const el=document.createElement("button");el.className="fighterCard"+(id===char?" selected":"");el.innerHTML=`<div class="portrait" style="background:${c}">${n==="ISHOWSPEED"?"⚡":n==="MBAPU"?"👑":n.slice(0,1)}</div><b>${n}</b><small>${t}</small>${id==="mbapu"?'<div class="boss">★ BOSS CHARACTER ★</div>':""}`;el.addEventListener("click",()=>{char=id;makeRoster();if(room)socket.emit("player:select",{char,stage});});root.append(el);});}
function myName(){return $("name").value.trim().slice(0,18)||"Player";}
function create(m){mode=m;show("select");makeRoster();}
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>create(b.dataset.mode));
$("backHome").onclick=()=>show("home");
document.querySelectorAll("[data-stage]").forEach(b=>b.onclick=()=>{stage=b.dataset.stage;document.querySelectorAll("[data-stage]").forEach(x=>x.classList.toggle("active",x===b));});
$("fight").onclick=()=>{if(mode==="solo")createRoom("solo");else createRoom(mode);};
$("hostRoom").onclick=()=>createRoom(mode==="solo"?"1v1":mode);
function createRoom(m){note("Creating room…");socket.emit("room:create",{mode:m,name:myName(),char,stage,cpuChar:$("cpuChar").value},res=>{if(res.error)return note(res.error);enter(res.room);});}
function joinRoom(){const code=$("joinCode").value.trim().toUpperCase();if(!code)return note("Enter your friend's room code.");socket.emit("room:join",{code,name:myName(),char},res=>{if(res.error)return note(res.error);enter(res.room);});}
$("join").onclick=joinRoom;$("joinCode").onkeydown=e=>{if(e.key==="Enter")joinRoom();};
function enter(r){room=r;show("lobby");renderLobby(r);}
function renderLobby(r){$("roomCode").textContent=r.code;$("roomMode").textContent=r.mode==="2v2"?"2 vs 2 TEAM BATTLE":r.mode==="solo"?"SOLO PRACTICE":"1 vs 1 DUEL";const root=$("lobbyPlayers");root.innerHTML="";const cap=r.mode==="2v2"?4:2;r.players.forEach(p=>{const d=document.createElement("div");d.className="slot";d.innerHTML=`<b>${esc(p.name)}</b><small>${label(p.char)} · TEAM ${p.team+1}</small><small>${p.ready?"✓ READY":"Waiting"}</small>`;root.append(d)});for(let i=r.players.length;i<cap;i++){const d=document.createElement("div");d.className="slot";d.innerHTML="<b>Open slot</b><small>Waiting for friend…</small>";root.append(d)}const mine=r.players.find(p=>p.id===myId);$("ready").textContent=mine&&mine.ready?"CANCEL READY":"I'M READY";$("lobbyMsg").textContent=`${r.players.length}/${cap} players joined · ${r.players.filter(p=>p.ready||p.bot).length} ready`;}
function label(id){return (CHARS.find(c=>c[0]===id)||CHARS[0])[1]}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("ready").onclick=()=>socket.emit("player:ready");
$("copyCode").onclick=async()=>{const t=`Join my Sansad Showdown match! Room code: ${room.code}`;try{await navigator.clipboard.writeText(t);$("copyCode").textContent="COPIED!";}catch{$("copyCode").textContent=room.code;}};
$("leave").onclick=$("quit").onclick=()=>{stopInput();socket.emit("room:leave");room=null;show("home");};
$("pause").onclick=()=>{paused=!paused;$("gameMsg").textContent=paused?"PAUSED":"FIGHT!";};
$("rematch").onclick=()=>socket.emit("match:rematch");
socket.on("connect",()=>{myId=socket.id});
socket.on("state",r=>{room=r;if(r.status==="lobby"){stopInput();show("lobby");renderLobby(r)}else{show("game");renderGame(r);if(r.status==="playing")startInput();else stopInput();}});
socket.on("disconnect",()=>{note("Connection interrupted. Reconnecting…");stopInput()});
function startInput(){if(tick)return;tick=setInterval(()=>{if(room&&room.status==="playing"&&!paused)socket.emit("input",held)},33);}
function stopInput(){if(tick)clearInterval(tick);tick=null;held={};}
const keymap={a:"left",d:"right",w:"jump",s:"crouch",q:"block",j:"punch",k:"kick",i:"grab",l:"super"," ":"super"};
window.addEventListener("keydown",e=>{if(["INPUT"].includes(document.activeElement.tagName))return;const k=e.key.toLowerCase();if(k==="escape"){$("pause").click();return}if(keymap[k]){held[keymap[k]]=true;e.preventDefault()}});
window.addEventListener("keyup",e=>{const k=e.key.toLowerCase();if(keymap[k])held[keymap[k]]=false});
document.querySelectorAll("[data-action]").forEach(b=>{const k=b.dataset.action;const down=e=>{e.preventDefault();held[k]=true};const up=e=>{e.preventDefault();held[k]=false};b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);b.addEventListener("pointercancel",up)});
window.addEventListener("blur",stopInput);
function renderGame(r){$("arena").dataset.stage=r.stage;$("round").textContent=`ROUND ${r.round}`;$("rematch").classList.toggle("hidden",r.status!=="finished");$("gameMsg").textContent=r.status==="finished"?`${r.winner===null?"DRAW":`TEAM ${r.winner+1} WINS!`}`:r.status==="countdown"?`GET READY… ${Math.ceil(r.countdown)}`:paused?"PAUSED":"FIGHT!";
const health=$("health");health.innerHTML="";const teams=[0,1];teams.forEach(team=>{const ps=r.players.filter(p=>p.team===team);if(!ps.length)return;const hp=ps.reduce((a,p)=>a+p.hp,0)/ps.length;const box=document.createElement("div");box.className="healthBox";if(team===1)box.style.marginLeft="auto";box.innerHTML=`<div class="playerTag"><span>${ps.map(p=>esc(p.name)).join(" + ")}</span><span>${Math.round(hp)} HP</span></div><div class="healthLine ${team===1?"right":""}"><span style="width:${hp}%"></span></div><div class="sub">⚡ ${Math.round(ps.reduce((a,p)=>a+p.energy,0)/ps.length)}% SHAKTI</div>`;health.append(box)});
const root=$("fighters");const active=new Set();r.players.forEach(p=>{active.add(p.id);let el=document.getElementById("f_"+safe(p.id));if(!el){el=document.createElement("div");el.id="f_"+safe(p.id);el.className="sprite";el.innerHTML='<div class="hair"></div><div class="head"></div><div class="body"></div><div class="arm a"></div><div class="arm b"></div><div class="leg a"></div><div class="leg b"></div>';root.append(el)}const c=CHARS.find(x=>x[0]===p.char)||CHARS[0];el.style.left=(p.x/1000*100)+"%";el.style.setProperty("--suit",c[3]);el.style.setProperty("--skin",skin(p.char));el.style.setProperty("--hair",hair(p.char));el.className="sprite"+(p.facing===-1?" flip":"")+(p.hp<=0?" ko":"")+(p.action==="hit"?" hit":"")+(p.action==="punch"||p.action==="kick"||p.action==="grab"?" "+p.action:"")+(p.action==="super"?" super":"")+(p.block?" block":"");});[...root.children].forEach(el=>{if(!active.has(el.id.slice(2)))el.remove()});
}
function safe(s){return String(s).replace(/[^a-zA-Z0-9_-]/g,"_")}
function skin(id){return ({modi:"#bd805c",rahul:"#c98d6b",yogi:"#a96f4f",trump:"#efc19b",nitin:"#b77f5c",didi:"#b8795c",putin:"#e0b38e",xi:"#e3b48c",kim:"#e0b18a",speed:"#965e43",mbapu:"#d6a17e"})[id]||"#bd805c"}
function hair(id){return id==="modi"?"#ded3b8":id==="trump"?"#e4b94e":id==="yogi"?"#282321":id==="mbapu"?"#f0f0e8":"#24242b"}
})();