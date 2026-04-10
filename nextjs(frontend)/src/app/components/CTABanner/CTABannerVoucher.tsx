import { CTABanner } from "@/lib/api";
import Link from "next/link";
import { CgChevronRight } from "react-icons/cg";

interface Props {
    CTABannerVoucherData?: CTABanner;
}

const CTABannerVoucher = ({ CTABannerVoucherData }: Props) => {


    const phoneNumber = CTABannerVoucherData?.buttonLink?.replace(/\D/g, "");

    const whatsappUrl = phoneNumber
        ? `https://wa.me/${phoneNumber}`
        : CTABannerVoucherData?.buttonLink || "#";




    return (
        <section className="cta-banner-voucher-wrapper relative overflow-hidden ">
            {/* Decorative blocks – left */}

            <img
                alt="Background shapes"
                className="contact-bg-image absolute left-0 top-0 bottom-0 z-0 h-full"
                src="/assets/images/cta-voucher-left.svg"
            />


            {/* Decorative blocks – right */}


            <img
                alt="Background shapes"
                className="contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full"
                src="/assets/images/cta-voucher-right.svg"
            />

            {/* Decorative blocks – phone */}


            <img
                alt="Background shapes"
                className="contact-bg-image phone-bg absolute left-0 top-0 bottom-0 z-0 h-full"
                src="/assets/images/cta-voucher-phone.svg"
            />


            <div className="cta-banner-voucher-info relative z-[2] mx-auto px-4 text-center container">
                <h2 className="text-3xl md:text-4xl font-medium text-[#243A8F]">
                    {CTABannerVoucherData?.title?.split("?").map((part, index, arr) => (
                        <span key={index}>
                            {part}
                            {index < arr.length - 1 && "?"}
                            {index < arr.length - 1 && <br />}
                        </span>
                    ))}
                 

                </h2>



                {/* Trust points */}
                <div className="mt-8">
                    <div className="cta-trust-points">
                        <div
                            className="list-points"
                            dangerouslySetInnerHTML={{
                                __html: CTABannerVoucherData?.description || "",
                            }}
                        />
                        {/* 
                        <li><strong>10+ Years </strong> Leading in Business</li>
                        <li>Trusted by <strong> 5000+ Customers</strong> </li>
                        <li><strong> 75+ Top </strong> Companies as Partners</li> */}
                    </div>


                </div>

                {/* CTA */}
                <div className="mt-12 flex justify-center">
                    <Link href={whatsappUrl}
                        target={CTABannerVoucherData?.openInNewTab ? "_blank" : "_self"}
                        rel={
                            CTABannerVoucherData?.openInNewTab
                                ? "noopener noreferrer"
                                : undefined
                        }
                        className="btn-primary whitespace-nowrap">
                        {CTABannerVoucherData?.buttonText} <span className='inline-button-arrow'> <CgChevronRight className='primary-btn-first-arrow' /> <CgChevronRight className='primary-btn-second-arrow' />  </span>

                    </Link>
                </div>
            </div>
        </section>

    )
}

export default CTABannerVoucher