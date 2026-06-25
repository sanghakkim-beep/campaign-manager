import {
  pgTable,
  pgEnum,
  uuid,
  text,
  bigint,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const campaignStatusEnum = pgEnum("campaign_status", [
  "계획중",
  "준비중",
  "진행중",
  "완료",
  "취소",
]);

export const brands = pgTable("brands", {
  id:           uuid("id").defaultRandom().primaryKey(),
  code:         text("code").notNull().unique(),
  name:         text("name").notNull(),
  manager:      text("manager").notNull().default(""),
  annualBudget: bigint("annual_budget", { mode: "number" }).notNull().default(0),
  description:  text("description").notNull().default(""),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id:            uuid("id").defaultRandom().primaryKey(),
  code:          text("code").notNull().unique(),
  brandId:       uuid("brand_id").notNull().references(() => brands.id),
  name:          text("name").notNull(),
  startDate:     date("start_date"),
  endDate:       date("end_date"),
  plannedBudget: bigint("planned_budget", { mode: "number" }).notNull().default(0),
  actualBudget:  bigint("actual_budget", { mode: "number" }).notNull().default(0),
  status:        campaignStatusEnum("status").notNull().default("계획중"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

export const milestones = pgTable("milestones", {
  id:         uuid("id").defaultRandom().primaryKey(),
  code:       text("code").notNull().unique(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id),
  name:       text("name").notNull(),
  dueDate:    date("due_date"),
  manager:    text("manager").notNull().default(""),
  completed:  boolean("completed").notNull().default(false),
  notes:      text("notes").notNull().default(""),
});
