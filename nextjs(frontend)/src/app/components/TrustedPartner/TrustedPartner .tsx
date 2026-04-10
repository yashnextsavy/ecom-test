
type BannerImage = {
  id: number;
  alt: string;
  url: string;
  thumbnailURL?: string | null;
  filename?: string;
  mimeType?: string;
  filesize?: number;
  width?: number;
  height?: number;
  focalX?: number;
  focalY?: number;
};

export interface AboutContent2 {
  title?: string;
  content?: string;
  image?: BannerImage;
}
interface PropType {
  aboutData?: AboutContent2;
}

const TrustedPartner = ({ aboutData }: PropType) => {
  return (
    <section className="why-choose-us-wrapper">
      <div className="container-custom mx-auto">
        <div className="why-choose-us-content flex flex-col  md:flex-row-reverse">

          <div className="why-choose-us-image relative w-full md:w-1/2">
            <img
              src={aboutData?.image?.url}
              alt={aboutData?.image?.alt}
              width={350}
              height={150}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          
          <div className="why-choose-us-info-container w-full md:w-1/2 flex justify-start p-7">
            <div className="why-choose-us-info flex flex-col gap-12">
              <h2>{aboutData?.title}</h2>
              <div
                dangerouslySetInnerHTML={{ __html: aboutData?.content ?? "" }}

              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default TrustedPartner 
