import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260305000100 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "international_country" ("id" text not null, "country_name" text not null, "currency_name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "international_country_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_international_country_deleted_at" ON "international_country" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "international_country" cascade;`)
  }
}
