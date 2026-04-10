import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260408114500 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "payment_recovery_entry" ("id" text not null, "provider_id" text not null default 'pp_easebuzz_default', "payment_session_id" text not null, "cart_id" text not null, "txnid" text null, "status" text not null default 'pending', "attempt_count" integer not null default 0, "max_attempts" integer not null default 60, "next_retry_at" timestamptz not null default now(), "last_attempt_at" timestamptz null, "last_error" text null, "order_id" text null, "payload" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_recovery_entry_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_recovery_entry_deleted_at" ON "payment_recovery_entry" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_payment_recovery_entry_payment_session_id" ON "payment_recovery_entry" ("payment_session_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_recovery_entry_status_next_retry_at" ON "payment_recovery_entry" ("status", "next_retry_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_recovery_entry_cart_id" ON "payment_recovery_entry" ("cart_id") WHERE deleted_at IS NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_recovery_entry" cascade;`)
  }
}
