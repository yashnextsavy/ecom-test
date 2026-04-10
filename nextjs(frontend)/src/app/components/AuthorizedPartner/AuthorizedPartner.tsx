'use client';

import Link from 'next/link';
import React from 'react';

type Partner = {
    id: string;
    partnerName: string;
    image: string;
    partnerWebsiteURL: string;
};

type AuthorizedPartnersProps = {
    title?: string;
    partners: Partner[];
};

const AuthorizedPartners: React.FC<AuthorizedPartnersProps> = ({
    title,
    partners,
}) => {
    const isMarquee = partners.length > 4;

    // Duplicate items for smooth infinite loop
    const marqueeItems = isMarquee ? [...partners, ...partners] : partners;



    return (
        <section className="authorized-partner-wrapper w-full overflow-hidden ">

            {/* Title */}
            {title && (
                <div className='container-custom mx-auto'>
                    <h2 className="authorized-partner-title text-center  mb-6 lg:mb-8">
                        {title}
                    </h2>
                </div>
            )}

            {/* Container */}
            <div className="authorized-partner-container relative w-full">

                {/* Static Grid (≤4 items) */}
                {!isMarquee && (
                    <div className='container-custom mx-auto'>
                        <div className="authorized-partner-grid flex  flex-wrap">
                            {partners.map((partner) => (
                                <Link
                                    key={partner.id}
                                    href={partner.partnerWebsiteURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="authorized-partner-item flex items-center justify-center"
                                >
                                    <img
                                        src={partner.image}
                                        alt={partner.partnerName}
                                        className="authorized-partner-image  transition-transform duration-300 "
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Marquee (>4 items) */}
                {isMarquee && (
                    <div className="authorized-partner-marquee group overflow-hidden">
                        <div className="authorized-partner-track flex animate-authorized-partner-marquee">

                            {marqueeItems.map((partner, index) => (
                                <Link
                                    key={`${partner.id}-${index}`}
                                    href={partner.partnerWebsiteURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="authorized-partner-item flex items-center justify-center"
                                >
                                    <img
                                        src={partner.image}
                                        alt={partner.partnerName}
                                        className="authorized-partner-image transition-transform duration-300 "
                                    />
                                </Link>
                            ))}

                        </div>
                    </div>
                )}

            </div>
        </section>
    );
};

export default AuthorizedPartners;