import CompanyMarquee from "./components/BrandsMarquee/BrandsMarquee";
import CompanyCertificationsGrid from "./components/CompanyCertifications/CompanyCertificationsGrid";
import CTABannerContactUs from "./components/CTABanner/CTABannerContactUs";
import CTABannerVoucher from "./components/CTABanner/CTABannerVoucher";
import FAQs from "./components/FAQs/FAQs";
import GetInTouch from "./components/GetInTouch/GetInTouch";
import HeroBanner from "./components/HeroBanner/HeroBanner";
import TestimonialsSection from "./components/TestimonialSection/TestimonialSection";
import UsefulBlogs from "./components/UsefulBlogs/UsefulBlogs";
import WhyTrustGits from "./components/WhyTrustGits/WhyTrustGits";
import { Metadata } from "next";
import { getHomePageData } from "@/lib/apis/payload-api";
import { getMedusaProductCategories } from "@/lib/apis/medusa-api";
import { getPopularBlogsData } from "@/lib/apis/payload-api";
import AuthorizedPartners from "./components/AuthorizedPartner/AuthorizedPartner";

// import 



export async function generateMetadata(): Promise<Metadata> {
  try {
    const result = await getHomePageData();

    return {
      title: result?.data?.seo?.title || " Global IT Success",
      description: result?.data?.seo?.description,
      keywords: result?.keywords,
    };
  } catch {
    return {
      title: "Global IT Success",
      description:
        "Learn more about Global IT Success and our certification programs.",
    };
  }
}

export default async function Home() {
  const [homeResult, categoriesResult, blogsResult] = await Promise.allSettled([
    getHomePageData(),
    getMedusaProductCategories(),
    getPopularBlogsData(),
  ]);

  const categoryData = await getMedusaProductCategories();

  const pageData = homeResult.status === "fulfilled" ? homeResult.value : null;
  const productCategoriesData =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : null;
  const popularBlogsData =
    blogsResult.status === "fulfilled" ? blogsResult.value : null;






  // const mockPartners = [
  //   {
  //     id: '1',
  //     partnerName: 'Microsoft',
  //     image: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
  //     partnerWebsiteURL: 'https://partner.microsoft.com/',
  //   },
  //   {
  //     id: '2',
  //     partnerName: 'Wipro',
  //     image: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg',
  //     partnerWebsiteURL: 'https://www.wipro.com/',
  //   },
  //   {
  //     id: '3',
  //     partnerName: 'IBM',
  //     image: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg',
  //     partnerWebsiteURL: 'https://www.ibm.com/',
  //   },
  //   {
  //     id: '4',
  //     partnerName: 'Accenture',
  //     image: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg',
  //     partnerWebsiteURL: 'https://www.accenture.com/',
  //   },

  // ];



  return (
    <>

      {/* <pre>{JSON.stringify(pageData?.data, null, 2)}</pre> */}

      <HeroBanner bannerData={pageData?.data?.banner} />
      <CompanyCertificationsGrid
        certificationsGridData={productCategoriesData?.product_categories || []}
      />

      <CompanyMarquee
        edgeShadow
        brandsData={productCategoriesData?.product_categories || []}
      />
      <CTABannerContactUs ctaData={pageData?.data?.ctaBannerOne} />
      <WhyTrustGits whyTrustUsData={pageData?.data?.whyChooseUs} />

      <TestimonialsSection TestimonialsData={pageData?.data?.testimonials || {}} />
      <FAQs faqData={pageData?.data?.faqSection} />


      {/* authorized partner */}
      <AuthorizedPartners
        title={pageData?.data?.authorisedPartners?.sectionInfo?.title}
        partners={pageData?.data?.authorisedPartners?.partners || []}
      // partners={mockPartners}
      />


      <GetInTouch contactInfoData={pageData?.data?.contactInformation} categories={categoryData?.product_categories || []} />

      <UsefulBlogs
        popularBlogsData={pageData?.data?.popularBlogs}
        popularBlogsList={popularBlogsData?.data}
      />
      <CTABannerVoucher CTABannerVoucherData={pageData?.data?.ctaBanner} />
    </>
  );
}
