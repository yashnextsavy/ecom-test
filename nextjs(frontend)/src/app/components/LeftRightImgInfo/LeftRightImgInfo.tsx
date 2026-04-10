type LeftRightItem = {
    title: string;
    description: string;
    image: string | { url?: string };
    imageAlt?: string;
};

type LeftRightImgInfoProps = {
    achievementsData: LeftRightItem[];
};

const LeftRightImgInfo = ({
    achievementsData,
}: LeftRightImgInfoProps) => {


    return (
        <section className="left-right-img-info-section">
            <div className="container-custom mx-auto">
                <div className="left-right-wrapper flex flex-col">

                    {achievementsData.map((item, index) => (
                        <div className="left-right-info-container-wrapper" key={index}>
                            <div className={`left-right-info-container flex flex-col gap-8 justify-center lg:flex-row ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                                }`}
                            >

                                {/* Image */}
                                <div className="p-6 image-content flex-1 flex justify-center">
                                    <img
                                        src={typeof item.image === "string" ? item.image : item.image?.url || "/assets/images/achivements-ats01.webp"}
                                        alt={item.imageAlt || item.title}
                                    />
                                </div>

                                {/* Content */}
                                <div className="info-content w-full lg:w-1/2">
                                    <div className="content-title">
                                        <h2>{item.title}</h2>
                                    </div>

                                    <div
                                        className="content-description"
                                        dangerouslySetInnerHTML={{ __html: item.description }}
                                    />
                                </div>

                            </div>

                            {/* Divider - except last item */}

                            {index !== achievementsData.length - 1 && (
                                <div className="faq-divider py-6 lg:py-8">
                                    <img
                                        alt="divider icon"
                                        className="faq-divider-line"
                                        src="/assets/images/faq-dashed-line.svg"
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                </div>
            </div>
        </section>
    )
}

export default LeftRightImgInfo
