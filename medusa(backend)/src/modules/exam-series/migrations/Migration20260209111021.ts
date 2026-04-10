import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260209111021 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "exam_series" ("id" text not null, "title" text not null, "category_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "exam_series_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_exam_series_deleted_at" ON "exam_series" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "exam_series" cascade;`);
  }

}
