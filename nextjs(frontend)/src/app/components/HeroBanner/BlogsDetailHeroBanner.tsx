type BlogsDetailHeroBannerProps = {
    title?: string;
    description?: string;
    companyName?: string;
    authorName?: string;
    date?: string;
    extendedBG?: boolean;
    mobileExtendedBG?: boolean;
};



export default function BlogsDetailHeroBanner({
    title,
    description,
    companyName,
    authorName,
    date,
    extendedBG = false,
    mobileExtendedBG = false,

}: BlogsDetailHeroBannerProps) {
    const heroTitle = title
    const heroDescription = description
    const blogCompany = companyName
    const blogAuthor = authorName
    const blogDate = date

    return (
        <section
            className={`text-hero-banner-wrapper-type-2${extendedBG ? " large-btm-padding" : ""
                } `}
        >
            {extendedBG && <div className="section-extended-background" />}
            {mobileExtendedBG && <div className="mobile-extended-background" />}



            <div className="container-custom mx-auto">
                <div className="blogs-text-hero-banner-content flex flex-col justify-center  md:text-center gap-4 md:gap-8">
                    <h1>{heroTitle}</h1>

                    {/* Optional description */}
                    {/* {heroDescription && <p>{heroDescription}</p>} */}

                    <div className="blog-banner-details flex flex-row gap-6 justify-center items-center">


                        <div className="blog-deatils-banner-item-company">
                            {blogCompany}
                        </div>

                        <img
                            src="/assets/images/gray-vertical-dashed-line.svg"
                            alt="divider"
                        />

                        <div className="blog-deatils-banner-item flex items-center gap-2  hide-mobile">
                            <img
                                height={16}
                                width={16}
                                src="/assets/images/solar_pen-2-bold.svg"
                                alt="author icon"
                            />
                            By {blogAuthor}
                        </div>

                        <img
                            className="hide-divider"
                            src="/assets/images/gray-vertical-dashed-line.svg"
                            alt="divider"
                        />

                        <div className="blog-deatils-banner-item flex items-center gap-2">
                            <img
                                height={16}
                                width={16}
                                src="/assets/images/date-icon.svg"
                                alt="date icon"
                            />
                            {blogDate}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
