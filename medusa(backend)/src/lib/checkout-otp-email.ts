import { sendEmail } from "./email"
import {
  getEmailTemplateConfig,
  type EmailTemplateConfigRecord,
} from "./email-template-config"

type ScopeLike = {
  resolve: (name: string) => unknown
}

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
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

const buildOtpEmailTemplate = (
  input: {
    otp: string
    expiresInMinutes: number
  },
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
      <style>
        @media only screen and (max-width: 600px) {
          .otp-wrapper {
            padding: 24px 12px 20px 12px !important;
          }
          .otp-code {
            font-size: 28px !important;
            letter-spacing: 5px !important;
          }
          .otp-text {
            font-size: 17px !important;
            line-height: 1.6 !important;
          }
          .otp-actions td {
            display: block !important;
            width: 100% !important;
            padding: 0 0 14px 0 !important;
          }
          .otp-actions a {
            font-size: 16px !important;
            display: inline-block !important;
          }
        }
      </style>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:780px;margin:0 auto;background:#ffffff;">
        <tr>
          <td class="otp-wrapper" style="padding:52px 32px 32px 32px;">
            ${
              assets.logoSrc
                ? `<img src="${escapeHtml(assets.logoSrc)}" alt="${escapeHtml(settings.website_name)}" style="display:block;max-width:210px;max-height:82px;height:auto;margin-bottom:40px;" />`
                : ""
            }

            <p class="otp-text" style="margin:0 0 22px 0;font-size:19px;line-height:1.7;color:#2d4a9d;">Your checkout verification code is:</p>

            <p class="otp-code" style="margin:0 0 22px 0;font-size:34px;line-height:1.2;letter-spacing:8px;color:#2d4a9d;font-weight:700;">
              ${escapeHtml(input.otp)}
            </p>

            <p class="otp-text" style="margin:0 0 22px 0;font-size:19px;line-height:1.7;color:#2d4a9d;">
              This code expires in ${input.expiresInMinutes} minutes.
            </p>

            <p class="otp-text" style="margin:0 0 28px 0;font-size:19px;line-height:1.7;color:#2d4a9d;">
              If you did not request this code, you can ignore this email.
            </p>

            <table class="otp-actions" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
              <tr>
                <td style="padding:0 0 14px 0;">
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

            <p style="margin:0 0 10px 0;font-size:19px;line-height:1.7;color:#2d4a9d;">Best regards,</p>
            <p style="margin:0 0 50px 0;font-size:19px;line-height:1.7;color:#2d4a9d;font-weight:700;">Team ${escapeHtml(settings.website_name)}</p>

            <p style="margin:0 0 12px 0;font-size:16px;line-height:1.7;color:#2d4a9d;">
              For any queries, connect with us at
              <a href="mailto:${escapeHtml(settings.support_email)}" style="color:#2d4a9d;font-weight:700;text-decoration:none;"> ${escapeHtml(settings.support_email)}</a>
            </p>
            <p style="margin:0 0 28px 0;font-size:16px;line-height:1.7;color:#2d4a9d;">${escapeHtml(settings.copyright_text)}</p>

            <p style="margin:0 0 28px 0;font-size:16px;line-height:1.7;color:#2d4a9d;">
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

export const sendCheckoutOtpEmail = async (
  input: {
    email: string
    otp: string
    expiresInMinutes: number
  },
  options?: {
    scope?: ScopeLike
  }
) => {
  const settings = await getEmailTemplateConfig(options?.scope)

  const logoImage = createCidImage(settings.logo_url, "otp-logo", "otp-logo")
  const facebookImage = createCidImage(
    settings.social_facebook_icon,
    "otp-facebook",
    "facebook-icon"
  )
  const xImage = createCidImage(settings.social_x_icon, "otp-x", "x-icon")
  const linkedinImage = createCidImage(
    settings.social_linkedin_icon,
    "otp-linkedin",
    "linkedin-icon"
  )
  const instagramImage = createCidImage(
    settings.social_instagram_icon,
    "otp-instagram",
    "instagram-icon"
  )

  const attachments = [
    logoImage.attachment,
    facebookImage.attachment,
    xImage.attachment,
    linkedinImage.attachment,
    instagramImage.attachment,
  ].filter(Boolean)

  const text = [
    `Your checkout verification code is: ${input.otp}`,
    `This code expires in ${input.expiresInMinutes} minutes.`,
    "",
    "If you did not request this code, you can ignore this email.",
  ].join("\n")

  await sendEmail({
    to: input.email,
    subject: settings.checkout_otp_email_subject,
    text,
    html: buildOtpEmailTemplate(input, settings, {
      logoSrc: logoImage.src,
      facebookIconSrc: facebookImage.src,
      xIconSrc: xImage.src,
      linkedinIconSrc: linkedinImage.src,
      instagramIconSrc: instagramImage.src,
    }),
    attachments,
  })
}
