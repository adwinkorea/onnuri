/* =====================================================================
   온누리 드론 지식센터 — 공통 스크립트 (common.js)
   헤더·푸터·챗봇을 모든 페이지에 자동으로 그려줍니다.
   각 페이지에서: <body> 안에 빈 컨테이너를 두고 이 파일을 불러오면 됩니다.
   ===================================================================== */

let PHONE_DIGITS = (DATA.site.phone || "").replace(/[^0-9]/g, "");

/* 서버에 저장된 최신 콘텐츠가 있으면 DATA에 병합한 뒤 페이지를 그립니다.
   api.js가 함께 로드된 경우에만 동작하고, 없으면 즉시 콜백을 실행합니다. */
async function bootContent(renderCallback){
  if(typeof fetchContent === "function"){
    try{
      const fresh = await fetchContent();
      Object.assign(DATA, fresh);
      PHONE_DIGITS = (DATA.site.phone || "").replace(/[^0-9]/g, "");
      // 서버/로컬 콘텐츠가 반영됐으니 헤더·푸터를 최신 값으로 다시 렌더
      const h = document.getElementById("site-header");
      const f = document.getElementById("site-footer");
      if(h){ h.innerHTML = renderHeader(h.dataset.active || ""); }
      if(f){ f.innerHTML = renderFooter(); }
      wireHeader();
    }catch(e){ /* 폴백: 기본/로컬 DATA 사용 */ }
  }
  if(typeof renderCallback === "function") renderCallback();
}

/* ── 이미지 헬퍼: 경로가 있으면 <img>, 없으면 플레이스홀더 ── */
function imgOrPlaceholder(src, alt, phText){
  if(src && src.trim()){
    return `<img src="${src}" alt="${alt||''}" onerror="this.parentNode.innerHTML='<div class=&quot;ph&quot; style=&quot;width:100%;height:100%&quot;>${(phText||'이미지 준비중').replace(/'/g,'')}</div>'">`;
  }
  return `<div class="ph" style="width:100%;height:100%">${phText||'이미지 준비중'}</div>`;
}

/* ── 헤더 렌더 ── */
function renderHeader(active){
  const cats = DATA.categories;
  const menu = [
    {label:"홈", href:"index.html", key:"home"},
    {label:"기체선택", href:"models.html", key:"models"},
    {label:"고장진단", href:"diagnosis.html", key:"diag"},
    {label:"교육영상", href:"education.html", key:"edu"},
    {label:"A/S 접수", href:"as.html", key:"as"}
  ];
  const links = menu.map(m=>`<a href="${m.href}" class="${active===m.key?'active':''}">${m.label}</a>`).join("");
  return `
  <header>
    <div class="wrap nav">
      <a href="index.html" class="brand">
        <span class="mark">✈</span>
        <span>${DATA.site.company}<small>${DATA.site.serviceName}</small></span>
      </a>
      <nav class="menu" id="menu">${links}</nav>
      <a href="tel:${PHONE_DIGITS}" class="call-btn">📞 ${DATA.site.phone}</a>
      <button class="burger" id="burger" aria-label="메뉴 열기">☰</button>
    </div>
  </header>`;
}

/* ── 푸터 렌더 ── */
function renderFooter(){
  const s = DATA.site;
  const bizDigits = (s.bizPhone || "").replace(/[^0-9]/g, "");
  return `
  <footer>
    <div class="wrap foot-grid">
      <div class="foot-biz">
        <div class="biz-line">
          <span><b>${s.bizName || ""}</b></span>
          <span>대표자 : ${s.ceo || ""}</span>
          <span>사업자번호 : ${s.bizNo || ""}</span>
        </div>
        <div class="biz-line">
          <span>TEL : <a href="tel:${bizDigits}">${s.bizPhone || ""}</a></span>
          <span>E-mail : <a href="mailto:${s.email || ""}">${s.email || ""}</a></span>
        </div>
        <div class="biz-line">
          <span>주소 : ${s.address || ""}</span>
        </div>
      </div>
      <div class="foot-cs">
        <h5>고객센터</h5>
        <div class="foot-call">
          <b>${s.phone}</b>
          <span>${s.hours}</span>
          <span>${s.holiday}</span>
        </div>
      </div>
    </div>
    <div class="wrap foot-bottom">
      <span>© 2026 ${s.company}. All rights reserved.</span>
      <span><a href="admin.html">관리자 로그인</a><!-- · 이용약관 · 개인정보처리방침 --></span>
    </div>
  </footer>`;
}

/* ── 챗봇 렌더 ── */
function renderChatbot(){
  return `
  <button class="chatbot" id="chatBtn" aria-label="AI 챗봇 열기">🤖</button>
  <div class="chat-panel" id="chatPanel">
    <div class="chat-head">🤖 AI 챗봇 <span style="margin-left:auto;cursor:pointer" id="chatClose">✕</span></div>
    <div class="chat-body" id="chatBody">
      <div class="bubble bot">무엇을 도와드릴까요? 증상이나 궁금한 점을 입력해 주세요.</div>
    </div>
    <div class="chat-input">
      <input id="chatText" type="text" placeholder="질문을 입력하세요...">
      <button id="chatSend">➤</button>
    </div>
  </div>`;
}

/* ── 마운트: 페이지에서 한 번 호출 ── */
function mountChrome(activeKey){
  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
  if(h){ h.dataset.active = activeKey || ""; h.innerHTML = renderHeader(activeKey); }
  if(f) f.innerHTML = renderFooter();
  document.body.insertAdjacentHTML("beforeend", renderChatbot());
  wireHeader();
  wireChatbot();
}

/* ── 헤더 동작 (햄버거) ── */
function wireHeader(){
  const burger=document.getElementById('burger'), menu=document.getElementById('menu');
  if(burger&&menu){
    burger.addEventListener('click',()=>menu.classList.toggle('show'));
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('show')));
  }
}

/* ── 챗봇 동작 ── */
function botReply(msg){
  const t = msg.replace(/\s/g,'');
  if(t.includes('RTK')) return 'RTK LED가 빨간색이면 위성 수신 불량입니다. 개활지로 이동 후 재시도하고, 고장진단 메뉴의 RTK 진단을 참고해 주세요.';
  if(t.includes('배터리')||t.includes('충전')) return '배터리 충전불량은 단자 청소 후 정품 충전기로 재시도해 보세요. 배터리 관리 메뉴도 확인해 주세요.';
  if(t.includes('펌프')||t.includes('살포')||t.includes('분사')) return '펌프가 안 돌면 노즐 막힘·약제 잔량을 먼저 확인하세요. 정비방법 > 부품교체를 참고하시면 됩니다.';
  if(t.includes('모터')) return '모터 진동·소음은 프로펠러 체결 상태와 이물질을 확인하고, 지속되면 A/S 접수를 권장합니다.';
  if(t.includes('설명서')||t.includes('매뉴얼')) return '사용설명서 메뉴에서 기체별 PDF를 내려받을 수 있습니다.';
  if(t.includes('자격')||t.includes('교육')) return '교육영상 메뉴에서 1~3종 국가자격증과 실무 교육 영상을 확인하세요.';
  if(t.includes('AS')||t.includes('수리')||t.includes('접수')) return 'A/S 접수 화면에서 이름·연락처·증상을 남겨주시면 영업일 1일 내 연락드립니다.';
  if(t.includes('전화')||t.includes('연락')) return `고객센터 ${DATA.site.phone}, ${DATA.site.hours}에 상담 가능합니다.`;
  return '자세한 진단은 고장진단 메뉴를 이용하시거나 ' + DATA.site.phone + '으로 문의해 주세요.';
}
function wireChatbot(){
  const btn=document.getElementById('chatBtn'), panel=document.getElementById('chatPanel');
  const close=document.getElementById('chatClose'), body=document.getElementById('chatBody');
  const text=document.getElementById('chatText'), send=document.getElementById('chatSend');
  if(!btn) return;
  btn.addEventListener('click',()=>panel.classList.toggle('open'));
  close.addEventListener('click',()=>panel.classList.remove('open'));
  function add(cls,msg){const b=document.createElement('div');b.className='bubble '+cls;b.textContent=msg;body.appendChild(b);body.scrollTop=body.scrollHeight;}
  function go(){const v=text.value.trim();if(!v)return;add('me',v);text.value='';setTimeout(()=>add('bot',botReply(v)),350);}
  send.addEventListener('click',go);
  text.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
}

/* ── QR (시각용 패턴 생성) ── */
function renderQR(elId){
  const el=document.getElementById(elId); if(!el) return;
  const seed=[1,1,1,1,1,0,1,1,0,1,1,0,0,0,1,0,0,1,1,0,1,0,1,0,1,1,1,0,0,1,1,0,0,0,1,0,1,1,0,0,1,1,1,1,1,0,0,1,1,1];
  const n=10, sz=100/n; let s='';
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const corner=(x<3&&y<3)||(x>n-4&&y<3)||(x<3&&y>n-4);
    let on;
    if(corner){on=(x%2===0||y%2===0)?1:0; if((x===1&&y===1)) on=1;}
    else on=seed[(x*7+y*3)%50];
    if(on) s+=`<rect x="${x*sz}" y="${y*sz}" width="${sz}" height="${sz}" fill="#1545a0"/>`;
  }
  el.innerHTML=`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
