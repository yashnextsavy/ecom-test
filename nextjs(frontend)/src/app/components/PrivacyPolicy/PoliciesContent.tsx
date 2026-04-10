type PoliciesContentProps = {
  content?: string;
};

export default function PoliciesContent({ content }: PoliciesContentProps) {
  // ✅ Step 1: remove empty paragraphs
  const cleanedContent = content
    ?.replace(/<p>\s*(<br\s*\/?>|&nbsp;|\s)*\s*<\/p>/gi, "")
    // ✅ also remove ALL <hr> to avoid duplicate dividers
    ?.replace(/<hr\s*\/?>/gi, "");

  // ✅ Step 2: check if content is empty
  const isEmpty =
    !cleanedContent ||
    cleanedContent.replace(/<[^>]*>/g, "").trim() === "";

  if (isEmpty) {
    return (
      <section className="policy-content-wrapper">
        <div className="container-custom mx-auto py-10">
          <h2>Information unavailable at the moment</h2>
          <p>Please check back later.</p>
        </div>
      </section>
    );
  }

  // ✅ Step 3: inject dividers before headings (except first)
  let isFirstHeading = true;

  const formattedContent = cleanedContent.replace(
    /<(h2|h3)([^>]*)>/gi,
    (match, tag, attrs) => {
      if (isFirstHeading) {
        isFirstHeading = false;
        return `<${tag}${attrs}>`;
      }

      return `
        <div class="faq-divider">
          <img src="/assets/images/faq-dashed-line.svg" class="faq-divider-line" />
        </div>
        <${tag}${attrs}>
      `;
    }
  );

  return (
    <section className="policy-content-wrapper">
      <div className="container-custom mx-auto">
        <div
          className="policy-block"
          dangerouslySetInnerHTML={{ __html: formattedContent || "" }}
        />
      </div>
    </section>
  );
}