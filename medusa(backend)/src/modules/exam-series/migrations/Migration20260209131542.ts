import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260209131542 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "exam_series" add column if not exists "category_title" text not null default '';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "exam_series" drop column if exists "category_title";`);
  }

}
