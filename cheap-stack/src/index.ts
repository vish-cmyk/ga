export interface Env {
  DB: D1Database;
  AI: Ai;
}

type Business = {
  name: string;
  description: string;
  people: string;
  years: string;
  goal: string;
  concern: string;
};

type CoachState = {
  focusArea: string;
  workingDiagnosis: string;
  confidence: "low" | "medium" | "high" | "not_ready";
  facts: string[];
  beliefs: string[];
  evidence: string[];
  inferences: string[];
  unknowns: string[];
  contradictions: string[];
};

type Message = { role: "user" | "assistant"; text: string };

const SYSTEM = [
  "You are SME Business Coach, a calm, commercially minded questioning business partner for SME owners.",
  "Core loop: Understand -> Investigate -> Diagnose -> Challenge -> Decide -> Act -> Review -> Learn.",
  "Use all prior context. Never make the owner repeat information.",
  "Ask one question only when its answer could materially change the diagnosis or recommendation. Do not become a questionnaire.",
  "Separate facts, beliefs, evidence, inferences and unknowns. Notice contradictions.",
  "Do not accept the owner's proposed solution as proven. Test the underlying problem first.",
  "Respect the owner's goal. Do not optimise a different problem.",
  "When a significant decision is near, test options, evidence, assumptions, downside and reversibility.",
  "Be concise, practical and human. Avoid generic management lists.",
  "Return only JSON: {reply,state}. State has focusArea, workingDiagnosis, confidence, facts, beliefs, evidence, inferences, unknowns, contradictions."
].join("\\n");

const PAGE = [
"<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
"<title>SME Business Coach</title>",
"<style>",
"body{margin:0;background:#f5f2eb;color:#1f2937;font-family:system-ui,-apple-system,Segoe UI,sans-serif}.top{padding:18px 5vw;border-bottom:1px solid #ddd7ca;background:#fbfaf7;font-weight:700}.wrap{max-width:1120px;margin:auto;padding:40px 5vw}.grid{display:grid;grid-template-columns:1fr .9fr;gap:28px}.card{background:#fff;border:1px solid #ddd7ca;border-radius:16px;padding:24px;box-shadow:0 8px 24px rgba(0,0,0,.06)}h1,h2{font-family:Georgia,serif}.muted{color:#687386}.field{margin:12px 0}.field label{display:block;font-size:12px;font-weight:700;margin-bottom:5px}.field input,.field textarea{width:100%;box-sizing:border-box;border:1px solid #d8d1c4;border-radius:9px;padding:10px;font:inherit;background:#fcfbf8}.field textarea{min-height:80px}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.btn{border:0;border-radius:9px;padding:12px 15px;font-weight:700;cursor:pointer;background:#243f65;color:#fff}.btn:disabled{opacity:.45}.msg{padding:13px 15px;border-radius:12px;margin:10px 0;line-height:1.55}.coach{background:#f8f6f1;border:1px solid #e0d9cc}.owner{margin-left:auto;background:#243f65;color:#fff;max-width:80%}.who{font-size:10px;letter-spacing:.12em;font-weight:700;opacity:.65;margin-bottom:5px}.side{position:sticky;top:15px;height:max-content}.section{border-top:1px solid #e1dbd0;padding-top:12px;margin-top:12px}.eyebrow{font-size:11px;letter-spacing:.14em;color:#b56232;font-weight:700}small{color:#687386}@media(max-width:800px){.grid{grid-template-columns:1fr}.side{position:static}.two{grid-template-columns:1fr}}",
"</style></head><body><div class='top'>✦ SME Business Coach <span style='float:right;font-weight:400;color:#687386'>Low-cost validation build</span></div>",
"<main class='wrap'><div id='app'></div></main>",
"<script>",
"var state={business:{name:'',description:'',people:'',years:'',goal:'',concern:''},caseId:null,messages:[],coachState:null,busy:false};",
"var ck='sme_coach_client_key_v1',sk='sme_coach_case_id_v1';",
"function key(){var k=localStorage.getItem(ck);if(!k){k=crypto.randomUUID()+crypto.randomUUID();localStorage.setItem(ck,k)}return k}",
"function esc(s){return String(s||'').replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[m]})}",
"function startHtml(){document.getElementById('app').innerHTML='<div class=\"grid\"><section><div class=\"eyebrow\">EARLY VALIDATION</div><h1>Think through the business.<br><span style=\"color:#b56232\">Not just the problem.</span></h1><p class=\"muted\">A persistent Coach that investigates before advising and challenges the thinking behind business decisions.</p></section><section class=\"card\"><div class=\"eyebrow\">START A REAL CASE</div><h2>What are you dealing with?</h2>'+field('Business name','name','Optional')+area('What does the business do?','description','A few sentences are enough.')+'<div class=\"two\">'+field('People','people','e.g. 12 staff')+field('Years','years','e.g. 8')+'</div>'+area('What do you want to achieve?','goal','What would a good outcome look like?')+area('What is happening or worrying you?','concern','Describe it without trying to solve it yet.')+'<button class=\"btn\" id=\"start\" disabled>Start coaching</button></section></div>';wireStart()}",
"function field(l,id,p){return '<div class=\"field\"><label>'+l+'</label><input id=\"'+id+'\" placeholder=\"'+p+'\"></div>'}",
"function area(l,id,p){return '<div class=\"field\"><label>'+l+'</label><textarea id=\"'+id+'\" placeholder=\"'+p+'\"></textarea></div>'}",
"function wireStart(){['name','description','people','years','goal','concern'].forEach(function(id){document.getElementById(id).oninput=function(){state.business[id]=this.value;document.getElementById('start').disabled=!(state.business.description.trim()&&state.business.goal.trim()&&state.business.concern.trim())}});document.getElementById('start').onclick=function(){startCase()}}",
"function workspace(){document.getElementById('app').innerHTML='<div class=\"eyebrow\">ACTIVE CASE</div><h2>'+esc(state.business.name||'Business case')+'</h2><div class=\"grid\"><section class=\"card\"><div id=\"msgs\"></div><form id=\"form\"><textarea id=\"input\" placeholder=\"Continue in your own words…\" style=\"width:100%;min-height:90px;box-sizing:border-box\"></textarea><button class=\"btn\" style=\"margin-top:10px\" id=\"send\">Send</button></form></section><aside class=\"card side\" id=\"side\"></aside></div>';document.getElementById('form').onsubmit=function(e){e.preventDefault();var v=document.getElementById('input').value.trim();if(v)send(v)};render()}",
"async function startCase(){workspace();await send('Let’s work through this. First help me understand what is really happening before we decide what to do.')} ",
"async function send(text){if(state.busy)return;state.messages.push({role:'user',text:text});document.getElementById('input').value='';state.busy=true;render();try{var saved=localStorage.getItem(sk);var res=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({clientKey:key(),caseId:saved&&saved!=='undefined'?saved:null,business:state.business,message:text})});var data=await res.json();if(!res.ok)throw new Error(data.error||'The Coach could not respond.');state.caseId=data.caseId;localStorage.setItem(sk,state.caseId);state.coachState=data.state;state.messages.push({role:'assistant',text:data.reply})}catch(e){state.messages.push({role:'assistant',text:e.message||'The Coach could not respond.'})}finally{state.busy=false;render()}}",
"function render(){var m=document.getElementById('msgs');if(!m)return;m.innerHTML=state.messages.map(function(x){return '<div class=\"msg '+(x.role==='assistant'?'coach':'owner')+'\"><div class=\"who\">'+(x.role==='assistant'?'COACH':'YOU')+'</div>'+esc(x.text).replace(/\\n/g,'<br>')+'</div>'}).join('')+(state.busy?'<div class=\"msg coach\"><div class=\"who\">COACH</div><small>Thinking through the case…</small></div>':'');m.scrollTop=m.scrollHeight;document.getElementById('side').innerHTML=sideHtml();document.getElementById('send').disabled=state.busy}",
"function sideHtml(){if(!state.coachState)return '<div class=\"eyebrow\">WORKING VIEW</div><h2>Building the picture</h2><p class=\"muted\">Facts, beliefs, evidence, unknowns and a working diagnosis will appear here.</p>';var s=state.coachState;return '<div class=\"eyebrow\">WORKING VIEW</div><h2>What the Coach sees</h2><div class=\"section\"><small>FOCUS</small><p>'+esc(s.focusArea)+'</p></div><div class=\"section\"><small>WORKING DIAGNOSIS</small><p>'+esc(s.workingDiagnosis)+'</p><small>Confidence: '+esc(s.confidence)+'</small></div>'+ (s.unknowns&&s.unknowns.length?'<div class=\"section\"><small>STILL UNKNOWN</small><p>'+s.unknowns.slice(0,4).map(esc).join('<br>')+'</p></div>':'')+(s.contradictions&&s.contradictions.length?'<div class=\"section\"><small>CONTRADICTIONS</small><p>'+s.contradictions.slice(0,4).map(esc).join('<br>')+'</p></div>':'')}",
"function restore(){var saved=localStorage.getItem(sk);if(!saved||saved==='undefined')return;fetch('/api/case?clientKey='+encodeURIComponent(key())+'&caseId='+encodeURIComponent(saved)).then(function(r){return r.ok?r.json():null}).then(function(d){if(!d){localStorage.removeItem(sk);return}state.business=d.business;state.caseId=d.caseId;state.messages=d.messages;state.coachState=d.state;workspace()}).catch(function(){})}",
"startHtml();restore();",
"</script></body></html>"
].join("\\n");

function json(data: unknown, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" }});
}

async function ai(env:Env, prompt:string):Promise<string> {
  const response=await env.AI.run("@cf/zai-org/glm-4.7-flash",{messages:[{role:"system",content:SYSTEM},{role:"user",content:prompt}],temperature:0.2,max_tokens:1800});
  if(typeof response==="string") return response;
  const body=response as any;
  return body?.response || body?.result || body?.choices?.[0]?.message?.content || "";
}

function parse(text:string){
  const a=text.indexOf("{"),b=text.lastIndexOf("}");
  if(a<0||b<=a) throw new Error("Invalid Coach response");
  const d=JSON.parse(text.slice(a,b+1)),s=d.state||{};
  return {
    reply:String(d.reply||"").trim(),
    state:{
      focusArea:String(s.focusArea||""),
      workingDiagnosis:String(s.workingDiagnosis||"Not ready to diagnose"),
      confidence:["low","medium","high","not_ready"].includes(s.confidence)?s.confidence:"not_ready",
      facts:Array.isArray(s.facts)?s.facts.map(String).slice(0,8):[],
      beliefs:Array.isArray(s.beliefs)?s.beliefs.map(String).slice(0,8):[],
      evidence:Array.isArray(s.evidence)?s.evidence.map(String).slice(0,8):[],
      inferences:Array.isArray(s.inferences)?s.inferences.map(String).slice(0,8):[],
      unknowns:Array.isArray(s.unknowns)?s.unknowns.map(String).slice(0,8):[],
      contradictions:Array.isArray(s.contradictions)?s.contradictions.map(String).slice(0,8):[]
    } as CoachState
  };
}

async function chat(request:Request,env:Env){
  const input=await request.json() as any;
  if(typeof input.clientKey!=="string"||input.clientKey.length<16||!input.business||typeof input.message!=="string"||!input.message.trim()) return json({error:"Invalid request"},400);
  const id=input.caseId||crypto.randomUUID();
  const row=input.caseId?await env.DB.prepare("SELECT * FROM cases WHERE id=?1 AND client_key=?2").bind(input.caseId,input.clientKey).first<any>():null;
  const history:Message[]=row?.messages_json?JSON.parse(row.messages_json):[];
  const historyText=history.slice(-24).map(m=>(m.role==="user"?"OWNER: ":"COACH: ")+m.text).join("\\n")||"(No prior conversation.)";
  const b=input.business as Business;
  const prompt=["BUSINESS PROFILE","Name: "+(b.name||"(not provided)"),"What it does: "+b.description,"People: "+(b.people||"(not provided)"),"Years: "+(b.years||"(not provided)"),"Owner goal: "+b.goal,"Concern: "+b.concern,"","CONVERSATION HISTORY",historyText,"","NEW OWNER MESSAGE",input.message,"","Coach this case now. Remember everything already known."].join("\\n");
  let result;try{result=parse(await ai(env,prompt))}catch(e){return json({error:e instanceof Error?e.message:"The Coach could not respond."},502)}
  const next=[...history,{role:"user",text:input.message},{role:"assistant",text:result.reply}];
  const now=new Date().toISOString();
  if(!row){
    await env.DB.prepare("INSERT INTO cases (id,client_key,business_name,business_description,people,years,goal,concern,state_json,messages_json,feedback_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,input.clientKey,b.name,b.description,b.people,b.years,b.goal,b.concern,JSON.stringify(result.state),JSON.stringify(next),"[]",now,now).run();
  } else {
    await env.DB.prepare("UPDATE cases SET business_name=?,business_description=?,people=?,years=?,goal=?,concern=?,state_json=?,messages_json=?,updated_at=? WHERE id=? AND client_key=?").bind(b.name,b.description,b.people,b.years,b.goal,b.concern,JSON.stringify(result.state),JSON.stringify(next),now,id,input.clientKey).run();
  }
  return json({caseId:id,reply:result.reply,state:result.state});
}

async function getCase(request:Request,env:Env){
  const u=new URL(request.url),key=u.searchParams.get("clientKey"),id=u.searchParams.get("caseId");
  if(!key||!id)return json({error:"Invalid request"},400);
  const r=await env.DB.prepare("SELECT * FROM cases WHERE id=?1 AND client_key=?2").bind(id,key).first<any>();
  if(!r)return json({error:"Case not found"},404);
  return json({caseId:r.id,business:{name:r.business_name,description:r.business_description,people:r.people,years:r.years,goal:r.goal,concern:r.concern},messages:JSON.parse(r.messages_json||"[]"),state:JSON.parse(r.state_json||"{}")});
}

async function feedback(request:Request,env:Env){
  const x=await request.json() as any;
  if(typeof x.clientKey!=="string"||typeof x.caseId!=="string"||typeof x.rating!=="number")return json({error:"Invalid request"},400);
  const r=await env.DB.prepare("SELECT feedback_json FROM cases WHERE id=?1 AND client_key=?2").bind(x.caseId,x.clientKey).first<any>();
  if(!r)return json({error:"Case not found"},404);
  const list=JSON.parse(r.feedback_json||"[]");list.push({rating:x.rating,comment:String(x.comment||"").slice(0,3000),sawSomethingNew:Boolean(x.sawSomethingNew),wouldReturn:Boolean(x.wouldReturn),createdAt:new Date().toISOString()});
  await env.DB.prepare("UPDATE cases SET feedback_json=?,updated_at=? WHERE id=? AND client_key=?").bind(JSON.stringify(list),new Date().toISOString(),x.caseId,x.clientKey).run();
  return json({saved:true});
}

export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    try{
      const u=new URL(request.url);
      if(request.method==="GET"&&u.pathname==="/")return new Response(PAGE,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
      if(request.method==="POST"&&u.pathname==="/api/chat")return chat(request,env);
      if(request.method==="GET"&&u.pathname==="/api/case")return getCase(request,env);
      if(request.method==="POST"&&u.pathname==="/api/feedback")return feedback(request,env);
      return new Response("Not found",{status:404});
    }catch(e){return json({error:e instanceof Error?e.message:"Unexpected server error"},500)}
  }
};