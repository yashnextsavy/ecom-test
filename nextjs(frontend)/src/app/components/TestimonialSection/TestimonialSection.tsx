'use client';

import { useState } from "react";
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { GoStarFill } from "react-icons/go";
import { BsQuote } from "react-icons/bs";




type TestimonialEntry = {
  id: string;
  testimony: string;
  reviewer: string;
  rating: string;
};


type TestimonialsData = {
  sectionInfo?: {
    title?: string;
    description?: string;
  };
  testimonialEntries?: TestimonialEntry[];
  googleReviews?: {
    googleStars?: string;
    totalCustomerRatings?: string;
    googleReviewLink?: string;
  }
};

interface Props {
  TestimonialsData?: TestimonialsData;
}


const TestimonialsSection = ({ TestimonialsData = {} }: Props) => {

  const sectionInfo = TestimonialsData?.sectionInfo;
  const googleReviews = TestimonialsData?.googleReviews || {};
  const entries = TestimonialsData?.testimonialEntries || [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const MAX_LENGTH = 180;
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const disableCursor = () => setShowCursor(false);
  const enableCursor = () => setShowCursor(true);

  return (
    <>


      <section className="testimonials-section-wrapper">
        <div className="container-custom mx-auto">

          {/* HEADER */}
          <div className="testimonials__header">
            <div className="testimonials__title">

              <h2>{sectionInfo?.title ?? ""}</h2>
              <p>{sectionInfo?.description ?? ""}</p>

            </div>

            <div className="testimonials__rating">
              <div className="rating-score">
                <span className="google-logo"><img width={92} height={92} src='/assets/images/testimonials-google-icon.svg' alt="google" /></span>
                <strong >{googleReviews.googleStars ?? "4.9"}</strong>
                <span className="star"><GoStarFill /></span>
              </div>

              <span className="rating-count">{googleReviews?.totalCustomerRatings ?? "250+"} Google Customer Ratings</span>
              <a target="_blank" href={googleReviews?.googleReviewLink ?? "https://share.google/H1LR8EAVK8a6jqw2H"} className="secondary-btn-link inline-flex justify-center items-center">
                Read more Google reviews →
              </a>
            </div>
          </div>


          {/* <div className="faq-divider">
          <img alt="divider icon" className="faq-divider-question" src="/assets/images/faq-dashed-line.svg" />
        </div> */}


        </div>


        <div
          className="drag-wrapper"
          onMouseEnter={() => setShowCursor(true)}
          onMouseLeave={() => setShowCursor(false)}
          onMouseMove={(e) =>
            setCursorPosition({ x: e.clientX, y: e.clientY })
          }
        >

          {/* SLIDER */}
          <Splide
            options={{
              perPage: 4,
              loop: true,
              gap: '24px',
              arrows: true,
              center: false,
              pagination: true,
              drag: true,
              breakpoints: {
                1440: { perPage: 3 },
                1024: { perPage: 2 },
                640: { perPage: 1 },
              },

            }}
            className="testimonials__slider marquee-edge-shadow"
            onMouseEnter={enableCursor}

          >


            {entries.map((item) => (
              <SplideSlide key={item.id}>
                <div className="testimonial-card">
                  <span className="quote"><BsQuote /></span>
                  <span className="quote-inner"><BsQuote /></span>

                  {/* <p className="testimonial-text">
                {item?.testimony}
              </p> */}
                  <p className="testimonial-text">
                    {expandedId === item.id
                      ? item.testimony
                      : item.testimony.slice(0, MAX_LENGTH)}

                    {item.testimony.length > MAX_LENGTH && (
                      <>
                        {expandedId !== item.id && "... "}

                        <button
                          className="read-more-btn"
                          onMouseEnter={disableCursor}
                          onMouseLeave={enableCursor}
                          onClick={() =>
                            setExpandedId(expandedId === item.id ? null : item.id)
                          }
                        >
                          {expandedId === item.id ? " Read less" : " Read more"}
                        </button>
                      </>
                    )}
                  </p>
                  <div className="testimonial-footer">
                    <div className="avatar"> {item.reviewer?.[0]?.toUpperCase()}</div>
                    <div>
                      <strong>{item.reviewer}</strong>
                      <div className="stars">
                        <div>{'★'.repeat(Number(item.rating))}</div>

                      </div>
                    </div>
                  </div>
                </div>
              </SplideSlide>
            ))}
          </Splide>

          {showCursor && (
            <div
              className="drag-cursor"
              style={{
                top: cursorPosition.y,
                left: cursorPosition.x,
              }}
            >
              <span className="drag-cursor-circle">‹</span>
              <span>DRAG</span>
              <span className="drag-cursor-circle" >›</span>
            </div>
          )}
        </div>




      </section>
    </>
  );
};

export default TestimonialsSection;
