import pkg from "@next/env";
pkg.loadEnvConfig(process.cwd());

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const postgres = require("postgres");

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function seed() {
  // ── 브랜드 ────────────────────────────────────────────────────────────────
  const brandRows = await sql`
    INSERT INTO brands (code, name, manager, annual_budget, description) VALUES
      ('BRD001', '라로제 클래식', '박소연', 599999872, '기초 스킨케어 라인'),
      ('BRD002', '라로제 솔라',   '이민아', 60000000,  '선케어 전문 라인'),
      ('BRD003', '라로제 바이탈', '최준혁', 50000000,  '기능성·프리미엄 라인')
    RETURNING id, code
  `;
  const bm = Object.fromEntries(brandRows.map((r) => [r.code, r.id]));
  console.log("✓ brands (3)");

  // ── 캠페인 ────────────────────────────────────────────────────────────────
  const campaignRows = await sql`
    INSERT INTO campaigns
      (code, brand_id, name, start_date, end_date, planned_budget, actual_budget, status)
    VALUES
      ('CMP001', ${bm.BRD001}, '2026 봄 기초 케어 캠페인', '2026-03-01', '2026-05-31', 25000000, 23500000, '완료'),
      ('CMP002', ${bm.BRD001}, '여름 수분 케어 프로모션',  '2026-06-01', '2026-08-31', 30000000,  8200000, '진행중'),
      ('CMP003', ${bm.BRD002}, 'SPF 시즌 론칭 캠페인',    '2026-04-01', '2026-06-30', 20000000, 18700000, '진행중'),
      ('CMP004', ${bm.BRD002}, '여름 선케어 브랜드데이',   '2026-07-01', '2026-07-31', 15000000,        0, '준비중'),
      ('CMP005', ${bm.BRD003}, '레티놀 앰플 신제품 론칭', '2026-05-15', '2026-06-30', 18000000, 12400000, '진행중')
    RETURNING id, code
  `;
  const cm = Object.fromEntries(campaignRows.map((r) => [r.code, r.id]));
  console.log("✓ campaigns (5)");

  // ── 마일스톤 ──────────────────────────────────────────────────────────────
  const milestones = [
    // CMP001 — 2026 봄 기초 케어 캠페인 (완료 5/5)
    { code: "M001", campaign_id: cm.CMP001, name: "기획안 확정",         due_date: "2026-03-05", manager: "박소연", completed: true,  notes: "" },
    { code: "M002", campaign_id: cm.CMP001, name: "크리에이티브 시안 완료", due_date: "2026-03-15", manager: "김다은", completed: true,  notes: "" },
    { code: "M003", campaign_id: cm.CMP001, name: "SNS 콘텐츠 업로드",   due_date: "2026-04-01", manager: "이서준", completed: true,  notes: "" },
    { code: "M004", campaign_id: cm.CMP001, name: "인플루언서 협찬 발송", due_date: "2026-04-10", manager: "박소연", completed: true,  notes: "" },
    { code: "M005", campaign_id: cm.CMP001, name: "캠페인 성과 보고서",  due_date: "2026-05-31", manager: "박소연", completed: true,  notes: "" },
    // CMP002 — 여름 수분 케어 프로모션 (완료 2/5)
    { code: "M006", campaign_id: cm.CMP002, name: "기획안 확정",         due_date: "2026-05-20", manager: "박소연", completed: true,  notes: "" },
    { code: "M007", campaign_id: cm.CMP002, name: "콘텐츠 제작 의뢰",    due_date: "2026-06-05", manager: "김다은", completed: true,  notes: "" },
    { code: "M008", campaign_id: cm.CMP002, name: "SNS 1차 포스팅",      due_date: "2026-06-15", manager: "이서준", completed: false, notes: "⚠ 마감 임박" },
    { code: "M009", campaign_id: cm.CMP002, name: "오프라인 행사 진행",   due_date: "2026-07-10", manager: "박소연", completed: false, notes: "" },
    { code: "M010", campaign_id: cm.CMP002, name: "중간 성과 보고",      due_date: "2026-07-20", manager: "박소연", completed: false, notes: "" },
    // CMP003 — SPF 시즌 론칭 캠페인 (완료 5/6)
    { code: "M011", campaign_id: cm.CMP003, name: "론칭 기획 확정",      due_date: "2026-04-05", manager: "이민아", completed: true,  notes: "" },
    { code: "M012", campaign_id: cm.CMP003, name: "제품 촬영 완료",      due_date: "2026-04-20", manager: "정재원", completed: true,  notes: "" },
    { code: "M013", campaign_id: cm.CMP003, name: "광고 소재 제작",      due_date: "2026-05-10", manager: "정재원", completed: true,  notes: "" },
    { code: "M014", campaign_id: cm.CMP003, name: "Meta 광고 론칭",      due_date: "2026-05-20", manager: "이민아", completed: true,  notes: "" },
    { code: "M015", campaign_id: cm.CMP003, name: "리뷰어 발송",         due_date: "2026-06-01", manager: "이민아", completed: true,  notes: "" },
    { code: "M016", campaign_id: cm.CMP003, name: "캠페인 결과 보고",    due_date: "2026-06-18", manager: "이민아", completed: false, notes: "⚠ 마감 임박" },
    // CMP004 — 여름 선케어 브랜드데이 (완료 1/4)
    { code: "M017", campaign_id: cm.CMP004, name: "브랜드데이 기획안",   due_date: "2026-06-10", manager: "이민아", completed: true,  notes: "" },
    { code: "M018", campaign_id: cm.CMP004, name: "행사장 섭외",         due_date: "2026-06-20", manager: "정재원", completed: false, notes: "⚠ 마감 임박" },
    { code: "M019", campaign_id: cm.CMP004, name: "인플루언서 섭외",     due_date: "2026-06-25", manager: "이민아", completed: false, notes: "" },
    { code: "M020", campaign_id: cm.CMP004, name: "현장 운영 준비",      due_date: "2026-07-01", manager: "정재원", completed: false, notes: "" },
    // CMP005 — 레티놀 앰플 신제품 론칭 (완료 3/5)
    { code: "M021", campaign_id: cm.CMP005, name: "신제품 론칭 기획",    due_date: "2026-05-15", manager: "최준혁", completed: true,  notes: "" },
    { code: "M022", campaign_id: cm.CMP005, name: "바이럴 영상 제작",    due_date: "2026-05-28", manager: "김다은", completed: true,  notes: "" },
    { code: "M023", campaign_id: cm.CMP005, name: "인플루언서 협찬 발송", due_date: "2026-06-05", manager: "최준혁", completed: true,  notes: "" },
    { code: "M024", campaign_id: cm.CMP005, name: "SNS 해시태그 캠페인", due_date: "2026-06-17", manager: "이서준", completed: false, notes: "⚠ 마감 임박" },
    { code: "M025", campaign_id: cm.CMP005, name: "월간 성과 보고",      due_date: "2026-06-30", manager: "최준혁", completed: false, notes: "" },
  ];

  await sql`
    INSERT INTO milestones ${sql(milestones, "code", "campaign_id", "name", "due_date", "manager", "completed", "notes")}
  `;
  console.log(`✓ milestones (${milestones.length})`);

  await sql.end();
  console.log("\nSeed complete.");
}

seed().catch((e) => { console.error(e); process.exit(1); });
