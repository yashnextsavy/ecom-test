import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260327123000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "checkout_otp" ("id" text not null, "cart_id" text not null, "email" text not null, "otp_hash" text not null, "expires_at" timestamptz not null, "last_sent_at" timestamptz not null, "attempt_count" integer not null default 0, "resend_count" integer not null default 0, "verified" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "checkout_otp_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_checkout_otp_deleted_at" ON "checkout_otp" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_checkout_otp_cart_email" ON "checkout_otp" ("cart_id", "email");`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "checkout_otp" cascade;`)
  }
}
