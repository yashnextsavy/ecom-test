import type { Metadata } from "next";
import { Manrope } from 'next/font/google';
import "./globals.css";
import Header from "./components/Header/Header";
import TopContactBar from "./components/TopContactBar/TopContactBar";
import Footer from "./components/Footer/Footer";
import { getContactPageData } from "@/lib/api";
import { getMedusaProductCategories } from "@/lib/api";
import Script from "next/script";
import { ContactProvider } from "@/app/context/contact-context";
import { CartProvider } from "@/app/context/CartContext"
import CartDrawer from "@/app/components/Cart/CartDrawer";
// import Providers from "./providers"
import FixedContact from "./components/FixedContact/FixedContact";
import { CheckoutProvider } from "./context/CheckoutContext";
// import { CheckoutProvider } from "@/context/CheckoutContext"
import { getFooterData } from "@/lib/api";


export const metadata: Metadata = {
  title: {
    default: "Global IT Success",
    template: "%s | Global IT Success",
  },
  description: "Buy official exam vouchers at best prices.",

  icons: {
    icon: [
      { url: "/assets/favicon.ico" },
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
      { url: "/assets/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/assets/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  manifest: "/assets/site.webmanifest",
};


const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-primary',
  display: 'swap',
});



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contactResult, categoryResult, footerData] = await Promise.allSettled([
    getContactPageData(),
    getMedusaProductCategories(),
    getFooterData()
  ]);
  const contactData = contactResult.status === "fulfilled" ? contactResult.value : null;
  const categoryData = categoryResult.status === "fulfilled" ? categoryResult.value : null;


  return (
    <html lang="en">
      <body className={manrope.variable}>
        <Script
          src="https://cdn.webshare.io/share.min.js"
          strategy="afterInteractive"
        />

        <ContactProvider contactData={contactData?.data}>
          <CheckoutProvider>
            <CartProvider>


              <TopContactBar />
              <Header categories={categoryData?.product_categories || []} contactData={contactData?.data} />
              <FixedContact contactData={contactData?.data}
                categoryData={categoryData}
              />
              {children}
              <Footer

                contactData={contactData?.data}
                categories={categoryData?.product_categories || []}
                footerColumns={footerData}
              />
              <CartDrawer />
            </CartProvider>
          </CheckoutProvider>
        </ContactProvider>

      </body>
    </html>
  );
} 
