import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "./firebase";
import { ref, get, set, onValue } from "firebase/database";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const ADMIN_PIN = "2026";
// Deadline: 11 Jun 2026 17:00 hs Argentina (UTC-3) = 20:00 UTC
const DEADLINE = new Date("2026-06-11T20:00:00Z");

// ─── MATCH DATA ───────────────────────────────────────────────────────────────
const GROUPS = [
  { id:"A", teams:["México","Corea del Sur","Sudáfrica","Rep. Checa"],
    matches:[
      {id:"A0",j:1,h:"México",a:"Sudáfrica",date:"11/06",venue:"Ciudad de México"},
      {id:"A1",j:1,h:"Corea del Sur",a:"Rep. Checa",date:"11/06",venue:"Guadalajara"},
      {id:"A2",j:2,h:"Rep. Checa",a:"Sudáfrica",date:"18/06",venue:"Atlanta"},
      {id:"A3",j:2,h:"México",a:"Corea del Sur",date:"18/06",venue:"Guadalajara"},
      {id:"A4",j:3,h:"Rep. Checa",a:"México",date:"24/06",venue:"Ciudad de México"},
      {id:"A5",j:3,h:"Sudáfrica",a:"Corea del Sur",date:"24/06",venue:"Monterrey"},
    ]},
  { id:"B", teams:["Canadá","Suiza","Qatar","Bosnia y H."],
    matches:[
      {id:"B0",j:1,h:"Canadá",a:"Bosnia y H.",date:"12/06",venue:"Toronto"},
      {id:"B1",j:1,h:"Qatar",a:"Suiza",date:"13/06",venue:"San Francisco"},
      {id:"B2",j:2,h:"Suiza",a:"Bosnia y H.",date:"18/06",venue:"Los Ángeles"},
      {id:"B3",j:2,h:"Canadá",a:"Qatar",date:"18/06",venue:"Vancouver"},
      {id:"B4",j:3,h:"Suiza",a:"Canadá",date:"24/06",venue:"Vancouver"},
      {id:"B5",j:3,h:"Bosnia y H.",a:"Qatar",date:"24/06",venue:"Seattle"},
    ]},
  { id:"C", teams:["Brasil","Marruecos","Escocia","Haití"],
    matches:[
      {id:"C0",j:1,h:"Brasil",a:"Marruecos",date:"13/06",venue:"Nueva York"},
      {id:"C1",j:1,h:"Haití",a:"Escocia",date:"13/06",venue:"Boston"},
      {id:"C2",j:2,h:"Escocia",a:"Marruecos",date:"19/06",venue:"Boston"},
      {id:"C3",j:2,h:"Brasil",a:"Haití",date:"19/06",venue:"Filadelfia"},
      {id:"C4",j:3,h:"Escocia",a:"Brasil",date:"24/06",venue:"Miami"},
      {id:"C5",j:3,h:"Marruecos",a:"Haití",date:"24/06",venue:"Atlanta"},
    ]},
  { id:"D", teams:["EE.UU.","Australia","Paraguay","Turquía"],
    matches:[
      {id:"D0",j:1,h:"EE.UU.",a:"Paraguay",date:"12/06",venue:"Los Ángeles"},
      {id:"D1",j:1,h:"Australia",a:"Turquía",date:"13/06",venue:"Vancouver"},
      {id:"D2",j:2,h:"Turquía",a:"Paraguay",date:"19/06",venue:"San Francisco"},
      {id:"D3",j:2,h:"EE.UU.",a:"Australia",date:"19/06",venue:"Seattle"},
      {id:"D4",j:3,h:"Turquía",a:"EE.UU.",date:"25/06",venue:"Los Ángeles"},
      {id:"D5",j:3,h:"Paraguay",a:"Australia",date:"25/06",venue:"San Francisco"},
    ]},
  { id:"E", teams:["Alemania","Ecuador","Costa de Marfil","Curazao"],
    matches:[
      {id:"E0",j:1,h:"Alemania",a:"Curazao",date:"14/06",venue:"Houston"},
      {id:"E1",j:1,h:"Costa de Marfil",a:"Ecuador",date:"14/06",venue:"Filadelfia"},
      {id:"E2",j:2,h:"Alemania",a:"Costa de Marfil",date:"20/06",venue:"Toronto"},
      {id:"E3",j:2,h:"Ecuador",a:"Curazao",date:"20/06",venue:"Kansas City"},
      {id:"E4",j:3,h:"Ecuador",a:"Alemania",date:"25/06",venue:"Nueva York"},
      {id:"E5",j:3,h:"Curazao",a:"Costa de Marfil",date:"25/06",venue:"Filadelfia"},
    ]},
  { id:"F", teams:["Países Bajos","Japón","Suecia","Túnez"],
    matches:[
      {id:"F0",j:1,h:"Países Bajos",a:"Japón",date:"14/06",venue:"Dallas"},
      {id:"F1",j:1,h:"Suecia",a:"Túnez",date:"14/06",venue:"Monterrey"},
      {id:"F2",j:2,h:"Países Bajos",a:"Suecia",date:"20/06",venue:"Houston"},
      {id:"F3",j:2,h:"Túnez",a:"Japón",date:"20/06",venue:"Monterrey"},
      {id:"F4",j:3,h:"Japón",a:"Suecia",date:"25/06",venue:"Dallas"},
      {id:"F5",j:3,h:"Túnez",a:"Países Bajos",date:"25/06",venue:"Kansas City"},
    ]},
  { id:"G", teams:["Bélgica","Egipto","Irán","Nueva Zelanda"],
    matches:[
      {id:"G0",j:1,h:"Bélgica",a:"Egipto",date:"15/06",venue:"Seattle"},
      {id:"G1",j:1,h:"Irán",a:"Nueva Zelanda",date:"15/06",venue:"Los Ángeles"},
      {id:"G2",j:2,h:"Bélgica",a:"Irán",date:"21/06",venue:"Los Ángeles"},
      {id:"G3",j:2,h:"Egipto",a:"Nueva Zelanda",date:"21/06",venue:"Vancouver"},
      {id:"G4",j:3,h:"Nueva Zelanda",a:"Bélgica",date:"26/06",venue:"Vancouver"},
      {id:"G5",j:3,h:"Egipto",a:"Irán",date:"26/06",venue:"Seattle"},
    ]},
  { id:"H", teams:["España","Uruguay","Arabia Saudita","Cabo Verde"],
    matches:[
      {id:"H0",j:1,h:"España",a:"Cabo Verde",date:"15/06",venue:"Atlanta"},
      {id:"H1",j:1,h:"Arabia Saudita",a:"Uruguay",date:"15/06",venue:"Miami"},
      {id:"H2",j:2,h:"España",a:"Arabia Saudita",date:"21/06",venue:"Atlanta"},
      {id:"H3",j:2,h:"Cabo Verde",a:"Uruguay",date:"21/06",venue:"Miami"},
      {id:"H4",j:3,h:"Uruguay",a:"España",date:"26/06",venue:"Guadalajara"},
      {id:"H5",j:3,h:"Cabo Verde",a:"Arabia Saudita",date:"26/06",venue:"Houston"},
    ]},
  { id:"I", teams:["Francia","Noruega","Senegal","Iraq"],
    matches:[
      {id:"I0",j:1,h:"Francia",a:"Senegal",date:"16/06",venue:"Nueva York"},
      {id:"I1",j:1,h:"Iraq",a:"Noruega",date:"16/06",venue:"Boston"},
      {id:"I2",j:2,h:"Francia",a:"Iraq",date:"22/06",venue:"Filadelfia"},
      {id:"I3",j:2,h:"Noruega",a:"Senegal",date:"22/06",venue:"Nueva York"},
      {id:"I4",j:3,h:"Noruega",a:"Francia",date:"26/06",venue:"Boston"},
      {id:"I5",j:3,h:"Senegal",a:"Iraq",date:"26/06",venue:"Filadelfia"},
    ]},
  { id:"J", teams:["Argentina","Argelia","Austria","Jordania"],
    matches:[
      {id:"J0",j:1,h:"Argentina",a:"Argelia",date:"16/06",venue:"Kansas City"},
      {id:"J1",j:1,h:"Austria",a:"Jordania",date:"16/06",venue:"San Francisco"},
      {id:"J2",j:2,h:"Argentina",a:"Austria",date:"22/06",venue:"Dallas"},
      {id:"J3",j:2,h:"Jordania",a:"Argelia",date:"22/06",venue:"San Francisco"},
      {id:"J4",j:3,h:"Argelia",a:"Austria",date:"27/06",venue:"Kansas City"},
      {id:"J5",j:3,h:"Jordania",a:"Argentina",date:"27/06",venue:"Dallas"},
    ]},
  { id:"K", teams:["Portugal","Colombia","R.D. Congo","Uzbekistán"],
    matches:[
      {id:"K0",j:1,h:"Portugal",a:"R.D. Congo",date:"17/06",venue:"Houston"},
      {id:"K1",j:1,h:"Uzbekistán",a:"Colombia",date:"17/06",venue:"Ciudad de México"},
      {id:"K2",j:2,h:"Portugal",a:"Uzbekistán",date:"23/06",venue:"Houston"},
      {id:"K3",j:2,h:"R.D. Congo",a:"Colombia",date:"23/06",venue:"Guadalajara"},
      {id:"K4",j:3,h:"Colombia",a:"Portugal",date:"27/06",venue:"Miami"},
      {id:"K5",j:3,h:"R.D. Congo",a:"Uzbekistán",date:"27/06",venue:"Atlanta"},
    ]},
  { id:"L", teams:["Inglaterra","Croacia","Ghana","Panamá"],
    matches:[
      {id:"L0",j:1,h:"Inglaterra",a:"Croacia",date:"17/06",venue:"Dallas"},
      {id:"L1",j:1,h:"Ghana",a:"Panamá",date:"17/06",venue:"Toronto"},
      {id:"L2",j:2,h:"Inglaterra",a:"Ghana",date:"23/06",venue:"Toronto"},
      {id:"L3",j:2,h:"Croacia",a:"Panamá",date:"23/06",venue:"Filadelfia"},
      {id:"L4",j:3,h:"Panamá",a:"Inglaterra",date:"27/06",venue:"Nueva York"},
      {id:"L5",j:3,h:"Croacia",a:"Ghana",date:"27/06",venue:"Filadelfia"},
    ]},
];

const ALL_MATCHES = GROUPS.flatMap(g => g.matches);
const TOTAL_MATCHES = ALL_MATCHES.length;

const FLAGS = {
  "México":"🇲🇽","Corea del Sur":"🇰🇷","Sudáfrica":"🇿🇦","Rep. Checa":"🇨🇿",
  "Canadá":"🇨🇦","Suiza":"🇨🇭","Qatar":"🇶🇦","Bosnia y H.":"🇧🇦",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Haití":"🇭🇹",
  "EE.UU.":"🇺🇸","Australia":"🇦🇺","Paraguay":"🇵🇾","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","Ecuador":"🇪🇨","Costa de Marfil":"🇨🇮","Curazao":"🇨🇼",
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "España":"🇪🇸","Uruguay":"🇺🇾","Arabia Saudita":"🇸🇦","Cabo Verde":"🇨🇻",
  "Francia":"🇫🇷","Noruega":"🇳🇴","Senegal":"🇸🇳","Iraq":"🇮🇶",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","Colombia":"🇨🇴","R.D. Congo":"🇨🇩","Uzbekistán":"🇺🇿",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
};

const GC = {
  A:"#50fa7b",B:"#6eb5ff",C:"#ff6b6b",D:"#a0c4ff",
  E:"#ffb347",F:"#bd93f9",G:"#f1fa8c",H:"#ff79c6",
  I:"#8be9fd",J:"#FFD700",K:"#c0c8d8",L:"#69ff47",
};

// ─── SCORING ──────────────────────────────────────────────────────────────────
function getOutcome(h,a){ return h>a?"H":a>h?"A":"D"; }
function calcPoints(pred,real){
  if(pred?.h==null||pred?.h===""||pred?.a==null||pred?.a==="") return null;
  if(real?.h==null||real?.h===""||real?.a==null||real?.a==="") return null;
  const ph=parseInt(pred.h),pa=parseInt(pred.a),rh=parseInt(real.h),ra=parseInt(real.a);
  if(ph===rh&&pa===ra) return 2;
  if(getOutcome(ph,pa)===getOutcome(rh,ra)) return 1;
  return 0;
}

// ─── FIREBASE HELPERS ─────────────────────────────────────────────────────────
async function fbGet(path){ try{ const s=await get(ref(db,path)); return s.exists()?s.val():null; }catch{ return null; } }
async function fbSet(path,val){ try{ await set(ref(db,path),val); }catch(e){ console.error(e); } }

// ─── AUTO RESULTS via Claude API ──────────────────────────────────────────────
async function fetchResultsFromAPI(onLog){
  const matchList = ALL_MATCHES.map(m=>`ID:${m.id} | ${m.h} vs ${m.a} | ${m.date}/2026`).join("\n");
  onLog("🔍 Buscando resultados en internet...");
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:1000,
      tools:[{type:"web_search_20250305",name:"web_search"}],
      messages:[{role:"user",content:
        `Buscá en internet los resultados FINALES Y OFICIALES de la fase de grupos del Mundial FIFA 2026 que ya se hayan jugado.\n\nPartidos:\n${matchList}\n\nResponde ÚNICAMENTE con JSON (sin markdown):\n{"results":{"A0":{"h":2,"a":1}},"note":"resumen"}\n\nSolo partidos TERMINADOS. h=goles local, a=goles visitante. Si ninguno jugado: {"results":{},"note":"..."}`
      }],
    }),
  });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const text = data.content.filter(b=>b.type==="text").map(b=>b.text).join("\n");
  const m = text.match(/\{[\s\S]*"results"[\s\S]*?\}/);
  if(!m) throw new Error("No se pudo interpretar la respuesta");
  const parsed = JSON.parse(m[0]);
  const normalized={};
  Object.entries(parsed.results||{}).forEach(([id,v])=>{ normalized[id]={h:String(v.h),a:String(v.a)}; });
  return { results:normalized, note:parsed.note||"" };
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function useCountdown(){
  const [timeLeft,setTimeLeft]=useState(null);
  useEffect(()=>{
    function calc(){
      const diff=DEADLINE-new Date();
      if(diff<=0){ setTimeLeft(null); return; }
      const d=Math.floor(diff/86400000);
      const h=Math.floor((diff%86400000)/3600000);
      const m=Math.floor((diff%3600000)/60000);
      const s=Math.floor((diff%60000)/1000);
      setTimeLeft({d,h,m,s,expired:false});
    }
    calc();
    const id=setInterval(calc,1000);
    return()=>clearInterval(id);
  },[]);
  return timeLeft;
}

// ─── COLORS ───────────────────────────────────────────────────────────────────
const cl="#080C16",cc="#0F1724",cb="rgba(255,255,255,.08)";
const gold="#FFD700",grn="#2DC653",red="#E63946",teal="#00C896",muted="#4A6080";

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("ranking");
  const [user,setUser]=useState(null);
  const [participants,setParticipants]=useState({});
  const [myPreds,setMyPreds]=useState({});
  const [results,setResults]=useState({});
  const [allPreds,setAllPreds]=useState({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [saveMsg,setSaveMsg]=useState("");
  const [nameInput,setNameInput]=useState("");
  const [nameError,setNameError]=useState("");
  const [fetchStatus,setFetchStatus]=useState("idle");
  const [fetchLog,setFetchLog]=useState("");
  const [lastUpdated,setLastUpdated]=useState(null);
  const [isAdmin,setIsAdmin]=useState(false);
  const [adminPin,setAdminPin]=useState("");
  const [adminPinErr,setAdminPinErr]=useState("");
  const [adminResults,setAdminResults]=useState({});
  const fetching=useRef(false);
  const countdown=useCountdown();
  const isLocked=new Date()>=DEADLINE;

  // ── Load initial data ──
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const [parts,res,lf]=await Promise.all([
        fbGet("participants"),
        fbGet("results"),
        fbGet("lastFetch"),
      ]);
      setParticipants(parts||{});
      setResults(res||{});
      setAdminResults(res||{});
      if(lf?.timestamp) setLastUpdated(lf.timestamp);
      try{
        const saved=localStorage.getItem("prode26:me");
        if(saved){
          const u=JSON.parse(saved);
          setUser(u);
          const pr=await fbGet(`predictions/${u.id}`);
          setMyPreds(pr||{});
        }
      }catch{}
      setLoading(false);
    })();
  },[]);

  // ── Listen to results in real-time ──
  useEffect(()=>{
    const unsub=onValue(ref(db,"results"),(snap)=>{
      const val=snap.val()||{};
      setResults(val);
      setAdminResults(val);
    });
    return()=>unsub();
  },[]);

  // ── Listen to participants in real-time ──
  useEffect(()=>{
    const unsub=onValue(ref(db,"participants"),(snap)=>{
      setParticipants(snap.val()||{});
    });
    return()=>unsub();
  },[]);

  // ── Load all predictions for ranking ──
  useEffect(()=>{
    if(!Object.keys(participants).length) return;
    (async()=>{
      const map={};
      await Promise.all(Object.keys(participants).map(async uid=>{
        map[uid]=(await fbGet(`predictions/${uid}`))||{};
      }));
      setAllPreds(map);
    })();
  },[participants,results]);

  // ── Auto-fetch results ──
  const doFetch=useCallback(async()=>{
    if(fetching.current) return;
    fetching.current=true;
    setFetchStatus("fetching");
    try{
      const data=await fetchResultsFromAPI(setFetchLog);
      const current=(await fbGet("results"))||{};
      const merged={...current,...data.results};
      const ts=new Date().toISOString();
      await fbSet("results",merged);
      await fbSet("lastFetch",{timestamp:ts,note:data.note});
      setLastUpdated(ts);
      const n=Object.keys(data.results).length;
      setFetchLog(`✅ ${n} resultado${n!==1?"s":""} encontrado${n!==1?"s":""}.`);
      setFetchStatus("ok");
    }catch(e){
      setFetchLog(`❌ ${e.message}`);
      setFetchStatus("error");
    }finally{ fetching.current=false; }
  },[]);

  useEffect(()=>{
    doFetch();
    const id=setInterval(doFetch,5*60*1000);
    return()=>clearInterval(id);
  },[doFetch]);

  // ── Register ──
  async function register(){
    const name=nameInput.trim();
    if(!name||name.length<2) return setNameError("Ingresá tu nombre (mínimo 2 letras)");
    setNameError("");
    const existing=Object.entries(participants).find(([,n])=>n.toLowerCase()===name.toLowerCase());
    let uid;
    if(existing){
      uid=existing[0];
    }else{
      uid="u_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);
      await fbSet(`participants/${uid}`,name);
    }
    const u={id:uid,name:existing?existing[1]:name};
    setUser(u);
    const pr=await fbGet(`predictions/${uid}`);
    setMyPreds(pr||{});
    try{ localStorage.setItem("prode26:me",JSON.stringify(u)); }catch{}
    setTab("prode");
  }

  // ── Save predictions ──
  async function savePreds(){
    if(!user||isLocked) return;
    // Validate all filled
    const filled=ALL_MATCHES.filter(m=>myPreds[m.id]?.h!==""&&myPreds[m.id]?.h!=null&&myPreds[m.id]?.a!==""&&myPreds[m.id]?.a!=null).length;
    if(filled<TOTAL_MATCHES){
      const missing=TOTAL_MATCHES-filled;
      setSaveMsg(`⚠️ Faltan ${missing} partido${missing!==1?"s":""} por completar. Debés cargar todos los ${TOTAL_MATCHES} partidos.`);
      setTimeout(()=>setSaveMsg(""),4000);
      return;
    }
    setSaving(true);
    await fbSet(`predictions/${user.id}`,myPreds);
    setAllPreds(p=>({...p,[user.id]:myPreds}));
    setSaving(false);
    setSaveMsg("✅ ¡Predicciones guardadas!");
    setTimeout(()=>setSaveMsg(""),3000);
  }

  // ── Admin save ──
  async function saveAdminResults(){
    await fbSet("results",adminResults);
    alert("✅ Resultados guardados.");
  }

  // ── Ranking ──
  function getRanking(){
    const sc={};
    Object.entries(participants).forEach(([uid,name])=>{
      sc[uid]={name,pts:0,exact:0,winner:0,wrong:0,played:0};
    });
    Object.entries(results).forEach(([mid,real])=>{
      if(real?.h==null||real?.h==="") return;
      Object.keys(participants).forEach(uid=>{
        const pred=(allPreds[uid]||{})[mid]; if(!pred) return;
        const pts=calcPoints(pred,real); if(pts===null) return;
        sc[uid].played++; sc[uid].pts+=pts;
        if(pts===2) sc[uid].exact++;
        else if(pts===1) sc[uid].winner++;
        else sc[uid].wrong++;
      });
    });
    return Object.entries(sc).map(([uid,s])=>({uid,...s}))
      .sort((a,b)=>b.pts-a.pts||b.exact-a.exact||b.winner-a.winner);
  }

  const ranking=getRanking();
  const totalPlayed=Object.values(results).filter(r=>r?.h!=null&&r?.h!=="").length;
  const myFilled=user?ALL_MATCHES.filter(m=>myPreds[m.id]?.h!==""&&myPreds[m.id]?.h!=null&&myPreds[m.id]?.a!==""&&myPreds[m.id]?.a!=null).length:0;

  const fmtTs=(iso)=>{ try{ return new Date(iso).toLocaleString("es-AR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}); }catch{ return ""; } };

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if(loading) return(
    <div style={{minHeight:"100vh",background:cl,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
      <span style={{fontSize:"3rem",display:"block",animation:"spin 1s linear infinite"}}>⚽</span>
      <span style={{color:muted,letterSpacing:3,fontSize:".82rem",textTransform:"uppercase"}}>Cargando...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return(
    <div style={{minHeight:"100vh",background:cl,color:"#D0DCF0",fontFamily:"'Segoe UI',system-ui,sans-serif",overflowX:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        .mrow:hover{background:rgba(255,255,255,.018)!important}
        .tabbtn:hover{color:#8899bb!important}
        .gbtn:hover{opacity:.88!important}
        .gbtn:active{transform:scale(.97)!important}
        input:focus{border-color:rgba(255,215,0,.5)!important;box-shadow:0 0 0 2px rgba(255,215,0,.08)!important}
      `}</style>

      {/* ── HEADER ── */}
      <header style={{background:"linear-gradient(155deg,#060A13,#0C1828,#060A13)",padding:"26px 20px 18px",textAlign:"center",borderBottom:`1px solid ${cb}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 65% 45% at 50% 0%,rgba(20,50,90,.55),transparent)",pointerEvents:"none"}}/>
        <span style={{fontSize:"2.8rem",display:"block",filter:"drop-shadow(0 0 18px rgba(255,215,0,.4))",animation:"pulse 3.5s ease-in-out infinite"}}>🏆</span>
        <div style={{fontWeight:800,fontSize:".78rem",letterSpacing:7,textTransform:"uppercase",color:"#4a7a9a",margin:"4px 0 2px"}}>Copa Mundial de la FIFA</div>
        <div style={{fontWeight:900,fontSize:"clamp(2.4rem,9vw,4.8rem)",letterSpacing:5,lineHeight:.9,
          background:"linear-gradient(135deg,#FFD700 0%,#FFA500 45%,#FF6B35 100%)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"4px 0"}}>MUNDIAL 2026</div>
        <div style={{fontSize:".73rem",letterSpacing:2,color:"#304050",textTransform:"uppercase",marginBottom:10}}>11 Jun – 27 Jun · Fase de Grupos · Prode Oficial</div>
        <div style={{display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap",marginBottom:10}}>
          {["🇺🇸 EE.UU.","🇲🇽 México","🇨🇦 Canadá"].map(h=>(
            <span key={h} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${cb}`,borderRadius:20,padding:"3px 10px",fontSize:".68rem",color:"#384858",letterSpacing:.5}}>{h}</span>
          ))}
        </div>

        {/* COUNTDOWN */}
        {!isLocked && countdown && (
          <div style={{display:"inline-flex",gap:6,background:"rgba(255,215,0,.07)",border:"1px solid rgba(255,215,0,.2)",borderRadius:12,padding:"8px 14px",marginBottom:4}}>
            <span style={{fontSize:".65rem",color:gold,letterSpacing:2,textTransform:"uppercase",marginRight:4,alignSelf:"center"}}>⏱ Cierre predicciones:</span>
            {[["d","días"],["h","hs"],["m","min"],["s","seg"]].map(([k,label])=>(
              <div key={k} style={{textAlign:"center",minWidth:32}}>
                <div style={{fontWeight:900,fontSize:"1.2rem",color:gold,lineHeight:1}}>{String(countdown[k]).padStart(2,"0")}</div>
                <div style={{fontSize:".55rem",color:"#8a7040",letterSpacing:1}}>{label}</div>
              </div>
            ))}
          </div>
        )}
        {isLocked && (
          <div style={{display:"inline-block",background:"rgba(230,57,70,.1)",border:"1px solid rgba(230,57,70,.3)",borderRadius:10,padding:"6px 16px",fontSize:".8rem",color:red,fontWeight:700,letterSpacing:1}}>
            🔒 Predicciones cerradas — 11/06 17:00hs ARG
          </div>
        )}

        {user && (
          <div style={{marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <span style={{background:"rgba(255,215,0,.1)",border:"1px solid rgba(255,215,0,.2)",borderRadius:20,padding:"4px 13px",fontSize:".8rem",color:gold,fontWeight:700}}>
              👤 {user.name}
            </span>
            {!isLocked && (
              <span style={{background:myFilled===TOTAL_MATCHES?"rgba(45,198,83,.15)":"rgba(230,57,70,.1)",
                border:`1px solid ${myFilled===TOTAL_MATCHES?"rgba(45,198,83,.3)":"rgba(230,57,70,.25)"}`,
                borderRadius:20,padding:"4px 11px",fontSize:".72rem",
                color:myFilled===TOTAL_MATCHES?grn:red,fontWeight:600}}>
                {myFilled}/{TOTAL_MATCHES} cargados
              </span>
            )}
            <button className="gbtn" onClick={()=>{setUser(null);setMyPreds({});try{localStorage.removeItem("prode26:me")}catch{}}}
              style={{background:"rgba(255,255,255,.05)",color:"#6a8aaa",border:`1px solid ${cb}`,borderRadius:8,padding:"4px 11px",fontSize:".75rem",cursor:"pointer",fontWeight:600,transition:"opacity .15s"}}>
              Salir
            </button>
          </div>
        )}
      </header>

      {/* ── AUTO-FETCH BAR ── */}
      <div style={{background:"#060A10",borderBottom:`1px solid ${cb}`,padding:"7px 16px",display:"flex",alignItems:"center",gap:10,justifyContent:"space-between",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:0}}>
          <span style={{width:7,height:7,borderRadius:"50%",flexShrink:0,
            background:fetchStatus==="fetching"?gold:fetchStatus==="ok"?teal:fetchStatus==="error"?red:"#2a3a4a",
            animation:fetchStatus==="fetching"?"blink .8s ease-in-out infinite":"none"}}/>
          <span style={{fontSize:".7rem",color:fetchStatus==="fetching"?gold:fetchStatus==="ok"?teal:fetchStatus==="error"?red:muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {fetchStatus==="fetching"?"🔍 Buscando resultados en internet...":
             fetchStatus==="ok"?`✅ Resultados actualizados ${fmtTs(lastUpdated)}`:
             fetchStatus==="error"?fetchLog:"En espera..."}
          </span>
        </div>
        <button className="gbtn" onClick={doFetch} disabled={fetchStatus==="fetching"}
          style={{background:"rgba(0,200,150,.08)",color:teal,border:"1px solid rgba(0,200,150,.15)",borderRadius:8,
            padding:"4px 11px",fontSize:".7rem",fontWeight:700,cursor:"pointer",flexShrink:0,
            opacity:fetchStatus==="fetching"?.4:1,display:"flex",alignItems:"center",gap:4,transition:"opacity .15s"}}>
          <span style={{display:"inline-block",animation:fetchStatus==="fetching"?"spin .9s linear infinite":"none"}}>🔄</span>
          {fetchStatus==="fetching"?"Buscando...":"Actualizar"}
        </button>
      </div>

      {/* ── LEGEND ── */}
      <div style={{background:"#07101C",borderBottom:`1px solid ${cb}`,padding:"8px 14px",display:"flex",gap:7,flexWrap:"wrap",justifyContent:"center",alignItems:"center"}}>
        <span style={{fontSize:".68rem",color:muted,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginRight:2}}>Puntos:</span>
        {[[2,gold,"Resultado exacto"],[1,grn,"Ganador correcto"],[0,red,"Sin acierto"]].map(([pts,bg,label])=>(
          <div key={pts} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.03)",border:`1px solid ${cb}`,borderRadius:8,padding:"4px 9px"}}>
            <span style={{background:bg,color:"#060C14",borderRadius:5,padding:"1px 7px",fontWeight:900,fontSize:".8rem",minWidth:20,textAlign:"center"}}>{pts}</span>
            <span style={{fontSize:".7rem",color:"#5a7a9a"}}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",background:"#07101C",borderBottom:`2px solid ${cb}`,overflowX:"auto"}}>
        {[["ranking","🏆","Ranking"],["prode","⚽","Mi Prode"],["resultados","📊","Resultados"],["admin","🔐","Admin"]].map(([id,ic,lb])=>(
          <button key={id} className="tabbtn"
            onClick={()=>setTab(id)}
            style={{padding:"11px 17px",border:"none",background:"none",cursor:"pointer",whiteSpace:"nowrap",
              fontWeight:700,fontSize:".82rem",letterSpacing:2,textTransform:"uppercase",transition:"color .12s",
              color:tab===id?gold:"#304050",
              borderBottom:tab===id?`2px solid ${gold}`:"2px solid transparent",marginBottom:-2}}>
            {ic} {lb}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:880,margin:"0 auto",padding:"16px 13px 60px"}}>

        {/* ── RANKING ── */}
        {tab==="ranking"&&(
          <div style={{animation:"fadeUp .25s ease"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,gap:8,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:900,fontSize:"1.3rem",letterSpacing:2}}>RANKING GENERAL</div>
                <div style={{fontSize:".7rem",color:muted,marginTop:3}}>
                  {totalPlayed} partido{totalPlayed!==1?"s":""} jugado{totalPlayed!==1?"s":""} · {Object.keys(participants).length} participante{Object.keys(participants).length!==1?"s":""}
                  {lastUpdated&&<span style={{color:teal}}> · Act. {fmtTs(lastUpdated)}</span>}
                </div>
              </div>
            </div>

            {ranking.length===0?(
              <div style={{textAlign:"center",padding:"46px 20px",color:muted}}>
                <div style={{fontSize:"3rem",marginBottom:10}}>🏟️</div>
                <div style={{fontSize:".88rem",marginBottom:16}}>Nadie se registró todavía</div>
                <button className="gbtn" onClick={()=>setTab("prode")}
                  style={{background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#060C14",border:"none",borderRadius:9,
                    padding:"10px 22px",fontWeight:800,fontSize:".9rem",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
                  Registrarme ⚽
                </button>
              </div>
            ):(
              <div style={{background:cc,border:`1px solid ${cb}`,borderRadius:13,overflow:"hidden"}}>
                {ranking.map((p,i)=>(
                  <div key={p.uid} className="mrow" style={{
                    display:"flex",alignItems:"center",gap:11,padding:"12px 17px",
                    borderBottom:"1px solid rgba(255,255,255,.04)",
                    background:i===0?"rgba(255,215,0,.05)":i===1?"rgba(192,192,192,.03)":i===2?"rgba(205,127,50,.03)":"transparent",
                  }}>
                    <div style={{width:30,height:30,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:".9rem",
                      background:i===0?"linear-gradient(135deg,#FFD700,#FFA500)":i===1?"linear-gradient(135deg,#C0C0C0,#909090)":i===2?"linear-gradient(135deg,#CD7F32,#9A5420)":"rgba(255,255,255,.06)",
                      color:i<3?"#060C14":"#3a5a7a"}}>{i+1}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:".96rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {p.name}
                        {p.uid===user?.id&&<span style={{fontSize:".65rem",color:gold,marginLeft:5}}>(vos)</span>}
                      </div>
                      <div style={{display:"flex",gap:9,marginTop:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:".67rem",color:muted}}>{p.played} jugados</span>
                        <span style={{fontSize:".67rem",color:gold}}>✦ {p.exact} exactos</span>
                        <span style={{fontSize:".67rem",color:grn}}>✓ {p.winner} ganadores</span>
                        <span style={{fontSize:".67rem",color:red}}>✗ {p.wrong} errores</span>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontWeight:900,fontSize:"1.45rem",color:gold,lineHeight:1}}>{p.pts}</div>
                      <div style={{fontSize:".6rem",color:muted,letterSpacing:1,textTransform:"uppercase"}}>pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPlayed>0&&(
              <div style={{marginTop:20}}>
                <div style={{fontWeight:700,fontSize:".75rem",letterSpacing:2,color:muted,textTransform:"uppercase",marginBottom:9}}>Últimos resultados</div>
                <div style={{background:cc,border:`1px solid ${cb}`,borderRadius:12,overflow:"hidden"}}>
                  {ALL_MATCHES.filter(m=>results[m.id]?.h!=null&&results[m.id]?.h!=="").slice(-6).reverse().map(m=>(
                    <div key={m.id} className="mrow" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 15px",borderBottom:"1px solid rgba(255,255,255,.03)",fontSize:".8rem"}}>
                      <span style={{flex:1,textAlign:"right",color:"#7a9abb"}}>{FLAGS[m.h]} {m.h}</span>
                      <span style={{fontWeight:900,color:gold,minWidth:46,textAlign:"center",letterSpacing:2,fontSize:".92rem"}}>{results[m.id].h}–{results[m.id].a}</span>
                      <span style={{flex:1,color:"#7a9abb"}}>{FLAGS[m.a]} {m.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MI PRODE ── */}
        {tab==="prode"&&(
          <div style={{animation:"fadeUp .25s ease"}}>
            {!user?(
              <div style={{maxWidth:350,margin:"36px auto",textAlign:"center"}}>
                <div style={{fontSize:"2.8rem",marginBottom:12}}>⚽</div>
                <div style={{fontWeight:900,fontSize:"1.25rem",letterSpacing:2,marginBottom:5}}>INGRESÁ AL PRODE</div>
                <div style={{color:muted,fontSize:".83rem",marginBottom:20,lineHeight:1.6}}>
                  Escribí tu nombre para registrarte y cargar tus predicciones.<br/>
                  Si ya participaste antes, usá el mismo nombre exacto.
                </div>
                {isLocked&&(
                  <div style={{background:"rgba(230,57,70,.1)",border:"1px solid rgba(230,57,70,.25)",borderRadius:10,padding:"10px 14px",fontSize:".82rem",color:red,marginBottom:16,lineHeight:1.5}}>
                    🔒 El plazo para cargar predicciones venció el 11/06 a las 17:00hs ARG. Igual podés ver el ranking.
                  </div>
                )}
                <input value={nameInput} onChange={e=>{setNameInput(e.target.value);setNameError("")}}
                  onKeyDown={e=>e.key==="Enter"&&register()}
                  placeholder="Tu nombre..." autoFocus
                  style={{background:"rgba(255,255,255,.06)",border:`1px solid ${cb}`,borderRadius:9,color:"white",
                    padding:"11px 14px",fontSize:"1rem",outline:"none",width:"100%",marginBottom:6,
                    textAlign:"center",fontFamily:"inherit",transition:"border-color .15s"}}/>
                {nameError&&<div style={{color:red,fontSize:".78rem",marginBottom:7}}>{nameError}</div>}
                <button className="gbtn" onClick={register}
                  style={{background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#060C14",border:"none",borderRadius:9,
                    padding:"11px",fontWeight:800,fontSize:".9rem",cursor:"pointer",width:"100%",letterSpacing:1,transition:"opacity .15s"}}>
                  Entrar 🚀
                </button>
              </div>
            ):(
              <div>
                {/* Top bar */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:13,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:"1.15rem",letterSpacing:2}}>TUS PREDICCIONES</div>
                    <div style={{fontSize:".7rem",color:muted,marginTop:2}}>
                      {isLocked
                        ?"🔒 Predicciones cerradas — podés ver tus selecciones pero no modificarlas"
                        :`Completá los ${TOTAL_MATCHES} partidos antes del 11/06 17:00hs · ${myFilled}/${TOTAL_MATCHES} cargados`}
                    </div>
                  </div>
                  {!isLocked&&(
                    <button className="gbtn" onClick={savePreds} disabled={saving}
                      style={{background:"linear-gradient(135deg,#2DC653,#1a9e3f)",color:"white",border:"none",borderRadius:9,
                        padding:"9px 18px",fontWeight:800,fontSize:".85rem",cursor:"pointer",
                        opacity:saving?.5:1,display:"flex",alignItems:"center",gap:5,transition:"opacity .15s"}}>
                      {saving?"Guardando...":"💾 Guardar"}
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {!isLocked&&(
                  <div style={{marginBottom:14}}>
                    <div style={{height:5,background:"rgba(255,255,255,.06)",borderRadius:5,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:5,transition:"width .3s ease",
                        background:`linear-gradient(90deg,${myFilled===TOTAL_MATCHES?grn:gold},${myFilled===TOTAL_MATCHES?"#1a9e3f":"#FFA500"})`,
                        width:`${(myFilled/TOTAL_MATCHES)*100}%`}}/>
                    </div>
                    <div style={{fontSize:".65rem",color:myFilled===TOTAL_MATCHES?grn:muted,marginTop:4,textAlign:"right"}}>
                      {myFilled===TOTAL_MATCHES?"✅ ¡Todos los partidos cargados! No olvides guardar.":`${myFilled} de ${TOTAL_MATCHES} partidos completados`}
                    </div>
                  </div>
                )}

                {/* Save message */}
                {saveMsg&&(
                  <div style={{background:saveMsg.startsWith("✅")?"rgba(45,198,83,.1)":"rgba(230,57,70,.1)",
                    border:`1px solid ${saveMsg.startsWith("✅")?"rgba(45,198,83,.25)":"rgba(230,57,70,.25)"}`,
                    borderRadius:9,padding:"10px 14px",fontSize:".83rem",
                    color:saveMsg.startsWith("✅")?grn:red,marginBottom:12,fontWeight:600}}>
                    {saveMsg}
                  </div>
                )}

                {/* Groups */}
                {GROUPS.map(g=>(
                  <div key={g.id} style={{background:cc,border:`1px solid ${cb}`,borderRadius:13,overflow:"hidden",marginBottom:12}}>
                    <div style={{background:"rgba(0,0,0,.3)",borderBottom:`1px solid ${cb}`,padding:"9px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                      <span style={{fontWeight:900,fontSize:".92rem",letterSpacing:3,textTransform:"uppercase",color:GC[g.id]}}>GRUPO {g.id}</span>
                      <span style={{fontSize:".67rem",color:"#243040"}}>{g.teams.map(t=>`${FLAGS[t]} ${t}`).join(" · ")}</span>
                    </div>
                    {[1,2,3].map(j=>(
                      <div key={j}>
                        <div style={{padding:"5px 14px 2px",fontSize:".6rem",color:"#243040",letterSpacing:2,textTransform:"uppercase",borderBottom:"1px solid rgba(255,255,255,.02)"}}>
                          ⚽ Fecha {j}
                        </div>
                        {g.matches.filter(m=>m.j===j).map(m=>{
                          const pred=myPreds[m.id]||{h:"",a:""};
                          const real=results[m.id];
                          const played=real?.h!=null&&real?.h!=="";
                          const locked=isLocked||played;
                          const pts=played?calcPoints(pred,real):null;
                          return(
                            <div key={m.id} className="mrow" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:4,padding:"7px 13px",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                              <div style={{fontSize:".6rem",color:"#243040",gridColumn:"1/-1",textAlign:"center",marginBottom:1}}>{m.date}/06 · {m.venue}</div>
                              <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end",flexDirection:"row-reverse",minWidth:0}}>
                                <span style={{fontSize:".8rem",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:88,color:"#8aA0b8"}}>{m.h}</span>
                                <span style={{fontSize:"1rem",flexShrink:0}}>{FLAGS[m.h]}</span>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0,justifyContent:"center"}}>
                                {pts!==null&&(
                                  <div style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",
                                    fontWeight:900,fontSize:".72rem",marginRight:1,flexShrink:0,
                                    background:pts===2?gold:pts===1?grn:red,color:pts>0?"#080C16":"white"}}>{pts}</div>
                                )}
                                <input type="number" min="0" max="99" placeholder="–" value={pred.h} disabled={locked}
                                  onChange={e=>!locked&&setMyPreds(p=>({...p,[m.id]:{...pred,h:e.target.value}}))}
                                  style={{width:33,height:33,background:locked?"rgba(255,255,255,.02)":"#162030",
                                    border:`1.5px solid ${locked?"rgba(255,255,255,.05)":"rgba(255,255,255,.14)"}`,
                                    borderRadius:7,color:locked?"#2a4a5a":gold,fontSize:"1rem",fontWeight:900,
                                    textAlign:"center",outline:"none",cursor:locked?"default":"pointer",transition:"border-color .15s"}}/>
                                <span style={{color:"#1a2a3a",fontWeight:900,fontSize:".85rem",userSelect:"none",margin:"0 1px"}}>:</span>
                                <input type="number" min="0" max="99" placeholder="–" value={pred.a} disabled={locked}
                                  onChange={e=>!locked&&setMyPreds(p=>({...p,[m.id]:{...pred,a:e.target.value}}))}
                                  style={{width:33,height:33,background:locked?"rgba(255,255,255,.02)":"#162030",
                                    border:`1.5px solid ${locked?"rgba(255,255,255,.05)":"rgba(255,255,255,.14)"}`,
                                    borderRadius:7,color:locked?"#2a4a5a":gold,fontSize:"1rem",fontWeight:900,
                                    textAlign:"center",outline:"none",cursor:locked?"default":"pointer",transition:"border-color .15s"}}/>
                                {played&&<span style={{fontSize:".68rem",color:"#1a4a2a",marginLeft:3,fontWeight:700,whiteSpace:"nowrap"}}>({real.h}–{real.a})</span>}
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
                                <span style={{fontSize:"1rem",flexShrink:0}}>{FLAGS[m.a]}</span>
                                <span style={{fontSize:".8rem",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:88,color:"#8aA0b8"}}>{m.a}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}

                {!isLocked&&(
                  <button className="gbtn" onClick={savePreds} disabled={saving}
                    style={{background:"linear-gradient(135deg,#2DC653,#1a9e3f)",color:"white",border:"none",borderRadius:9,
                      padding:"12px",fontWeight:800,fontSize:".9rem",cursor:"pointer",width:"100%",
                      opacity:saving?.5:1,transition:"opacity .15s",marginTop:4}}>
                    {saving?"Guardando...":"💾 Guardar predicciones"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── RESULTADOS ── */}
        {tab==="resultados"&&(
          <div style={{animation:"fadeUp .25s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:13,gap:8,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:900,fontSize:"1.15rem",letterSpacing:2}}>RESULTADOS REALES</div>
                <div style={{fontSize:".7rem",color:muted,marginTop:2}}>Actualizados automáticamente desde internet · {totalPlayed} partido{totalPlayed!==1?"s":""} jugado{totalPlayed!==1?"s":""}</div>
              </div>
              <button className="gbtn" onClick={doFetch} disabled={fetchStatus==="fetching"}
                style={{background:"rgba(0,200,150,.08)",color:teal,border:"1px solid rgba(0,200,150,.15)",borderRadius:8,
                  padding:"6px 12px",fontSize:".75rem",fontWeight:700,cursor:"pointer",
                  opacity:fetchStatus==="fetching"?.4:1,display:"flex",alignItems:"center",gap:4,transition:"opacity .15s"}}>
                <span style={{display:"inline-block",animation:fetchStatus==="fetching"?"spin .9s linear infinite":"none"}}>🔄</span>
                Actualizar
              </button>
            </div>
            {GROUPS.map(g=>(
              <div key={g.id} style={{background:cc,border:`1px solid ${cb}`,borderRadius:13,overflow:"hidden",marginBottom:12}}>
                <div style={{background:"rgba(0,0,0,.3)",borderBottom:`1px solid ${cb}`,padding:"9px 14px"}}>
                  <span style={{fontWeight:900,fontSize:".9rem",letterSpacing:3,textTransform:"uppercase",color:GC[g.id]}}>GRUPO {g.id}</span>
                </div>
                {g.matches.map(m=>{
                  const r=results[m.id]; const played=r?.h!=null&&r?.h!=="";
                  return(
                    <div key={m.id} className="mrow" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:4,padding:"7px 13px",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                      <div style={{fontSize:".6rem",color:"#243040",gridColumn:"1/-1",textAlign:"center",marginBottom:1}}>{m.date}/06 · {m.venue}</div>
                      <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end",flexDirection:"row-reverse",minWidth:0}}>
                        <span style={{fontSize:".8rem",fontWeight:played&&parseInt(r.h)>parseInt(r.a)?700:400,
                          color:played&&parseInt(r.h)>parseInt(r.a)?"#ddeeff":"#6a8aaa",
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:88}}>{m.h}</span>
                        <span style={{flexShrink:0}}>{FLAGS[m.h]}</span>
                      </div>
                      <div style={{textAlign:"center",minWidth:52}}>
                        {played?<span style={{fontWeight:900,fontSize:"1.1rem",color:gold,letterSpacing:3}}>{r.h}–{r.a}</span>
                          :<span style={{color:"#182030",fontSize:".78rem"}}>vs</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
                        <span style={{flexShrink:0}}>{FLAGS[m.a]}</span>
                        <span style={{fontSize:".8rem",fontWeight:played&&parseInt(r.a)>parseInt(r.h)?700:400,
                          color:played&&parseInt(r.a)>parseInt(r.h)?"#ddeeff":"#6a8aaa",
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:88}}>{m.a}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── ADMIN ── */}
        {tab==="admin"&&(
          <div style={{animation:"fadeUp .25s ease"}}>
            {!isAdmin?(
              <div style={{maxWidth:290,margin:"36px auto",textAlign:"center"}}>
                <div style={{fontSize:"2.2rem",marginBottom:11}}>🔐</div>
                <div style={{fontWeight:900,fontSize:"1.15rem",letterSpacing:2,marginBottom:5}}>PANEL ADMIN</div>
                <div style={{color:muted,fontSize:".8rem",marginBottom:18,lineHeight:1.55}}>
                  Los resultados se obtienen automáticamente desde internet.<br/>Usá este panel para corregir manualmente si algo falla.
                </div>
                <input type="password" placeholder="PIN" value={adminPin}
                  onChange={e=>{setAdminPin(e.target.value);setAdminPinErr("")}}
                  onKeyDown={e=>{if(e.key==="Enter"){if(adminPin===ADMIN_PIN)setIsAdmin(true);else setAdminPinErr("PIN incorrecto");}}}
                  style={{background:"rgba(255,255,255,.06)",border:`1px solid ${cb}`,borderRadius:9,color:"white",
                    padding:"10px 14px",fontSize:"1.1rem",outline:"none",width:"100%",
                    textAlign:"center",letterSpacing:6,marginBottom:6,fontFamily:"inherit",transition:"border-color .15s"}}/>
                {adminPinErr&&<div style={{color:red,fontSize:".78rem",marginBottom:6}}>{adminPinErr}</div>}
                <button className="gbtn" onClick={()=>{if(adminPin===ADMIN_PIN)setIsAdmin(true);else setAdminPinErr("PIN incorrecto");}}
                  style={{background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#060C14",border:"none",borderRadius:9,
                    padding:"10px",fontWeight:800,fontSize:".88rem",cursor:"pointer",width:"100%",letterSpacing:1,transition:"opacity .15s"}}>
                  Ingresar
                </button>
              </div>
            ):(
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:13,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:"1.15rem",letterSpacing:2,color:teal}}>✅ MODO ADMIN</div>
                    <div style={{fontSize:".7rem",color:muted,marginTop:2}}>Corrección manual · los resultados automáticos siguen corriendo en paralelo</div>
                  </div>
                  <div style={{display:"flex",gap:7}}>
                    <button className="gbtn" onClick={saveAdminResults}
                      style={{background:"linear-gradient(135deg,#2DC653,#1a9e3f)",color:"white",border:"none",borderRadius:9,padding:"8px 16px",fontWeight:800,fontSize:".85rem",cursor:"pointer",transition:"opacity .15s"}}>
                      💾 Guardar
                    </button>
                    <button className="gbtn" onClick={()=>setIsAdmin(false)}
                      style={{background:"rgba(255,255,255,.05)",color:"#6a8aaa",border:`1px solid ${cb}`,borderRadius:9,padding:"8px 14px",fontWeight:600,fontSize:".85rem",cursor:"pointer",transition:"opacity .15s"}}>
                      Salir
                    </button>
                  </div>
                </div>

                <div style={{background:cc,border:`1px solid ${cb}`,borderRadius:12,marginBottom:13,overflow:"hidden"}}>
                  <div style={{borderBottom:`1px solid ${cb}`,padding:"8px 14px",fontSize:".7rem",color:muted,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>
                    👥 Participantes ({Object.keys(participants).length})
                  </div>
                  <div style={{padding:"10px 14px",display:"flex",gap:6,flexWrap:"wrap"}}>
                    {Object.values(participants).length===0
                      ?<span style={{color:"#1a2a3a",fontSize:".8rem"}}>Ninguno todavía</span>
                      :Object.values(participants).map((n,i)=>(
                        <span key={i} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${cb}`,borderRadius:20,padding:"3px 10px",fontSize:".78rem",color:"#5a7a9a"}}>{n}</span>
                      ))}
                  </div>
                </div>

                {GROUPS.map(g=>(
                  <div key={g.id} style={{background:cc,border:`1px solid ${cb}`,borderRadius:13,overflow:"hidden",marginBottom:12}}>
                    <div style={{background:"rgba(0,0,0,.3)",borderBottom:`1px solid ${cb}`,padding:"9px 14px"}}>
                      <span style={{fontWeight:900,fontSize:".9rem",letterSpacing:3,textTransform:"uppercase",color:GC[g.id]}}>GRUPO {g.id}</span>
                    </div>
                    {g.matches.map(m=>{
                      const r=adminResults[m.id]||{h:"",a:""};
                      return(
                        <div key={m.id} className="mrow" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:4,padding:"7px 13px",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                          <div style={{fontSize:".6rem",color:"#243040",gridColumn:"1/-1",textAlign:"center",marginBottom:1}}>{m.date}/06 · {m.venue}</div>
                          <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end",flexDirection:"row-reverse",minWidth:0}}>
                            <span style={{fontSize:".8rem",color:"#9aaabb",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:88}}>{m.h}</span>
                            <span style={{flexShrink:0}}>{FLAGS[m.h]}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0,justifyContent:"center"}}>
                            <input type="number" min="0" max="99" placeholder="–" value={r.h}
                              onChange={e=>setAdminResults(p=>({...p,[m.id]:{...r,h:e.target.value}}))}
                              style={{width:33,height:33,background:"#091409",border:"1.5px solid rgba(0,200,150,.2)",
                                borderRadius:7,color:teal,fontSize:"1rem",fontWeight:900,textAlign:"center",outline:"none",transition:"border-color .15s"}}/>
                            <span style={{color:"#1a2a3a",fontWeight:900,fontSize:".85rem",userSelect:"none",margin:"0 1px"}}>:</span>
                            <input type="number" min="0" max="99" placeholder="–" value={r.a}
                              onChange={e=>setAdminResults(p=>({...p,[m.id]:{...r,a:e.target.value}}))}
                              style={{width:33,height:33,background:"#091409",border:"1.5px solid rgba(0,200,150,.2)",
                                borderRadius:7,color:teal,fontSize:"1rem",fontWeight:900,textAlign:"center",outline:"none",transition:"border-color .15s"}}/>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
                            <span style={{flexShrink:0}}>{FLAGS[m.a]}</span>
                            <span style={{fontSize:".8rem",color:"#9aaabb",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:88}}>{m.a}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <button className="gbtn" onClick={saveAdminResults}
                  style={{background:"linear-gradient(135deg,#2DC653,#1a9e3f)",color:"white",border:"none",borderRadius:9,
                    padding:"12px",fontWeight:800,fontSize:".9rem",cursor:"pointer",width:"100%",marginTop:4,transition:"opacity .15s"}}>
                  💾 Guardar todos los resultados
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
