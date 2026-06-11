// api/content.js — 사이트 콘텐츠 영구 저장/조회
//   GET  /api/content            → 저장된 콘텐츠 반환 (없으면 null)
//   POST /api/content            → 콘텐츠 저장 (관리자 토큰 필요)
import { redis, CONTENT_KEY, json, isAdmin, readBody } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 200, {});

  try {
    if (req.method === "GET") {
      const data = await redis.get(CONTENT_KEY); // 객체로 자동 역직렬화됨
      return json(res, 200, { ok: true, data: data || null });
    }

    if (req.method === "POST") {
      if (!isAdmin(req)) return json(res, 401, { ok: false, error: "관리자 인증 실패" });
      const body = await readBody(req);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json(res, 400, { ok: false, error: "콘텐츠 형식이 올바르지 않습니다." });
      }
      await redis.set(CONTENT_KEY, body);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { ok: false, error: "허용되지 않은 메서드" });
  } catch (e) {
    return json(res, 500, { ok: false, error: "서버 오류", detail: String(e?.message || e) });
  }
}
