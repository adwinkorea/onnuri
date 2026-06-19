/* =====================================================================
   api.js — 프론트엔드 ↔ 백엔드 통신 레이어
   ---------------------------------------------------------------------
   • 백엔드(API)가 응답하면 서버 데이터를 사용
   • 백엔드가 없거나 실패하면 기존 localStorage 로 자동 폴백
   → 로컬에서 파일로 열어도, Vercel에 배포해도 동일하게 동작합니다.
   ===================================================================== */

const API_BASE = ""; // 같은 도메인의 /api 사용. 다른 도메인이면 "https://..." 지정
/* ── Supabase 연결 ── */
const SUPABASE_URL = 'https://mlfguelaobivcupfxnwh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZmd1ZWxhb2JpdmN1cGZ4bndoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDY1MDQsImV4cCI6MjA5NzMyMjUwNH0.qymgP1z5ZAv6-b8PLkuFSVYg76feBu9Bh8Mmq5C5R8M';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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

/* ── A/S 접수 전송: Supabase 저장, 실패 시 로컬 보관 ── */
async function submitAS(payload){
  try{
    const { error } = await db.from('as_requests').insert([{
      name: payload.name,
      phone: payload.phone,
      drone_model: payload.model,
      content: payload.symptom
    }]);
    if(error) throw error;
    return { ok:true, server:true };
  }catch(e){
    // Supabase 실패 시 기존 로컬 폴백 유지
    const list = JSON.parse(localStorage.getItem("onnuri_as_local")||"[]");
    list.unshift({ ...payload, id:Date.now().toString(36), createdAt:new Date().toISOString(), status:"접수(로컬)" });
    localStorage.setItem("onnuri_as_local", JSON.stringify(list));
    return { ok:true, server:false };
  }
}

/* ── A/S 접수 목록 조회 (관리자) ── */
async function fetchSubmissions(){
  try{
    const { data, error } = await db
      .from('as_requests')
      .select('*')
      .order('created_at', { ascending:false });
    if(error) throw error;
    // 화면(admin.html)이 기대하는 이름으로 변환
    const list = (data||[]).map(row=>({
      id: row.id,
      name: row.name,
      phone: row.phone,
      model: row.drone_model,
      symptom: row.content,
      status: row.status || "접수",
      createdAt: row.created_at,
      memos: Array.isArray(row.memos) ? row.memos : []
    }));
    return { ok:true, server:true, list };
  }catch(e){
    return { ok:false, error:"목록을 불러오지 못했습니다: " + (e.message||e) };
  }
}

/* ── A/S 접수 상태/메모 변경 (관리자) ── */
async function updateSubmission(id, patch){
  try{
    // 메모 추가/삭제는 현재 memos 배열을 읽어와서 수정 후 다시 저장
    if(patch.addMemo !== undefined || patch.deleteMemoId !== undefined){
      const { data: cur, error: e1 } = await db
        .from('as_requests').select('memos').eq('id', id).single();
      if(e1) throw e1;
      let memos = Array.isArray(cur.memos) ? cur.memos : [];

      if(typeof patch.addMemo === "string" && patch.addMemo.trim()){
        memos.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2,5),
          text: patch.addMemo.trim(),
          at: new Date().toISOString()
        });
      }
      if(typeof patch.deleteMemoId === "string" && patch.deleteMemoId){
        memos = memos.filter(m => m.id !== patch.deleteMemoId);
      }

      const { error: e2 } = await db.from('as_requests').update({ memos }).eq('id', id);
      if(e2) throw e2;
      return { ok:true, server:true };
    }

    // 상태 변경
    const fields = {};
    if(typeof patch.status === "string") fields.status = patch.status;
    const { error } = await db.from('as_requests').update(fields).eq('id', id);
    if(error) throw error;
    return { ok:true, server:true };
  }catch(e){
    return { ok:false, error:(e.message||e) };
  }
}

/* ── A/S 접수 삭제 (관리자) ── */
async function deleteSubmission(id){
  try{
    const { error } = await db.from('as_requests').delete().eq('id', id);
    if(error) throw error;
    return { ok:true, server:true };
  }catch(e){
    return { ok:false, error:(e.message||e) };
  }
}
