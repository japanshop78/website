import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MessengerFloatingButton from "@/components/MessengerFloatingButton";
import TrackingScripts from "@/components/TrackingScripts";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProductDataProvider } from "@/context/ProductDataContext";
import { CartProvider } from "@/context/CartContext";
import { getSiteUrl } from "@/utils/siteUrl";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Đồ Nội Địa Nhật 100% - Japan Shop | Hàng Nhật Chính Hãng",
    template: "%s | Đồ Nội Địa Nhật 100% - Japan Shop",
  },
  description: "Đồ Nội Địa Nhật 100% (Japan Shop) - Chuyên cung cấp mỹ phẩm, thực phẩm chức năng, đồ dùng mẹ và bé chính hãng nội địa Nhật Bản chất lượng cao.",
  keywords: [
    "đồ nội địa nhật",
    "đồ nội địa nhật 100",
    "hàng nội địa nhật",
    "mỹ phẩm nội địa nhật",
    "thực phẩm chức năng nhật bản",
    "japan shop",
    "donoidianhat100",
  ],
  referrer: "no-referrer",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Đồ Nội Địa Nhật 100% - Japan Shop | Hàng Nhật Chính Hãng",
    description: "Đồ Nội Địa Nhật 100% (Japan Shop) - Chuyên cung cấp mỹ phẩm, thực phẩm chức năng, đồ dùng mẹ và bé chính hãng nội địa Nhật Bản chất lượng cao.",
    url: baseUrl,
    siteName: "Đồ Nội Địa Nhật 100% - Japan Shop",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${baseUrl}/logo.jpg`,
        width: 600,
        height: 600,
        alt: "Đồ Nội Địa Nhật 100% - Japan Shop Logo",
      },
    ],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Đồ Nội Địa Nhật 100% - Japan Shop",
  alternateName: "Japan Shop",
  url: baseUrl,
  logo: `${baseUrl}/logo.jpg`,
  description: "Chuyên cung cấp đồ nội địa Nhật 100%: mỹ phẩm, thực phẩm chức năng, đồ dùng mẹ và bé chính hãng Nhật Bản.",
  telephone: "+84902493895",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+84902493895",
    contactType: "customer service",
    areaServed: "VN",
    availableLanguage: ["vi", "ja"],
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Đồ Nội Địa Nhật 100% - Japan Shop",
  alternateName: "Japan Shop",
  url: baseUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${baseUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50 font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <TrackingScripts />
        <ThemeProvider>
          <ProductDataProvider>
            <CartProvider>
              <Header />
              <CartDrawer />
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
              <MessengerFloatingButton />
            </CartProvider>
          </ProductDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
