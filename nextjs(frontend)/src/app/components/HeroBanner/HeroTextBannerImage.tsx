// const heroData = {
//     title: 'Terms of service',
//     description:
//         'We will collects certain information from individuals using our services, such as name, contact number, email address, residential address, and work information.',
// }

// const HeroTextBannerImage = () => {
//     return (
//         <section className="text-image-hero-banner-wrapper" >

//             <img

//                 className="hero-bg-gradient  contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full w-2/3 object-cover "
//                 src={"/assets/images/text-imagebanner-1-blue-gradient.svg"} alt={"bg-gradient"}
//             />
//             <img

//                 className="hero-bg-image contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full w-2/3 object-cover "
//                 src={"/assets/images/text-imagebanner-1-bg.webp"} alt={"bg"}
//             />


//             <div className="container-custom mx-auto">
//                 <div className="text-hero-banner-content text-image-banner-type-1">
//                     <h1>{heroData.title}</h1>
//                     <p>{heroData.description}</p>
//                 </div>

//             </div>
//         </section>
//     )
// }

// export default HeroTextBannerImage  

type HeroTextBannerImageProps = {
    title?: string;
    description?: string;
    image?: string;
};

const HeroTextBannerImage = ({
    title,
    description,
    image,
}: HeroTextBannerImageProps) => {

    const fallbackImage = "/assets/images/text-imagebanner-1-bg.webp";

    return (
        <section className="text-image-hero-banner-wrapper">


            {/* <img
                className="hero-bg-gradient contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full w-2/3 object-cover"
                src="/assets/images/text-imagebanner-1-blue-gradient.svg"
                alt="bg-gradient"
            /> */}


            <div className="hero-bg-gradient contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full w-2/3 object-cover">

            </div>

            <img
                className="hero-bg-image contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full w-2/3 object-cover"
                src={image || fallbackImage}
                alt={title || "banner"}
            />



            <div className="container-custom mx-auto">
                <div className="text-hero-banner-content text-image-banner-type-1">


                    <h1>{title || "Information unavailable"}</h1>

                    <p>
                        {description ||
                            "Please check back later for more details."}
                    </p>

                </div>
            </div>
        </section>
    );
};

export default HeroTextBannerImage;