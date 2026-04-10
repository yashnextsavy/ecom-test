type Props = {
    missionVisionData?: {
        ourMission: string;
        ourVision: string;
    };
};



const MissionVision = ({ missionVisionData }: Props) => {
    const ourMission = missionVisionData?.ourMission ?? "";
    const ourVision = missionVisionData?.ourVision ?? "";


    return (
        <section className='mission-vission-wrapper'>
            <div className="container-custom mx-auto">
                <div className='mission-vision-cards-wrapper flex flex-col md:flex-row gap-8'>
                    <div className='mission-card mission-vision-card w-full md:w-1/2 relative'>
                        <h3 className='bullet-point  white-bullet'>Our Mission</h3>
                        <div className="faq-divider">
                            <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line-gray.svg" />
                        </div>
                        {/* <p>Transforming IT education and certification accessibility by delivering unparalleled IT training and affordable certification vouchers, empowering growth, innovation, and success in a competitive digital world.</p> */}
                        {/* {data.ourMission} */}

                        <div
                            dangerouslySetInnerHTML={{ __html: ourMission }}
                        />
                        <img
                            alt="Background shapes"
                            className="contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full"
                            src="/assets/images/mission-vision-bg.svg"
                        />

                    </div>
                    <div className='vision-card mission-vision-card w-full md:w-1/2 relative'>
                        <h3 className='bullet-point'>Our Vision</h3>
                        <div className="faq-divider">
                            <img alt="divider icon" className="faq-divider-line" src="/assets/images/faq-dashed-line.svg" />
                        </div>
                        {/* <p>To become the most trusted global reseller of discounted IT exam vouchers, and IT certification training provider, fostering an international community of skilled professionals who drive innovation, champion diversity, and shape the future of the IT industry.</p> */}

                        <div
                            dangerouslySetInnerHTML={{ __html: ourVision }}
                        />
                        <img
                            alt="Background shapes"
                            className="contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full"
                            src="/assets/images/mission-vision-bg.svg"
                        />

                    </div>


                </div>
            </div>
        </section>
    )
}


export default MissionVision
