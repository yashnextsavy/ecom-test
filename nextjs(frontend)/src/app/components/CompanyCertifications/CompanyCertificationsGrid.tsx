'use client';

import '@splidejs/react-splide/css';
import { CgChevronRight } from 'react-icons/cg';
import Link from 'next/link';
import Image from 'next/image';

type ProductCategory = {
    id: string;
    name: string;
    handle: string;

    media?: {
        id: string;
        url: string;
    }[];

    offer_badge?: string;
    metadata?: {
        offer_badge_text?: string;
    };
};

interface CompanyCertificationsGridProps {
    certificationsGridData?: ProductCategory[];
}

const CompanyCertificationsGrid = ({
    certificationsGridData = [],
}: CompanyCertificationsGridProps) => {

    if (!certificationsGridData.length) return null;

    return (
        <section className="cert-grid cert-grid-wrapper">
            <div className='container-custom mx-auto'>

                {/* DESKTOP GRID */}
                <div className="cert-grid__desktop">

                    {certificationsGridData.map((item) => {

                        const badgeText =
                            item.offer_badge ||
                            item.metadata?.offer_badge_text ||
                            '';

                        return (
                            <Link
                                href={`/voucher/${item.handle}`}
                                key={item.id}
                                className="cert-card"
                            >
                                <div className="cert-card__inner">

                                    {badgeText && (
                                        <span className="cert-card__badge">
                                            {badgeText}
                                        </span>
                                    )}

                                    {/* Keeping image structure untouched */}
                                    <Image
                                        // src="/assets/images/company-certifications.svg"
                                        src={
                                            item.media?.[0]?.url ||
                                            "/assets/images/company-certifications.svg"}
                                        alt={item.name}
                                        width={250}
                                        height={90}
                                        unoptimized

                                    />

                                </div>

                                <div className="cert-card__cta">
                                    <span className="hidden! lg:flex! btn-primary small-btn whitespace-nowrap">
                                        Explore Vouchers
                                        <span className='inline-button-arrow'>
                                            <CgChevronRight className='primary-btn-first-arrow' />
                                            <CgChevronRight className='primary-btn-second-arrow' />
                                        </span>
                                    </span>

                                    <span className="btn-primary small-btn whitespace-nowrap lg:hidden!">
                                        Explore
                                        <span className='inline-button-arrow'>
                                            <CgChevronRight className='primary-btn-first-arrow' />
                                            <CgChevronRight className='primary-btn-second-arrow' />
                                        </span>
                                    </span>
                                </div>

                            </Link>
                        );
                    })}

                </div>
            </div>
        </section>
    );
};

export default CompanyCertificationsGrid;