// api/_lib.js — 서버리스 함수 공통 유틸 (Upstash Redis + 간단 인증)
// 주의: 폐지된 @vercel/kv 가 아니라 현행 @upstash/redis 를 사용합니다.

import { Redis } from "@upstash/redis";

// Vercel Marketplace에서 Upstash Redis 통합을 추가하면
// 아래 환경변수가 프로젝트에 자동 주입됩니다.
//   KV_REST_API_URL / KV_REST_API_TOKEN  (또는 UPSTASH_REDIS_REST_URL / _TOKEN)
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 저장 키
export const CONTENT_KEY = "onnuri:content";       // 사이트 콘텐츠(JSON)
export const SUBMISSIONS_KEY = "onnuri:submissions"; // A/S 접수 목록(List)

// CORS / JSON 응답 헬퍼
export function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.status(status).send(JSON.stringify(body));
}

// 관리자 토큰 검증 (헤더 x-admin-token 과 환경변수 비교)
export function isAdmin(req) {
  const token = req.headers["x-admin-token"];
  return token && token === process.env.ADMIN_TOKEN;
}

// 요청 본문 JSON 파싱 (Vercel은 보통 자동 파싱하지만 안전하게 처리)
export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
