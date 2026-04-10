import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260409120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "email_template_config" ("id" text not null, "website_name" text null, "logo_url" text null, "support_email" text null, "contact_admin_email" text null, "order_admin_email" text null, "order_support_email" text null, "whatsapp_url" text null, "call_url" text null, "about_url" text null, "terms_url" text null, "privacy_url" text null, "facebook_url" text null, "x_url" text null, "linkedin_url" text null, "instagram_url" text null, "social_facebook_icon" text null, "social_x_icon" text null, "social_linkedin_icon" text null, "social_instagram_icon" text null, "copyright_text" text null, "checkout_otp_email_subject" text null, "order_email_gst_rate" integer null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "email_template_config_pkey" primary key ("id"));`
    )

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_email_template_config_deleted_at" ON "email_template_config" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "email_template_config" cascade;`)
  }
}
