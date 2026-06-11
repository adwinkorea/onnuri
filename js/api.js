/* =====================================================================
   api.js — 프론트엔드 ↔ 백엔드 통신 레이어
   ---------------------------------------------------------------------
   • 백엔드(API)가 응답하면 서버 데이터를 사용
   • 백엔드가 없거나 실패하면 기존 localStorage 로 자동 폴백
   → 로컬에서 파일로 열어도, Vercel에 배포해도 동일하게 동작합니다.
   ===================================================================== */

const API_BASE = ""; // 같은 도메인의 /api 사용. 다른 도메인이면 "https://..." 지정

// 관리자 토큰: 로그인 시 sessionStorage에 보관 (서버 ADMIN_TOKEN과 일치해야 저장 권한)
function getAdminToken(){ return sessionStorage.getItem("onnuri_admin_token") || ""; }
function setAdminToken(t){ sessionStorage.setItem("onnuri_admin_token", t); }

/* ── 콘텐츠 불러오기: 서버 → 실패 시 localStorage → 기본값 ── */
async function fetchContent(){
  try{
    const r = await fetch(`${API_BASE}/api/content`, { cache:"no-store" });
    if(r.ok){
      const j = await r.json();
      if(j.ok && j.data){
        // 서버 값을 받으면 로컬에도 캐시(오프라인 대비)
        try{ localStorage.setItem(STORE_KEY, JSON.stringify(j.data)); }catch{}
        return Object.assign(JSON.parse(JSON.stringify(DEFAULT_DATA)), j.data);
      }
    }
  }catch(e){ /* 서버 없음 → 폴백 */ }
  return loadData(); // data.js의 localStorage 기반 로더
}

/* ── 콘텐츠 저장: 서버 우선, 동시에 로컬에도 저장 ── */
async function pushContent(data){
  // 항상 로컬에도 저장 (서버 미연동 환경 대비)
  saveData(data);
  try{
    const r = await fetch(`${API_BASE}/api/content`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "x-admin-token": getAdminToken() },
      body: JSON.stringify(data)
    });
    if(r.ok){ const j = await r.json(); if(j.ok) return { ok:true, server:true }; }
    if(r.status===401) return { ok:false, error:"서버 관리자 인증 실패 (토큰 확인)" };
    return { ok:true, server:false }; // 서버 실패해도 로컬엔 저장됨
  }catch(e){
    return { ok:true, server:false }; // 서버 없음 → 로컬만
  }
}

/* ── A/S 접수 전송: 서버 우선, 실패 시 로컬 보관 ── */
async function submitAS(payload){
  try{
    const r = await fetch(`${API_BASE}/api/submissions`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(()=>null);
    if(r.ok && j && j.ok) return { ok:true, server:true, emailed:j.emailed };
    // 서버가 응답했지만 정상 JSON이면 그 에러를 보여줌
    if(j && j.error) return { ok:false, error:j.error };
    // API가 없는 정적 호스팅(501/404 등) → 로컬 폴백
    return localFallback(payload);
  }catch(e){
    return localFallback(payload);
  }
  function localFallback(p){
    const list = JSON.parse(localStorage.getItem("onnuri_as_local")||"[]");
    list.unshift({ ...p, id:Date.now().toString(36), createdAt:new Date().toISOString(), status:"접수(로컬)" });
    localStorage.setItem("onnuri_as_local", JSON.stringify(list));
    return { ok:true, server:false };
  }
}

/* ── A/S 접수 목록 조회 (관리자) ── */
async function fetchSubmissions(){
  try{
    const r = await fetch(`${API_BASE}/api/submissions`, {
      headers:{ "x-admin-token": getAdminToken() }, cache:"no-store"
    });
    if(r.ok){ const j = await r.json(); if(j.ok) return { ok:true, server:true, list:j.data }; }
    if(r.status===401) return { ok:false, error:"서버 관리자 인증 실패" };
  }catch(e){ /* 폴백 */ }
  // 서버 없음 → 로컬 데모 목록
  const list = JSON.parse(localStorage.getItem("onnuri_as_local")||"[]");
  return { ok:true, server:false, list };
}

/* ── A/S 접수 상태/메모 변경 (관리자) ── */
async function updateSubmission(id, patch){
  try{
    const r = await fetch(`${API_BASE}/api/submissions`, {
      method:"PATCH",
      headers:{ "Content-Type":"application/json", "x-admin-token": getAdminToken() },
      body: JSON.stringify({ id, ...patch })
    });
    const j = await r.json().catch(()=>null);
    if(r.ok && j && j.ok) return { ok:true, server:true };
    if(r.status===401) return { ok:false, error:"서버 관리자 인증 실패" };
    if(j && j.error) return localPatch(id, patch);
    return localPatch(id, patch);
  }catch(e){ return localPatch(id, patch); }
  function localPatch(id, patch){
    const list = JSON.parse(localStorage.getItem("onnuri_as_local")||"[]");
    const it = list.find(x=>x.id===id);
    if(it){
      if(typeof patch.status === "string") it.status = patch.status;
      // 단일 memo → 댓글 배열 이관 (하위호환)
      if(!Array.isArray(it.memos)){
        it.memos = [];
        if(typeof it.memo === "string" && it.memo.trim()){
          it.memos.push({ id:"m0", text:it.memo.trim(), at:it.createdAt||new Date().toISOString() });
        }
        delete it.memo;
      }
      if(typeof patch.addMemo === "string" && patch.addMemo.trim()){
        it.memos.push({ id:Date.now().toString(36)+Math.random().toString(36).slice(2,5), text:patch.addMemo.trim(), at:new Date().toISOString() });
      }
      if(typeof patch.deleteMemoId === "string" && patch.deleteMemoId){
        it.memos = it.memos.filter(m=>m.id!==patch.deleteMemoId);
      }
      localStorage.setItem("onnuri_as_local", JSON.stringify(list));
    }
    return { ok:true, server:false };
  }
}

/* ── A/S 접수 삭제 (관리자) ── */
async function deleteSubmission(id){
  try{
    const r = await fetch(`${API_BASE}/api/submissions`, {
      method:"DELETE",
      headers:{ "Content-Type":"application/json", "x-admin-token": getAdminToken() },
      body: JSON.stringify({ id })
    });
    const j = await r.json().catch(()=>null);
    if(r.ok && j && j.ok) return { ok:true, server:true };
    if(r.status===401) return { ok:false, error:"서버 관리자 인증 실패" };
    return localDel(id);
  }catch(e){ return localDel(id); }
  function localDel(id){
    let list = JSON.parse(localStorage.getItem("onnuri_as_local")||"[]");
    list = list.filter(x=>x.id!==id);
    localStorage.setItem("onnuri_as_local", JSON.stringify(list));
    return { ok:true, server:false };
  }
}
