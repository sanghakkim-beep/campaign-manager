CREATE TYPE "public"."campaign_status" AS ENUM('계획중', '준비중', '진행중', '완료', '취소');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"manager" text DEFAULT '' NOT NULL,
	"annual_budget" bigint DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"planned_budget" bigint DEFAULT 0 NOT NULL,
	"actual_budget" bigint DEFAULT 0 NOT NULL,
	"status" "campaign_status" DEFAULT '계획중' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text NOT NULL,
	"due_date" date,
	"manager" text DEFAULT '' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "milestones_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;