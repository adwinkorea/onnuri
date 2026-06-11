// api/submissions.js — A/S 접수 저장 + 이메일 알림 + 관리자 목록 조회
//   POST /api/submissions        → 접수 저장 + 관리자에게 이메일 발송 (공개)
//   GET  /api/submissions        → 접수 목록 반환 (관리자 토큰 필요)
import { Resend } from "resend";
import { redis, SUBMISSIONS_KEY, json, isAdmin, readBody } from "./_lib.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function esc(s = "") {
  return String(s).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 200, {});

  try {
    // ── 접수 등록 (공개) ──
    if (req.method === "POST") {
      const b = await readBody(req);
      const name = (b.name || "").trim();
      const phone = (b.phone || "").trim();
      const model = (b.model || "").trim();
      const symptom = (b.symptom || "").trim();

      if (!name || !phone) {
        return json(res, 400, { ok: false, error: "이름과 연락처는 필수입니다." });
      }

      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name, phone, model, symptom,
        createdAt: new Date().toISOString(),
        status: "접수",
      };

      // 1) Redis 목록에 저장 (최신이 앞)
      await redis.lpush(SUBMISSIONS_KEY, JSON.stringify(entry));

      // 2) 관리자에게 이메일 발송 (키가 있을 때만)
      let emailed = false;
      if (resend && process.env.AS_NOTIFY_TO) {
        try {
          await resend.emails.send({
            from: process.env.AS_NOTIFY_FROM || "온누리 A/S <onboarding@resend.dev>",
            to: process.env.AS_NOTIFY_TO.split(",").map(s => s.trim()),
            replyTo: undefined,
            subject: `[A/S 접수] ${name} · ${model || "기체 미선택"}`,
            html: `
              <div style="font-family:sans-serif;line-height:1.6">
                <h2 style="margin:0 0 12px">새 A/S 접수가 도착했습니다</h2>
                <table cellpadding="6" style="border-collapse:collapse">
                  <tr><td><b>이름</b></td><td>${esc(name)}</td></tr>
                  <tr><td><b>연락처</b></td><td>${esc(phone)}</td></tr>
                  <tr><td><b>기체</b></td><td>${esc(model) || "-"}</td></tr>
                  <tr><td><b>증상</b></td><td>${esc(symptom) || "-"}</td></tr>
                  <tr><td><b>접수시각</b></td><td>${entry.createdAt}</td></tr>
                </table>
              </div>`,
          });
          emailed = true;
        } catch (mailErr) {
          // 이메일 실패해도 접수 자체는 성공 처리
          console.error("email error", mailErr);
        }
      }

      return json(res, 200, { ok: true, id: entry.id, emailed });
    }

    // ── 목록 조회 (관리자) ──
    if (req.method === "GET") {
      if (!isAdmin(req)) return json(res, 401, { ok: false, error: "관리자 인증 실패" });
      const raw = await redis.lrange(SUBMISSIONS_KEY, 0, 199); // 최근 200건
      const list = raw.map(x => (typeof x === "string" ? safeParse(x) : x)).filter(Boolean);
      return json(res, 200, { ok: true, data: list });
    }

    // ── 상태 변경 / 메모(댓글) 추가·삭제 (관리자) ──
    //   PATCH /api/submissions  { id, status?, addMemo?, deleteMemoId? }
    if (req.method === "PATCH") {
      if (!isAdmin(req)) return json(res, 401, { ok: false, error: "관리자 인증 실패" });
      const b = await readBody(req);
      const id = (b.id || "").trim();
      if (!id) return json(res, 400, { ok: false, error: "id가 필요합니다." });

      const raw = await redis.lrange(SUBMISSIONS_KEY, 0, -1);
      let found = false;
      for (let i = 0; i < raw.length; i++) {
        const item = typeof raw[i] === "string" ? safeParse(raw[i]) : raw[i];
        if (item && item.id === id) {
          // 상태 변경
          if (typeof b.status === "string") item.status = b.status;

          // 기존 단일 memo가 있으면 댓글 배열로 1회 이관 (하위호환)
          if (!Array.isArray(item.memos)) {
            item.memos = [];
            if (typeof item.memo === "string" && item.memo.trim()) {
              item.memos.push({ id: "m0", text: item.memo.trim(), at: item.createdAt || new Date().toISOString() });
            }
            delete item.memo;
          }

          // 댓글 추가
          if (typeof b.addMemo === "string" && b.addMemo.trim()) {
            item.memos.push({
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
              text: b.addMemo.trim(),
              at: new Date().toISOString(),
            });
          }
          // 댓글 삭제
          if (typeof b.deleteMemoId === "string" && b.deleteMemoId) {
            item.memos = item.memos.filter(m => m.id !== b.deleteMemoId);
          }

          await redis.lset(SUBMISSIONS_KEY, i, JSON.stringify(item));
          found = true;
          break;
        }
      }
      if (!found) return json(res, 404, { ok: false, error: "해당 접수를 찾을 수 없습니다." });
      return json(res, 200, { ok: true });
    }

    // ── 삭제 (관리자) ──
    //   DELETE /api/submissions  { id }
    if (req.method === "DELETE") {
      if (!isAdmin(req)) return json(res, 401, { ok: false, error: "관리자 인증 실패" });
      const b = await readBody(req);
      const id = (b.id || "").trim();
      if (!id) return json(res, 400, { ok: false, error: "id가 필요합니다." });

      const raw = await redis.lrange(SUBMISSIONS_KEY, 0, -1);
      const target = raw.find(x => {
        const item = typeof x === "string" ? safeParse(x) : x;
        return item && item.id === id;
      });
      if (!target) return json(res, 404, { ok: false, error: "해당 접수를 찾을 수 없습니다." });
      // 동일한 직렬화 값을 리스트에서 제거 (lrem)
      const rawVal = typeof target === "string" ? target : JSON.stringify(target);
      await redis.lrem(SUBMISSIONS_KEY, 1, rawVal);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { ok: false, error: "허용되지 않은 메서드" });
  } catch (e) {
    return json(res, 500, { ok: false, error: "서버 오류", detail: String(e?.message || e) });
  }
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
