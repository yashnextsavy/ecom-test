import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260327110000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `alter table if exists "contact_request" add column if not exists "page_url" text not null default '';`
    )
  }

  async down(): Promise<void> {
    this.addSql(
      `alter table if exists "contact_request" drop column if exists "page_url";`
    )
  }
}
