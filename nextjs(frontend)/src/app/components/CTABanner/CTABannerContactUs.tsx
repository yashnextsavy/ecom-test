import Image from "next/image";
import Link from "next/link";
import { CgChevronRight } from "react-icons/cg";

type CTABannerData = {
    image?: {
        id: number;
        alt?: string;
        url?: string;
    };
    title?: string;
    buttonText?: string;
    buttonLink?: string;
    openInNewTabPrimary?: boolean;
    buttonTwoText?: string;
    buttonTwoLink?: string;
    openInNewTabSecondary?: boolean;
};

interface Props {
    ctaData?: CTABannerData;
}

const CTABannerContactUs = ({ ctaData }: Props) => {
    if (!ctaData) return null;

    const {
        image,
        title,
        buttonText,
        buttonLink,
        openInNewTabPrimary,
        buttonTwoText,
        buttonTwoLink,
        openInNewTabSecondary,
    } = ctaData;

    return (
        <section className="cta-banner section-margin">
            <div className="container-custom mx-auto">
                <div className="cta-inner">

                    {/* Left Image */}
                    <div className="cta-avatars w-2/5">
                        <Image
                            src={
                                image?.url || "/assets/images/cta-1.webp"
                            }
                            width={150}
                            height={120}
                            alt={image?.alt || "CTA Image"}
                            className="cta-avatar"
                            unoptimized
                        />
                    </div>

                    {/* Right Content */}
                    <div className="cta-content flex-1">
                        <p>{title}</p>

                        <div className="cta-actions">

                            {/* WhatsApp */}
                            {buttonText && buttonLink && (
                                <Link
                                    href={`https://wa.me/${buttonLink}`}
                                    target={openInNewTabPrimary ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="btn-primary whitespace-nowrap"
                                >
                                    {buttonText}
                                    <span className="inline-button-arrow">
                                        <CgChevronRight className="primary-btn-first-arrow" />
                                        <CgChevronRight className="primary-btn-second-arrow" />
                                    </span>
                                </Link>
                            )}

                            {/* Call */}
                            {buttonTwoText && buttonTwoLink && (
                                <Link
                                    href={`tel:+91${buttonTwoLink}`}
                                    target={openInNewTabSecondary ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="secondary-btn-link inline-flex justify-center items-center"
                                >
                                    {buttonTwoText}
                                    <span className="secondary-link-arrow">
                                        <CgChevronRight />
                                    </span>
                                </Link>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default CTABannerContactUs;