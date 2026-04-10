import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260404163000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "invoice_config" ("id" text not null, "company_name" text not null, "company_address" text not null, "company_phone" text null, "company_email" text null, "company_logo" text null, "gstin" text null, "state" text null, "sac_code" text null, "reverse_charge" text null, "signature_name" text null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_config_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_invoice_config_deleted_at" ON "invoice_config" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "invoice" ("id" text not null, "display_id" bigserial not null, "order_id" text not null, "status" text check ("status" in ('latest', 'stale')) not null default 'latest', "currency_code" text null, "invoice_json" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_invoice_deleted_at" ON "invoice" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_invoice_order_id" ON "invoice" ("order_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_invoice_order_status" ON "invoice" ("order_id", "status") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "invoice" cascade;`)
    this.addSql(`drop table if exists "invoice_config" cascade;`)
  }
}
