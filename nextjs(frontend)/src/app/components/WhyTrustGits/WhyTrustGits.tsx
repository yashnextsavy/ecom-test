'use client';

import React from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { WhyChooseUsSection, WhyChooseUsEntry } from '@/lib/api';
import Image from 'next/image';

interface Props {
  whyTrustUsData?: WhyChooseUsSection;
}

const WhyTrustGits = ({ whyTrustUsData }: Props) => {

  const entries = whyTrustUsData?.whyChooseUsEntries ?? [];

  if (entries.length === 0) return null;

  return (
    <section className="trust-v2 relative">
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

      <div className='container-custom mx-auto'>

        <h2 className="trust-v2__title">
          {whyTrustUsData?.sectionInfo?.title || whyTrustUsData?.title || "Experience The Difference"
          }
        </h2>

        {entries.length > 0 && (
          <Splide
            options={{
              perPage: Math.min(5, entries.length), // max 5, but not more than entries
              gap: '20px',
              arrows: false,
              pagination: false,
              drag: false,
              center: true,
              breakpoints: {
                1700: { drag: true, perPage: Math.min(5, entries.length) },
                1640: { drag: true, perPage: Math.min(4, entries.length) },
                1280: { perPage: Math.min(3, entries.length) },
                991: { perPage: Math.min(2, entries.length) },
                550: { perPage: 1 },
              },
            }}
            className="trust-v2__slider"
          >
            {entries.map((card: WhyChooseUsEntry) => (
              <SplideSlide key={card.id}>
                <div className="trust-v2__card">
                  <div className="trust-v2__icon">
                    <Image width={64} height={64} src={card?.image || "/assets/images/why-trust-us-card-1.svg"} alt={card.title} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </SplideSlide>
            ))}
          </Splide>
        )}

      </div>
    </section>
  );
};

export default WhyTrustGits;