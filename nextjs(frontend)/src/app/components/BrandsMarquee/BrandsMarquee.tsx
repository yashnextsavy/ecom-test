import Link from "next/link";

interface CategoryFromAPI {
  id: string;
  name: string;
  handle: string;
  media?: {
    url: string;
  }[];
}

type BrandsMarqueeProps = {
  edgeShadow?: boolean;
  brandsData?: CategoryFromAPI[];
};

export default function BrandsMarquee({
  edgeShadow = false,
  brandsData = [],
}: BrandsMarqueeProps) {
  if (!brandsData.length) return null;

  const brands = brandsData.map((item) => ({
    id: item.id,
    name: item.name,
    logo:
      item.media?.[0]?.url ||
      "/assets/images/company-certifications.svg",
    url: `/${item.handle}`,
  }));

  const marqueeCompanies = [...brands, ...brands];

  return (
    <div
      className={`brands-marquee-wrapper background-primary ${edgeShadow ? "marquee-edge-shadow" : ""
        }`}
    >
      <div className="brands-marquee">
        <div className="brands-marquee-track">
          {marqueeCompanies.map((brand, index) => (
            <Link
              key={`${brand.id}-${index}`}
              href={`/voucher${brand.url}`}
              className="brands-marquee-item"
            >
              <div className="brands-marquee-item-box">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="brands-marquee-item-image"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}