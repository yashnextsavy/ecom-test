import "server-only";
import { fetchJson } from "@/lib/server/http-client";

const PAYLOAD_DEFAULTS = {
  baseUrl: "http://localhost:3000",
  revalidateSeconds: 30,
} as const;

export const PAYLOAD_API_BASE_URL =
  process.env.PAYLOADCMS_API_BASE_URL ??
  process.env.API_BASE_URL ??
  process.env.fAPI_BASE_URL ??
  PAYLOAD_DEFAULTS.baseUrl;

export const PAYLOAD_REVALIDATE_SECONDS = Number(
  process.env.PAYLOAD_REVALIDATE_SECONDS ?? PAYLOAD_DEFAULTS.revalidateSeconds
);

export const PAYLOAD_API_PATHS = {
  home: "/api/home",
  about: "/api/about",
  contact: "/api/contact",
  achievement: "/api/achievement",
  vendors: "/api/vendors",
  international: "/api/international",
  blogsPopular: "/api/public/blogs/popular",
  blogsList: "/api/public/blogs",
  blogsPage: "/api/public/blogs/page",
  blogsSimilar: "/api/public/blogs/similar",
  search: "/api/search",
  generalPages: "/api/public/general-pages",
  footer: "/api/footer",
  voucher: "/api/vouchers",
  trendingOffersSection: "/api/trending-offers-section",

} as const;



export interface BannerImage {
  id: number;
  alt: string;
  url: string;
  thumbnailURL: string | null;
}

export interface BannerItem {
  id: string;
  image: BannerImage;
  cmp_img?: string;
  title: string;
  description: string;
  actualPrice: string;
  offerPrice: string;
  buttonTitle: string;
  buttonLink: string;


}

export interface CTABannerData {
  image?: {
    id: number;
    alt?: string;
    url?: string;
  };
  title?: string;
  buttonText?: string;
  buttonLink?: string;
  openInNewTabPrimary?: boolean;
  buttonTwoText?: string;
  buttonTwoLink?: string;
  openInNewTabSecondary?: boolean;
}


export interface WhyChooseUsEntry {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface WhyChooseUsSection {
  id: number;
  title: string;
  sectionInfo?: {
    title?: string;
  };
  whyChooseUsEntries?: WhyChooseUsEntry[];
  updatedAt?: string;
  createdAt?: string;
  globalType?: string;

}


export interface ContactInformation {
  id: number;
  sectionInfo?: {
    title?: string;
    description?: string;
  };
  contactDetails?: {
    whatsappNumber?: string;
    callNumber?: string;
    email?: string;
    address?: string;
    mapLocationUrl?: string;
    mapUrl?: string;
  };
  socialMedia?: {
    facebook?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    tweeter?: string | null;
    youtube?: string | null;
  };
  updatedAt?: string;
  createdAt?: string;
  globalType?: string;
}

export interface PopularBlogsSection {
  title?: string;
  description?: string;
  popularBlogsButtonText?: string;
  popularBlogsButtonLink?: string;
  openInNewTab?: boolean;
}

export interface AuthorisedPartnerItem {
  id: string;
  partnerName: string;
  image: string;
  partnerWebsiteURL: string;
}

export interface AuthorisedPartnersSection {
  sectionInfo?: {
    title?: string;
  };
  partners?: AuthorisedPartnerItem[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  categoryTitle: string;
  faqs: FAQItem[];
}

export interface FAQSectionData {
  sectionInfo?: {
    title?: string;
    description?: string;
  };
  faqCategories?: FAQCategory[];
}

export interface BlogCategoryMedia {
  id: string;
  url: string;
  type: string;
}

export interface BlogCategory {
  id: number;
  name: string;
  handle: string;
  imageUrl?: string;
  media?: BlogCategoryMedia[];
}

export interface BlogFeaturedImage {
  id: number;
  alt?: string;
  url: string;
  thumbnailURL?: string | null;
}

export interface BlogAuthor {
  name?: string;
}

export interface PopularBlogItem {
  title: string;
  slug: string;
  publishedAt: string;
  featuredImage?: BlogFeaturedImage | null;
  listingImage?: BlogFeaturedImage | null;
  categories?: BlogCategory[];
}

export interface BlogsListItem extends PopularBlogItem {
  id: number | string;
}

export interface PopularBlogsApiResponse {
  ok: boolean;
  page: string;
  data: PopularBlogItem[];
  meta: {
    total: number;
    limit: number;
  };
}


export interface CTABanner {
  title?: string;
  buttonText?: string;
  buttonLink?: string;
  openInNewTab?: boolean;
  description?: string;
}



export type PayloadHomePageResponse = {
  data: {
    seo: {
      title?: string;
      description?: string;
    };
    testimonials?: unknown;
    faqSection?: FAQSectionData;
    banner?: BannerItem[];
    ctaBannerOne?: CTABannerData;
    whyChooseUs?: WhyChooseUsSection;
    contactInformation?: ContactInformation;
    popularBlogs?: PopularBlogsSection;
    authorisedPartners?: AuthorisedPartnersSection;
    ctaBanner?: CTABanner;

  };
  keywords?: string[];
};


export type aboutBannerImage = {
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


export type OfferCategory = {
  name?: string;
  medusaCategoryId?: string;
  handle?: string;
  offer_badge?: string;
  media?: BlogCategoryMedia[];
};
export type OfferTopPoints = {
  pointOne?: string | null;
  pointTwo?: string | null;
  pointThree?: string | null;
};

export interface OffersCtaBanner {
  title?: string;
  buttonTitle?: string;
  buttonLink?: string | null;
  openInNewTab?: boolean;
  topPoints?: OfferTopPoints;
  categories?: OfferCategory[];
}




export type PayloadAboutPageResponse = {
  data: {
    seo: {
      title?: string;
      description?: string;
    }
    banner: {
      title: string;
      description: string;
    }
    ourMissionAndVision: {
      ourMission: string;
      ourVision: string;
    };
    ctaBanner: {
      title?: string;
      description?: string;
    }
    contactInformation: ContactInformation;
    aboutContent1: {
      title?: string;
      content?: string;
      image?: aboutBannerImage;
    }
    aboutContent2: {
      title?: string;
      content?: string;
      image?: aboutBannerImage;

    }
    offersCtaBanner?: OffersCtaBanner;
    trendingOffersSection?: {
      sectionInfo?: {
        title?: string;
        description?: string;
        buttonText?: string;
      };
    };
  };
};


// contactDetails


export interface contactDetails {

  whatsappNumber?: string;
  callNumber?: string;
  email?: string;
  address?: string;
  mapLocationUrl?: string;
  mapUrl?: string;


}

export interface ContactPageData extends ContactInformation {
  banner?: {
    title?: string;
    description?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export type PayloadContactPageResponse = {
  ok: boolean;
  page: string;
  data: ContactPageData;
};


export interface AchievementApiItem {
  id: string;
  image: string | null;
  title: string;
  description: string;
}

export type PayloadAchievementPageResponse = {
  data: {
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
    }
    banner: {
      title: string;
      description: string;
    }
    achievements: AchievementApiItem[];
    whyChooseUs?: WhyChooseUsSection;
    contactInformation: ContactInformation;
  };
};

export type PayloadVendorsPageResponse = {
  data: {
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
    }
    contactInformation: ContactInformation;
    banner: {
      title: string;
      description: string;
    }
    certificationsGridData: string;
  }
};

export type PayloadInternationalPageResponse = {
  data?: {
    seo?: {
      title?: string;
      description?: string;
    };
    banner?: BannerItem[];
    sectionInfo?: WhyChooseUsSection;
    faqSection?: FAQSectionData;
    ctaBanner?: CTABanner;
    ctaBannerInquiry?: CTABanner;
  };
};

export type PayloadBlogsPopularResponse = {
  ok: boolean;
  page: string;
  data: PopularBlogItem[];
  meta: {
    total: number;
    limit: number;
  };
};

export type PayloadBlogsListResponse = {
  data?: BlogsListItem[];
  page?: number;
  limit?: number;
  totalPages?: number;
  totalDocs?: number;
};

export type PayloadBlogsPageDataResponse = {
  data: {
    seo: {
      metaTitle?: string;
      metaDescription?: string;
    }
    banner: {
      title: string;
      description: string;
    }
    contactInformation: ContactInformation;
  };
};

export type PayloadBlogDetailsResponse = {
  data?: {
    title?: string;
    excerpt?: string;
    publishedAt?: string;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
    };
    content?: string;
    faqs?: FAQItem[];
    author?: BlogAuthor;
    categories?: BlogCategory[];
    featuredImage?: BlogFeaturedImage | null;
    contactInformation?: ContactInformation;
  };
};

export type PayloadBlogsSimilarResponse = {
  data?: Array<{
    title: string;
    slug: string;
    publishedAt: string;
    featuredImage?: BlogFeaturedImage | null;
    categories?: BlogCategory[];
  }>;
};

type QueryParamValue = string | number | boolean | undefined | null;

const buildPayloadUrl = (path: string) => `${PAYLOAD_API_BASE_URL}${path}`;
const withQuery = (path: string, params?: Record<string, QueryParamValue>) => {
  if (!params) return path;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
};

const getBlogDetailsPath = (slug: string) =>
  `${PAYLOAD_API_PATHS.blogsList}/${encodeURIComponent(slug)}`;

export const payloadRequest = async <T = unknown>(
  path: string,
  options?: Omit<RequestInit, "body"> & { body?: unknown; revalidate?: number }
) => {
  return fetchJson<T>(buildPayloadUrl(path), {
    revalidate: options?.revalidate ?? PAYLOAD_REVALIDATE_SECONDS,
    ...options,
  });
};

export const getHomePageData = () =>
  payloadRequest<PayloadHomePageResponse>(PAYLOAD_API_PATHS.home);

export const getAboutPageData = () =>
  payloadRequest<PayloadAboutPageResponse>(PAYLOAD_API_PATHS.about);

export const getContactPageData = () =>
  payloadRequest<PayloadContactPageResponse>(PAYLOAD_API_PATHS.contact);

export const getAchievementPageData = () =>
  payloadRequest<PayloadAchievementPageResponse>(PAYLOAD_API_PATHS.achievement);

export const getVendorsPageData = () =>
  payloadRequest<PayloadVendorsPageResponse>(PAYLOAD_API_PATHS.vendors);


export const getVouchersPageData = () =>
  payloadRequest<PayloadVendorsPageResponse>(PAYLOAD_API_PATHS.voucher);



export const getInternationalPageData = () =>
  payloadRequest<PayloadInternationalPageResponse>(PAYLOAD_API_PATHS.international);

export const getPopularBlogsData = () =>
  payloadRequest<PayloadBlogsPopularResponse>(PAYLOAD_API_PATHS.blogsPopular);

export const getBlogsListData = (params?: {
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  if (params?.page || params?.limit) {
    return payloadRequest<PayloadBlogsListResponse>(
      withQuery(PAYLOAD_API_PATHS.blogsList, params)
    );
  }

  return (async () => {
    const baseParams = {
      status: params?.status ?? "published",
      sort: params?.sort ?? "desc",
      limit: 100,
    };

    const firstPage = await payloadRequest<PayloadBlogsListResponse>(
      withQuery(PAYLOAD_API_PATHS.blogsList, {
        ...baseParams,
        page: 1,
      })
    );

    const totalPages = firstPage?.totalPages ?? 1;

    if (totalPages <= 1) {
      return firstPage;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        payloadRequest<PayloadBlogsListResponse>(
          withQuery(PAYLOAD_API_PATHS.blogsList, {
            ...baseParams,
            page: index + 2,
          })
        )
      )
    );

    return {
      ...firstPage,
      data: [
        ...(firstPage?.data ?? []),
        ...remainingPages.flatMap((page) => page?.data ?? []),
      ],
    };
  })();
};

export const getBlogsPageData = () =>
  payloadRequest<PayloadBlogsPageDataResponse>(PAYLOAD_API_PATHS.blogsPage);

export const getBlogDetailsData = (slug: string) =>
  payloadRequest<PayloadBlogDetailsResponse>(getBlogDetailsPath(slug));

export const getSimilarBlogsData = (slug: string, limit = 4) =>
  payloadRequest<PayloadBlogsSimilarResponse>(
    withQuery(PAYLOAD_API_PATHS.blogsSimilar, { slug, limit })
  );





export interface SearchResultItem {
  id?: string | number;
  title?: string;
  slug?: string;
  description?: string;
}

export interface PayloadSearchResponse {
  ok?: boolean;
  data?: SearchResultItem[];
}

export const searchContent = (query: string) =>
  payloadRequest<PayloadSearchResponse>(
    withQuery(PAYLOAD_API_PATHS.search, { q: query })
  );




export interface GeneralPageListItem {
  id: string | number;
  title: string;
  slug: string;
  status?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayloadGeneralPagesListResponse {
  data?: GeneralPageListItem[];
}

export interface PayloadGeneralPageDetailsResponse {
  data?: {
    id: string | number;
    title?: string;
    slug?: string;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
    };
    banner?: {
      title?: string;
      description?: string;
      image?: {
        url?: string;
      };
    };
    content?: string;
    publishedAt?: string;
    updatedAt?: string;
  };
}


const getGeneralPageDetailsPath = (slug: string) =>
  `${PAYLOAD_API_PATHS.generalPages}/${encodeURIComponent(slug)}`;

export const getGeneralPagesList = () =>
  payloadRequest<PayloadGeneralPagesListResponse>(
    PAYLOAD_API_PATHS.generalPages
  );

export const getGeneralPageBySlug = (slug: string) =>
  payloadRequest<PayloadGeneralPageDetailsResponse>(
    getGeneralPageDetailsPath(slug)
  );



export interface FooterLinkItem {
  label: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface FooterContact {
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
}

export interface PayloadFooterResponse {
  data?: {
    logo?: string;
    description?: string;
    columns?: FooterColumn[];
    contact?: FooterContact;
    copyright?: string;
  };
}
export const getFooterData = () =>
  payloadRequest<PayloadFooterResponse>(PAYLOAD_API_PATHS.footer);



export interface TrendingOffersSectionResponse {
  data?: {
    id?: number;
    sectionInfo?: {
      title?: string;
      description?: string;
      buttonText?: string;
    };
  };
}

export const getTrendingOffersSection = () =>
  payloadRequest<TrendingOffersSectionResponse>(
    PAYLOAD_API_PATHS.trendingOffersSection
  );
