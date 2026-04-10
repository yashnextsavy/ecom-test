import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260409143000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "email_template_config" add column if not exists "contact_url" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "email_template_config" drop column if exists "contact_url";`
    )
  }
}
