import { CgChevronRight } from "react-icons/cg";
import CertificateCard from "../CertificateCard/CertificateCard";
import TrendingOffers from "../TrendingOffers/TrendingOffers";
// import CertificateCard from ''
type CompanyCard = {
  id: number
  company: string
  logo: string
  link: string
  className: string
}

const certificateCards: CompanyCard[] = [
  {
    id: 1,
    company: 'AWS',
    logo: '/assets/images/c-card-aws.webp',
    link: '/aws-certifications',
    className: 'c-card-1',
  },
  {
    id: 2,
    company: 'Cisco',
    logo: '/assets/images/c-card-aws.webp',
    link: '/cisco-certifications',
    className: 'c-card-2',
  },
  {
    id: 3,
    company: 'CompTIA',
    logo: '/assets/images/c-card-aws.webp',
    link: '/comptia-certifications',
    className: 'c-card-3',
  },
]


export type CategoryMedia = {
  id: string;
  url: string;
  type?: string;
  file_id?: string;
  category_id?: string;
};

export type OfferCategory = {
  name?: string;
  medusaCategoryId?: string;
  handle?: string;
  offer_badge?: string;
  media?: CategoryMedia[];
};

export type OfferTopPoints = {
  pointOne?: string | null;
  pointTwo?: string | null;
  pointThree?: string | null;
};

export interface OffersCtaBanner {
  title?: string; // HTML string
  buttonTitle?: string;
  buttonLink?: string | null;
  openInNewTab?: boolean;
  topPoints?: OfferTopPoints;
  categories?: OfferCategory[];
}

interface DiscoverProps {
  DiscoverData?: OffersCtaBanner;
  trendingOffersSection?: {
    sectionInfo?: {
      title?: string;
      description?: string;
      buttonText?: string;
    };
  };
}


const DiscoverCertificates = ({ DiscoverData, trendingOffersSection }: DiscoverProps) => {


  console.log("about Data: ", DiscoverData);


  if (!DiscoverData) return null;
  return (
    <section className="discover-certificates-wrapper">

      <img
        alt="Background shapes"
        className="contact-bg-image absolute left-0 top-0 bottom-0 z-0 h-full"
        src="/assets/images/why-trust-us-left-bg.svg"
      />
      <img
        alt="Background shapes"
        className="contact-bg-image cards-bg-img  absolute right-0 top-0 bottom-0 z-0 h-full"
        src="/assets/images/why-trust-us-right-bg.svg"
      />

      <div className="container-custom mx-auto">
        <div className="discover-content gap-8 xl:gap-0 flex flex-col xl:flex-row relative">
          <div className="discover-info  w-full xl:w-2/3 flex flex-col justify-center gap-8 md:gap-11">
            <ul className="cta-trust-points ">

              {DiscoverData?.topPoints?.pointThree ? (
                <>
                  {DiscoverData?.topPoints?.pointOne && (
                    <li>{DiscoverData?.topPoints?.pointOne}</li>
                  )}
                  {DiscoverData?.topPoints?.pointTwo && (
                    <li>{DiscoverData?.topPoints?.pointTwo}</li>
                  )}
                  {DiscoverData?.topPoints?.pointThree && (
                    <li>{DiscoverData?.topPoints?.pointThree}</li>
                  )}
                </>
              ) : (
                <>
                  <li><strong>10+ Years</strong> Leading in Business</li>
                  <li>Trusted by <strong>5000+ Customers</strong></li>
                  <li><strong>75+ Top</strong> Companies as Partners</li>
                </>
              )}

            </ul>



            <div
              className="banner-title"
              dangerouslySetInnerHTML={{ __html: DiscoverData?.title || "" }}
            />
          </div>

          <TrendingOffers
            categories={DiscoverData?.categories || []}
            // buttonLink={trendingOffersSection?.sectionInfo?.buttonText}
            trendingTitle={trendingOffersSection?.sectionInfo?.title}
            buttonTitle={trendingOffersSection?.sectionInfo?.buttonText}
            trendingDescription={trendingOffersSection?.sectionInfo?.description}
          />



        </div>
      </div>
    </section>
  )
}

export default DiscoverCertificates
