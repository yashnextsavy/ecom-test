
import { CgChevronRight } from "react-icons/cg";

type HeroTextBannerProps = {
  title?: string
  description?: string
  extendedBG?: boolean
  buttons?: boolean
  primaryBtn?: {
    label: string
    link: string
  }
  secondaryBtn?: {
    label: string
    link: string
  }
}


const defaultHeroData = {
  title: 'Connect With Our Support Team With Ease',
  description:
    'At Global IT Success, your certification goals matter to us. Reach out for support related to exam vouchers, certifications, or order inquiries. Our team is dedicated to making your experience smooth and stress-free.',
}


export default function HeroTextBanner1({
  title,
  description,
  extendedBG = false,
  buttons = false,
  primaryBtn = { label: "Contact via whatsapp", link: "#" },
  secondaryBtn = { label: "call our experts", link: "#" }
}: HeroTextBannerProps) {
  const heroTitle = title || defaultHeroData.title
  const heroDescription = description || defaultHeroData.description

  return (
    <section className={`text-hero-banner-wrapper ${extendedBG ? "large-btm-padding" : ""}`}>

      {extendedBG && <div className="section-extended-background"></div>}

      <div className="container-custom mx-auto">
        <div className="text-hero-banner-content">


          <div className="flex flex-col">
            <h1>{heroTitle}</h1>
            {buttons && <div className="title-btn-wrapper desktop-screen">

              <a href={primaryBtn.link} className="btn-primary white-btn">
                {primaryBtn.label}  <span className='inline-button-arrow'> <CgChevronRight className='primary-btn-first-arrow' /> <CgChevronRight className='primary-btn-second-arrow' />  </span>
              </a>



              <a href={secondaryBtn.link} className="secondary-btn-link inline-flex white-btn justify-center items-center ">
                Call our experts <span className='secondary-link-arrow'> <CgChevronRight /></span>
              </a>

            </div>
            }


          </div>

          <div className="space-y-4">
            {heroDescription
              ?.split('\n')
              .filter((line) => line.trim() !== '')
              .map((line, index) => (
                <p key={index}>{line}</p>
              ))}
          </div>

          {buttons && <div className="title-btn-wrapper mobile-screen">

            <a href={primaryBtn.link} className="btn-primary white-btn">
              {primaryBtn.label}  <span className='inline-button-arrow'> <CgChevronRight className='primary-btn-first-arrow' /> <CgChevronRight className='primary-btn-second-arrow' />  </span>
            </a>

            <a href={secondaryBtn.link} className="secondary-btn-link inline-flex white-btn justify-center items-center ">
              Call our experts <span className='secondary-link-arrow'> <CgChevronRight /></span>
            </a>

          </div>
          }


        </div>
      </div>
    </section>
  )
}