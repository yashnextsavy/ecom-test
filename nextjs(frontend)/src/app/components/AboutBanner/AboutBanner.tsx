
interface PropType {
    bannerData?: {
        title: string;
        description: string;
    }
}


const AboutBannerSection = ({ bannerData }: PropType) => {
    return (
        <>

            <section className="about-banner-wrapper relative">


                <img
                    alt="Background shapes"
                    className="about-bg-gradient absolute left-0 top-0 bottom-0 right-0 z-0 w-full h-full"
                    src="/assets/images/about-hero-gradient.svg"
                />


                <img
                    alt="Background shapes"
                    className="about-hero-img absolute left-0 bottom-0 right-0  w-full h-full"
                    src="/assets/images/hero-images.webp"
                />
                <img
                    alt="Background shapes"
                    className="about-hero-person  absolute left-0 bottom-0 right-0  object-fit"
                    src="/assets/images/about-hero.svg"
                />

                <div className="about-hero-content-wrapper">
                    <div className="container-custom mx-auto">
                        <div className="about-hero-content">
                            <h1>{bannerData?.title}</h1>
                            {/* <p>{bannerData?.description}</p> */}
                            {/* <div
                                className="space-y-4"
                                dangerouslySetInnerHTML={{
                                    __html: bannerData?.description ?? "",
                                }}
                            /> */}

                            {bannerData?.description && (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: bannerData.description,
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

            </section>


        </>
    )
}

export default AboutBannerSection;  
