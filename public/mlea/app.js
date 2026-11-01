/* MLEA Academic Desk — app */
(function(){
"use strict";
/* ---------- constants from the programme brief ---------- */
const DTYPES=["Individual assignment","Group assignment","Individual presentation","Group presentation","Research paper","Case study","Problem set / exercises","Quiz / test","Midterm examination","Final examination","Reading assignment","Other coursework"];
const DSTATUS=["Not announced","Announced","Requirements under review","Not started","Research in progress","Drafting in progress","Under review","Ready for submission","Submitted","Presentation scheduled","Presented","Graded","Revision required","Completed"];
const DONE=new Set(["Submitted","Presented","Graded","Completed"]);
const ACTIVE=new Set(["Requirements under review","Research in progress","Drafting in progress","Under review","Ready for submission","Revision required","Presentation scheduled"]);
const isPres=t=>/presentation/i.test(t||"");
const isExam=t=>/Quiz|Midterm|Final examination/.test(t||"");
const isAssign=t=>t&&!isPres(t)&&!isExam(t)&&t!=="Reading assignment";
const ATT=["Scheduled","Attended","Missed","Excused","Cancelled"];
const STUDY=["Not started","In progress","Studied","Needs recovery"];
const RSTAT=["Not started","Reading","Done","Needs re-read"];
const PREP=["Not started","In progress","Done"];

/* ---------- state ---------- */
const S={courses:[],lectures:[],deliverables:[],readings:[],syllabi:[],materials:[],sessions:[],settings:{capacity:6.5,weekStart:6},loaded:{},db:null,canWrite:true};
const COLS=["courses","lectures","deliverables","readings","syllabi","materials","sessions"];
const UI={calFilter:"all",calPast:false,delFilter:"all",lecCourse:"",editing:null};

/* ---------- dates (Cairo) ---------- */
function todayISO(){try{const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());return p}catch(e){return new Date().toISOString().slice(0,10)}}
const T=todayISO();
const toUTC=s=>{const[y,m,d]=s.split("-").map(Number);return Date.UTC(y,m-1,d)};
const daysBetween=(a,b)=>Math.round((toUTC(b)-toUTC(a))/864e5);
const addDays=(s,n)=>new Date(toUTC(s)+n*864e5).toISOString().slice(0,10);
const validDate=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s);
const fmtD=s=>{if(!validDate(s))return"—";const d=new Date(toUTC(s));return d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"})};
const fmtLong=s=>new Date(toUTC(s)).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
function weekStartOf(s){const dow=new Date(toUTC(s)).getUTCDay();const ws=Number(S.settings.weekStart??6);return addDays(s,-((dow-ws+7)%7))}
function priority(due){if(!validDate(due))return null;const n=daysBetween(T,due);if(n<0)return{k:"over",l:"Overdue",n};if(n<=3)return{k:"crit",l:"Critical",n};if(n<=7)return{k:"high",l:"High",n};if(n<=14)return{k:"med",l:"Medium",n};return{k:"plan",l:"Planned",n}}
const pPill=p=>p?`<span class="pill p-${p.k}" title="${p.n<0?Math.abs(p.n)+" days past":p.n+" days left"}">${p.l}</span>`:`<span class="pill p-neutral">No date</span>`;
const daysTxt=n=>n===0?"today":n===1?"tomorrow":n<0?`${-n}d overdue`:`in ${n}d`;

/* ---------- helpers ---------- */
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const course=id=>S.courses.find(c=>c.id===id);
const cName=id=>{const c=course(id);return c?(c.code?c.code+" · ":"")+c.name:"Unassigned"};
const cShort=id=>{const c=course(id);return c?(c.code||c.name):"—"};
const num=v=>{const n=parseFloat(v);return isFinite(n)?n:null};
function dueOf(d){return validDate(d.due)?d.due:(validDate(d.presDate)?d.presDate:"")}
function remainingHours(r){const h=num(r.estHours);if(h==null)return null;const p=num(r.progress)||0;return Math.max(0,h*(1-Math.min(100,p)/100))}
function toast(m){const h=$("#toastHost");h.innerHTML=`<div class="toast" role="status">${esc(m)}</div>`;clearTimeout(toast.t);toast.t=setTimeout(()=>h.innerHTML="",2400)}
function stDot(st){if(DONE.has(st))return"p-ok";if(st==="Revision required")return"p-crit";if(ACTIVE.has(st))return"p-plan";return"p-neutral"}
function parseMilestones(txt){return String(txt||"").split(/\n/).map(l=>l.trim()).filter(Boolean).map(l=>{const done=/^\[x\]/i.test(l);l=l.replace(/^\[[x ]\]\s*/i,"");const m=l.match(/^(\d{4}-\d{2}-\d{2})\s*[-|:]?\s*(.*)$/);return m?{date:m[1],title:m[2]||"Milestone",done}:null}).filter(Boolean)}

/* ---------- schemas for the editing drawer ---------- */
const courseSel={type:"course"};
const SCHEMA={
 courses:{label:"Course",fields:[
  {g:"Course",k:"name",l:"Course name",type:"text",req:1,wide:1},{k:"code",l:"Code",type:"text"},{k:"lecturer",l:"Lecturer",type:"text"},
  {k:"term",l:"Term / semester",type:"text"},{k:"credits",l:"Credits",type:"number"},{k:"color",l:"Colour",type:"select",opts:["Teal","Indigo","Amber","Rose","Violet","Green","Sky","Orange"]},
  {k:"gradingNotes",l:"Official grading rules (copy from syllabus)",type:"textarea",wide:1,hint:"Only what the university states. Leave blank until confirmed."},
  {k:"notes",l:"Notes",type:"textarea",wide:1}]},
 lectures:{label:"Lecture",fields:[
  {g:"Session",k:"courseId",l:"Course",...courseSel,req:1,wide:1},{k:"date",l:"Date",type:"date",req:1},{k:"no",l:"Lecture no.",type:"number"},
  {k:"start",l:"Start",type:"time"},{k:"end",l:"End",type:"time"},{k:"topic",l:"Topic",type:"text",wide:1},
  {k:"mode",l:"Mode",type:"select",opts:["In person","Online","Recorded"]},{k:"venue",l:"Venue / link",type:"text"},
  {g:"Attendance & study",k:"attendance",l:"Attendance",type:"select",opts:ATT},{k:"study",l:"Study completion",type:"select",opts:STUDY},
  {k:"studyHours",l:"Study time needed (h)",type:"number"},{k:"materials",l:"Slides / materials",type:"text"},
  {k:"notes",l:"Notes and key concepts",type:"textarea",wide:1}]},
 deliverables:{label:"Deliverable",fields:[
  {g:"Register",k:"did",l:"Deliverable ID",type:"text",hint:"Auto-filled; edit if the course uses its own code."},{k:"courseId",l:"Course",...courseSel,req:1},
  {k:"title",l:"Title",type:"text",req:1,wide:1},{k:"type",l:"Type",type:"select",opts:DTYPES,req:1},{k:"responsibility",l:"Responsibility",type:"select",opts:["Individual","Group"]},
  {k:"description",l:"Description and academic requirements",type:"textarea",wide:1},
  {k:"assigned",l:"Assigned date",type:"date"},{k:"due",l:"Official deadline",type:"date"},{k:"dueTime",l:"Deadline time",type:"time"},{k:"internalDeadline",l:"Internal target date",type:"date",hint:"Your own buffer before the official deadline."},
  {k:"weight",l:"Weight in course grade (%)",type:"number",hint:"From the syllabus only. Blank if not stated."},{k:"format",l:"Submission format",type:"select",opts:["Word","PDF","PowerPoint","Excel","Oral presentation","Online quiz","Written exam","Other"]},
  {k:"members",l:"Group members",type:"text",wide:1,show:r=>r.responsibility==="Group"||/Group/.test(r.type||"")},
  {k:"readings",l:"Required readings and references",type:"textarea",wide:1},
  {g:"Progress",k:"status",l:"Submission status",type:"select",opts:DSTATUS},{k:"progress",l:"Progress (%)",type:"number"},
  {k:"estHours",l:"Estimated total effort (h)",type:"number"},{k:"submittedOn",l:"Actual submission date",type:"date"},
  {k:"outstanding",l:"Outstanding tasks",type:"textarea",wide:1,hint:"One task per line."},
  {g:"Academic workspace",k:"summary",l:"Instructions summary",type:"textarea",wide:1,show:r=>!isExam(r.type)},
  {k:"researchQuestion",l:"Research question and expected outcome",type:"textarea",wide:1,show:r=>!isExam(r.type)},
  {k:"concepts",l:"Legal and economic concepts",type:"textarea",wide:1,show:r=>!isExam(r.type)},
  {k:"argument",l:"Argument outline",type:"textarea",wide:1,show:r=>!isExam(r.type)&&!isPres(r.type)},
  {k:"milestones",l:"Internal milestones",type:"textarea",wide:1,hint:"One per line: 2026-11-10 Outline done. Prefix [x] when complete. They appear on the calendar."},
  {k:"versions",l:"Submitted versions log",type:"textarea",wide:1,show:r=>!isExam(r.type)},
  {g:"Presentation",k:"presDate",l:"Presentation date",type:"date",show:r=>isPres(r.type)},{k:"duration",l:"Required duration (min)",type:"number",show:r=>isPres(r.type)},
  {k:"slides",l:"Number of slides",type:"number",show:r=>isPres(r.type)},{k:"slideStatus",l:"Slide preparation",type:"select",opts:PREP,show:r=>isPres(r.type)},
  {k:"notesStatus",l:"Speaker notes",type:"select",opts:PREP,show:r=>isPres(r.type)},{k:"rehearsal",l:"Rehearsal",type:"select",opts:["Not started","Rehearsed once","Rehearsed twice+","Ready"],show:r=>isPres(r.type)},
  {k:"instructions",l:"Lecturer instructions",type:"textarea",wide:1,show:r=>isPres(r.type)},{k:"outline",l:"Presentation outline",type:"textarea",wide:1,show:r=>isPres(r.type)},
  {k:"speakerNotes",l:"Speaker notes",type:"textarea",wide:1,show:r=>isPres(r.type)},{k:"questions",l:"Anticipated questions",type:"textarea",wide:1,show:r=>isPres(r.type)},
  {g:"Examination readiness",k:"examTime",l:"Exam time",type:"time",show:r=>isExam(r.type)},{k:"venue",l:"Venue",type:"text",show:r=>isExam(r.type)},
  {k:"examScope",l:"Topics / lectures examined",type:"textarea",wide:1,show:r=>isExam(r.type)},
  {k:"revisionPct",l:"Revision coverage (%)",type:"number",show:r=>isExam(r.type)},{k:"practice",l:"Practice questions done",type:"number",show:r=>isExam(r.type)},
  {k:"confidence",l:"Confidence (1–5)",type:"select",opts:["1","2","3","4","5"],show:r=>isExam(r.type)},
  {g:"Outcome",k:"maxGrade",l:"Maximum possible grade",type:"number"},{k:"grade",l:"Grade received",type:"number"},
  {k:"feedback",l:"Lecturer feedback",type:"textarea",wide:1},{k:"followUp",l:"Follow-up actions",type:"textarea",wide:1}]},
 readings:{label:"Reading",fields:[
  {g:"Reading",k:"courseId",l:"Course",...courseSel,req:1,wide:1},{k:"title",l:"Title",type:"text",req:1,wide:1},{k:"author",l:"Author(s)",type:"text"},
  {k:"kind",l:"Kind",type:"select",opts:["Required reading","Recommended reading","Research source","Case / judgment","Statute / regulation","Other"]},
  {k:"deliverable",l:"Supports deliverable",type:"deliverable"},{k:"due",l:"Read by",type:"date"},
  {k:"status",l:"Status",type:"select",opts:RSTAT},{k:"estHours",l:"Estimated time (h)",type:"number"},
  {k:"citation",l:"Citation / link",type:"text",wide:1},{k:"notes",l:"Key points",type:"textarea",wide:1}]}
};

/* ---------- backend: Supabase auth, data, files ---------- */
const CFG=window.MLEA_CONFIG||{};
const APP_URL=/^https?:/.test(location.protocol)?location.origin+location.pathname:(CFG.SITE_URL||undefined);
const sb=(window.supabase&&CFG.SUPABASE_URL&&!/YOUR-PROJECT|YOUR-ANON-KEY/.test(CFG.SUPABASE_URL+CFG.SUPABASE_ANON_KEY))?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY):null;
/* Fields each student keeps privately on shared programme items. Everything else on a shared item is maintained by the admin. */
const PERSONAL={
  lectures:["attendance","study","studyHours","notes","completedAt"],
  deliverables:["status","progress","estHours","submittedOn","outstanding","summary","researchQuestion","concepts","argument","milestones","versions","members","internalDeadline","slideStatus","notesStatus","rehearsal","outline","speakerNotes","questions","revisionPct","practice","confidence","grade","feedback","followUp","completedAt"],
  readings:["status","notes","completedAt"],
  settings:["capacity","weekStart","name"],
  courses:[],syllabi:[],materials:[]
};
const PRIVATE=new Set(["sessions"]);
const STORE={shared:{},mine:{},listeners:{},docListeners:{},loaded:false};
const uuid=()=>(crypto.randomUUID?crypto.randomUUID():"id-"+Date.now().toString(36)+Math.random().toString(36).slice(2,10));
const pick=(o,ks)=>{const r={};ks.forEach(k=>{if(o&&o[k]!==undefined)r[k]=o[k]});return r};
const omit=(o,ks)=>{const r=Object.assign({},o);ks.forEach(k=>delete r[k]);return r};
const sh=c=>(STORE.shared[c]=STORE.shared[c]||{});const mi=c=>(STORE.mine[c]=STORE.mine[c]||{});
function isOwn(col,id){if(col==="settings")return false;if(PRIVATE.has(col))return true;const m=mi(col)[id];if(m&&m.own)return true;return !sh(col)[id]&&!!m}
function mergedDoc(col,id){
  const s=sh(col)[id],m=mi(col)[id];
  if(PRIVATE.has(col))return m||null;
  if(s)return Object.assign({},s,pick(m||{},PERSONAL[col]||[]));
  if(m&&(m.own||col==="settings"))return Object.assign({},m);
  return null;
}
function snapOf(col){const ids=new Set([...Object.keys(sh(col)),...Object.keys(mi(col))]);const docs=[];ids.forEach(id=>{const d=mergedDoc(col,id);if(d)docs.push({id,exists:true,data:()=>d})});return{docs,metadata:{fromCache:false}}}
function docSnapOf(col,id){const d=mergedDoc(col,id);return{id,exists:!!d,data:()=>d||undefined,metadata:{fromCache:false}}}
function emit(col){const s=snapOf(col);(STORE.listeners[col]||[]).forEach(f=>{try{f(s)}catch(e){console.error(e)}});Object.keys(STORE.docListeners).forEach(k=>{if(k.split("/")[0]===col){const[c,i]=k.split("/");STORE.docListeners[k].forEach(f=>{try{f(docSnapOf(c,i))}catch(e){console.error(e)}})}})}
function fail(error){return{code:/row-level security|permission/i.test(error.message||"")?"not_allowed":"save_failed",message:error.message}}
async function writeShared(col,id,data){const{error}=await sb.from("shared_docs").upsert({collection:col,id,data,updated_at:new Date().toISOString()});if(error)throw fail(error);sh(col)[id]=data}
async function writeMine(col,id,data){const{error}=await sb.from("user_docs").upsert({user_id:S.uid,collection:col,id,data,updated_at:new Date().toISOString()});if(error)throw fail(error);mi(col)[id]=data}
async function delShared(col,id){const{error}=await sb.from("shared_docs").delete().match({collection:col,id});if(error)throw fail(error);delete sh(col)[id]}
async function delMine(col,id){const{error}=await sb.from("user_docs").delete().match({user_id:S.uid,collection:col,id});if(error)throw fail(error);delete mi(col)[id]}
async function setDoc(col,id,body){
  body=JSON.parse(JSON.stringify(body||{}));delete body.id;
  const P=PERSONAL[col]||[];
  if(PRIVATE.has(col)){await writeMine(col,id,body)}
  else if(isOwn(col,id)||(!S.isAdmin&&!sh(col)[id]&&col!=="settings")){body.own=true;await writeMine(col,id,body)}
  else{
    if(S.isAdmin)await writeShared(col,id,omit(body,P));
    const per=pick(body,P);
    if(Object.keys(per).length||mi(col)[id])await writeMine(col,id,Object.assign({},pick(mi(col)[id]||{},P),per));
  }
  emit(col);
}
async function delDoc(col,id){
  if(isOwn(col,id)){await delMine(col,id)}
  else if(S.isAdmin){await delShared(col,id);if(mi(col)[id])await delMine(col,id)}
  else throw{code:"admin only",message:"Only the programme admin can remove shared items."};
  emit(col);
}
function docRef(col,id){return{id,path:col+"/"+id,
  set:b=>setDoc(col,id,b),
  update:p=>setDoc(col,id,Object.assign({},mergedDoc(col,id)||{},p)),
  delete:()=>delDoc(col,id),get:async()=>docSnapOf(col,id),
  onSnapshot(cb){const k=col+"/"+id;(STORE.docListeners[k]=STORE.docListeners[k]||[]).push(cb);if(STORE.loaded)cb(docSnapOf(col,id));return()=>{}}}}
const DB={
  collection:col=>({path:col,
    onSnapshot(cb){(STORE.listeners[col]=STORE.listeners[col]||[]).push(cb);if(STORE.loaded)cb(snapOf(col));return()=>{}},
    add:async b=>{const id=uuid();await setDoc(col,id,b);return docRef(col,id)},
    doc:id=>docRef(col,id||uuid())}),
  doc:path=>{const i=path.indexOf("/");return docRef(path.slice(0,i),path.slice(i+1))}
};
async function fetchAll(table,filter){let out=[],from=0;for(;;){let q=sb.from(table).select("collection,id,data").range(from,from+999);if(filter)q=filter(q);const{data,error}=await q;if(error)throw error;out=out.concat(data||[]);if(!data||data.length<1000)break;from+=1000}return out}
async function loadAll(){
  const a=await fetchAll("shared_docs"),b=await fetchAll("user_docs",q=>q.eq("user_id",S.uid));
  STORE.shared={};STORE.mine={};a.forEach(r=>{sh(r.collection)[r.id]=r.data});b.forEach(r=>{mi(r.collection)[r.id]=r.data});
  STORE.loaded=true;new Set([...COLS,"settings",...Object.keys(STORE.listeners)]).forEach(emit);
  refreshSignedUrls();
}
/* files: private bucket, short-lived signed links */
const URLS={};
function splitAsset(id){return String(id).startsWith("private:")?["private",String(id).slice(8)]:["files",String(id)]}
function blobUrl(id){return URLS[id]||"#"}
async function refreshSignedUrls(){
  if(!sb)return;const ids=new Set();const st=mergedDoc("settings","main")||{};Object.values(st.logos||{}).forEach(x=>ids.add(x));
  S.syllabi.forEach(x=>x.assetId&&ids.add(x.assetId));S.materials.forEach(x=>x.assetId&&ids.add(x.assetId));
  const need=[...ids].filter(x=>x&&!URLS[x]);if(!need.length)return;let n=0;
  for(const b of["files","private"]){const list=need.filter(x=>splitAsset(x)[0]===b);if(!list.length)continue;const paths=list.map(x=>splitAsset(x)[1]);
    const{data}=await sb.storage.from(b).createSignedUrls(paths,43200);(data||[]).forEach(x=>{if(x.signedUrl){URLS[(b==="private"?"private:":"")+x.path]=x.signedUrl;n++}})}
  if(n)render();
}
const ASSETS={
  upload:async file=>{const name=uuid()+"-"+String(file.name||"file").replace(/[^\w.\-]+/g,"_").slice(-80);const bucket=S.isAdmin?"files":"private";const path=S.isAdmin?name:S.uid+"/"+name;const{error}=await sb.storage.from(bucket).upload(path,file,{contentType:file.type||undefined,upsert:false});if(error)throw{code:"upload_failed",message:error.message};setTimeout(refreshSignedUrls,400);return{id:(bucket==="private"?"private:":"")+path,url:""}},
  delete:async id=>{const[b,p]=splitAsset(id);await sb.storage.from(b).remove([p]);delete URLS[id]}
};
const DL={save:async({filename,data})=>{const blob=data instanceof Blob?data:new Blob([data]);const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return{status:"saved"}}};
/* AI: calls the "ai" edge function, which holds the Anthropic key server-side */
async function aiCall(input){
  const messages=typeof input==="string"?[{role:"user",content:input}]:input;
  const{data,error}=await sb.functions.invoke("ai",{body:{messages}});
  if(error){const st=error.context&&error.context.status;throw{code:st===403?"not_granted":st===429?"rate_limited":"error",message:error.message}}
  return{text:String(data&&data.text||""),truncated:!!(data&&data.truncated)};
}
const SAMPLE=Object.assign(async(input,opts)=>{const r=await aiCall(input);if(opts&&opts.onText)opts.onText({text:r.text,delta:r.text});return r},{
  json:async input=>{const r=await aiCall(typeof input==="string"?input+"\n\nReply with the JSON only, no other text.":input);const m=r.text.match(/\{[\s\S]*\}/);try{return JSON.parse(m?m[0]:r.text)}catch(e){throw{code:"invalid_json",text:r.text}}},
  limits:async()=>({})});

/* ---------- auth screens ---------- */
function authShell(inner){return `<div class="auth"><div class="authcard"><div class="authbrand"><div class="mono-mark" aria-hidden="true">M</div><div><b>MLEA Academic Desk</b><span class="sub">Cairo University · FEPS &nbsp;·&nbsp; Universität Hamburg · Faculty of Law</span></div></div>${inner}<div id="authMsg" class="authmsg" role="alert"></div></div><p class="authfoot">Your records are private to your account. The programme admin maintains the shared timetable and assessments.</p></div>`}
function fld(id,label,type,extra){return `<div class="f"><label for="${id}">${label}</label><input id="${id}" type="${type}" ${extra||""}></div>`}
function showAuth(mode,msg){
  $("#appRoot").hidden=true;const h=$("#authHost");
  const forms={
    signin:`<h2>Sign in</h2><form id="authForm" class="authform">${fld("aEmail","Email","email",'autocomplete="email" required')}${fld("aPass","Password","password",'autocomplete="current-password" required')}<button class="primary" type="submit">Sign in</button></form><div class="authlinks"><button class="link" data-mode="signup">Create account</button><button class="link" data-mode="forgot">Forgot password?</button></div>`,
    signup:`<h2>Create your account</h2><p class="sub" style="margin:0 0 12px">You get your own private dashboard. Use an email you can open; we send a confirmation link.</p><form id="authForm" class="authform">${fld("aName","Full name","text",'autocomplete="name" required')}${fld("aEmail","Email","email",'autocomplete="email" required')}${fld("aPass","Password (at least 8 characters)","password",'autocomplete="new-password" minlength="8" required')}${fld("aPass2","Repeat password","password",'autocomplete="new-password" minlength="8" required')}<button class="primary" type="submit">Create account</button></form><div class="authlinks"><button class="link" data-mode="signin">I already have an account</button></div>`,
    forgot:`<h2>Reset your password</h2><form id="authForm" class="authform">${fld("aEmail","Email","email",'autocomplete="email" required')}<button class="primary" type="submit">Send reset link</button></form><div class="authlinks"><button class="link" data-mode="signin">Back to sign in</button></div>`,
    reset:`<h2>Choose a new password</h2><form id="authForm" class="authform">${fld("aPass","New password (at least 8 characters)","password",'autocomplete="new-password" minlength="8" required')}${fld("aPass2","Repeat password","password",'autocomplete="new-password" minlength="8" required')}<button class="primary" type="submit">Save password</button></form>`};
  h.innerHTML=authShell(forms[mode]);
  const say=(t,ok)=>{const m=$("#authMsg");m.textContent=t||"";m.className="authmsg"+(ok?" ok":"")};
  if(msg)say(msg.t,msg.ok);
  h.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>showAuth(b.dataset.mode));
  $("#authForm").addEventListener("submit",async e=>{
    e.preventDefault();const btn=e.target.querySelector("button[type=submit]");btn.disabled=true;say("");
    const email=($("#aEmail")||{}).value,pass=($("#aPass")||{}).value,pass2=($("#aPass2")||{}).value;
    try{
      if(mode==="signin"){const{data,error}=await sb.auth.signInWithPassword({email:email.trim(),password:pass});if(error)throw error;return startApp(data.session)}
      if((mode==="signup"||mode==="reset")&&pass!==pass2){say("The two passwords don't match.");btn.disabled=false;return}
      if(mode==="signup"){const{data,error}=await sb.auth.signUp({email:email.trim(),password:pass,options:{data:{full_name:$("#aName").value.trim()},emailRedirectTo:APP_URL}});if(error)throw error;
        if(data.session)return startApp(data.session);showAuth("signin",{t:"Account created. Check your inbox for the confirmation link, then sign in.",ok:true});return}
      if(mode==="forgot"){const{error}=await sb.auth.resetPasswordForEmail(email.trim(),{redirectTo:APP_URL});if(error)throw error;say("If that email has an account, a reset link is on its way.",true)}
      if(mode==="reset"){const{error}=await sb.auth.updateUser({password:pass});if(error)throw error;const{data}=await sb.auth.getSession();if(data.session)return startApp(data.session);showAuth("signin",{t:"Password saved. Sign in with it now.",ok:true});return}
    }catch(err){const m=String(err&&err.message||err);
      say(/Invalid login/i.test(m)?"Email or password is incorrect.":/not confirmed/i.test(m)?"Confirm your email first: open the link we sent you.":/Database error saving new user/i.test(m)?"The account couldn't be created. Try again in a minute.":/already registered/i.test(m)?"An account with this email already exists. Sign in or reset your password.":/rate limit/i.test(m)?"Too many attempts. Wait a few minutes and try again.":m)}
    btn.disabled=false;
  });
  const first=h.querySelector("input");if(first)first.focus();
}
function showSetupMissing(){$("#appRoot").hidden=true;if(!window.supabase){$("#authHost").innerHTML=authShell(`<h2>Can't connect</h2><p>The sign-in service didn't load. Check your internet connection, then reload this page.</p>`);return}$("#authHost").innerHTML=authShell(`<h2>Setup needed</h2><p>Add your Supabase project URL and anon key to <code>config.js</code>, then reload. The README explains each step.</p>`)}
async function boot(){
  if(!sb){showSetupMissing();return}
  sb.auth.onAuthStateChange((ev)=>{if(ev==="PASSWORD_RECOVERY")showAuth("reset");if(ev==="SIGNED_OUT")location.replace(location.pathname)});
  if(/type=recovery/.test(location.hash))return;
  const{data:{session}}=await sb.auth.getSession();
  if(!session){showAuth("signin");return}
  startApp(session);
}
let started=false;
async function startApp(session){
  if(started)return;started=true;
  S.uid=session.user.id;S.email=session.user.email;
  const{data:prof}=await sb.from("profiles").select("*").eq("id",S.uid).maybeSingle();
  S.profile=prof||{role:"student",full_name:(session.user.user_metadata||{}).full_name||""};S.isAdmin=S.profile.role==="admin";
  document.body.classList.toggle("student",!S.isAdmin);
  $("#authHost").innerHTML="";$("#appRoot").hidden=false;
  if(/type=recovery|access_token/.test(location.hash))history.replaceState(null,"",location.pathname+"#today");
  S.db=DB;S.assets=ASSETS;S.downloads=DL;
  S.sample=(CFG.AI_ENABLED&&(CFG.AI_ROLES||["admin"]).includes(S.profile.role))?SAMPLE:null;
  if(TM.state&&TM.state.running)tmTick();
  for(const c of COLS)DB.collection(c).onSnapshot(snap=>{S[c]=snap.docs.map(d=>Object.assign({id:d.id},d.data()));S.loaded[c]=true;render();if(c==="materials"&&UI.editing&&!(UI.ai&&UI.ai.busy))repaintAI()});
  DB.doc("settings/main").onSnapshot(s=>{S.settings=Object.assign({capacity:6.5,weekStart:6},s.exists?s.data():{});render()});
  render();$("#statusLine").textContent="Loading your records…";
  try{await loadAll();$("#statusLine").textContent=""}catch(e){$("#statusLine").textContent="Couldn't load records: "+(e.message||e)+". Check your connection and reload."}
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!UI.editing)loadAll().catch(()=>{})});
  setInterval(()=>{if(!document.hidden&&!UI.editing&&!$("#drawerHost").innerHTML)loadAll().catch(()=>{})},180000);
}

/* ---------- account, students, import/export ---------- */
function initials(){const n=(S.settings.name||S.profile&&S.profile.full_name||S.email||"?").trim();return n.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
function exportData(){
  const out={app:"MLEA Academic Desk",version:1,exportedAt:new Date().toISOString(),collections:{}};
  COLS.forEach(c=>{out.collections[c]=S[c].map(x=>Object.assign({},x))});out.collections.settings=[Object.assign({id:"main"},S.settings)];
  DL.save({filename:"mlea-data-"+T+".json",data:new Blob([JSON.stringify(out,null,1)],{type:"application/json"})});toast("Export saved");
}
async function importData(file){
  let j;try{j=JSON.parse(await file.text())}catch(e){toast("That file isn't a valid export");return}
  const cols=j&&j.collections;if(!cols){toast("That file isn't an MLEA export");return}
  let n=0;const order=["courses","lectures","deliverables","readings","syllabi","materials","sessions","settings"];
  for(const c of order){for(const d of(cols[c]||[])){const id=String(d.id||uuid());const body=Object.assign({},d);delete body.id;
    if(c==="settings")delete body.logos;if(body.assetId)delete body.assetId;
    try{await setDoc(c,id,body);n++;if(n%20===0)$("#statusLine").textContent=`Importing… ${n} records`}catch(e){toast("Import stopped: "+(e.message||e.code));$("#statusLine").textContent="";return}}}
  $("#statusLine").textContent="";toast(`Imported ${n} records. Re-upload logos and PDF files; file attachments don't carry over.`);
}
function openAccount(){
  UI.sheet="account";
  openSheet("Account",`<div class="panel" style="box-shadow:none;background:var(--raise);margin-bottom:14px"><b>${esc(S.settings.name||S.profile.full_name||"")}</b><div class="sub">${esc(S.email)} · ${S.isAdmin?"Programme admin":"Student"}</div></div>
   <form id="pwForm"><fieldset><legend>Change password</legend>${fld("npw","New password","password",'minlength="8" autocomplete="new-password" required')}${fld("npw2","Repeat password","password",'minlength="8" autocomplete="new-password" required')}<div class="f wide"><button class="primary" type="submit" style="justify-self:start;width:max-content">Update password</button></div></fieldset></form>
   <fieldset><legend>Your data</legend><div class="f wide"><div class="acts"><button id="expBtn">${ico("download",16)} Export my data</button><label class="btn iconbtn" for="impFile" style="cursor:pointer">${ico("clip",16)} Import data</label><input id="impFile" type="file" accept=".json,application/json" hidden></div><span class="hint">${S.isAdmin?"Import a JSON export from the Claude version to load the programme's courses, timetable and tasks.":"Import adds records to your own private space."}</span></div></fieldset>
   ${S.isAdmin?`<div class="acts"><button data-close id="goStudents">${ico("users",16)} Students &amp; access</button></div>`:""}
   <div class="acts" style="margin-top:14px"><button class="danger" id="signOut">Sign out</button></div>`,h=>{
    h.querySelector("#pwForm").addEventListener("submit",async e=>{e.preventDefault();const a=$("#npw").value,b=$("#npw2").value;if(a!==b){toast("The passwords don't match");return}const{error}=await sb.auth.updateUser({password:a});toast(error?"Not changed: "+error.message:"Password updated");if(!error)e.target.reset()});
    h.querySelector("#expBtn").onclick=exportData;
    h.querySelector("#impFile").onchange=e=>{const f=e.target.files&&e.target.files[0];if(f){closeSheet();importData(f)}};
    const gs=h.querySelector("#goStudents");if(gs)gs.onclick=()=>{closeSheet();location.hash="#students"};
    h.querySelector("#signOut").onclick=async()=>{await sb.auth.signOut();location.replace(location.pathname)};
  },true);
}
UI.students={allowed:null,profiles:null,err:""};
async function loadStudents(){
  const[a,p]=await Promise.all([sb.from("allowed_emails").select("*").order("email"),sb.from("profiles").select("id,email,full_name,role,created_at").order("created_at")]);
  UI.students={allowed:a.data||[],profiles:p.data||[],err:(a.error||p.error||{}).message||""};render();
}
function vStudents(){
  if(!S.isAdmin)return`<div class="empty">Only the programme admin can manage access.</div>`;
  const st=UI.students;if(!st.allowed){if(!st.loading){st.loading=true;loadStudents()}return`<div class="busy"><span class="spin"></span>Loading students…</div>`}
  const reg=new Map(st.profiles.map(p=>[String(p.email||"").toLowerCase(),p]));const listed=new Set(st.allowed.map(a=>a.email.toLowerCase()));st.profiles.forEach(p=>{if(p.email&&!listed.has(String(p.email).toLowerCase()))st.allowed.push({email:String(p.email).toLowerCase(),role:p.role,unlisted:true})});
  return `<div class="panel" style="margin-bottom:16px"><h3>Add people</h3><div class="f wide"><label for="addEmails">Email addresses (one per line or separated by commas)</label><textarea id="addEmails" placeholder="student1@example.com&#10;student2@example.com"></textarea></div>
   <div class="acts"><select id="addRole" aria-label="Role" style="font-size:14px;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--fg)"><option value="student">Student</option><option value="admin">Admin</option></select><button class="primary" id="addBtn">Add to list</button></div>
   <p class="note">Anyone with the app link can create an account and gets their own private dashboard. List an email here as <b>Admin</b> to give that person admin rights when they sign up; for people already registered, change the role in the table.</p></div>
   ${st.err?`<div class="alert">${esc(st.err)}</div>`:""}
   <div class="tablebox"><table><thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Account</th><th></th></tr></thead><tbody>${st.allowed.map(a=>{const p=reg.get(a.email.toLowerCase());return`<tr><td>${esc(a.email)}</td><td>${esc(p&&p.full_name||"")}</td><td>${p?`<select data-role="${p.id}">${["student","admin"].map(r=>`<option ${p.role===r?"selected":""}>${r}</option>`).join("")}</select>`:esc(a.role)}</td><td>${p?'<span class="pill p-ok">Registered</span>':'<span class="pill p-neutral">Not yet</span>'}</td><td>${(p&&p.id===S.uid)||a.unlisted?"":UI.rmEmail===a.email?`<span class="confirm"><button class="danger" data-rmyes="${esc(a.email)}">Remove</button><button data-rmno>Keep</button></span>`:`<button class="link" data-rm="${esc(a.email)}">Remove</button>`}</td></tr>`}).join("")||`<tr><td colspan="5" class="muted">No one has signed up yet.</td></tr>`}</tbody></table></div>
   <p class="note">To close an account, delete the user in Supabase under Authentication → Users; their private records are deleted with it.</p>`;
}
function bindStudents(v){
  const ab=v.querySelector("#addBtn");if(ab)ab.onclick=async()=>{const emails=[...new Set(($("#addEmails").value||"").split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(x=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)))];if(!emails.length){toast("Enter at least one valid email");return}
    const role=$("#addRole").value;const{error}=await sb.from("allowed_emails").upsert(emails.map(email=>({email,role})));if(error){toast("Not added: "+error.message);return}toast(`${emails.length} added`);UI.students.allowed=null;render()};
  v.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{UI.rmEmail=b.dataset.rm;render()});
  v.querySelectorAll("[data-rmno]").forEach(b=>b.onclick=()=>{UI.rmEmail=null;render()});
  v.querySelectorAll("[data-rmyes]").forEach(b=>b.onclick=async()=>{const{error}=await sb.from("allowed_emails").delete().eq("email",b.dataset.rmyes);UI.rmEmail=null;toast(error?"Not removed: "+error.message:"Removed");UI.students.allowed=null;render()});
  v.querySelectorAll("[data-role]").forEach(s=>s.onchange=async()=>{const{error}=await sb.from("profiles").update({role:s.value}).eq("id",s.dataset.role);toast(error?"Not changed: "+error.message:"Role updated")});
}
function fieldLocked(k){const E=UI.editing;if(!E||S.isAdmin||!E.id||!sb)return false;if(isOwn(E.col,E.id))return false;return!(PERSONAL[E.col]||[]).includes(k)}
function canDelete(E){return S.isAdmin||isOwn(E.col,E.id)}

const allLoaded=()=>COLS.every(c=>S.loaded[c]);
async function save(col,rec){
  if(!S.db){toast("Sign in to save");return false}
  const body={};for(const[k,v]of Object.entries(rec)){if(k!=="id"&&v!==undefined)body[k]=v}
  body.updatedAt=T;
  try{
    if(rec.id){await S.db.doc(col+"/"+rec.id).set(body)}else{body.createdAt=T;await S.db.collection(col).add(body)}
    return true;
  }catch(e){
    if(e&&e.code==="invalid_argument"&&!rec.id){S.canWrite=false}
    toast(e&&e.code==="quota_exceeded"?"Storage is full. Delete old records to add new ones.":"Not saved: "+(e&&e.code||"error"));return false}
}
async function quickUpdate(col,id,patch){
  if(!S.db)return;const r=S[col].find(x=>x.id===id);if(!r)return;
  const next=Object.assign({},r,patch);markCompletion(col,r,next);
  try{await S.db.doc(col+"/"+id).update(Object.assign({},patch,{updatedAt:T},next.completedAt!==r.completedAt?{completedAt:next.completedAt}:{}))}catch(e){toast("Not saved: "+(e.code||"error"))}
}
function markCompletion(col,prev,next){
  const done=col==="deliverables"?DONE.has(next.status):col==="readings"?next.status==="Done":col==="lectures"?next.study==="Studied":false;
  const was=col==="deliverables"?DONE.has(prev.status):col==="readings"?prev.status==="Done":col==="lectures"?prev.study==="Studied":false;
  if(done&&!was)next.completedAt=T; if(!done)next.completedAt=null;
}

/* ---------- routing ---------- */
const NAV_MAIN=[["today","Today","home"],["calendar","Calendar","cal"],["work","Tasks","work"],["lectures","Lectures","lect"],["assistant","Assistant","spark"]];
const NAV_MORE=[["exams","Exam readiness","grad"],["readings","Research & reading","book"],["grades","Grades","chart"],["report","Weekly report","report"],["courses","Courses & settings","gear"]];
const ALLV=[...NAV_MAIN,...NAV_MORE,["students","Students & access","users"]];
function navMain(){return NAV_MAIN.filter(v=>v[0]!=="assistant"||S.sample)}
function navMore(){return S.isAdmin?[...NAV_MORE,["students","Students & access","users"]]:NAV_MORE}
function current(){let h=(location.hash||"").slice(1);if(h==="deliverables")h="work";if(h==="dashboard")h="report";return ALLV.some(v=>v[0]===h)?h:"today"}
window.addEventListener("hashchange",()=>{render();window.scrollTo(0,0)});
const INST=[{k:"feps",name:"Cairo University",sub:"Faculty of Economics and Political Science",short:"Cairo University · FEPS"},{k:"uhh",name:"Universität Hamburg",sub:"Faculty of Law",short:"Universität Hamburg · Law"}];
function render(){
  const cur=current();
  const L=S.settings.logos||{};
  $("#rail").innerHTML=`<div class="rb"><b>MLEA Academic Desk</b><span class="sub">${esc(fmtLong(T))}</span></div>
   ${navMain().map(([k,l,i])=>`<a href="#${k}" ${k===cur?'aria-current="page"':""}>${ico(i,19)}${l}</a>`).join("")}
   <div class="sec">More</div>${navMore().map(([k,l,i])=>`<a href="#${k}" ${k===cur?'aria-current="page"':""}>${ico(i,19)}${l}</a>`).join("")}
   <div class="inst-r">${INST.map(i=>`<div>${L[i.k]?`<img src="${esc(blobUrl(L[i.k]))}" alt="${esc(i.name)}"><br>`:""}<b style="color:var(--fg)">${esc(i.name)}</b><br>${esc(i.sub)}</div>`).join("")}</div>`;
  const inMore=navMore().some(v=>v[0]===cur);$("#tabbar").style.setProperty("--tabs",navMain().length+1);$("#acctBtn").textContent=initials();
  $("#tabbar").innerHTML=navMain().map(([k,l,i])=>`<a href="#${k}" ${k===cur?'aria-current="page"':""}><span class="tpill">${ico(i,21)}</span>${k==="assistant"?"Assist":l}</a>`).join("")+`<button id="moreBtn" ${inMore?'aria-current="page"':""}><span class="tpill">${ico("more",21)}</span>More</button>`;
  $("#viewTitle").textContent=cur==="today"?"MLEA":(ALLV.find(v=>v[0]===cur)||[])[1]||"";
  const al=activeAlerts();const n=al.filter(a=>a.level==="crit"||a.level==="high").length;
  $("#bellBtn").innerHTML=ico("bell",20)+(n?`<span class="badge">${n>9?"9+":n}</span>`:"");
  $("#bellBtn").setAttribute("aria-label",n?`Alerts, ${n} need attention`:"Alerts");
  $("#timerBtn").classList.toggle("on",!!(TM.state&&TM.state.running));
  const v=$("#view");
  const fn={today:vToday,report:vDash,calendar:vCal,lectures:vLect,work:vDel,readings:vRead,exams:vExam,grades:vGrades,courses:vCourses,assistant:vAssist,students:vStudents}[cur];
  v.innerHTML=fn();
  paintTimerPill();
  bindView();
}

/* ---------- workload engine ---------- */
function openWork(){
  const items=[];
  for(const d of S.deliverables){if(DONE.has(d.status)||d.status==="Not announced")continue;const due=dueOf(d);items.push({col:"deliverables",id:d.id,title:d.title,course:d.courseId,due,type:d.type,weight:num(d.weight),rem:remainingHours(d),status:d.status})}
  for(const r of S.readings){if(r.status==="Done")continue;items.push({col:"readings",id:r.id,title:r.title,course:r.courseId,due:r.due,type:"Reading",weight:null,rem:remainingHours(r),status:r.status})}
  for(const l of S.lectures){if(l.study==="Studied"||l.attendance==="Cancelled"||!validDate(l.date)||l.date>T)continue;const h=num(l.studyHours);items.push({col:"lectures",id:l.id,title:"Study: "+(l.topic||"Lecture "+(l.no||"")),course:l.courseId,due:"",type:"Lecture recovery",weight:null,rem:h,status:l.study||"Not started",lec:l})}
  return items;
}
function score(it){const p=priority(it.due);let s=0;if(p){s+=p.n<0?60:30/(p.n+1)}else s+=2;s+=(it.weight||0)/5;if(it.status==="Revision required")s+=10;if(it.col==="lectures")s+=3;return s}
function weekLoad(){
  const cap=num(S.settings.capacity)||6.5;const ws=weekStartOf(T);
  const weeks=[0,1,2].map(i=>({start:addDays(ws,i*7),end:addDays(ws,i*7+6),hours:0,items:[]}));
  const unknown=[];
  for(const it of openWork()){
    if(it.rem==null){if(it.due&&daysBetween(T,it.due)<=21)unknown.push(it);continue}
    const due=it.due&&daysBetween(T,it.due)>=0?it.due:T;
    const w=weeks.find(w=>due>=w.start&&due<=w.end);if(w){w.hours+=it.rem;w.items.push(it)}
    else if(due<weeks[0].start){weeks[0].hours+=it.rem;weeks[0].items.push(it)}
  }
  return{cap,weeks,unknown};
}
function conflicts(){
  const ds=S.deliverables.filter(d=>!DONE.has(d.status)&&validDate(dueOf(d))&&daysBetween(T,dueOf(d))>=0).sort((a,b)=>dueOf(a)<dueOf(b)?-1:1);
  const out=[];for(let i=0;i<ds.length;i++){const grp=[ds[i]];for(let j=i+1;j<ds.length;j++){if(daysBetween(dueOf(ds[i]),dueOf(ds[j]))<=3)grp.push(ds[j]);else break}if(grp.length>1&&!out.some(g=>g.every(x=>grp.includes(x))))out.push(grp)}
  return out;
}
function latestStart(it,cap){if(!validDate(it.due)||it.rem==null)return null;const weeks=Math.ceil(it.rem/cap)||0;return addDays(it.due,-Math.max(1,weeks*7))}

/* ---------- views ---------- */
function setupNeeded(){
  if(S.courses.length)return"";
  if(!S.isAdmin)return`<div class="empty" style="margin-bottom:18px"><strong>Set up your dashboard.</strong>Courses the programme admin publishes appear here automatically. You can also add your own courses, timetable and deadlines now; they stay private to you.<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px"><button class="primary" data-new="courses">Add a course</button><button class="iconbtn" data-syl="">${CLIP} Attach a syllabus</button></div></div>`;
  return`<div class="empty" style="margin-bottom:18px"><strong>Start by adding your MLEA courses.</strong>Each lecture, deliverable and reading links to a course. Add them under Courses & settings, then enter the lecture timetable and every announced assessment from the course outlines. Nothing is pre-filled: weights, deadlines and grading rules appear only once you enter them.<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px"><button class="primary iconbtn" data-syl="">${CLIP} Import a syllabus</button><button data-new="courses">Add a course manually</button></div></div>`;
}
function vDash(){
  const ws=weekStartOf(T),we=addDays(ws,6),nws=addDays(ws,7),nwe=addDays(ws,13);
  const lecWeek=S.lectures.filter(l=>l.date>=ws&&l.date<=we&&l.attendance!=="Cancelled");
  const attended=lecWeek.filter(l=>l.attendance==="Attended").length;
  const recovery=S.lectures.filter(l=>validDate(l.date)&&l.date<=T&&l.attendance!=="Cancelled"&&(l.study==="Needs recovery"||((l.attendance==="Missed"||l.attendance==="Excused")&&l.study!=="Studied")||(l.attendance==="Scheduled"||!l.attendance)&&l.date<T)).sort((a,b)=>a.date<b.date?-1:1);
  const inProg=S.deliverables.filter(d=>ACTIVE.has(d.status)&&!isPres(d.type));
  const pres=S.deliverables.filter(d=>isPres(d.type)&&!DONE.has(d.status)).sort((a,b)=>(dueOf(a)||"9")<(dueOf(b)||"9")?-1:1);
  const next14=calItems().filter(e=>e.date>=T&&e.date<=addDays(T,14)&&e.kind!=="Lecture"&&!e.done);
  const reads=S.readings.filter(r=>r.status!=="Done").sort((a,b)=>(a.due||"9")<(b.due||"9")?-1:1);
  const doneWeek=[...S.deliverables.filter(d=>d.completedAt>=ws&&d.completedAt<=we).map(d=>({t:d.title+" — "+d.status,c:d.courseId,col:"deliverables",id:d.id})),
    ...S.readings.filter(r=>r.completedAt>=ws&&r.completedAt<=we).map(r=>({t:"Read: "+r.title,c:r.courseId,col:"readings",id:r.id})),
    ...S.lectures.filter(l=>l.completedAt>=ws&&l.completedAt<=we).map(l=>({t:"Studied: "+(l.topic||"lecture"),c:l.courseId,col:"lectures",id:l.id}))];
  const L=weekLoad();const conf=conflicts();
  const actions=openWork().filter(it=>!it.due||daysBetween(T,it.due)<=21||it.col==="lectures").sort((a,b)=>score(b)-score(a));
  let budget=L.cap;const plan=[];const overflow=[];
  for(const it of actions){const h=it.rem==null?null:Math.min(it.rem,Math.max(0,budget));if(budget<=0.01){overflow.push(it);continue}plan.push({it,h});if(it.rem!=null)budget-=Math.min(it.rem,budget);if(plan.length>=8)break}

  const overdue=S.deliverables.filter(d=>!DONE.has(d.status)&&validDate(dueOf(d))&&dueOf(d)<T);
  let alerts="";
  if(overdue.length)alerts+=`<div class="alert"><b>${overdue.length} deliverable${overdue.length>1?"s are":" is"} past the deadline without a confirmed submission.</b> ${overdue.map(d=>esc(d.title)).join("; ")}. Update the status once you've submitted; it never changes on its own.</div>`;
  const overWeeks=L.weeks.filter(w=>w.hours>L.cap+0.05);
  if(overWeeks.length)alerts+=`<div class="alert warn"><b>Workload above your ${L.cap}h weekly capacity.</b> ${overWeeks.map(w=>`Week of ${fmtD(w.start)}: ${w.hours.toFixed(1)}h`).join("; ")}. See the revised start dates under Priority actions.</div>`;
  if(conf.length)alerts+=`<div class="alert warn"><b>Overlapping deadlines.</b> ${conf.map(g=>g.map(d=>`${esc(d.title)} (${fmtD(dueOf(d))})`).join(" + ")).join("; ")}. Bring the earlier start forward or agree an extension with the lecturer.</div>`;

  const li=(arr,f,empty)=>arr.length?`<ul>${arr.map(f).join("")}</ul>`:`<p class="muted" style="margin:0">${empty}</p>`;
  return `${setupNeeded()}
  <div class="bar"><div><h2>Week of ${fmtD(ws)} – ${fmtD(we)}</h2><div class="sub">Weekly academic deliverables report · priority flags are planning indicators, not official deadlines</div></div></div>
  ${alerts}
  <div class="stats">
    <div class="stat"><div class="v">${attended}/${lecWeek.length}</div><div class="l">Lectures attended this week</div></div>
    <div class="stat"><div class="v">${recovery.length}</div><div class="l">Lectures needing recovery</div></div>
    <div class="stat"><div class="v">${next14.length}</div><div class="l">Deadlines in next 14 days</div></div>
    <div class="stat"><div class="v">${L.weeks[0].hours.toFixed(1)}<span class="muted" style="font-size:14px">/${L.cap}h</span></div><div class="l">Load due this week</div></div>
  </div>
  <div class="grid">
    <section class="panel"><h3>1 · Lectures this week</h3>${li(lecWeek.sort((a,b)=>a.date<b.date?-1:1),l=>`<li data-open="lectures:${l.id}" style="cursor:pointer"><span class="t">${fmtD(l.date)} · ${esc(cShort(l.courseId))} ${esc(l.topic||"")}</span><span class="pill ${l.attendance==="Attended"?"p-ok":l.attendance==="Missed"?"p-crit":"p-neutral"}">${esc(l.attendance||"Scheduled")}</span></li>`,"No lectures entered for this week.")}</section>
    <section class="panel"><h3>2 · Lectures requiring recovery</h3>${li(recovery.slice(0,8),l=>`<li data-open="lectures:${l.id}" style="cursor:pointer"><span class="t">${fmtD(l.date)} · ${esc(cShort(l.courseId))} ${esc(l.topic||"")}</span><span class="pill p-high">${l.attendance==="Scheduled"||!l.attendance?"Unmarked":esc(l.study==="Needs recovery"?"Recover":l.attendance)}</span></li>`,"Nothing to recover.")}</section>
    <section class="panel"><h3>3 · Assignments in progress</h3>${li(inProg,d=>`<li data-open="deliverables:${d.id}" style="cursor:pointer"><span class="t">${esc(d.title)} <span class="muted">· ${esc(cShort(d.courseId))}</span></span><span class="pill p-plan">${esc(d.status)}</span></li>`,"No assignment is marked in progress.")}</section>
    <section class="panel"><h3>4 · Upcoming presentations</h3>${li(pres,d=>`<li data-open="deliverables:${d.id}" style="cursor:pointer"><span class="t">${esc(d.title)} <span class="muted">· ${fmtD(dueOf(d))} · slides ${esc(d.slideStatus||"Not started")}, rehearsal ${esc(d.rehearsal||"Not started")}</span></span>${pPill(priority(dueOf(d)))}</li>`,"No presentations entered.")}</section>
    <section class="panel"><h3>5 · Deadlines in next 14 days</h3>${li(next14,e=>`<li data-open="${e.col}:${e.id}" style="cursor:pointer"><span class="t"><span class="mono">${fmtD(e.date)}</span> · ${esc(e.title)}</span>${pPill(priority(e.date))}</li>`,"No deadlines in the next 14 days.")}</section>
    <section class="panel"><h3>6 · Outstanding research & reading</h3>${li(reads.slice(0,8),r=>`<li data-open="readings:${r.id}" style="cursor:pointer"><span class="t">${esc(r.title)} <span class="muted">· ${esc(cShort(r.courseId))}${r.due?" · by "+fmtD(r.due):""}</span></span><span class="pill p-neutral">${esc(r.status||"Not started")}</span></li>`,"No open readings.")}</section>
    <section class="panel"><h3>7 · Completed this week</h3>${li(doneWeek,x=>`<li data-open="${x.col}:${x.id}" style="cursor:pointer"><span class="t">${esc(x.t)}</span><span class="muted mono">${esc(cShort(x.c))}</span></li>`,"Nothing marked complete yet this week.")}</section>
    <section class="panel"><h3>8 · Priority actions (fits ${L.cap}h)</h3>${plan.length?`<ul>${plan.map(({it,h})=>{const ls=latestStart(it,L.cap);return`<li data-open="${it.col}:${it.id}" style="cursor:pointer"><span class="t">${esc(it.title)} <span class="muted">· ${esc(cShort(it.course))}${it.due?" · due "+fmtD(it.due):""}${ls&&ls<T?" · should have started "+fmtD(ls):""}</span></span><span class="mono">${h==null?"?h":h.toFixed(1)+"h"}</span></li>`}).join("")}</ul>${overflow.length?`<p class="note">Doesn't fit this week: ${overflow.slice(0,5).map(i=>esc(i.title)).join("; ")}. Move to next week or reduce scope.</p>`:""}${L.unknown.length?`<p class="note">${L.unknown.length} item(s) due within 3 weeks have no effort estimate, so the workload check can't count them.</p>`:""}`:`<p class="muted" style="margin:0">No open work yet.</p>`}</section>
  </div>
  <section class="panel" style="margin-top:16px"><h3>Workload against capacity</h3>
    ${L.weeks.map(w=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:10px"><span>Week of ${fmtD(w.start)}</span><span class="mono">${w.hours.toFixed(1)} / ${L.cap}h</span></div><div class="loadbar"><span class="${w.hours>L.cap?"over":""}" style="width:${Math.min(100,w.hours/L.cap*100)}%"></span></div></div>`).join("")}
    <p class="note">Counts remaining effort (estimate × (1 − progress)) by the week each item is due. Overdue items count against this week. Capacity is set under Courses & settings.</p>
  </section>`;
}

function calItems(){
  const out=[];
  for(const l of S.lectures){if(!validDate(l.date))continue;out.push({date:l.date,time:l.start||"",kind:"Lecture",cat:"lectures",title:`${cShort(l.courseId)} — ${l.topic||"Lecture"+(l.no?" "+l.no:"")}`,col:"lectures",id:l.id,done:l.attendance==="Attended"||l.attendance==="Cancelled",extra:l.attendance||"Scheduled"})}
  for(const d of S.deliverables){
    const exam=isExam(d.type),pres=isPres(d.type);
    if(validDate(d.due))out.push({date:d.due,time:d.dueTime||d.examTime||"",kind:exam?"Exam":d.type==="Research paper"?"Paper due":d.type==="Reading assignment"?"Reading due":/Group/.test(d.type||"")?"Group due":"Deadline",cat:exam?"exams":"deadlines",title:`${cShort(d.courseId)} — ${d.title}`,col:"deliverables",id:d.id,done:DONE.has(d.status),extra:d.status,weight:d.weight});
    if(pres&&validDate(d.presDate)&&d.presDate!==d.due)out.push({date:d.presDate,time:"",kind:"Presentation",cat:"deadlines",title:`${cShort(d.courseId)} — ${d.title}`,col:"deliverables",id:d.id,done:DONE.has(d.status),extra:d.status});
    if(validDate(d.internalDeadline))out.push({date:d.internalDeadline,time:"",kind:"Internal prep",cat:"milestones",title:`${d.title} (internal target)`,col:"deliverables",id:d.id,done:DONE.has(d.status)});
    for(const m of parseMilestones(d.milestones))out.push({date:m.date,time:"",kind:"Milestone",cat:"milestones",title:`${d.title}: ${m.title}`,col:"deliverables",id:d.id,done:m.done||DONE.has(d.status)});
  }
  for(const r of S.readings){if(validDate(r.due))out.push({date:r.due,time:"",kind:"Reading",cat:"readings",title:`${cShort(r.courseId)} — ${r.title}`,col:"readings",id:r.id,done:r.status==="Done",extra:r.status})}
  return out.sort((a,b)=>a.date===b.date?(a.time<b.time?-1:1):a.date<b.date?-1:1);
}
function vCal(){
  const F=[["all","All"],["deadlines","Deadlines"],["exams","Exams"],["lectures","Lectures"],["readings","Readings"],["milestones","Milestones"]];
  const ym=UI.calMonth||T.slice(0,7);UI.calMonth=ym;const sel=UI.calDay||T;
  const [y,m]=ym.split("-").map(Number);const first=`${ym}-01`;
  const ws=Number(S.settings.weekStart??6);const lead=(new Date(toUTC(first)).getUTCDay()-ws+7)%7;
  const start=addDays(first,-lead);const days=[];for(let i=0;i<42;i++)days.push(addDays(start,i));
  if(days.slice(35).every(d=>d.slice(0,7)!==ym))days.length=35;
  const items=calItems().filter(e=>UI.calFilter==="all"||e.cat===UI.calFilter);
  const by={};items.forEach(e=>(by[e.date]=by[e.date]||[]).push(e));
  const wdn=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const mName=new Date(Date.UTC(y,m-1,1)).toLocaleDateString("en-GB",{month:"long",year:"numeric",timeZone:"UTC"});
  const dayItems=(by[sel]||[]);
  return `${setupNeeded()}<div class="calhead"><h2>${mName}</h2><button class="ib" data-calnav="-1" aria-label="Previous month">${ico("chevL",18)}</button><button class="ib" data-calnav="0" aria-label="This month" style="width:auto;padding:0 12px;font-size:13px;font-weight:700">Today</button><button class="ib" data-calnav="1" aria-label="Next month">${ico("chevR",18)}</button></div>
  <div class="chips" style="margin-bottom:10px">${F.map(([k,l])=>`<button class="chip" data-calf="${k}" aria-pressed="${UI.calFilter===k}">${l}</button>`).join("")}</div>
  <div class="month"><div class="mgrid">${[0,1,2,3,4,5,6].map(i=>`<div class="wd">${wdn[(ws+i)%7]}</div>`).join("")}
  ${days.map(d=>{const ev=by[d]||[];const hot=ev.some(e=>e.cat!=="lectures"&&!e.done&&(()=>{const p=priority(d);return p&&(p.k==="crit"||p.k==="over")})());
    const dots=ev.slice(0,4).map(e=>`<i class="${e.cat==="lectures"?"":"sq"}" style="--cc:${ccOf(itemCourse(e))}"></i>`).join("");
    return `<button class="mday ${d.slice(0,7)!==ym?"out":""} ${d===T?"today":""} ${hot?"hot":""}" data-calday="${d}" aria-pressed="${d===sel}" aria-label="${fmtLong(d)}, ${ev.length} item${ev.length===1?"":"s"}"><span class="n">${Number(d.slice(8))}</span><span class="dots">${dots}</span></button>`}).join("")}</div>
  <p class="note" style="margin:8px 4px 2px">Round dots are lectures, square dots are deadlines and tasks, in each course's colour. A red ring means a deadline within 3 days.</p></div>
  <div class="sect"><div class="sh"><h2>${sel===T?"Today":fmtD(sel)}</h2><span class="sub">${dayItems.length} item${dayItems.length===1?"":"s"}</span></div>
  ${dayItems.length?`<div class="agenda">${dayItems.map(agHTML).join("")}</div>`:`<div class="empty">Nothing on this day.</div>`}</div>
  <div class="sect"><div class="sh"><h2>Coming up</h2></div>${(()=>{const up=items.filter(e=>e.date>T&&e.date<=addDays(T,21)&&e.cat!=="lectures"&&!e.done);return up.length?`<div class="agenda">${up.map(e=>agHTML(e,true)).join("")}</div>`:`<div class="empty">No deadlines in the next three weeks.</div>`})()}</div>
  <div class="panel"><h3>Phone calendar</h3><p class="note" style="margin-top:0">Save every lecture, deadline, exam and reading as one calendar file. Opening it on your phone adds them to Apple, Google or Outlook Calendar, with reminders 3 days and 1 day before each deadline. Export again after changes.</p><div class="acts"><button class="iconbtn primary" data-ics>${ico("download",17)} Export to phone calendar</button></div></div>`;
}
function agHTML(e,showDate){
  const p=priority(e.date);
  const right=e.cat==="lectures"?`<span class="pill ${e.extra==="Attended"?"p-ok":e.extra==="Missed"?"p-crit":"p-neutral"}">${esc(e.extra)}</span>`:e.done?`<span class="pill p-ok">${esc(e.extra||"Done")}</span>`:pPill(p);
  return `<div class="ag ${e.done&&e.cat!=="lectures"?"done":""}" data-open="${e.col}:${e.id}"><span class="tm">${showDate?fmtD(e.date).replace(/^\w+ /,""):(e.time||"All day")}</span><span class="bd"><span class="cchip" style="--cc:${ccOf(itemCourse(e))}">${esc(e.kind)}</span><div class="t">${esc(e.title)}</div>${e.weight?`<span class="sub">${esc(e.weight)}% of grade</span>`:""}</span>${right}</div>`;
}

function vLect(){
  const segs=[["week","This week"],["upcoming","Upcoming"],["recover","To recover"],["past","Past"],["all","All"]];
  const sg=UI.lecSeg||"week";const ws=weekStartOf(T),we=addDays(ws,6);
  let list=S.lectures.filter(l=>!UI.lecCourse||l.courseId===UI.lecCourse);
  const needs=l=>validDate(l.date)&&l.date<=T&&l.attendance!=="Cancelled"&&l.study!=="Studied";
  if(sg==="week")list=list.filter(l=>l.date>=ws&&l.date<=we);
  if(sg==="upcoming")list=list.filter(l=>l.date>=T);
  if(sg==="recover")list=list.filter(needs);
  if(sg==="past")list=list.filter(l=>l.date<T);
  list.sort((a,b)=>a.date===b.date?((a.start||"")<(b.start||"")?-1:1):(a.date<b.date?-1:1));
  if(sg==="past")list.reverse();
  const stats=S.courses.map(c=>{const ls=S.lectures.filter(l=>l.courseId===c.id&&validDate(l.date)&&l.date<=T&&l.attendance!=="Cancelled");return{c,n:ls.length,att:ls.filter(l=>l.attendance==="Attended").length,st:ls.filter(l=>l.study==="Studied").length}});
  const groups={};list.forEach(l=>{const k=validDate(l.date)?weekStartOf(l.date):"none";(groups[k]=groups[k]||[]).push(l)});
  return `${setupNeeded()}
  ${stats.length?`<div class="stats">${stats.map(s=>`<div class="stat"><span class="cchip" style="--cc:${ccOf(s.c.id)}">${esc(s.c.code||s.c.name)}</span><div class="v">${s.n?Math.round(s.att/s.n*100)+"%":"—"}</div><div class="l">attended · ${s.n?Math.round(s.st/s.n*100)+"%":"—"} studied</div></div>`).join("")}</div>`:""}
  <div class="seg" role="group" aria-label="Lecture filter">${segs.map(([k,l])=>`<button data-lecseg="${k}" aria-pressed="${sg===k}">${l}</button>`).join("")}</div>
  <div class="bar"><div class="chips"><button class="chip" data-lecc="" aria-pressed="${!UI.lecCourse}">All courses</button>${S.courses.map(c=>`<button class="chip" data-lecc="${c.id}" aria-pressed="${UI.lecCourse===c.id}" style="--cc:${ccOf(c.id)}">${esc(c.code||c.name)}</button>`).join("")}</div><div class="left"><button data-series>Add weekly series</button></div></div>
  ${list.length?Object.keys(groups).map(k=>`<div class="grp"><h3>${k==="none"?"No date":k===ws?"This week":"Week of "+fmtD(k)} <span class="n">${groups[k].length}</span></h3><div class="dlist">${groups[k].map(lecCard).join("")}</div></div>`).join("")
  :`<div class="empty"><strong>${sg==="recover"?"Nothing to recover.":"No lectures here."}</strong>${S.lectures.length?"Try another filter.":"Use “Add weekly series” to enter a course's timetable in one step, then mark attendance after each session."}</div>`}`;
}
function lecCard(l){
  const d=validDate(l.date)?new Date(toUTC(l.date)):null;const nm=S.materials.filter(m=>m.lectureId===l.id).length;const a=l.attendance||"Scheduled";
  return `<div class="lcard" data-open="lectures:${l.id}"><div class="datebox ${l.date===T?"today":""}"><div class="m">${d?d.toLocaleDateString("en-GB",{weekday:"short",timeZone:"UTC"}):"—"}</div><div class="d">${d?d.getUTCDate():"?"}</div></div>
  <div class="bd"><div><span class="cchip" style="--cc:${ccOf(l.courseId)}">${esc(cShort(l.courseId))}${l.no?" · L"+esc(l.no):""}</span> <span class="sub mono">${esc(l.start||"")}${l.end?"–"+esc(l.end):""}</span></div>
  <div class="t">${esc(l.topic||"Topic not set")}</div>
  <div class="att" role="group" aria-label="Attendance">${[["Attended","a"],["Missed","m"],["Excused","e"]].map(([v,c])=>`<button class="${c}" data-att="${l.id}:${v}" aria-pressed="${a===v}">${v}</button>`).join("")}</div>
  <div class="dfoot"><select data-q="lectures:${l.id}:study" aria-label="Study completion">${STUDY.map(o=>`<option ${(l.study||"Not started")===o?"selected":""}>${o}</option>`).join("")}</select><span style="display:flex;gap:6px"><button class="mini" data-mat="${l.id}" aria-label="Attach slides">${CLIP}${nm||"Slides"}</button><button class="mini" data-focus="lectures:${l.id}" aria-label="Focus on this lecture">${ico("timer",15)}</button></span></div></div></div>`;
}

function vDel(){
  const F=[["all","All"],["assign","Assignments"],["pres","Presentations"],["group","Group"],["exam","Exams"]];
  const f=UI.delFilter||"all";
  let list=S.deliverables.filter(d=>f==="all"||(f==="assign"&&isAssign(d.type))||(f==="pres"&&isPres(d.type))||(f==="group"&&(d.responsibility==="Group"||/Group/.test(d.type||"")))||(f==="exam"&&isExam(d.type)));
  list.sort((a,b)=>(dueOf(a)||"9999")<(dueOf(b)||"9999")?-1:1);
  const G=[["over","Overdue"],["week","Due within 7 days"],["two","Within 14 days"],["later","Later"],["nodate","No deadline yet"],["done","Completed"]];
  const g={};list.forEach(d=>{let k;const due=dueOf(d);if(DONE.has(d.status))k="done";else if(!validDate(due))k="nodate";else{const n=daysBetween(T,due);k=n<0?"over":n<=7?"week":n<=14?"two":"later"}(g[k]=g[k]||[]).push(d)});
  return `${setupNeeded()}<div class="seg" role="group" aria-label="Task filter">${F.map(([k,l])=>`<button data-delf="${k}" aria-pressed="${f===k}">${l}</button>`).join("")}</div>
  ${list.length?G.filter(([k])=>g[k]).map(([k,l])=>k==="done"?`<details class="grp"><summary><h3 style="display:inline-flex;gap:8px;margin:0">${l} <span class="n" style="font-family:var(--f-mono);background:var(--sunk);border-radius:6px;padding:0 6px">${g[k].length}</span></h3></summary><div class="dlist" style="margin-top:10px">${g[k].map(dCard).join("")}</div></details>`:`<div class="grp"><h3>${l} <span class="n">${g[k].length}</span></h3><div class="dlist">${g[k].map(dCard).join("")}</div></div>`).join("")
  :`<div class="empty"><strong>No tasks in this view.</strong>Add each assessment when it's announced, or import a syllabus or lecture slides and let the assistant find them for you.<div class="acts"><button class="primary" data-new="deliverables">Add task</button><button class="iconbtn" data-syl="">${CLIP} Import syllabus</button></div></div>`}`;
}
function dCard(d){
  const due=dueOf(d);const rem=remainingHours(d);const pr=num(d.progress);
  return `<article class="dcard" data-open="deliverables:${d.id}"><div class="dtop"><span class="cchip" style="--cc:${ccOf(d.courseId)}">${esc(cShort(d.courseId))}</span>${DONE.has(d.status)?'<span class="pill p-ok">Closed</span>':pPill(priority(due))}</div>
  <h4>${esc(d.title)}</h4>
  <div class="dmeta"><span>${esc(d.type||"")}</span>${validDate(due)?`<span>${fmtD(due)}${d.dueTime?" "+esc(d.dueTime):""} · ${daysTxt(daysBetween(T,due))}</span>`:""}${num(d.weight)!=null?`<span>${esc(d.weight)}%</span>`:""}${rem!=null&&!DONE.has(d.status)?`<span>${rem.toFixed(1)}h left</span>`:""}</div>
  ${pr!=null?`<div class="loadbar" title="${pr}% done"><span style="width:${Math.min(100,pr)}%"></span></div>`:""}
  <div class="dfoot"><select data-q="deliverables:${d.id}:status" aria-label="Status">${DSTATUS.map(o=>`<option ${(d.status||"Announced")===o?"selected":""}>${o}</option>`).join("")}</select>${DONE.has(d.status)?"":`<button class="mini" data-focus="deliverables:${d.id}">${ico("timer",15)} Focus</button>`}</div></article>`;
}

function vRead(){
  const list=[...S.readings].sort((a,b)=>(a.status==="Done")-(b.status==="Done")||((a.due||"9")<(b.due||"9")?-1:1));
  const delTitle=id=>{const d=S.deliverables.find(x=>x.id===id);return d?d.title:""};
  return `${setupNeeded()}<div class="bar"><div><h2>Research & reading tracker</h2><div class="sub">Required readings, research sources and cases, linked to the deliverable they support</div></div><div class="left"><button class="primary" data-new="readings">Add reading</button></div></div>
  ${list.length?`<div class="tablebox"><table><thead><tr><th>Course</th><th>Title</th><th>Kind</th><th>Supports</th><th>Read by</th><th>Time</th><th>Status</th></tr></thead><tbody>${list.map(r=>`<tr class="row" data-open="readings:${r.id}"><td>${esc(cShort(r.courseId))}</td><td style="min-width:200px">${esc(r.title)}${r.author?`<div class="sub">${esc(r.author)}</div>`:""}</td><td class="muted">${esc(r.kind||"")}</td><td>${esc(delTitle(r.deliverable)||"—")}</td><td class="num">${fmtD(r.due)} ${r.status!=="Done"&&r.due?pPill(priority(r.due)):""}</td><td class="num">${num(r.estHours)!=null?esc(r.estHours)+"h":"—"}</td>
  <td><select data-q="readings:${r.id}:status" aria-label="Reading status">${RSTAT.map(o=>`<option ${(r.status||"Not started")===o?"selected":""}>${o}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>`
  :`<div class="empty"><strong>No readings logged.</strong>Add the reading list from each course outline and any sources you gather for papers. Give each an estimated time so it counts in the weekly workload.</div>`}`;
}

function vExam(){
  const list=S.deliverables.filter(d=>isExam(d.type)).sort((a,b)=>(dueOf(a)||"9")<(dueOf(b)||"9")?-1:1);
  return `${setupNeeded()}<div class="bar"><div><h2>Examination readiness</h2><div class="sub">Quizzes, midterms and finals with revision coverage and confidence. Lectures still needing recovery for the course are counted.</div></div><div class="left"><button class="primary" data-new="deliverables" data-type="Midterm examination">Add exam</button></div></div>
  ${list.length?`<div class="tablebox"><table><thead><tr><th>Course</th><th>Assessment</th><th>Date</th><th>Priority</th><th>Weight</th><th>Revision</th><th>Practice Qs</th><th>Confidence</th><th>Lectures to recover</th><th>Status</th></tr></thead><tbody>${list.map(d=>{const rec=S.lectures.filter(l=>l.courseId===d.courseId&&validDate(l.date)&&l.date<=T&&l.attendance!=="Cancelled"&&l.study!=="Studied").length;const rv=num(d.revisionPct);return`<tr class="row" data-open="deliverables:${d.id}"><td>${esc(cShort(d.courseId))}</td><td>${esc(d.title)}<div class="sub">${esc(d.type)}</div></td><td class="num">${fmtD(dueOf(d))}${d.examTime?" "+esc(d.examTime):""}</td><td>${DONE.has(d.status)?'<span class="pill p-ok">Sat</span>':pPill(priority(dueOf(d)))}</td><td class="num">${d.weight?esc(d.weight)+"%":"—"}</td><td style="min-width:110px"><span class="num">${rv==null?"—":rv+"%"}</span>${rv!=null?`<div class="loadbar"><span style="width:${Math.min(100,rv)}%"></span></div>`:""}</td><td class="num">${esc(d.practice||"—")}</td><td class="num">${d.confidence?esc(d.confidence)+"/5":"—"}</td><td class="num">${rec?`<span class="pill p-high">${rec}</span>`:"0"}</td><td><span class="pill ${stDot(d.status)}">${esc(d.status||"Announced")}</span></td></tr>`}).join("")}</tbody></table></div>`
  :`<div class="empty"><strong>No examinations entered.</strong>Add quizzes, midterms and finals as deliverables once dates are published. Track revision coverage and practice here as you prepare.</div>`}`;
}

function vGrades(){
  if(!S.courses.length)return setupNeeded();
  return `<div class="bar"><div><h2>Assessment & grade tracker</h2><div class="sub">One table per course. Estimates appear only where weights and grades have been entered; no grading rules are assumed.</div></div></div>`+
  S.courses.map(c=>{
    const ds=S.deliverables.filter(d=>d.courseId===c.id&&d.type!=="Reading assignment").sort((a,b)=>(dueOf(a)||"9")<(dueOf(b)||"9")?-1:1);
    const weighted=ds.filter(d=>num(d.weight)!=null);const missingW=ds.length-weighted.length;
    const graded=weighted.filter(d=>num(d.grade)!=null&&num(d.maxGrade));
    const gW=graded.reduce((s,d)=>s+num(d.weight),0);const earned=graded.reduce((s,d)=>s+num(d.grade)/num(d.maxGrade)*num(d.weight),0);
    const totalW=weighted.reduce((s,d)=>s+num(d.weight),0);const remaining=ds.filter(d=>num(d.grade)==null);
    let summary;
    if(!ds.length)summary=`<span class="muted">No assessments entered.</span>`;
    else if(!graded.length)summary=`<span class="muted">No graded, weighted assessments yet.</span>`;
    else summary=`Earned <b class="mono">${earned.toFixed(1)}</b> of <span class="mono">${gW.toFixed(1)}</span> weighted points graded so far (<b class="mono">${(earned/gW*100).toFixed(1)}%</b> on graded work).`;
    return `<section class="coursecard"><div class="head"><h2 style="font-size:17px">${esc(cName(c.id))}</h2><span class="sub">Weights entered: <span class="mono">${totalW}%</span>${missingW?` · ${missingW} without weight`:""} · ${remaining.length} remaining</span></div>
    <div class="tablebox"><table><thead><tr><th>Assessment</th><th>Type</th><th>Weight</th><th>Max</th><th>Grade</th><th>%</th><th>Status</th><th>Feedback</th></tr></thead><tbody>${ds.length?ds.map(d=>{const g=num(d.grade),m=num(d.maxGrade);return`<tr class="row" data-open="deliverables:${d.id}"><td>${esc(d.title)}</td><td class="muted">${esc(d.type||"")}</td><td class="num">${num(d.weight)!=null?esc(d.weight)+"%":"—"}</td><td class="num">${m??"—"}</td><td class="num">${g??"—"}</td><td class="num">${g!=null&&m?(g/m*100).toFixed(0)+"%":"—"}</td><td><span class="pill ${stDot(d.status)}">${esc(d.status||"Announced")}</span></td><td class="muted" style="max-width:260px">${esc((d.feedback||"").slice(0,120))}${(d.feedback||"").length>120?"…":""}</td></tr>`}).join(""):`<tr><td colspan="8" class="muted">Add this course's assessments in the Deliverables register.</td></tr>`}</tbody></table></div>
    <p class="note">${summary}${totalW&&totalW!==100?` Entered weights total ${totalW}%, so either assessments are missing or the syllabus uses a different scheme; check before relying on the estimate.`:""}${c.gradingNotes?`<br>Official rules on file: ${esc(c.gradingNotes)}`:""}</p></section>`}).join("");
}

function vCourses(){
  return `<div class="bar"><div><h2>Courses</h2><div class="sub">Everything else links to these</div></div><div class="left"><button class="iconbtn" data-syl="">${CLIP} Import syllabus</button><button class="primary" data-new="courses">Add course</button></div></div>
  ${S.courses.length?`<div class="tablebox" style="margin-bottom:22px"><table><thead><tr><th>Code</th><th>Course</th><th>Lecturer</th><th>Term</th><th>Lectures</th><th>Deliverables</th><th>Readings</th><th>Syllabus</th></tr></thead><tbody>${S.courses.map(c=>`<tr class="row" data-open="courses:${c.id}"><td><span class="cchip" style="--cc:${ccOf(c.id)}">${esc(c.code||"—")}</span></td><td>${esc(c.name)}</td><td>${esc(c.lecturer||"")}</td><td>${esc(c.term||"")}</td><td class="num">${S.lectures.filter(l=>l.courseId===c.id).length}</td><td class="num">${S.deliverables.filter(d=>d.courseId===c.id).length}</td><td class="num">${S.readings.filter(r=>r.courseId===c.id).length}</td><td><button class="iconbtn" data-syl="${c.id}" title="Attach syllabus (PDF or Word)" aria-label="Attach syllabus for ${esc(c.name)}">${CLIP}${S.syllabi.filter(x=>x.courseId===c.id).length?S.syllabi.filter(x=>x.courseId===c.id).length+" file"+(S.syllabi.filter(x=>x.courseId===c.id).length>1?"s":""):"Attach"}</button></td></tr>`).join("")}</tbody></table></div>${sylPanel()}`:`<div class="empty" style="margin-bottom:22px"><strong>No courses yet.</strong>Add each MLEA course with its code and lecturer. Copy the official grading rules from the syllabus into the course record when you have them.</div>`}
  <section class="panel" style="max-width:520px"><h3>Planning settings</h3>
   <form id="settingsForm"><fieldset style="margin:0"><div class="f wide"><label for="setName">First name for the greeting</label><input id="setName" type="text" value="${esc(S.settings.name||"")}"></div><div class="f"><label for="setCap">Independent study capacity (h/week)</label><input id="setCap" type="number" step="0.5" min="0" value="${esc(S.settings.capacity)}"></div>
   <div class="f"><label for="setWs">Week starts on</label><select id="setWs">${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d,i)=>`<option value="${i}" ${Number(S.settings.weekStart)===i?"selected":""}>${d}</option>`).join("")}</select></div>
   <div class="f wide"><button class="primary" type="submit" style="justify-self:start">Save settings</button></div></fieldset></form>
   <h3 style="margin-top:16px">Institution logos</h3>
   ${INST.map(i=>{const id=(S.settings.logos||{})[i.k];return`<div class="logo-slot">${id?`<img src="${esc(blobUrl(id))}" alt="">`:""}<span style="flex:1;min-width:160px">${esc(i.name)}<div class="sub">${esc(i.sub)}</div></span><label class="btn iconbtn" for="logo_${i.k}" style="cursor:${S.assets?"pointer":"not-allowed"}">${CLIP} ${id?"Replace":"Upload"}</label><input id="logo_${i.k}" data-logo="${i.k}" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden ${S.assets?"":"disabled"}>${id?`<button class="link" data-logorm="${i.k}">Remove</button>`:""}</div>`}).join("")}
   <p class="note">Upload the official logo files (PNG, JPG or SVG) from each faculty's website or brand office. They show on the Today screen and in the side menu.</p>
   <p class="note">Priority bands: Critical ≤3 days, High ≤7, Medium ≤14, Planned beyond. They are planning indicators, not substitutes for official university deadlines.</p></section>`;
}

/* ---------- drawer ---------- */
function openDrawer(col,id,preset){
  const sch=SCHEMA[col];const existing=id?S[col].find(x=>x.id===id):null;
  const rec=existing?Object.assign({},existing):Object.assign({},preset||{});
  if(!existing){
    if(col==="deliverables"){const nums=S.deliverables.map(d=>parseInt(String(d.did||"").replace(/\D/g,""),10)).filter(n=>isFinite(n));rec.did="D-"+String((nums.length?Math.max(...nums):0)+1).padStart(3,"0");rec.status=rec.status||"Announced";rec.responsibility=rec.responsibility||"Individual";rec.type=rec.type||DTYPES[0]}
    if(col==="lectures"){rec.attendance="Scheduled";rec.study="Not started";if(UI.lecCourse)rec.courseId=UI.lecCourse}
    if(col==="readings")rec.status="Not started";
    if(!rec.courseId&&S.courses.length===1)rec.courseId=S.courses[0].id;
  }
  UI.editing={col,id:existing?existing.id:null,rec,confirmDel:false};UI.ai=null;
  drawDrawer();
}
function fieldHTML(f,rec){
  const v=rec[f.k]??"";const id="fld_"+f.k;let input;
  if(f.type==="textarea")input=`<textarea id="${id}" data-k="${f.k}">${esc(v)}</textarea>`;
  else if(f.type==="select")input=`<select id="${id}" data-k="${f.k}"><option value="">—</option>${f.opts.map(o=>`<option ${String(v)===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`;
  else if(f.type==="course")input=`<select id="${id}" data-k="${f.k}"><option value="">Choose course</option>${S.courses.map(c=>`<option value="${c.id}" ${v===c.id?"selected":""}>${esc(cName(c.id))}</option>`).join("")}</select>`;
  else if(f.type==="deliverable")input=`<select id="${id}" data-k="${f.k}"><option value="">None</option>${S.deliverables.map(d=>`<option value="${d.id}" ${v===d.id?"selected":""}>${esc(d.title)}</option>`).join("")}</select>`;
  else input=`<input id="${id}" data-k="${f.k}" type="${f.type}" ${f.type==="number"?'step="any"':""} value="${esc(v)}">`;
  if(fieldLocked(f.k))input=input.replace(/^<(input|select|textarea)/,"<$1 disabled");
  return `<div class="f ${f.wide?"wide":""}"><label for="${id}">${esc(f.l)}${f.req?" *":""}</label>${input}${f.hint?`<span class="hint">${esc(f.hint)}</span>`:""}</div>`;
}
function drawDrawer(){
  const E=UI.editing;const host=$("#drawerHost");if(!E){host.innerHTML="";return}
  const sch=SCHEMA[E.col];const groups=[];let g=null;
  for(const f of sch.fields){if(f.g){g={name:f.g,fields:[]};groups.push(g)}if(!f.show||f.show(E.rec))g.fields.push(f)}
  host.innerHTML=`<div class="scrim" data-close></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc((E.id?"Edit ":"New ")+sch.label.toLowerCase())}">
  <div class="dh"><h2 style="font-size:17px">${E.id?"Edit":"New"} ${sch.label.toLowerCase()}</h2><button data-close aria-label="Close">Close</button></div>
  <form class="db" id="recForm">${E.id&&!S.isAdmin&&!isOwn(E.col,E.id)?`<p class="note" style="margin:0 0 14px">Programme item, maintained by the admin. You can update your own progress, notes and grades; they stay private to you.</p>`:""}${groups.filter(g=>g.fields.length).map(g=>`<fieldset><legend>${esc(g.name)}</legend>${g.fields.map(f=>fieldHTML(f,E.rec)).join("")}</fieldset>`).join("")}
  <section id="aiBox">${aiBoxHTML()}</section></form>
  <div class="df"><div>${E.id&&canDelete(E)?(E.confirmDel?`<span class="confirm">Delete for good? <button class="danger" data-delyes>Delete</button><button data-delno>Keep</button></span>`:`<button class="danger" data-del>Delete</button>`):""}</div><div style="display:flex;gap:8px"><button data-close>Cancel</button><button class="primary" data-save ${S.offline?"disabled":""}>Save</button></div></div></aside>`;
  const form=$("#recForm");
  form.addEventListener("input",e=>{const k=e.target.dataset.k;if(k)E.rec[k]=e.target.value});
  form.addEventListener("change",e=>{const k=e.target.dataset.k;if(!k)return;E.rec[k]=e.target.value;if(["type","responsibility"].includes(k)){const top=form.scrollTop;drawDrawer();$("#recForm").scrollTop=top}});
  form.addEventListener("submit",e=>e.preventDefault());
  host.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>{UI.editing=null;drawDrawer()});
  const del=host.querySelector("[data-del]");if(del)del.onclick=()=>{E.confirmDel=true;drawDrawer()};
  const dn=host.querySelector("[data-delno]");if(dn)dn.onclick=()=>{E.confirmDel=false;drawDrawer()};
  const dy=host.querySelector("[data-delyes]");if(dy)dy.onclick=async()=>{try{await S.db.doc(E.col+"/"+E.id).delete();toast("Deleted");UI.editing=null;drawDrawer()}catch(e){toast("Not deleted: "+(e.code||"error"))}};
  host.querySelector("[data-save]").onclick=async()=>{
    for(const f of sch.fields){if(f.req&&!String(E.rec[f.k]||"").trim()){toast(`${f.l} is required`);const el=document.getElementById("fld_"+f.k);if(el)el.focus();return}}
    const prev=E.id?S[E.col].find(x=>x.id===E.id)||{}:{};const rec=Object.assign({},E.rec);
    for(const f of sch.fields)if(f.type==="number"&&rec[f.k]!==""&&rec[f.k]!=null){const n=num(rec[f.k]);rec[f.k]=n==null?"":n}
    markCompletion(E.col,prev,rec);
    const ok=await save(E.col,rec);if(ok){toast("Saved");UI.editing=null;drawDrawer()}
  };
  const first=host.querySelector("input,select,textarea");if(first&&!E.id)first.focus();
  bindAI();
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&UI.editing){UI.editing=null;drawDrawer()}});

/* weekly series generator */
function openSeries(){
  UI.editing=null;
  $("#drawerHost").innerHTML=`<div class="scrim" data-close></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="Add weekly lecture series">
  <div class="dh"><h2 style="font-size:17px">Add weekly lecture series</h2><button data-close>Close</button></div>
  <form class="db" id="serForm"><fieldset><legend>Timetable entry</legend>
  <div class="f wide"><label for="serC">Course *</label><select id="serC"><option value="">Choose course</option>${S.courses.map(c=>`<option value="${c.id}">${esc(cName(c.id))}</option>`).join("")}</select></div>
  <div class="f"><label for="serA">First lecture date *</label><input id="serA" type="date"></div><div class="f"><label for="serB">Last lecture date *</label><input id="serB" type="date"></div>
  <div class="f"><label for="serS">Start</label><input id="serS" type="time"></div><div class="f"><label for="serE">End</label><input id="serE" type="time"></div>
  <div class="f"><label for="serM">Mode</label><select id="serM"><option>In person</option><option>Online</option></select></div><div class="f"><label for="serV">Venue / link</label><input id="serV" type="text"></div>
  <div class="f wide"><span class="hint">Creates one lecture per week on the weekday of the first date. Edit or cancel individual sessions afterwards.</span></div></fieldset></form>
  <div class="df"><span></span><div style="display:flex;gap:8px"><button data-close>Cancel</button><button class="primary" id="serGo" ${S.offline?"disabled":""}>Create lectures</button></div></div></aside>`;
  $("#drawerHost").querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#drawerHost").innerHTML="");
  $("#serGo").onclick=async()=>{
    const c=$("#serC").value,a=$("#serA").value,b=$("#serB").value;
    if(!c||!validDate(a)||!validDate(b)||b<a){toast("Choose a course and a valid date range");return}
    const dates=[];for(let d=a;d<=b&&dates.length<40;d=addDays(d,7))dates.push(d);
    const base=S.lectures.filter(l=>l.courseId===c).length;
    $("#serGo").disabled=true;let n=0;
    for(const d of dates){const ok=await save("lectures",{courseId:c,date:d,no:base+(++n),start:$("#serS").value,end:$("#serE").value,mode:$("#serM").value,venue:$("#serV").value,attendance:"Scheduled",study:"Not started"});if(!ok)break}
    toast(`${n} lectures added`);$("#drawerHost").innerHTML="";
  };
}

/* ---------- syllabus import ---------- */
const CLIP=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.4 11.1l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/></svg>`;
const SY={};
const FORMATS=["Word","PDF","PowerPoint","Excel","Oral presentation","Online quiz","Written exam","Other"];
function sylPanel(){
  if(!S.syllabi.length)return"";
  return `<section class="panel" style="margin-bottom:22px"><h3>Syllabus files</h3><ul>${S.syllabi.map(f=>`<li><span class="t">${esc(f.fileName)} <span class="muted">· ${esc(cShort(f.courseId))}${f.pages?" · "+f.pages+" pages":""} · added ${fmtD(f.addedAt)}${f.imported?" · imported":""}</span></span><span style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">${f.assetId?`<a href="${esc(blobUrl(f.assetId))}" target="_blank" rel="noopener">Open</a>`:""}<button class="link" data-sylre="${f.id}">Re-read</button>${UI.sylDel===f.id?`<span class="confirm">Remove? <button class="danger" data-syldelyes="${f.id}">Remove</button><button data-syldelno>Keep</button></span>`:`<button class="link" data-syldel="${f.id}">Remove</button>`}</span></li>`).join("")}</ul><p class="note">Removing a file keeps any records already imported from it.</p></section>`;
}
function openSyllabus(courseId,existing){
  for(const k in SY)delete SY[k];
  Object.assign(SY,{step:existing?"ready":"pick",courseId:courseId||"",file:null,fileName:existing?existing.fileName:"",text:existing?existing.text||"":"",pages:existing?existing.pages:0,docId:existing?existing.id:null,result:null,sel:{},busy:"",err:"",applyCourse:true});
  UI.editing=null;drawSyl();
}
async function extractText(file){
  const name=file.name.toLowerCase();const buf=await file.arrayBuffer();
  if(name.endsWith(".pdf")||file.type==="application/pdf"){
    if(!window.pdfjsLib)throw new Error("The PDF reader didn't load. Check your connection and try again.");
    try{pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"}catch(e){}
    const pdf=await pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;const out=[];
    for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();out.push(tc.items.map(it=>(it.str||"")+(it.hasEOL?"\n":" ")).join(""))}
    return{text:out.join("\n\n").replace(/[ \t]+\n/g,"\n").trim(),pages:pdf.numPages,kind:"pdf"};
  }
  if(name.endsWith(".docx")){
    if(!window.mammoth)throw new Error("The Word reader didn't load. Check your connection and try again.");
    const r=await mammoth.extractRawText({arrayBuffer:buf});return{text:(r.value||"").trim(),pages:0,kind:"docx"};
  }
  if(name.endsWith(".pptx")){
    if(!window.JSZip)throw new Error("The PowerPoint reader didn't load. Check your connection and try again.");
    const zip=await JSZip.loadAsync(buf);const dec=x=>{const t=document.createElement("textarea");t.innerHTML=x;return t.value};
    const nOf=n=>parseInt(n.replace(/\D/g,""),10);
    const slides=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>nOf(a)-nOf(b));const out=[];
    for(const n of slides){const xml=await zip.file(n).async("string");const txt=[...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m=>dec(m[1])).join(" ");
      const nn="ppt/notesSlides/notesSlide"+nOf(n)+".xml";let notes="";if(zip.file(nn)){const nx=await zip.file(nn).async("string");notes=[...nx.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m=>dec(m[1])).join(" ").replace(/^\s*\d+\s*$/,"")}
      out.push(`Slide ${nOf(n)}: ${txt}${notes.trim()?"\nNotes: "+notes.trim():""}`)}
    return{text:out.join("\n"),pages:slides.length,kind:"pptx"};
  }
  if(name.endsWith(".ppt"))throw new Error("Old .ppt files can't be read here. Save it as .pptx or PDF and try again.");
  if(name.endsWith(".doc"))throw new Error("Old .doc files can't be read here. Save it as .docx or PDF and try again.");
  throw new Error("Choose a PDF, PowerPoint (.pptx) or Word (.docx) file.");
}
async function handleFile(file){
  if(!file)return;SY.err="";SY.fileName=file.name;SY.busy="Reading "+file.name+"…";drawSyl();
  try{
    const r=await extractText(file);
    if(r.text.replace(/\s/g,"").length<200)throw new Error("This file has almost no selectable text, so it's probably a scan. Upload the Word version or a text-based PDF.");
    SY.text=r.text;SY.pages=r.pages;SY.busy="Saving the file…";drawSyl();
    let assetId=null;
    if(r.kind==="pdf"&&S.assets){try{const a=await S.assets.upload(file);assetId=a.id}catch(e){}}
    if(S.db){const ref=S.db.collection("syllabi").doc();await ref.set({courseId:SY.courseId&&SY.courseId!=="__new"?SY.courseId:"",fileName:file.name,kind:r.kind,pages:r.pages,assetId,text:r.text.slice(0,180000),addedAt:T,imported:false});SY.docId=ref.id}
    SY.step="ready";SY.busy="";
  }catch(e){SY.busy="";SY.err=e&&e.message?e.message:"The file couldn't be read."}
  drawSyl();
}
async function runExtraction(){
  if(!S.sample){SY.err="Reading with Claude isn't available in this view. You can still keep the file here and enter assessments manually.";drawSyl();return}
  SY.err="";SY.busy="Claude is reading the syllabus. This can take up to a minute…";drawSyl();
  const prompt=`Extract this university course syllabus (Master's programme in Law & Economics, MLEA) into structured records.
Rules:
- Use ONLY facts explicitly stated in the text. Never guess or infer weights, dates, formats or grading rules. Use null when something is not stated.
- Dates as YYYY-MM-DD. If a date is written without a year, use the academic year containing ${T} and set "dateAssumed": true. If a deadline is vague (e.g. "week 6", "end of term"), set "due": null and copy the wording into "dueText".
- "type" must be exactly one of: ${DTYPES.join(" | ")}.
- "weight" is the percentage of the final course grade as a number (e.g. 30), or null.
- Include every assessed item: assignments, papers, presentations, quizzes, participation (as "Other coursework"), midterm, final.
- Lectures: include only sessions listed with a topic; date null if not given.
- Readings: required or recommended readings, cases or statutes listed by name.
Return only JSON in this shape:
{"course":{"name":null,"code":null,"lecturer":null,"gradingRules":null},
"assessments":[{"title":"","type":"","weight":null,"due":null,"dueText":null,"format":null,"responsibility":null,"description":null,"dateAssumed":false}],
"lectures":[{"no":null,"date":null,"topic":""}],
"readings":[{"title":"","author":null,"due":null,"kind":"Required reading"}]}
"gradingRules" is a short faithful summary of the grading scheme as written (or null). "responsibility" is "Individual", "Group" or null.

SYLLABUS TEXT:
"""
${SY.text.slice(0,120000)}
"""`;
  try{
    const res=await S.sample.json(prompt,{modelTier:"default"});
    const r={course:res&&res.course||{},assessments:Array.isArray(res&&res.assessments)?res.assessments:[],lectures:Array.isArray(res&&res.lectures)?res.lectures:[],readings:Array.isArray(res&&res.readings)?res.readings:[]};
    const cid=SY.courseId&&SY.courseId!=="__new"?SY.courseId:null;
    const have=new Set(S.deliverables.filter(d=>d.courseId===cid).map(d=>String(d.title||"").toLowerCase().trim()));
    const haveR=new Set(S.readings.filter(d=>d.courseId===cid).map(d=>String(d.title||"").toLowerCase().trim()));
    SY.sel={};
    r.assessments.forEach((a,i)=>{a._dup=have.has(String(a.title||"").toLowerCase().trim());SY.sel["a"+i]=!a._dup});
    r.lectures.forEach((l,i)=>{SY.sel["l"+i]=validDate(l.date)});
    r.readings.forEach((x,i)=>{x._dup=haveR.has(String(x.title||"").toLowerCase().trim());SY.sel["r"+i]=!x._dup});
    SY.result=r;SY.step="review";SY.busy="";
  }catch(e){SY.busy="";SY.err=e&&e.code==="not_granted"?"Permission to use Claude was declined, so the syllabus wasn't read. The file is still saved.":e&&e.code==="rate_limited"?"Claude is busy right now. Try again in a minute.":"Claude couldn't read this syllabus ("+(e&&e.code||"error")+"). Try again, or enter the assessments manually."}
  drawSyl();
}
async function importSelected(){
  const r=SY.result;if(!r||!S.db)return;SY.busy="Adding records…";drawSyl();
  try{
    let cid=SY.courseId;
    if(!cid||cid==="__new"){
      if(!r.course.name){SY.busy="";SY.err="The syllabus doesn't name the course. Choose an existing course above or add the course first.";drawSyl();return}
      const ref=S.db.collection("courses").doc();await ref.set({name:r.course.name,code:r.course.code||"",lecturer:r.course.lecturer||"",gradingNotes:r.course.gradingRules||"",createdAt:T,updatedAt:T});cid=ref.id;
    }else if(SY.applyCourse){
      const c=course(cid);if(c){const patch={};if(!c.code&&r.course.code)patch.code=r.course.code;if(!c.lecturer&&r.course.lecturer)patch.lecturer=r.course.lecturer;if(!c.gradingNotes&&r.course.gradingRules)patch.gradingNotes=r.course.gradingRules;if(Object.keys(patch).length)await S.db.doc("courses/"+cid).update(Object.assign(patch,{updatedAt:T}))}
    }
    const nums=S.deliverables.map(d=>parseInt(String(d.did||"").replace(/\D/g,""),10)).filter(n=>isFinite(n));let next=(nums.length?Math.max(...nums):0);
    const src="Source: syllabus ("+SY.fileName+")";let nA=0,nL=0,nR=0;
    for(let i=0;i<r.assessments.length;i++){if(!SY.sel["a"+i])continue;const a=r.assessments[i];
      const type=DTYPES.includes(a.type)?a.type:"Other coursework";const fmtOk=FORMATS.includes(a.format);
      const desc=[a.description,a.dueText?"Deadline as written: "+a.dueText:"",a.format&&!fmtOk?"Format: "+a.format:"",a.dateAssumed?"Year of the deadline was not stated in the syllabus; confirm the date.":"",src].filter(Boolean).join("\n");
      const ok=await save("deliverables",{did:"D-"+String(++next).padStart(3,"0"),courseId:cid,title:a.title||"Untitled assessment",type,responsibility:a.responsibility==="Group"||/Group/.test(type)?"Group":"Individual",weight:typeof a.weight==="number"?a.weight:"",due:validDate(a.due)?a.due:"",format:fmtOk?a.format:(a.format?"Other":""),description:desc,status:"Announced"});if(!ok)break;nA++}
    const base=S.lectures.filter(l=>l.courseId===cid).length;
    for(let i=0;i<r.lectures.length;i++){if(!SY.sel["l"+i])continue;const l=r.lectures[i];if(!validDate(l.date))continue;
      const ok=await save("lectures",{courseId:cid,date:l.date,no:typeof l.no==="number"?l.no:base+nL+1,topic:l.topic||"",attendance:"Scheduled",study:"Not started"});if(!ok)break;nL++}
    for(let i=0;i<r.readings.length;i++){if(!SY.sel["r"+i])continue;const x=r.readings[i];
      const ok=await save("readings",{courseId:cid,title:x.title||"Untitled reading",author:x.author||"",kind:x.kind||"Required reading",due:validDate(x.due)?x.due:"",status:"Not started",notes:src});if(!ok)break;nR++}
    if(SY.docId){try{await S.db.doc("syllabi/"+SY.docId).update({imported:true,courseId:cid})}catch(e){}}
    $("#drawerHost").innerHTML="";toast(`Added ${nA} assessment${nA===1?"":"s"}, ${nL} lecture${nL===1?"":"s"}, ${nR} reading${nR===1?"":"s"}`);
  }catch(e){SY.busy="";SY.err="Import stopped ("+(e&&e.code||e&&e.message||"error")+"). Records added so far are kept.";drawSyl()}
}
function drawSyl(){
  const host=$("#drawerHost");const r=SY.result;
  const courseOpts=`<option value="">Choose course</option>${S.courses.map(c=>`<option value="${c.id}" ${SY.courseId===c.id?"selected":""}>${esc(cName(c.id))}</option>`).join("")}<option value="__new" ${SY.courseId==="__new"?"selected":""}>New course, named from the syllabus</option>`;
  let body=`<fieldset><legend>Course</legend><div class="f wide"><label for="sylC">This syllabus is for</label><select id="sylC">${courseOpts}</select></div></fieldset>`;
  if(SY.step==="pick"){
    body+=`<label class="drop" id="sylDrop" for="sylF">${CLIP.replace('width="15" height="15"','width="26" height="26"')}<strong>Drop the syllabus here or choose a file</strong><span class="sub">PDF or Word (.docx)</span><input id="sylF" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label>
    <p class="note">The file is kept with the course. Claude then reads it and proposes the assessments, weights, deadlines, lecture topics and readings it states. You review everything before it is added. Nothing is guessed: anything the syllabus doesn't state is left blank.</p>`;
  }
  if(SY.step==="ready"){
    body+=`<div class="panel" style="margin-bottom:14px"><div style="display:flex;gap:8px;align-items:center">${CLIP}<b style="overflow-wrap:anywhere">${esc(SY.fileName)}</b></div><div class="sub">${SY.pages?SY.pages+" pages · ":""}${SY.text.length.toLocaleString()} characters read</div></div>
    <p class="note" style="margin-bottom:12px">Next, Claude reads the text and lists what it finds. The first time, your browser asks permission to use Claude on this page.</p>`;
  }
  if(SY.step==="review"&&r){
    const cb=(k)=>`<input type="checkbox" data-sel="${k}" ${SY.sel[k]?"checked":""} aria-label="Include">`;
    const c=r.course||{};
    body+=`<fieldset><legend>Course details found</legend><div class="f wide sub">${esc(c.name||"No course name stated")}${c.code?" · "+esc(c.code):""}${c.lecturer?" · "+esc(c.lecturer):""}</div>
    ${c.gradingRules?`<div class="f wide"><span class="sub">Grading rules as stated:</span><span>${esc(c.gradingRules)}</span></div>`:""}
    ${SY.courseId&&SY.courseId!=="__new"?`<label class="f wide" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" id="sylApply" ${SY.applyCourse?"checked":""}> <span class="sub">Fill empty code, lecturer and grading-rules fields on the course</span></label>`:""}</fieldset>
    <fieldset style="display:block"><legend>Assessments (${r.assessments.length})</legend>${r.assessments.length?r.assessments.map((a,i)=>`<label class="rv">${cb("a"+i)}<span class="body"><b>${esc(a.title||"Untitled")}</b> <span class="muted">· ${esc(DTYPES.includes(a.type)?a.type:"Other coursework")}</span><div class="sub">${typeof a.weight==="number"?a.weight+"% of grade":"Weight not stated"} · ${validDate(a.due)?fmtD(a.due):a.dueText?"Deadline: "+esc(a.dueText):"No deadline stated"}${a.dateAssumed?' · <span class="pill p-high">Year assumed</span>':""}${a.format?" · "+esc(a.format):""}${a._dup?' · <span class="pill p-neutral">Already in register</span>':""}</div></span></label>`).join(""):`<p class="muted">No assessments found.</p>`}</fieldset>
    <fieldset style="display:block"><legend>Lectures (${r.lectures.length})</legend>${r.lectures.length?r.lectures.map((l,i)=>`<label class="rv">${validDate(l.date)?cb("l"+i):'<input type="checkbox" disabled aria-label="No date">'}<span class="body">${l.no?"L"+esc(l.no)+" · ":""}${esc(l.topic||"")}<div class="sub">${validDate(l.date)?fmtD(l.date):"No date in syllabus. Add it with the timetable instead."}</div></span></label>`).join(""):`<p class="muted">No dated lecture schedule found.</p>`}</fieldset>
    <fieldset style="display:block"><legend>Readings (${r.readings.length})</legend>${r.readings.length?r.readings.map((x,i)=>`<label class="rv">${cb("r"+i)}<span class="body">${esc(x.title||"")}<div class="sub">${esc(x.author||"")}${x.kind?" · "+esc(x.kind):""}${validDate(x.due)?" · by "+fmtD(x.due):""}${x._dup?' · <span class="pill p-neutral">Already listed</span>':""}</div></span></label>`).join(""):`<p class="muted">No readings found.</p>`}</fieldset>
    <p class="note">Check each item against the syllabus before adding. Imported assessments start as “Announced”.</p>`;
  }
  if(SY.busy)body+=`<div class="busy" role="status"><span class="spin"></span>${esc(SY.busy)}</div>`;
  if(SY.err)body+=`<div class="alert" role="alert">${esc(SY.err)}</div>`;
  const nSel=Object.values(SY.sel).filter(Boolean).length;
  const foot=SY.step==="ready"?`<button class="primary" id="sylRun" ${SY.busy?"disabled":""}>Read with Claude</button>`:SY.step==="review"?`<button class="primary" id="sylImp" ${SY.busy||!nSel||S.offline?"disabled":""}>Add ${nSel} selected</button>`:"";
  host.innerHTML=`<div class="scrim" data-close></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="Import syllabus"><div class="dh"><h2 style="font-size:17px">Import syllabus</h2><button data-close>Close</button></div><div class="db">${body}</div><div class="df"><span>${SY.step==="review"?`<button id="sylAgain" ${SY.busy?"disabled":""}>Read again</button>`:""}</span><div style="display:flex;gap:8px"><button data-close>${SY.step==="pick"?"Cancel":"Done"}</button>${foot}</div></div></aside>`;
  host.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>{host.innerHTML=""});
  const cs=$("#sylC");if(cs)cs.onchange=()=>{SY.courseId=cs.value;if(SY.docId&&cs.value&&cs.value!=="__new"&&S.db)S.db.doc("syllabi/"+SY.docId).update({courseId:cs.value}).catch(()=>{})};
  const fi=$("#sylF");if(fi)fi.onchange=()=>handleFile(fi.files&&fi.files[0]);
  const dr=$("#sylDrop");if(dr){dr.addEventListener("dragover",e=>{e.preventDefault();dr.classList.add("over")});dr.addEventListener("dragleave",()=>dr.classList.remove("over"));dr.addEventListener("drop",e=>{e.preventDefault();dr.classList.remove("over");handleFile(e.dataTransfer.files&&e.dataTransfer.files[0])})}
  const rb=$("#sylRun");if(rb)rb.onclick=runExtraction;
  const ag=$("#sylAgain");if(ag)ag.onclick=runExtraction;
  const ib=$("#sylImp");if(ib)ib.onclick=importSelected;
  const ap=$("#sylApply");if(ap)ap.onchange=()=>{SY.applyCourse=ap.checked};
  host.querySelectorAll("[data-sel]").forEach(c=>c.onchange=()=>{SY.sel[c.dataset.sel]=c.checked;const b=$("#sylImp");const n=Object.values(SY.sel).filter(Boolean).length;if(b){b.textContent=`Add ${n} selected`;b.disabled=!n}});
}

/* ---------- AI study assistant ---------- */
const TUTOR=()=>`You are a study tutor for a working legal professional studying the MLEA (Master in Law and Economics) programme alongside a full-time job, with about ${num(S.settings.capacity)||6.5} hours of independent study a week. Your job is to help him understand, plan, and improve his own work. Do not write text for him to submit as his own: give explanations, structure, feedback and questions instead. Be concise and concrete. Only cite authors, cases, statutes or papers you are confident exist, and mark anything uncertain with "(verify)". For dates, weights and requirements use only what the provided material states. Today is ${T}. Write in English. Format with short "## " headings and "- " bullets.`;
function mdLite(t){
  const lines=esc(t||"").split("\n");let h="",list=null;
  const close=()=>{if(list){h+=`</${list}>`;list=null}};
  const inl=x=>x.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/(^|\W)\*(?!\s)(.+?)\*(?=\W|$)/g,"$1<i>$2</i>");
  for(const raw of lines){const l=raw.trimEnd();let m;
    if(m=l.match(/^#{1,4}\s+(.*)$/)){close();h+=`<h4>${inl(m[1])}</h4>`}
    else if(m=l.match(/^\s*[-*•]\s+(.*)$/)){if(list!=="ul"){close();h+="<ul>";list="ul"}h+=`<li>${inl(m[1])}</li>`}
    else if(m=l.match(/^\s*\d+[.)]\s+(.*)$/)){if(list!=="ol"){close();h+="<ol>";list="ol"}h+=`<li>${inl(m[1])}</li>`}
    else if(!l.trim()){close()}
    else{close();h+=`<p>${inl(l)}</p>`}}
  close();return h;
}
function delCtx(d){const L=[];const add=(k,v)=>{if(v!==undefined&&v!==null&&String(v).trim())L.push(k+": "+v)};
  add("Course",cName(d.courseId));add("Title",d.title);add("Type",d.type);add("Responsibility",d.responsibility);add("Group members",d.members);add("Official deadline",dueOf(d));add("Weight in course grade",num(d.weight)!=null?d.weight+"%":"");add("Submission format",d.format);
  add("Description and requirements",d.description);add("Lecturer instructions",d.instructions);add("Required readings",d.readings);add("Instructions summary",d.summary);add("Research question",d.researchQuestion);add("Concepts",d.concepts);add("Argument outline",d.argument);add("Presentation outline",d.outline);add("Required duration (min)",d.duration);add("Number of slides",d.slides);add("Exam scope",d.examScope);add("Lecturer feedback",d.feedback);
  return L.join("\n")}
function courseCtx(cid,max){
  const parts=[];S.syllabi.filter(x=>x.courseId===cid).forEach(x=>parts.push(`[Syllabus: ${x.fileName}]\n${x.text||""}`));
  S.materials.filter(m=>m.courseId===cid).map(m=>({m,l:S.lectures.find(x=>x.id===m.lectureId)})).sort((a,b)=>((a.l&&a.l.date)||"")<((b.l&&b.l.date)||"")?-1:1)
    .forEach(({m,l})=>parts.push(`[Lecture ${l?(l.no?l.no+" · ":"")+(l.date||"")+" · "+(l.topic||""):""} — ${m.fileName}]\n${m.text||""}`));
  let t=parts.join("\n\n");if(t.length>max)t=t.slice(0,max)+"\n[…material truncated]";return t||"(No syllabus or lecture slides uploaded for this course yet.)"}
function lecList(cid){return S.lectures.filter(l=>l.courseId===cid).sort((a,b)=>a.date<b.date?-1:1).map(l=>`- ${l.date||"?"} ${l.topic||"Lecture "+(l.no||"")} (attendance: ${l.attendance||"Scheduled"}, study: ${l.study||"Not started"})`).join("\n")}
function aiErr(e){return e&&e.code==="not_granted"?"Permission to use Claude was declined for this page.":e&&e.code==="rate_limited"?"Claude is busy. Try again in a minute.":e&&e.code==="invalid_json"?"Claude's answer couldn't be read. Try again.":"Claude couldn't answer ("+(e&&e.code||"error")+"). Try again."}
async function aiRun(action,prompt,mode,label){
  if(!S.sample){UI.ai={action,err:"The assistant isn't available in this view. Open the page from your Claude account."};repaintAI();return}
  UI.ai={action,label,busy:true,out:"",err:"",mode};repaintAI();const st=UI.ai;
  try{
    if(mode==="json"){st.json=await S.sample.json(prompt,{modelTier:"default"});if(action==="breakdown")st.sel={};}
    else{const r=await S.sample(prompt,{modelTier:"default",cache:false,onText:({text})=>{st.out=text;const o=$("#aiOut");if(o&&UI.ai===st)o.innerHTML=mdLite(text)}});st.out=r.text}
  }catch(e){st.err=aiErr(e)}
  st.busy=false;if(UI.ai===st)repaintAI();
}
function aiBoxHTML(){
  const E=UI.editing;if(!E)return"";
  if(!E.id)return E.col==="lectures"||E.col==="deliverables"?`<div class="aibox"><h3>Study assistant</h3><p class="note">Save this record first, then the assistant and file attachments appear here.</p></div>`:"";
  if(E.col==="lectures")return lecAI(E);if(E.col==="deliverables")return delAI(E);return"";
}
function repaintAI(){const b=$("#aiBox");if(b){b.innerHTML=aiBoxHTML();bindAI()}}
function aiResult(saveTargets){
  const A=UI.ai;if(!A)return"";let h="";
  if(A.busy)h+=`<div class="busy" role="status"><span class="spin"></span>${esc(A.label||"Thinking")}…</div>`;
  if(A.err)h+=`<div class="alert" role="alert">${esc(A.err)}</div>`;
  if(A.mode!=="json"&&(A.out||A.busy))h+=`<div class="aiout" id="aiOut">${mdLite(A.out)}</div>`;
  if(A.mode!=="json"&&A.out&&!A.busy&&saveTargets&&saveTargets.length)h+=`<div class="acts">${saveTargets.map(([k,l])=>`<button data-aisave="${k}">${esc(l)}</button>`).join("")}<button data-aicopy>Copy</button></div>`;
  if(A.mode==="json"&&A.json&&!A.busy){
    const qs=A.json.questions;
    if(Array.isArray(qs))h+=`<div class="aiout qa">${qs.map((q,i)=>`<details><summary>${i+1}. ${esc(q.q)}</summary>${Array.isArray(q.points)?`<ul>${q.points.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>`:""}</details>`).join("")}</div><div class="acts">${A.action==="qa"?`<button data-aisaveqa>Save to anticipated questions</button>`:""}</div>`;
    if(A.action==="breakdown")h+=breakdownHTML(A.json);
    if(A.action==="findtasks")h+=findTasksHTML(A.json);
  }
  return h;
}
function delAI(E){
  const d=Object.assign({},S.deliverables.find(x=>x.id===E.id)||{},E.rec);const t=d.type;
  const acts=[];
  if(isExam(t))acts.push(["revplan","Revision plan"],["practice","Practice questions"],["concepts","Explain the topics"]);
  else{acts.push(["breakdown","Break down"],["concepts","Explain concepts"]);
    if(isPres(t))acts.push(["slideplan","Slide plan"],["notes","Speaker notes from my outline"],["qa","Practise Q&A"]);
    else acts.push(["outline","Argument options"]);
    acts.push(["review","Review my draft"]);}
  const A=UI.ai;
  const targets=A&&!A.busy?({concepts:[["concepts","Save to concepts"]],outline:[["argument","Save to argument outline"]],slideplan:[["outline","Save to presentation outline"]],notes:[["speakerNotes","Save to speaker notes"]],review:[["versions","Log review in versions"]],revplan:[["examScope","Save to exam topics"]],ask:[["followUp","Save to follow-up actions"]]}[A.action]||[]):[];
  return `<div class="aibox"><h3>Study assistant</h3>
  <div class="acts">${acts.map(([k,l])=>`<button data-ai="${k}" ${A&&A.busy?"disabled":""}>${l}</button>`).join("")}</div>
  ${!isExam(t)?`<details ${A&&A.action==="review"&&!A.out?"open":""} style="margin-bottom:10px"><summary class="sub" style="cursor:pointer">Draft for review</summary><div class="f" style="margin-top:6px"><textarea id="aiDraft" placeholder="Paste your draft here, or attach the file">${esc(UI.draft||"")}</textarea><label class="btn iconbtn" for="aiDraftFile" style="justify-self:start;width:max-content;cursor:pointer">${CLIP} Attach draft (PDF, Word, PowerPoint)</label><input id="aiDraftFile" type="file" hidden accept=".pdf,.docx,.pptx"></div></details>`:""}
  <div style="display:flex;gap:8px;margin-bottom:10px"><input id="aiQ" type="text" placeholder="Ask about this ${isPres(t)?"presentation":isExam(t)?"exam":"assignment"}" style="flex:1;min-width:0;font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:5px;background:var(--bg);color:var(--fg)"><button data-ai="ask" ${A&&A.busy?"disabled":""}>Ask</button></div>
  ${aiResult(targets)}
  <p class="note">Uses this record, the course syllabus and uploaded lecture slides. Save the record first if you changed requirements above. The assistant explains, plans and critiques; the writing stays yours.</p></div>`;
}
function breakdownHTML(j){
  const li=a=>Array.isArray(a)&&a.length?`<ul>${a.map(x=>`<li>${esc(typeof x==="string"?x:x.ref?x.ref+(x.note?" — "+x.note:"")+(x.verify?" (verify)":""):x.task?x.task+(x.hours?" · "+x.hours+"h":""):x.title?(x.date||"")+" "+x.title:JSON.stringify(x))}</li>`).join("")}</ul>`:"<p class='muted'>None</p>";
  return `<div class="aiout"><h4>Instructions summary</h4><p>${esc(j.summary||"—")}</p><h4>Research question</h4><p>${esc(j.researchQuestion||"—")}</p><h4>Expected outcome</h4><p>${esc(j.expectedOutcome||"—")}</p><h4>Concepts</h4>${li(j.concepts)}<h4>Sources to find</h4>${li(j.sources)}<h4>Tasks</h4>${li(j.tasks)}<h4>Milestones</h4>${li(j.milestones)}</div>
  <div class="acts"><button class="primary" data-aiapply>Fill empty fields</button></div><p class="note">Fills only fields that are empty (summary, research question, concepts, outstanding tasks, milestones, effort). Then press Save.</p>`;
}
function lecAI(E){
  const l=Object.assign({},S.lectures.find(x=>x.id===E.id)||{},E.rec);const mats=S.materials.filter(m=>m.lectureId===E.id);const A=UI.ai;
  const targets=A&&!A.busy&&A.action==="summary"?[["notes","Save to lecture notes"]]:A&&!A.busy&&A.action==="lask"?[["notes","Append to notes"]]:[];
  return `<div class="aibox"><h3>Slides & study assistant</h3>
  ${mats.length?`<ul class="matlist" style="list-style:none;padding:0;margin:0 0 8px;display:grid;gap:4px">${mats.map(m=>`<li style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between"><span>${CLIP} ${esc(m.fileName)} <span class="muted">${m.pages?"· "+m.pages+(m.kind==="pptx"?" slides":" pages"):""}</span></span><span style="display:flex;gap:10px">${m.assetId?`<a href="${esc(blobUrl(m.assetId))}" target="_blank" rel="noopener">Open</a>`:""}${UI.matDel===m.id?`<span class="confirm"><button class="danger" data-matdelyes="${m.id}">Remove</button><button data-matdelno>Keep</button></span>`:`<button class="link" data-matdel="${m.id}">Remove</button>`}</span></li>`).join("")}</ul>`:`<p class="note" style="margin-top:0">No slides attached yet.</p>`}
  <div class="acts"><button class="iconbtn" data-matadd="${E.id}">${CLIP} Attach slides (PDF, PowerPoint, Word)</button></div>
  ${UI.matBusy?`<div class="busy"><span class="spin"></span>${esc(UI.matBusy)}</div>`:""}
  ${mats.length?`<div class="acts">${[["summary","Summarise lecture"],["findtasks","Find assignments & deadlines"],["lquiz","Quiz me"]].map(([k,lb])=>`<button data-ai="${k}" ${A&&A.busy?"disabled":""}>${lb}</button>`).join("")}</div>
  <div style="display:flex;gap:8px;margin-bottom:10px"><input id="aiQ" type="text" placeholder="Ask about this lecture" style="flex:1;min-width:0;font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:5px;background:var(--bg);color:var(--fg)"><button data-ai="lask" ${A&&A.busy?"disabled":""}>Ask</button></div>`:""}
  ${aiResult(targets)}</div>`;
}
function findTasksHTML(j){
  const items=Array.isArray(j.items)?j.items:[];
  if(!items.length)return`<div class="aiout"><p>No assignments, presentations or deadlines are announced in these slides.</p></div>`;
  UI.ai.sel=UI.ai.sel||Object.fromEntries(items.map((_,i)=>[i,true]));
  return `<div class="aiout">${items.map((a,i)=>`<label class="rv"><input type="checkbox" data-ftsel="${i}" ${UI.ai.sel[i]?"checked":""}><span class="body"><b>${esc(a.title)}</b> <span class="muted">· ${esc(DTYPES.includes(a.type)?a.type:"Other coursework")}</span><div class="sub">${validDate(a.due)?fmtD(a.due):a.dueText?esc(a.dueText):"No deadline stated"}${typeof a.weight==="number"?" · "+a.weight+"%":""}${a.description?" · "+esc(a.description):""}</div></span></label>`).join("")}</div>
  <div class="acts"><button class="primary" data-ftadd>Add selected to deliverables</button></div>`;
}
function aiPrompt(action,E){
  const col=E.col;const q=($("#aiQ")&&$("#aiQ").value||"").trim();
  if(col==="lectures"){
    const l=Object.assign({},S.lectures.find(x=>x.id===E.id)||{},E.rec);const mats=S.materials.filter(m=>m.lectureId===E.id).map(m=>`[${m.fileName}]\n${m.text||""}`).join("\n\n").slice(0,90000);
    const head=`${TUTOR()}\n\nCourse: ${cName(l.courseId)}\nLecture: ${l.no?l.no+" · ":""}${l.date||""} · ${l.topic||""}\n\nLECTURE MATERIAL:\n"""\n${mats}\n"""\n\n`;
    if(action==="summary")return[head+"Summarise this lecture for revision: key concepts, legal rules and cases, economic models or arguments, and the 5 points most worth remembering. End with how it likely connects to the course's assessments.","text","Summarising"];
    if(action==="lquiz")return[head+`Write 8 short-answer revision questions on this lecture, testing understanding rather than recall where possible. Return JSON: {"questions":[{"q":"","points":["key answer point"]}]}`,"json","Writing questions"];
    if(action==="findtasks")return[head+`List every assignment, presentation, reading task, quiz, exam or deadline that these slides announce. Use only what is stated; never invent dates or weights. Dates as YYYY-MM-DD (null if not a clear date; put vague wording in dueText). type must be one of: ${DTYPES.join(" | ")}. Return JSON: {"items":[{"title":"","type":"","due":null,"dueText":null,"weight":null,"description":null}]}`,"json","Looking for assignments"];
    if(action==="lask"){if(!q)return null;return[head+"Question: "+q,"text","Answering"]}
  }
  const d=Object.assign({},S.deliverables.find(x=>x.id===E.id)||{},E.rec);
  const head=`${TUTOR()}\n\nDELIVERABLE:\n${delCtx(d)}\n\nCOURSE MATERIAL (syllabus and lecture slides):\n"""\n${courseCtx(d.courseId,70000)}\n"""\n\n`;
  const cap=num(S.settings.capacity)||6.5;
  switch(action){
    case"breakdown":return[head+`Break this deliverable down so he can plan it. Schedule milestones between ${T} and the deadline, leaving at least a 2-day buffer, assuming about ${cap} h/week of total study time shared with other courses. Return JSON: {"summary":"plain-English summary of what is required","researchQuestion":"","expectedOutcome":"","concepts":["legal or economic concept"],"sources":[{"ref":"","note":"why useful","verify":true}],"tasks":[{"task":"","hours":1}],"milestones":[{"date":"YYYY-MM-DD","title":""}]}`,"json","Breaking it down"];
    case"concepts":return[head+"Explain the legal and economic concepts and theories this engages, how they connect to each other and to the requirements, and the main debates. One short section per concept. End with 5 reading leads (mark uncertain ones '(verify)').","text","Explaining"];
    case"outline":return[head+"Propose 2–3 possible theses or angles, with the trade-offs of each. Then give an argument structure for the strongest: sections, the point each section must establish, and the evidence or authority it needs. Don't write the prose.","text","Outlining"];
    case"review":{const dr=(($("#aiDraft")&&$("#aiDraft").value)||UI.draft||"").trim();if(dr.length<200){UI.ai={action:"review",err:"Paste or attach your draft first (open \"Draft for review\")."};repaintAI();return null}
      return[head+`Review his draft against the requirements. Give: 1) requirements coverage (met / partly / missing, per requirement); 2) argument and structure; 3) quality of legal and economic analysis; 4) sources and citation gaps; 5) the top 6 specific improvements, each locating the passage with at most a short phrase. Don't rewrite his paragraphs.\n\nDRAFT:\n"""\n${dr.slice(0,60000)}\n"""`,"text","Reviewing your draft"]}
    case"slideplan":return[head+`Produce a slide-by-slide plan${num(d.duration)?" fitting "+d.duration+" minutes":""}${num(d.slides)?" in about "+d.slides+" slides":""}: for each slide a title, 2–4 key points, a visual suggestion, and time. Build on his presentation outline if there is one.`,"text","Planning slides"];
    case"notes":if(!String(d.outline||"").trim()){UI.ai={action:"notes",err:"Write or save a presentation outline first; the notes are built from it."};repaintAI();return null}
      return[head+"From his presentation outline, give per-slide speaker-note prompts: 3–5 short cue bullets he speaks from, plus a transition line to the next slide. Cues, not a script.","text","Drafting speaker notes"];
    case"qa":return[head+`Write 8 questions a lecturer or classmate is likely to ask after this presentation, hardest last. For each, list the key points a strong answer covers. Return JSON: {"questions":[{"q":"","points":[""]}]}`,"json","Preparing questions"];
    case"practice":return[head+`Write 10 exam-style practice questions matching this assessment's type and scope, mixing short problems and essay questions, with the key points a strong answer covers. Return JSON: {"questions":[{"q":"","points":[""]}]}`,"json","Writing practice questions"];
    case"revplan":return[head+`Lectures for this course:\n${lecList(d.courseId)}\n\nBuild a revision plan from ${T} to the exam date within about ${cap} h/week shared with other work: topics in priority order (weak or unstudied lectures first), what to do for each (read, summarise, practise), and a week-by-week schedule.`,"text","Planning revision"];
    case"ask":if(!q)return null;return[head+"Question: "+q,"text","Answering"];
  }
  return null;
}
async function saveField(col,id,field,text,mode){
  if(!S.db)return;const r=S[col].find(x=>x.id===id)||{};const prev=String(r[field]||"").trim();
  const val=mode==="append"||prev?(prev?prev+"\n\n":"")+(mode==="log"?`[${T}] AI review:\n`:"")+text:text;
  try{await S.db.doc(col+"/"+id).update({[field]:val,updatedAt:T});if(UI.editing&&UI.editing.id===id)UI.editing.rec[field]=val;const el=document.getElementById("fld_"+field);if(el)el.value=val;toast("Saved to record")}catch(e){toast("Not saved: "+(e.code||"error"))}
}
async function attachMaterial(lectureId,file){
  const l=S.lectures.find(x=>x.id===lectureId);if(!file||!l||!S.db)return;
  UI.matBusy="Reading "+file.name+"…";repaintAI();
  try{const r=await extractText(file);if(r.text.replace(/\s/g,"").length<40)throw new Error("This file has almost no selectable text, so it's probably scanned images. Try the PowerPoint version.");
    let assetId=null;if(r.kind==="pdf"&&S.assets){try{assetId=(await S.assets.upload(file)).id}catch(e){}}
    await S.db.collection("materials").add({lectureId,courseId:l.courseId,fileName:file.name,kind:r.kind,pages:r.pages,assetId,text:r.text.slice(0,180000),addedAt:T});
    if(!l.materials)try{await S.db.doc("lectures/"+lectureId).update({materials:file.name,updatedAt:T})}catch(e){}
    toast("Slides attached");
  }catch(e){toast(e&&e.message?e.message:"The file couldn't be read")}
  UI.matBusy="";repaintAI();
}
document.addEventListener("change",e=>{if(e.target&&e.target.id==="matInput"){const f=e.target.files&&e.target.files[0];if(f&&UI.matTarget)attachMaterial(UI.matTarget,f)}});
function bindAI(){
  const box=$("#aiBox");if(!box)return;const E=UI.editing;if(!E)return;
  box.querySelectorAll("[data-ai]").forEach(b=>b.onclick=()=>{const P=aiPrompt(b.dataset.ai,E);if(P)aiRun(b.dataset.ai,P[0],P[1],P[2])});
  const q=$("#aiQ");if(q)q.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();const k=E.col==="lectures"?"lask":"ask";const P=aiPrompt(k,E);if(P)aiRun(k,P[0],P[1],P[2])}});
  const dr=$("#aiDraft");if(dr)dr.addEventListener("input",()=>{UI.draft=dr.value});
  const df=$("#aiDraftFile");if(df)df.onchange=async()=>{const f=df.files&&df.files[0];if(!f)return;try{const r=await extractText(f);UI.draft=r.text;const t=$("#aiDraft");if(t)t.value=r.text;toast("Draft loaded: "+f.name)}catch(e){toast(e.message||"Couldn't read the draft")}};
  box.querySelectorAll("[data-aisave]").forEach(b=>b.onclick=()=>{const k=b.dataset.aisave;saveField(E.col,E.id,k,UI.ai.out,k==="versions"?"log":"append")});
  const cp=box.querySelector("[data-aicopy]");if(cp)cp.onclick=()=>{navigator.clipboard.writeText(UI.ai.out).then(()=>toast("Copied")).catch(()=>toast("Copy isn't allowed here; select the text instead"))};
  const qa=box.querySelector("[data-aisaveqa]");if(qa)qa.onclick=()=>saveField(E.col,E.id,"questions",UI.ai.json.questions.map((x,i)=>`${i+1}. ${x.q}\n${(x.points||[]).map(p=>"   - "+p).join("\n")}`).join("\n"),"append");
  const ap=box.querySelector("[data-aiapply]");if(ap)ap.onclick=()=>{const j=UI.ai.json,R=E.rec;const fill=(k,v)=>{if(v&&!String(R[k]||"").trim())R[k]=v};
    fill("summary",j.summary);fill("researchQuestion",[j.researchQuestion,j.expectedOutcome?"Expected outcome: "+j.expectedOutcome:""].filter(Boolean).join("\n"));
    fill("concepts",(j.concepts||[]).join("\n"));fill("outstanding",(j.tasks||[]).map(t=>t.task+(t.hours?` (${t.hours}h)`:"")).join("\n"));
    fill("milestones",(j.milestones||[]).filter(m=>validDate(m.date)).map(m=>m.date+" "+m.title).join("\n"));
    const hrs=(j.tasks||[]).reduce((s,t)=>s+(num(t.hours)||0),0);if(hrs&&num(R.estHours)==null)R.estHours=Math.round(hrs*2)/2;
    if(Array.isArray(j.sources)&&j.sources.length)fill("readings",j.sources.map(x=>(x.ref||"")+(x.verify?" (verify)":"")).join("\n"));
    const top=$("#recForm").scrollTop;drawDrawer();$("#recForm").scrollTop=top;toast("Fields filled. Review, then Save")};
  box.querySelectorAll("[data-ftsel]").forEach(c=>c.onchange=()=>{UI.ai.sel[c.dataset.ftsel]=c.checked});
  const fa=box.querySelector("[data-ftadd]");if(fa)fa.onclick=async()=>{const items=UI.ai.json.items||[];const l=S.lectures.find(x=>x.id===E.id);const nums=S.deliverables.map(d=>parseInt(String(d.did||"").replace(/\D/g,""),10)).filter(n=>isFinite(n));let next=nums.length?Math.max(...nums):0;let n=0;
    for(let i=0;i<items.length;i++){if(!UI.ai.sel[i])continue;const a=items[i];const type=DTYPES.includes(a.type)?a.type:"Other coursework";
      const ok=await save("deliverables",{did:"D-"+String(++next).padStart(3,"0"),courseId:l.courseId,title:a.title||"Untitled",type,responsibility:/Group/.test(type)?"Group":"Individual",weight:typeof a.weight==="number"?a.weight:"",due:validDate(a.due)?a.due:"",description:[a.description,a.dueText?"Deadline as written: "+a.dueText:"","Source: lecture slides ("+fmtD(l.date)+")"].filter(Boolean).join("\n"),status:"Announced"});if(!ok)break;n++}
    toast(`Added ${n} deliverable${n===1?"":"s"}`);UI.ai=null;repaintAI()};
  const ma=box.querySelector("[data-matadd]");if(ma)ma.onclick=()=>{UI.matTarget=ma.dataset.matadd;const mi=$("#matInput");mi.value="";mi.click()};
  box.querySelectorAll("[data-matdel]").forEach(b=>b.onclick=()=>{UI.matDel=b.dataset.matdel;repaintAI()});
  const mn=box.querySelector("[data-matdelno]");if(mn)mn.onclick=()=>{UI.matDel=null;repaintAI()};
  const my=box.querySelector("[data-matdelyes]");if(my)my.onclick=async()=>{const m=S.materials.find(x=>x.id===my.dataset.matdelyes);UI.matDel=null;if(!m)return;try{if(m.assetId&&S.assets)await S.assets.delete(m.assetId).catch(()=>{});await S.db.doc("materials/"+m.id).delete();toast("Removed")}catch(e){toast("Not removed: "+(e.code||"error"))}};
}
/* course-level chat */
UI.chat={};UI.chatCourse="";
function vAssist(){
  if(!S.sample)return`<div class="empty"><strong>The study assistant isn't switched on.</strong>The programme admin can enable it; see the README.</div>`;
  if(!S.courses.length)return setupNeeded();
  const cid=UI.chatCourse||S.courses[0].id;UI.chatCourse=cid;const log=UI.chat[cid]||[];
  const nS=S.syllabi.filter(x=>x.courseId===cid).length,nM=S.materials.filter(x=>x.courseId===cid).length;
  return `<div class="bar"><div><h2>Study assistant</h2><div class="sub">Ask about a course using its syllabus, lecture slides and your deliverables</div></div></div>
  <div class="bar"><div class="chips">${S.courses.map(c=>`<button class="chip" data-chatc="${c.id}" aria-pressed="${c.id===cid}">${esc(c.code||c.name)}</button>`).join("")}</div><span class="sub">${nS} syllabus file${nS===1?"":"s"} · ${nM} slide file${nM===1?"":"s"}</span></div>
  <div class="panel" style="max-width:820px">
   ${log.length?`<div class="chatlog">${log.map(m=>m.role==="user"?`<div class="msg-u">${esc(m.shown||m.content)}</div>`:`<div class="aiout"${m.live?' id="chatLive"':""}>${mdLite(m.content)}</div>`).join("")}</div>`:`<p class="note" style="margin-top:0">Try: “Explain the Coase theorem as it's used in lecture 3”, “What does the final exam cover?”, “Which lectures should I recover first before the midterm?”${!nS&&!nM?" Upload a syllabus or lecture slides first for answers grounded in your course.":""}</p>`}
   ${UI.chatErr?`<div class="alert" role="alert">${esc(UI.chatErr)}</div>`:""}
   <div style="display:flex;gap:8px"><textarea id="chatIn" rows="2" placeholder="Ask a question about ${esc(course(cid)?course(cid).name:"this course")}" style="flex:1;min-width:0;font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:5px;background:var(--bg);color:var(--fg)">${esc(UI.chatDraft||"")}</textarea><div style="display:grid;gap:6px;align-content:start"><button class="primary" id="chatGo" ${UI.chatBusy?"disabled":""}>Ask</button>${log.length?`<button id="chatClear" ${UI.chatBusy?"disabled":""}>Clear</button>`:""}</div></div>
  </div>`;
}
function bindAssist(){
  document.querySelectorAll("[data-chatc]").forEach(b=>b.onclick=()=>{UI.chatCourse=b.dataset.chatc;UI.chatErr="";render()});
  const inp=$("#chatIn");if(inp){inp.addEventListener("input",()=>{UI.chatDraft=inp.value});inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat()}})}
  const go=$("#chatGo");if(go)go.onclick=sendChat;
  const cl=$("#chatClear");if(cl)cl.onclick=()=>{UI.chat[UI.chatCourse]=[];render()};
}
async function sendChat(){
  const q=(UI.chatDraft||"").trim();if(!q||UI.chatBusy)return;
  if(!S.sample){UI.chatErr="The assistant isn't available in this view.";render();return}
  const cid=UI.chatCourse;const log=UI.chat[cid]=UI.chat[cid]||[];
  const dels=S.deliverables.filter(d=>d.courseId===cid).map(d=>`- ${d.title} (${d.type}; due ${dueOf(d)||"not set"}; weight ${num(d.weight)!=null?d.weight+"%":"not stated"}; status ${d.status})`).join("\n");
  const ctx=`${TUTOR()}\n\nCourse: ${cName(cid)}\n\nDeliverables:\n${dels||"(none entered)"}\n\nLectures:\n${lecList(cid)||"(none entered)"}\n\nCOURSE MATERIAL:\n"""\n${courseCtx(cid,80000)}\n"""\n\n`;
  log.push({role:"user",content:q,shown:q});UI.chatDraft="";UI.chatErr="";UI.chatBusy=true;
  const live={role:"assistant",content:"",live:true};log.push(live);render();
  const msgs=log.filter(m=>m!==live).map((m,i)=>({role:m.role,content:i===0?ctx+"Question: "+m.content:m.content}));
  try{const r=await S.sample(msgs,{modelTier:"default",cache:false,onText:({text})=>{live.content=text;const el=$("#chatLive");if(el)el.innerHTML=mdLite(text)}});live.content=r.text}
  catch(e){log.pop();UI.chatErr=aiErr(e)}
  live.live=false;UI.chatBusy=false;render();
}

/* ---------- app shell: icons, colours, sheets ---------- */
const ICONS={home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 cal:'<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
 work:'<path d="M10 6h10M10 12h10M10 18h10"/><path d="m3.5 6 1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>',
 lect:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20.5h8"/>',
 spark:'<path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.5l-1.8-5L5 9.7l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
 more:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
 bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
 timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',chevL:'<path d="m15 6-6 6 6 6"/>',chevR:'<path d="m9 6 6 6-6 6"/>',
 grad:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
 book:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/>',
 chart:'<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>',report:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.8 2.5 3 5.2"/>',
 gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
 download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4.5M12 17.2v.1"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',clip:'<path d="M21.4 11.1l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/>',
 check:'<path d="m4 12.5 5 5L20 6.5"/>'};
function ico(n,s){return `<svg width="${s||20}" height="${s||20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||""}</svg>`}
const COLOR_NAMES=["Teal","Indigo","Amber","Rose","Violet","Green","Sky","Orange"];
function ccIdx(cid){const c=course(cid);if(!c)return -1;const i=COLOR_NAMES.indexOf(c.color);return i>=0?i:S.courses.indexOf(c)%8}
function ccOf(cid){const i=ccIdx(cid);return i<0?"var(--muted)":`var(--c${i})`}
function itemCourse(e){const r=(S[e.col]||[]).find(x=>x.id===e.id);return r&&r.courseId}
function nowHM(){try{return new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Cairo",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date())}catch(e){return"12:00"}}
function openSheet(title,html,bind,short){
  const host=$("#drawerHost");UI.editing=null;
  host.innerHTML=`<div class="scrim" data-close></div><aside class="drawer ${short?"short":""}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="dh"><h2 style="font-size:17px">${esc(title)}</h2><button data-close>Close</button></div><div class="db" id="sheetBody">${html}</div></aside>`;
  host.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeSheet);
  if(bind)bind(host);
}
function closeSheet(){$("#drawerHost").innerHTML="";UI.sheet=null}

/* ---------- study time ---------- */
function weekStudy(){const ws=weekStartOf(T),we=addDays(ws,6);const mins=S.sessions.filter(s=>s.date>=ws&&s.date<=we).reduce((a,s)=>a+(num(s.minutes)||0),0);return{mins,cap:num(S.settings.capacity)||6.5}}
function streak(){const ds=new Set(S.sessions.map(s=>s.date));let n=0,d=T;if(!ds.has(d))d=addDays(d,-1);while(ds.has(d)){n++;d=addDays(d,-1)}return n}

/* ---------- alerts ---------- */
function loadDismissed(){try{return JSON.parse(localStorage.getItem("mlea.dismissed")||"{}")}catch(e){return{}}}
function saveDismissed(m){try{localStorage.setItem("mlea.dismissed",JSON.stringify(m))}catch(e){}}
function allAlerts(){
  const A=[];const open=S.deliverables.filter(d=>!DONE.has(d.status)&&d.status!=="Not announced");
  for(const d of open){const due=dueOf(d);if(!validDate(due))continue;const n=daysBetween(T,due);
    if(n<0)A.push({id:"over:"+d.id+":"+due,level:"crit",title:`Overdue: ${d.title}`,detail:`${cShort(d.courseId)} · was due ${fmtD(due)}. Update the status once submitted.`,open:"deliverables:"+d.id});
    else if(n<=3)A.push({id:"crit:"+d.id+":"+due,level:"crit",title:`${d.title} due ${daysTxt(n)}`,detail:`${cShort(d.courseId)} · ${d.type}${num(d.weight)!=null?" · "+d.weight+"%":""} · status: ${d.status}`,open:"deliverables:"+d.id});
    if(isPres(d.type)&&n>=0&&n<=7&&(d.slideStatus!=="Done"||!/Ready|twice/.test(d.rehearsal||"")))A.push({id:"pres:"+d.id+":"+due+":"+(d.slideStatus||"")+(d.rehearsal||""),level:"high",title:`Presentation in ${n} day${n===1?"":"s"}: ${d.title}`,detail:`Slides: ${d.slideStatus||"Not started"} · rehearsal: ${d.rehearsal||"Not started"}`,open:"deliverables:"+d.id});
    if(isExam(d.type)&&n>=0&&n<=14&&(num(d.revisionPct)||0)<60)A.push({id:"exam:"+d.id+":"+due+":"+(d.revisionPct||0),level:"high",title:`${d.title} ${daysTxt(n)}`,detail:`Revision coverage ${num(d.revisionPct)!=null?d.revisionPct+"%":"not tracked"}. Open the exam to get a revision plan.`,open:"deliverables:"+d.id});
  }
  const Lw=weekLoad();if(Lw.weeks[0].hours>Lw.cap+0.05)A.push({id:"load:"+weekStartOf(T)+":"+Math.round(Lw.weeks[0].hours),level:"high",title:`This week needs ${Lw.weeks[0].hours.toFixed(1)}h; you have ${Lw.cap}h`,detail:"Start the next deadlines earlier or reduce scope. The weekly report shows what fits.",open:"#report"});
  const unmarked=S.lectures.filter(l=>validDate(l.date)&&l.date<T&&(!l.attendance||l.attendance==="Scheduled"));
  if(unmarked.length)A.push({id:"unm:"+unmarked.length+":"+unmarked[unmarked.length-1].date,level:"med",title:`${unmarked.length} past lecture${unmarked.length===1?"":"s"} not marked`,detail:"Mark attendance so recovery tracking stays accurate.",open:"#lectures"});
  const rec=S.lectures.filter(l=>validDate(l.date)&&l.date<=T&&(l.attendance==="Missed"||l.study==="Needs recovery")&&l.study!=="Studied");
  if(rec.length)A.push({id:"rec:"+rec.length,level:"med",title:`${rec.length} lecture${rec.length===1?"":"s"} to recover`,detail:rec.slice(0,3).map(l=>cShort(l.courseId)+" "+(l.topic||fmtD(l.date))).join(" · "),open:"#lectures",seg:"recover"});
  for(const r of S.readings){if(r.status==="Done"||!validDate(r.due))continue;const n=daysBetween(T,r.due);if(n>=0&&n<=3)A.push({id:"read:"+r.id+":"+r.due,level:"med",title:`Reading due ${daysTxt(n)}: ${r.title}`,detail:cShort(r.courseId),open:"readings:"+r.id})}
  const missing=open.filter(d=>!validDate(dueOf(d))||num(d.weight)==null);
  if(missing.length)A.push({id:"miss:"+missing.length,level:"info",title:`${missing.length} task${missing.length===1?"":"s"} missing a deadline or weight`,detail:"Add them from the syllabus or ask the lecturer; nothing is assumed.",open:"#work"});
  const todayL=S.lectures.filter(l=>l.date===T&&l.attendance!=="Cancelled");
  if(todayL.length)A.push({id:"today:"+T,level:"info",title:`${todayL.length} lecture${todayL.length===1?"":"s"} today`,detail:todayL.map(l=>(l.start?l.start+" ":"")+cShort(l.courseId)+" "+(l.topic||"")).join(" · "),open:"#calendar"});
  const order={crit:0,high:1,med:2,info:3};return A.sort((a,b)=>order[a.level]-order[b.level]);
}
function activeAlerts(){const dm=loadDismissed();return allAlerts().filter(a=>!dm[a.id])}
function alertHTML(a,dismiss){return `<div class="alertitem" data-alopen="${esc(a.open)}" ${a.seg?`data-seg="${a.seg}"`:""}><span class="lv ${a.level}">${ico(a.level==="info"?"info":"alert",17)}</span><span class="bd"><div class="t">${esc(a.title)}</div><div class="dt">${esc(a.detail)}</div></span>${dismiss?`<button class="link" data-aldis="${esc(a.id)}" aria-label="Dismiss">Dismiss</button>`:""}</div>`}
function bindAlertItems(root){
  root.querySelectorAll("[data-alopen]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest("button"))return;const o=el.dataset.alopen;closeSheet();if(el.dataset.seg)UI.lecSeg=el.dataset.seg;if(o.startsWith("#")){location.hash=o}else{const[c,i]=o.split(":");openDrawer(c,i)}}));
  root.querySelectorAll("[data-aldis]").forEach(b=>b.onclick=()=>{const m=loadDismissed();m[b.dataset.aldis]=1;saveDismissed(m);if(UI.sheet==="alerts")openAlerts();render()});
}
function openAlerts(){
  UI.sheet="alerts";const al=activeAlerts();const nDis=allAlerts().length-al.length;
  openSheet("Alerts",`${al.length?`<div class="alertlist">${al.map(a=>alertHTML(a,true)).join("")}</div>`:`<div class="empty"><strong>All clear.</strong>No deadlines, recoveries or workload problems need attention.</div>`}
  ${nDis?`<p class="note">${nDis} dismissed alert${nDis===1?"":"s"} hidden. <button class="link" id="alUndo">Show again</button></p>`:""}
  <p class="note">Alerts are worked out from your records each time you open the app. For reminders on your phone even when it's closed, export the calendar from the Calendar tab.</p>`,h=>{bindAlertItems(h);const u=h.querySelector("#alUndo");if(u)u.onclick=()=>{saveDismissed({});openAlerts();render()}});
}

/* ---------- today ---------- */
function vToday(){
  const hr=Number(nowHM().slice(0,2));const greet=hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const nm=S.settings.name||(S.profile&&S.profile.full_name||"").split(" ")[0];const name=nm?", "+esc(nm):"";const L=S.settings.logos||{};
  const W=weekStudy();const pct=Math.min(1,W.mins/60/W.cap);const R=26,C=2*Math.PI*R;
  const al=activeAlerts();const top=al.filter(a=>a.level!=="info").slice(0,3);
  const now=nowHM();
  const nextL=S.lectures.filter(l=>validDate(l.date)&&l.attendance!=="Cancelled"&&(l.date>T||(l.date===T&&(l.end||l.start||"23:59")>=now))).sort((a,b)=>a.date===b.date?((a.start||"")<(b.start||"")?-1:1):(a.date<b.date?-1:1))[0];
  let cd="";if(nextL){if(nextL.date===T&&nextL.start){const[h1,m1]=nextL.start.split(":").map(Number),[h0,m0]=now.split(":").map(Number);const diff=(h1*60+m1)-(h0*60+m0);cd=diff<=0?"Now":diff<60?`in ${diff} min`:`in ${Math.floor(diff/60)}h ${diff%60}m`}else cd=daysTxt(daysBetween(T,nextL.date))}
  const todayItems=calItems().filter(e=>e.date===T);
  const due=S.deliverables.filter(d=>!DONE.has(d.status)&&validDate(dueOf(d))&&daysBetween(T,dueOf(d))<=14).sort((a,b)=>dueOf(a)<dueOf(b)?-1:1);
  const st=streak();
  const nd=nextL?new Date(toUTC(nextL.date)):null;
  return `<section class="hero">
    <div><div class="hi">${greet}${name}</div><div class="hd">${esc(fmtLong(T))}</div></div>
    <div class="row2"><svg class="ring" width="74" height="74" viewBox="0 0 74 74" role="img" aria-label="${(W.mins/60).toFixed(1)} of ${W.cap} hours studied this week"><circle class="bgc" cx="37" cy="37" r="${R}"/><circle class="fgc" cx="37" cy="37" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct)}" transform="rotate(-90 37 37)"/><text x="37" y="41" text-anchor="middle">${Math.round(pct*100)}%</text></svg>
    <div class="hstats"><span><b>${(W.mins/60).toFixed(1)}h</b> of ${W.cap}h studied this week</span><span><b>${due.length}</b> deadline${due.length===1?"":"s"} in the next 14 days</span><span>${st?`<b>${st}</b>-day study streak`:"Start a focus session to begin a streak"}</span></div></div>
    <div class="logos">${INST.map(i=>`<span class="logo">${L[i.k]?`<img src="${esc(blobUrl(L[i.k]))}" alt="">`:""}<span>${esc(i.name)}<br><span style="font-weight:500">${esc(i.sub)}</span></span></span>`).join("")}</div>
  </section>
  ${setupNeeded()}
  <div class="qa-row"><button data-quick="focus">${ico("timer",22)}Focus</button><button data-new="deliverables">${ico("plus",22)}Add task</button><button data-syl="">${ico("clip",22)}Syllabus</button><button data-gohash="assistant">${ico("spark",22)}Ask</button></div>
  ${top.length?`<div class="sect"><div class="sh"><h2>Needs attention</h2><button class="link" id="allAlerts">All alerts (${al.length})</button></div><div class="alertlist">${top.map(a=>alertHTML(a,false)).join("")}</div></div>`:""}
  ${nextL?`<div class="sect"><div class="sh"><h2>Next lecture</h2><span class="countdown">${esc(cd)}</span></div><div class="nextcard" data-open="lectures:${nextL.id}"><div class="datebox ${nextL.date===T?"today":""}"><div class="m">${nd.toLocaleDateString("en-GB",{month:"short",timeZone:"UTC"})}</div><div class="d">${nd.getUTCDate()}</div></div><div class="body"><span class="cchip" style="--cc:${ccOf(nextL.courseId)}">${esc(cName(nextL.courseId))}</span><div class="t">${esc(nextL.topic||"Lecture"+(nextL.no?" "+nextL.no:""))}</div><span class="sub mono">${esc(nextL.start||"")}${nextL.end?"–"+esc(nextL.end):""}${nextL.venue?" · "+esc(nextL.venue):""}</span></div></div></div>`:""}
  <div class="sect"><div class="sh"><h2>Today</h2><a href="#calendar" class="sub">Calendar</a></div>${todayItems.length?`<div class="agenda">${todayItems.map(e=>agHTML(e)).join("")}</div>`:`<div class="empty">Nothing scheduled today.${S.courses.length?" A good day for recovery or reading.":""}</div>`}</div>
  ${due.length?`<div class="sect"><div class="sh"><h2>Due soon</h2><a href="#work" class="sub">All tasks</a></div><div class="hscroll">${due.map(dCard).join("")}</div></div>`:""}`;
}

/* ---------- focus timer ---------- */
const TM={state:null,iv:null};
try{TM.state=JSON.parse(localStorage.getItem("mlea.timer")||"null")}catch(e){TM.state=null}
function tmSave(){try{localStorage.setItem("mlea.timer",JSON.stringify(TM.state))}catch(e){}}
function tmRemaining(){const s=TM.state;if(!s)return 0;if(!s.running)return s.remaining;return Math.max(0,s.endsAt-Date.now())}
function fmtMS(ms){const t=Math.ceil(ms/1000);return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")}
function tmTargets(){
  const o=[["","General study"]];
  S.deliverables.filter(d=>!DONE.has(d.status)).sort((a,b)=>(dueOf(a)||"9")<(dueOf(b)||"9")?-1:1).forEach(d=>o.push(["deliverables:"+d.id,`${cShort(d.courseId)} · ${d.title}`]));
  S.lectures.filter(l=>validDate(l.date)&&l.date<=T&&l.study!=="Studied"&&l.attendance!=="Cancelled").forEach(l=>o.push(["lectures:"+l.id,`${cShort(l.courseId)} · Study: ${l.topic||fmtD(l.date)}`]));
  S.readings.filter(r=>r.status!=="Done").forEach(r=>o.push(["readings:"+r.id,`${cShort(r.courseId)} · Read: ${r.title}`]));
  return o;
}
function tmLabel(t){if(!t)return"General study";const[c,i]=t.split(":");const r=(S[c]||[]).find(x=>x.id===i);if(!r)return"Study";return c==="lectures"?"Study: "+(r.topic||fmtD(r.date)):r.title}
function openTimer(target){
  UI.sheet="timer";const s=TM.state;
  if(s){const tot=s.duration*60000,rem=tmRemaining(),R=88,C=2*Math.PI*R;
    openSheet("Focus session",`<div class="sub" style="text-align:center">${esc(tmLabel(s.target))}</div>
    <div class="tring"><svg width="210" height="210" viewBox="0 0 210 210" aria-hidden="true"><circle class="bgc" cx="105" cy="105" r="${R}"/><circle class="fgc" id="tmArc" cx="105" cy="105" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-rem/tot)}" transform="rotate(-90 105 105)"/></svg></div>
    <div class="tbig" id="tmBig" role="timer" style="margin-top:-150px;margin-bottom:96px">${fmtMS(rem)}</div>
    <div class="acts" style="justify-content:center">${s.running?`<button id="tmPause">Pause</button>`:`<button class="primary" id="tmResume">Resume</button>`}<button class="primary" id="tmFinish">Finish and log</button><button class="danger" id="tmDiscard">Discard</button></div>
    <p class="note" style="text-align:center">Keep this app open for the countdown. Logged time counts toward this week's study hours.</p>`,h=>{
      const p=h.querySelector("#tmPause");if(p)p.onclick=()=>{TM.state.remaining=tmRemaining();TM.state.running=false;tmSave();openTimer();render()};
      const r=h.querySelector("#tmResume");if(r)r.onclick=()=>{TM.state.endsAt=Date.now()+TM.state.remaining;TM.state.running=true;tmSave();tmTick();openTimer();render()};
      h.querySelector("#tmFinish").onclick=()=>tmFinish(false);
      h.querySelector("#tmDiscard").onclick=()=>{TM.state=null;tmSave();closeSheet();render();toast("Session discarded")};
    },true);
    return;
  }
  const opts=tmTargets();UI.tmDur=UI.tmDur||25;
  openSheet("Focus session",`<div class="f wide"><label for="tmT">What are you working on?</label><select id="tmT">${opts.map(([v,l])=>`<option value="${esc(v)}" ${v===(target||"")?"selected":""}>${esc(l)}</option>`).join("")}</select></div>
   <div class="durs">${[25,45,60,90].map(m=>`<button class="chip" data-dur="${m}" aria-pressed="${UI.tmDur===m}">${m} min</button>`).join("")}</div>
   <div class="acts" style="justify-content:center"><button class="primary" id="tmStart" style="min-width:160px">Start ${UI.tmDur} min</button></div>
   <p class="note" style="text-align:center">This week: ${(weekStudy().mins/60).toFixed(1)}h of ${weekStudy().cap}h. Sessions you finish are logged automatically.</p>`,h=>{
    h.querySelectorAll("[data-dur]").forEach(b=>b.onclick=()=>{UI.tmDur=Number(b.dataset.dur);h.querySelectorAll("[data-dur]").forEach(x=>x.setAttribute("aria-pressed",x===b));h.querySelector("#tmStart").textContent=`Start ${UI.tmDur} min`});
    h.querySelector("#tmStart").onclick=()=>{TM.state={target:h.querySelector("#tmT").value,duration:UI.tmDur,endsAt:Date.now()+UI.tmDur*60000,running:true,started:T};tmSave();tmTick();closeSheet();render();toast("Focus started")};
  },true);
}
async function tmFinish(auto){
  const s=TM.state;if(!s)return;const done=s.duration*60000-tmRemaining();const mins=Math.round(done/60000);
  TM.state=null;tmSave();if(UI.sheet==="timer")closeSheet();
  if(auto){try{const ctx=new (window.AudioContext||window.webkitAudioContext)();[0,0.25,0.5].forEach(t=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=880;g.gain.value=0.08;o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+0.15)})}catch(e){}}
  if(mins>=1&&S.db){let courseId="";if(s.target){const[c,i]=s.target.split(":");const r=(S[c]||[]).find(x=>x.id===i);courseId=r&&r.courseId||""}
    try{await S.db.collection("sessions").add({date:T,minutes:mins,target:s.target||"",courseId,label:tmLabel(s.target)});toast(`${auto?"Time's up. ":""}Logged ${mins} min`)}catch(e){toast("Session not logged: "+(e.code||"error"))}}
  else toast("Session under a minute, not logged");
  render();
}
function paintTimerPill(){
  const host=$("#timerHost");const s=TM.state;
  if(!s){host.innerHTML="";return}
  host.innerHTML=`<button class="timerpill" id="tmPill" aria-label="Open focus timer">${ico("timer",16)}<span id="tmPillT">${fmtMS(tmRemaining())}</span>${s.running?"":" · paused"}</button>`;
  $("#tmPill").onclick=()=>openTimer();
}
function tmTick(){
  clearInterval(TM.iv);
  TM.iv=setInterval(()=>{const s=TM.state;if(!s||!s.running){clearInterval(TM.iv);return}
    const rem=tmRemaining();const p=$("#tmPillT");if(p)p.textContent=fmtMS(rem);const b=$("#tmBig");if(b)b.textContent=fmtMS(rem);
    const a=$("#tmArc");if(a){const C=2*Math.PI*88;a.setAttribute("stroke-dashoffset",C*(1-rem/(s.duration*60000)))}
    if(rem<=0){clearInterval(TM.iv);tmFinish(true)}},1000);
}

/* ---------- calendar export ---------- */
function icsEsc(s){return String(s||"").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n")}
function icsFold(l){const out=[];while(l.length>73){out.push(l.slice(0,73));l=" "+l.slice(73)}out.push(l);return out.join("\r\n")}
function buildICS(){
  const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//MLEA Academic Desk//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:MLEA","X-WR-TIMEZONE:Africa/Cairo"];
  const d8=s=>s.replace(/-/g,"");const hm=s=>s.replace(":","")+"00";
  const plusMin=(t,m)=>{const[h,mi]=t.split(":").map(Number);const x=Math.min(23*60+59,h*60+mi+m);return String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0")};
  const ev=(uid,date,time,end,summary,desc,alarms)=>{L.push("BEGIN:VEVENT","UID:"+uid+"@mlea-desk","DTSTAMP:"+stamp);
    if(time){L.push("DTSTART;TZID=Africa/Cairo:"+d8(date)+"T"+hm(time),"DTEND;TZID=Africa/Cairo:"+d8(date)+"T"+hm(end||plusMin(time,30)))}else{L.push("DTSTART;VALUE=DATE:"+d8(date),"DTEND;VALUE=DATE:"+d8(addDays(date,1)))}
    L.push(icsFold("SUMMARY:"+icsEsc(summary)));if(desc)L.push(icsFold("DESCRIPTION:"+icsEsc(desc)));
    (alarms||[]).forEach(a=>L.push("BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+icsEsc(summary),"TRIGGER:"+a,"END:VALARM"));L.push("END:VEVENT")};
  let n=0;
  for(const l of S.lectures){if(!validDate(l.date)||l.attendance==="Cancelled")continue;ev("lec-"+l.id,l.date,l.start,l.end||(l.start?plusMin(l.start,90):""),`${cShort(l.courseId)} lecture${l.topic?": "+l.topic:""}`,[cName(l.courseId),l.venue].filter(Boolean).join(" · "),l.start?["-PT30M"]:[]);n++}
  for(const d of S.deliverables){if(DONE.has(d.status))continue;const desc=[cName(d.courseId),d.type,num(d.weight)!=null?d.weight+"% of grade":"",d.format?"Format: "+d.format:""].filter(Boolean).join(" · ");
    if(validDate(d.due)){ev("due-"+d.id,d.due,d.dueTime||d.examTime||"",d.examTime&&isExam(d.type)?plusMin(d.examTime,120):"",`${isExam(d.type)?"EXAM":"DUE"}: ${d.title} (${cShort(d.courseId)})`,desc,["-P3D","-P1D"]);n++}
    if(isPres(d.type)&&validDate(d.presDate)&&d.presDate!==d.due){ev("pres-"+d.id,d.presDate,"","",`PRESENT: ${d.title} (${cShort(d.courseId)})`,desc,["-P3D","-P1D"]);n++}
    if(validDate(d.internalDeadline)){ev("int-"+d.id,d.internalDeadline,"","",`Target: ${d.title}`,"Internal target date",["-P1D"]);n++}
    parseMilestones(d.milestones).filter(m=>!m.done).forEach((m,i)=>{ev("ms-"+d.id+"-"+i,m.date,"","",`${d.title}: ${m.title}`,"",[]);n++});
  }
  for(const r of S.readings){if(r.status==="Done"||!validDate(r.due))continue;ev("read-"+r.id,r.due,"","",`Read: ${r.title} (${cShort(r.courseId)})`,r.author||"",["-P1D"]);n++}
  L.push("END:VCALENDAR");return{text:L.join("\r\n")+"\r\n",n};
}
async function exportICS(){
  const {text,n}=buildICS();if(!n){toast("Nothing to export yet");return}
  const dl=S.downloads;if(!dl){toast("Saving files isn't available in this view");return}
  try{await dl.save({filename:"MLEA-calendar.ics",data:new Blob([text],{type:"text/calendar"})});toast(`${n} events exported. Open the file to add them to your calendar.`)}
  catch(e){if(e&&e.code!=="declined"&&e.code!=="cancelled")toast("Export failed: "+(e.code||"error"))}
}

/* ---------- more / quick add ---------- */
function openMore(){UI.sheet="more";openSheet("More",`<div class="sheetgrid">${navMore().map(([k,l,i])=>`<a href="#${k}" data-close>${ico(i,22)}${l}</a>`).join("")}<button data-close id="mAlerts">${ico("bell",22)}Alerts</button><button data-close id="mIcs">${ico("download",22)}Export to phone calendar</button></div>`,h=>{h.querySelectorAll("a[data-close]").forEach(a=>a.onclick=closeSheet);h.querySelector("#mAlerts").onclick=()=>{closeSheet();openAlerts()};h.querySelector("#mIcs").onclick=()=>{closeSheet();exportICS()}},true)}
function openQuick(){
  UI.sheet="quick";let items=[["deliverables","Task or assignment","work"],["exam","Exam or quiz","grad"],["lectures","Lecture","lect"],["series","Weekly lecture series","cal"],["readings","Reading","book"],["syllabus","Import syllabus","clip"],["focus","Focus session","timer"],["courses","Course","gear"]];
  openSheet("Add",`<div class="sheetgrid">${items.map(([k,l,i])=>`<button data-qa="${k}">${ico(i,22)}${l}</button>`).join("")}</div>`,h=>{
    h.querySelectorAll("[data-qa]").forEach(b=>b.onclick=()=>{const k=b.dataset.qa;closeSheet();
      if(k==="focus")return openTimer();if(k==="syllabus")return openSyllabus("");
      if(k!=="courses"&&!S.courses.length){toast("Add a course first, or import a syllabus");return openSyllabus("")}
      if(k==="series")return openSeries();if(k==="exam")return openDrawer("deliverables",null,{type:"Midterm examination"});openDrawer(k,null)})},true);
}
function bindShell(){
  $("#acctBtn").onclick=openAccount;
  $("#bellBtn").onclick=openAlerts;$("#timerBtn").onclick=()=>openTimer();$("#fab").onclick=openQuick;
  document.addEventListener("click",e=>{const m=e.target.closest("#moreBtn");if(m)openMore()});
  if(TM.state&&TM.state.running&&tmRemaining()>0)tmTick()
}

/* ---------- bindings ---------- */
function bindView(){
  const v=$("#view");
  v.querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest("select,button,a"))return;const[c,i]=el.dataset.open.split(":");openDrawer(c,i)}));
  v.querySelectorAll("[data-new]").forEach(b=>b.onclick=()=>{if(b.dataset.new!=="courses"&&!S.courses.length){toast("Add a course first");location.hash="#courses";return}openDrawer(b.dataset.new,null,b.dataset.type?{type:b.dataset.type}:null)});
  v.querySelectorAll("[data-q]").forEach(s=>s.addEventListener("change",()=>{const[c,i,k]=s.dataset.q.split(":");quickUpdate(c,i,{[k]:s.value})}));
  v.querySelectorAll("[data-calf]").forEach(b=>b.onclick=()=>{UI.calFilter=b.dataset.calf;render()});
  v.querySelectorAll("[data-delf]").forEach(b=>b.onclick=()=>{UI.delFilter=b.dataset.delf;render()});
  v.querySelectorAll("[data-lecc]").forEach(b=>b.onclick=()=>{UI.lecCourse=b.dataset.lecc;render()});
  const cp=$("#calPast");if(cp)cp.onchange=()=>{UI.calPast=cp.checked;render()};
  v.querySelectorAll("[data-mat]").forEach(b=>b.onclick=e=>{e.stopPropagation();UI.matTarget=b.dataset.mat;const mi=$("#matInput");mi.value="";mi.click()});
  bindAssist();
  bindStudents(v);
  bindAlertItems(v);
  v.querySelectorAll("[data-calnav]").forEach(b=>b.onclick=()=>{const dlt=Number(b.dataset.calnav);if(!dlt){UI.calMonth=T.slice(0,7);UI.calDay=T}else{const[y,m]=(UI.calMonth||T.slice(0,7)).split("-").map(Number);const d=new Date(Date.UTC(y,m-1+dlt,1));UI.calMonth=d.toISOString().slice(0,7);UI.calDay=UI.calMonth+"-01"}render()});
  v.querySelectorAll("[data-calday]").forEach(b=>b.onclick=()=>{UI.calDay=b.dataset.calday;if(b.dataset.calday.slice(0,7)!==UI.calMonth)UI.calMonth=b.dataset.calday.slice(0,7);render()});
  v.querySelectorAll("[data-ics]").forEach(b=>b.onclick=exportICS);
  v.querySelectorAll("[data-lecseg]").forEach(b=>b.onclick=()=>{UI.lecSeg=b.dataset.lecseg;render()});
  v.querySelectorAll("[data-att]").forEach(b=>b.onclick=e=>{e.stopPropagation();const[i,val]=b.dataset.att.split(":");const l=S.lectures.find(x=>x.id===i);quickUpdate("lectures",i,{attendance:l&&l.attendance===val?"Scheduled":val})});
  v.querySelectorAll("[data-focus]").forEach(b=>b.onclick=e=>{e.stopPropagation();openTimer(b.dataset.focus)});
  v.querySelectorAll("[data-quick]").forEach(b=>b.onclick=()=>{if(b.dataset.quick==="focus")openTimer()});
  v.querySelectorAll("[data-gohash]").forEach(b=>b.onclick=()=>{location.hash="#"+b.dataset.gohash});
  const aa=$("#allAlerts");if(aa)aa.onclick=openAlerts;
  v.querySelectorAll("[data-syl]").forEach(b=>b.onclick=e=>{e.stopPropagation();openSyllabus(b.dataset.syl)});
  v.querySelectorAll("[data-sylre]").forEach(b=>b.onclick=()=>{const f=S.syllabi.find(x=>x.id===b.dataset.sylre);if(f)openSyllabus(f.courseId,f)});
  v.querySelectorAll("[data-syldel]").forEach(b=>b.onclick=()=>{UI.sylDel=b.dataset.syldel;render()});
  v.querySelectorAll("[data-syldelno]").forEach(b=>b.onclick=()=>{UI.sylDel=null;render()});
  v.querySelectorAll("[data-syldelyes]").forEach(b=>b.onclick=async()=>{const f=S.syllabi.find(x=>x.id===b.dataset.syldelyes);UI.sylDel=null;if(!f)return;try{if(f.assetId&&S.assets){await S.assets.delete(f.assetId).catch(()=>{})}await S.db.doc("syllabi/"+f.id).delete();toast("Syllabus removed")}catch(e){toast("Not removed: "+(e.code||"error"))}});
  v.querySelectorAll("[data-logo]").forEach(inp=>inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f||!S.assets||!S.db)return;if(f.size>2e6){toast("Use a logo under 2 MB");return}try{const a=await S.assets.upload(f);const logos=Object.assign({},S.settings.logos||{},{[inp.dataset.logo]:a.id});await S.db.doc("settings/main").set(Object.assign({capacity:6.5,weekStart:6},S.settings,{logos}));toast("Logo saved")}catch(e){toast("Logo not saved: "+(e.code||"error"))}});
  v.querySelectorAll("[data-logorm]").forEach(b=>b.onclick=async()=>{const logos=Object.assign({},S.settings.logos||{});const old=logos[b.dataset.logorm];delete logos[b.dataset.logorm];try{await S.db.doc("settings/main").set(Object.assign({},S.settings,{logos}));if(old&&S.assets)S.assets.delete(old).catch(()=>{});toast("Logo removed")}catch(e){toast("Not removed: "+(e.code||"error"))}});
  const sb=v.querySelector("[data-series]");if(sb)sb.onclick=()=>{if(!S.courses.length){toast("Add a course first");return}openSeries()};
  const sf=$("#settingsForm");if(sf)sf.addEventListener("submit",async e=>{e.preventDefault();if(!S.db){toast("Saving is unavailable in this view");return}const cap=num($("#setCap").value);try{await S.db.doc("settings/main").set(Object.assign({},S.settings,{capacity:cap==null?6.5:cap,weekStart:Number($("#setWs").value),name:$("#setName").value.trim()}));toast("Settings saved")}catch(err){toast("Not saved: "+(err.code||"error"))}});
}

bindShell();
boot();
})();
