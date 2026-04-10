import Link from "next/link";
import { CgChevronRight } from "react-icons/cg";

type HeroTextBannerProps = {
  banner?: {
    title?: string;
    description?: string;
  };
  extendedBG?: boolean;
  buttons?: boolean;
  centerTitle?: boolean;
  beautifulBackground?: boolean;
  primaryBtn?: {
    label: string;
    link: string;
  };
  secondaryBtn?: {
    label: string;
    link: string;
  };
};



export default function HeroTextBannerDefault({
  banner,
  extendedBG = false,
  buttons = false,
  centerTitle = false,
  beautifulBackground = false,
  primaryBtn = { label: "Contact via whatsapp", link: "#" },
  secondaryBtn = { label: "Call our experts", link: "#" },
}: HeroTextBannerProps) {
  const heroTitle = banner?.title || "";
  const heroDescription = banner?.description || "";

  return (
    <section
      className={`text-hero-banner-wrapper ${extendedBG ? "large-btm-padding" : ""
        }`}
    >

      {beautifulBackground && (
        <>
          <img
            alt="Background shapes"
            className="contact-bg-image absolute left-0 top-0 bottom-0 z-0 h-full"
            src="/assets/images/why-trust-us-left-bg.svg"
          />
          <img
            alt="Background shapes"
            className="contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full"
            src="/assets/images/why-trust-us-right-bg.svg"
          />
        </>
      )}


      {extendedBG && <div className="section-extended-background"></div>}

      <div className="container-custom mx-auto relative z-1">
        <div
          className={`text-hero-banner-content ${centerTitle && !banner?.description ? "blog-banner-title" : ""
            }`}
        >

          <div className="flex flex-col">
            <div
              className="heading-tag"
              dangerouslySetInnerHTML={{ __html: heroTitle }}
            />

            {buttons && (
              <div className="title-btn-wrapper desktop-screen">
                <a target="_blank" href={primaryBtn.link} className="btn-primary white-btn">
                  {primaryBtn.label}
                  <span className="inline-button-arrow">
                    <CgChevronRight className="primary-btn-first-arrow" />
                    <CgChevronRight className="primary-btn-second-arrow" />
                  </span>
                </a>

                <a
                  href={secondaryBtn.link}
                  className="secondary-btn-link inline-flex white-btn justify-center items-center"
                >
                  {secondaryBtn.label}
                  <span className="secondary-link-arrow">
                    <CgChevronRight />
                  </span>
                </a>
              </div>
            )}
          </div>

          {/* <div className="space-y-4">
            {heroDescription
              ?.split("\n")
              .filter((line) => line.trim() !== "")
              .map((line, index) => (
                <p key={index}>{line}</p>
              ))}
          </div> */}
          {/* <div
            className="space-y-4"
            dangerouslySetInnerHTML={{ __html: heroDescription }}
          /> */}
          <div
            className="space-y-4 hero-description"
            dangerouslySetInnerHTML={{
              __html: (heroDescription ?? "").replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, ""),
            }}
          />

          {buttons && (
            <div className="title-btn-wrapper mobile-screen">
              <Link href={primaryBtn.link} className="btn-primary white-btn md:mr-10">
                {primaryBtn.label}
                <span className="inline-button-arrow">
                  <CgChevronRight className="primary-btn-first-arrow" />
                  <CgChevronRight className="primary-btn-second-arrow" />
                </span>
              </Link>

              <Link
                href={secondaryBtn.link}
                className="secondary-btn-link inline-flex white-btn justify-center items-center"
              >
                {secondaryBtn.label}
                <span className="secondary-link-arrow">
                  <CgChevronRight />
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}