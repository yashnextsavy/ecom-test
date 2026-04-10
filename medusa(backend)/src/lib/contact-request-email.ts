import { sendEmail } from "./email"
import {
  getEmailTemplateConfig,
  type EmailTemplateConfigRecord,
} from "./email-template-config"

type ContactRequestEmailInput = {
  fullName: string
  email: string
  phone: string
  country: string
  vendor: string
  course: string
  message: string
  pageUrl: string
}

type ScopeLike = {
  resolve: (name: string) => unknown
}

const getAdminRecipient = (settings: EmailTemplateConfigRecord) => {
  return (
    settings.contact_admin_email ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    ""
  )
}

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const createCidImage = (
  value: string,
  cid: string,
  fallbackFileName: string
): {
  src: string
  attachment?: {
    filename: string
    content: string
    encoding: "base64"
    contentType: string
    cid: string
  }
} => {
  const trimmed = value.trim()

  if (!trimmed) {
    return { src: "" }
  }

  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)

  if (!match) {
    return { src: trimmed }
  }

  return {
    src: `cid:${cid}`,
    attachment: {
      filename: fallbackFileName,
      content: match[2],
      encoding: "base64",
      contentType: match[1],
      cid,
    },
  }
}

const buildRows = (rows: Array<{ label: string; value: string }>) => {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding:12px 14px;border:1px solid #dfe3ea;background:#f7f9fc;font-weight:600;width:180px;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:12px 14px;border:1px solid #dfe3ea;background:#ffffff;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("")
}

const buildSocialIcon = (href: string, iconSrc: string, alt: string) => {
  if (!iconSrc) {
    return ""
  }

  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;margin-right:12px;text-decoration:none;">
      <img src="${escapeHtml(iconSrc)}" alt="${escapeHtml(alt)}" width="42" height="42" style="display:block;border:0;width:42px;height:42px;" />
    </a>
  `
}

const buildEmailTemplate = (input: {
  title: string
  intro: string
  rows: Array<{ label: string; value: string }>
  messageLabel: string
  message: string
}) => {
  return `
    <div style="margin:0;padding:24px;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#1a2233;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dfe3ea;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #e7ebf2;background:#fbfcfe;">
            <div style="font-size:24px;font-weight:700;margin-bottom:8px;">${escapeHtml(input.title)}</div>
            <div style="font-size:15px;line-height:1.6;color:#51607a;">${escapeHtml(input.intro)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              ${buildRows(input.rows)}
              <tr>
                <td style="padding:12px 14px;border:1px solid #dfe3ea;background:#f7f9fc;font-weight:600;width:180px;vertical-align:top;">
                  ${escapeHtml(input.messageLabel)}
                </td>
                <td style="padding:12px 14px;border:1px solid #dfe3ea;background:#ffffff;white-space:pre-wrap;line-height:1.6;">
                  ${escapeHtml(input.message)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `
}

const buildCustomerEmailTemplate = (
  input: ContactRequestEmailInput,
  settings: EmailTemplateConfigRecord,
  assets: {
    logoSrc: string
    facebookIconSrc: string
    xIconSrc: string
    linkedinIconSrc: string
    instagramIconSrc: string
  }
) => {
  return `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#2d4a9d;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:780px;margin:0 auto;background:#ffffff;">
        <tr>
          <td style="padding:32px 20px 24px 20px;">
            ${
              assets.logoSrc
                ? `<img src="${escapeHtml(assets.logoSrc)}" alt="${escapeHtml(settings.website_name)}" style="display:block;max-width:210px;max-height:82px;height:auto;margin-bottom:40px;" />`
                : ""
            }

            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">Dear ${escapeHtml(input.fullName)},</p>

            <p style="margin:0 0 18px 0;font-size:17px;line-height:1.6;color:#2d4a9d;">Thank you for contacting ${escapeHtml(settings.website_name)}.</p>

            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">
              High certification costs often slow down career growth. ${escapeHtml(input.vendor)} certification helps you access better jobs, higher pay, and stronger career opportunities in IT and cloud computing.
            </p>

            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">
              We have received your request. Our team will help you get discounted ${escapeHtml(input.vendor)} exam vouchers so you can save money and focus on your preparation.
            </p>

            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">Our team will contact you soon with the next steps.</p>

            <p style="margin:0 0 22px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">If you need any assistance, feel free to contact our support team.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
              <tr>
                <td style="padding:0 0 12px 0;">
                  <a href="${escapeHtml(settings.whatsapp_url)}" style="font-size:18px;line-height:1.5;font-weight:700;color:#2d4a9d;text-decoration:none;border-bottom:2px solid #2d4a9d;display:inline-block;padding-bottom:2px;">
                    CONNECT VIA WHATSAPP &nbsp;&rsaquo;
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="${escapeHtml(settings.call_url)}" style="font-size:18px;line-height:1.5;font-weight:700;color:#2d4a9d;text-decoration:none;border-bottom:2px solid #2d4a9d;display:inline-block;padding-bottom:2px;">
                    CALL OUR EXPERTS &nbsp;&rsaquo;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">Best regards,</p>
            <p style="margin:0 0 28px 0;font-size:17px;line-height:1.6;color:#2d4a9d;font-weight:700;">Team ${escapeHtml(settings.website_name)}</p>

            <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">
              For any queries, connect with us at
              <a href="mailto:${escapeHtml(settings.support_email)}" style="color:#2d4a9d;font-weight:700;text-decoration:none;"> ${escapeHtml(settings.support_email)}</a>
            </p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">${escapeHtml(settings.copyright_text)}</p>

            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">
              <a href="${escapeHtml(settings.contact_url)}" style="color:#2d4a9d;text-decoration:none;">Contact</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.about_url)}" style="color:#2d4a9d;text-decoration:none;">About</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.terms_url)}" style="color:#2d4a9d;text-decoration:none;">Terms of use</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.privacy_url)}" style="color:#2d4a9d;text-decoration:none;">Privacy policy</a>
            </p>

            <p style="margin:0 0 14px 0;font-size:16px;line-height:1.7;color:#2d4a9d;">Follow us on</p>
            <div>
              ${buildSocialIcon(settings.facebook_url, assets.facebookIconSrc, "Facebook")}
              ${buildSocialIcon(settings.x_url, assets.xIconSrc, "X")}
              ${buildSocialIcon(settings.linkedin_url, assets.linkedinIconSrc, "LinkedIn")}
              ${buildSocialIcon(settings.instagram_url, assets.instagramIconSrc, "Instagram")}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `
}

export const sendContactRequestEmails = async (
  input: ContactRequestEmailInput,
  options?: {
    scope?: ScopeLike
  }
) => {
  const settings = await getEmailTemplateConfig(options?.scope)
  const adminRecipient = getAdminRecipient(settings)
  const logoImage = createCidImage(settings.logo_url, "contact-logo", "contact-logo")
  const facebookImage = createCidImage(
    settings.social_facebook_icon,
    "contact-facebook",
    "facebook-icon"
  )
  const xImage = createCidImage(settings.social_x_icon, "contact-x", "x-icon")
  const linkedinImage = createCidImage(
    settings.social_linkedin_icon,
    "contact-linkedin",
    "linkedin-icon"
  )
  const instagramImage = createCidImage(
    settings.social_instagram_icon,
    "contact-instagram",
    "instagram-icon"
  )
  const customerAttachments = [
    logoImage.attachment,
    facebookImage.attachment,
    xImage.attachment,
    linkedinImage.attachment,
    instagramImage.attachment,
  ].filter(Boolean)

  const adminText = [
    "New contact request received.",
    "",
    `Name: ${input.fullName}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Country: ${input.country}`,
    `Vendor: ${input.vendor}`,
    `Course: ${input.course}`,
    `Page URL: ${input.pageUrl || ""}`,
    "",
    "Message:",
    input.message,
  ].join("\n")

  const customerText = [
    `Hi ${input.fullName},`,
    "",
    "Thank you for contacting us.",
    "We have received your request and our team will get back to you soon.",
    "",
    `Vendor: ${input.vendor}`,
    `Course: ${input.course}`,
    `Country: ${input.country}`,
    `Phone: ${input.phone}`,
    `Page URL: ${input.pageUrl || ""}`,
    "",
    "Your message:",
    input.message,
  ].join("\n")

  const tasks: Promise<unknown>[] = [
    sendEmail({
      to: input.email,
      subject: "We received your contact request",
      text: customerText,
      html: buildCustomerEmailTemplate(input, settings, {
        logoSrc: logoImage.src,
        facebookIconSrc: facebookImage.src,
        xIconSrc: xImage.src,
        linkedinIconSrc: linkedinImage.src,
        instagramIconSrc: instagramImage.src,
      }),
      attachments: customerAttachments,
    }),
  ]

  if (adminRecipient) {
    tasks.push(
      sendEmail({
        to: adminRecipient,
        subject: `New contact request from ${input.fullName}`,
        text: adminText,
        html: buildEmailTemplate({
          title: "New Contact Request",
          intro: "A new contact form submission has been received from your website.",
          rows: [
            { label: "Full Name", value: input.fullName },
            { label: "Email", value: input.email },
            { label: "Phone", value: input.phone },
            { label: "Country", value: input.country },
            { label: "Vendor", value: input.vendor },
            { label: "Course", value: input.course },
            { label: "Page URL", value: input.pageUrl || "" },
          ],
          messageLabel: "Message",
          message: input.message,
        }),
      })
    )
  }

  await Promise.all(tasks)
}
