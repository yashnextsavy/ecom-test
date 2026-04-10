import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260312120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "contact_request" ("id" text not null, "full_name" text not null, "email" text not null, "phone" text not null, "country" text not null, "vendor" text not null, "course" text not null, "message" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "contact_request_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_contact_request_deleted_at" ON "contact_request" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "contact_request" cascade;`)
  }
}
