import React from 'react';

type ImageContentSectionProps = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  imageDesktopPosition?: 'left' | 'right';
};

const ImageContentSection: React.FC<ImageContentSectionProps> = ({
  title,
  description,
  imageSrc,
  imageAlt = '',
  imageDesktopPosition = 'left',
}) => {
  return (
    <section className="why-choose-us-wrapper">
      <div className="container-custom mx-auto">
        <div
          className={`why-choose-us-content flex flex-col md:flex-row ${
            imageDesktopPosition === 'right' ? 'md:flex-row-reverse' : ''
          }`}
        >
          {/* Image */}
          <div className="why-choose-us-image relative w-full md:w-1/2">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="why-choose-us-info-container w-full md:w-1/2 flex justify-center p-7">
            <div className="why-choose-us-info flex flex-col gap-12">
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ImageContentSection;
