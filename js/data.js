/* =====================================================================
   온누리 드론 지식센터 — 공통 데이터 (data.js)
   ---------------------------------------------------------------------
   ▶ 관리자가 코드로 직접 고칠 수도 있고,
   ▶ 관리자 페이지(admin.html)에서 화면으로 고치면 localStorage에 저장되어
     이 기본값을 덮어씁니다.
   ▶ 이미지: images/ 폴더에 실제 사진을 넣고 경로만 바꾸면 됩니다.
     경로가 비어있거나 파일이 없으면 자동으로 회색 플레이스홀더가 표시됩니다.
   ===================================================================== */

const DEFAULT_DATA = {

  // ── 회사/고객센터 기본 정보 ────────────────────────────────
  site: {
    company: "온누리무인항공",
    serviceName: "드론 지식센터",
    phone: "063-545-0551",
    hours: "평일 09:00 ~ 18:00",
    holiday: "토/일·공휴일 휴무",
    heroTitle: "온누리 드론 지식센터",
    heroDesc: "필요한 정보를 쉽고 빠르게. 사용설명서부터 고장진단, 교육영상, A/S 접수까지 한 곳에서 확인하세요.",
    heroImage: "images/hero_main_img.png",       // 예: "images/hero.jpg"  (비우면 일러스트 표시)
    // ── 사업자 정보 (푸터 표기) ──
    bizName: "온누리무인항공",          // 상호명
    ceo: "김현중",                      // 대표자명
    bizNo: "781-45-00207",              // 사업자등록번호
    bizPhone: "063-545-0551",           // 대표 전화
    address: "전북특별자치도 김제시 만경로 120 온누리무인항공",
    email: "onnuridrone@naver.com"
  },

  // ── 기체 목록 ──────────────────────────────────────────────
  models: [
    { id:"ok20",  name:"OK20 방제드론",      desc:"온누리 자체 기종",       tag:"추천", icon:"🚁", image:"images/DRONE_ORIGIN.png" },
    { id:"agras", name:"DJI AGRAS 시리즈",   desc:"T10 · T20 · T30 · T50", tag:"12종", icon:"🛸", image:"images/DJI_AGRAS.png" },
    { id:"xag",   name:"XAG P100 시리즈",    desc:"P40 · P80 · P100",      tag:"8종",  icon:"✈️", image:"images/XAG_P100.png" },
    { id:"etc",   name:"기타 기종",          desc:"그 외 모든 기체",        tag:"문의", icon:"⚙️", image:"images/DRONE_etc.png" }
  ],

  // ── 카테고리(정보센터 메뉴) ────────────────────────────────
  // link: 같은 사이트 내 페이지 또는 외부주소. type 으로 동작 구분.
  categories: [
    { id:"manual", name:"사용설명서",  desc:"PDF 다운로드", icon:"📘", color:"#e7f0ff", link:"manual.html" },
    { id:"check",  name:"비행전 점검", desc:"점검표 6항목", icon:"✅", color:"#e3f8ed", link:"check.html" },
    { id:"fly",    name:"비행방법",    desc:"조작 가이드",  icon:"🧭", color:"#fff1e0", link:"fly.html" },
    { id:"battery",name:"배터리 관리", desc:"충전·보관법",  icon:"🔋", color:"#fde8ec", link:"battery.html" },
    { id:"repair", name:"정비방법",    desc:"일·주·월간",   icon:"🔧", color:"#eee8fb", link:"repair.html" },
    { id:"diag",   name:"고장진단",    desc:"증상별 진단",  icon:"🩺", color:"#e0f7fb", link:"diagnosis.html" },
    { id:"edu",    name:"교육영상",    desc:"자격증·실무",  icon:"🎬", color:"#fdeede", link:"education.html" },
    { id:"parts",  name:"부품도면",    desc:"분해도 조회",  icon:"📐", color:"#e8f5e0", link:"parts.html" },
    { id:"as",     name:"A/S 접수",    desc:"온라인 신청",  icon:"🛠️", color:"#fbe9f3", link:"as.html" },
    { id:"call",   name:"전화상담",    desc:"평일 9~18시",  icon:"📞", color:"#e3f8ed", link:"tel:0635450551" }
  ],

  // ── 사용설명서 자료 ────────────────────────────────────────
  manuals: [
    { id:"m1", model:"OK20 방제드론", version:"ver 1.2", file:"", desc:"기본 사용설명서" },
    { id:"m2", model:"DJI AGRAS T30", version:"ver 2.0", file:"", desc:"조작 및 정비 매뉴얼" }
  ],

  // ── 비행전 점검 항목 ───────────────────────────────────────
  checkItems: [
    "프로펠러 상태 확인",
    "암(Arm) 체결 상태 확인",
    "배터리 전압 확인",
    "RTK 연결 상태 확인",
    "약제 탱크 및 노즐 확인",
    "비행금지구역 확인"
  ],

  // ── 정비방법 항목 ──────────────────────────────────────────
  repairItems: [
    { title:"일일 점검",      desc:"비행 전후 매일 확인할 항목" },
    { title:"주간 점검",      desc:"일주일에 한 번 점검" },
    { title:"월간 점검",      desc:"한 달에 한 번 정밀 점검" },
    { title:"부품교체 방법",  desc:"소모품 교체 가이드" },
    { title:"겨울철 보관 방법", desc:"비수기 보관 요령" }
  ],

  // ── 고장진단(증상 목록) ────────────────────────────────────
  symptoms: [
    { id:"rtk",     name:"RTK 안 잡힘",     desc:"위성 신호 수신 불량" },
    { id:"pump",    name:"펌프 안 돌아감",  desc:"약제가 분사되지 않음" },
    { id:"motor",   name:"모터 이상",       desc:"진동·소음·정지" },
    { id:"rc",      name:"조종기 연결불량", desc:"통신 끊김" },
    { id:"spray",   name:"살포량 이상",     desc:"분사량이 일정치 않음" },
    { id:"charge",  name:"배터리 충전불량", desc:"충전이 안 되거나 느림" }
  ],

  // ── 교육영상 ───────────────────────────────────────────────
  // youtube: 영상 ID 또는 전체 URL (비우면 썸네일만 표시)
  educations: [
    { id:"e1", title:"1종 국가자격증",       emoji:"🥇", color:"#cfe3ff", youtube:"https://youtu.be/ko4F6I8DHNE?si=fOzTturecz5PmqPH" },
    { id:"e2", title:"2종 국가자격증",       emoji:"🥈", color:"#cdeede", youtube:"" },
    { id:"e3", title:"3종 국가자격증",       emoji:"🥉", color:"#ffe6c2", youtube:"" },
    { id:"e4", title:"농업용 드론 활용",     emoji:"🌾", color:"#d7f0c8", youtube:"" },
    { id:"e5", title:"안전교육 / 법규교육",  emoji:"⚖️", color:"#e2d8f8", youtube:"" },
    { id:"e6", title:"방제기술 / 파종기술",  emoji:"💧", color:"#c8eef2", youtube:"" }
  ]
};

/* =====================================================================
   저장값 병합: 관리자가 admin.html 에서 저장한 내용이 있으면 우선 적용
   ===================================================================== */
const STORE_KEY = "onnuri_cms_v1";

function loadData(){
  try{
    const saved = localStorage.getItem(STORE_KEY);
    if(saved){
      const obj = JSON.parse(saved);
      // 얕은 병합 (섹션 단위로 덮어쓰기)
      return Object.assign(JSON.parse(JSON.stringify(DEFAULT_DATA)), obj);
    }
  }catch(e){ console.warn("저장 데이터 로드 실패, 기본값 사용", e); }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(data){
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function resetData(){
  localStorage.removeItem(STORE_KEY);
}

// 전역에서 사용할 현재 데이터
const DATA = loadData();
