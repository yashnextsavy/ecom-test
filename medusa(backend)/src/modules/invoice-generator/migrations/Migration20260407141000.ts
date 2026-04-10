import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260407141000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "invoice_config" add column if not exists "copyright_text" text null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "invoice_config" drop column if exists "copyright_text";`)
  }
}

