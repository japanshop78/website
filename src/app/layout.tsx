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
    default: "Japan Shop - Hàng Nội Địa Nhật Bản Chính Hãng",
    template: "%s | Japan Shop",
  },
  description: "Chuyên cung cấp mỹ phẩm, thực phẩm chức năng, đồ dùng mẹ và bé chính hãng nội địa Nhật Bản chất lượng cao.",
  referrer: "no-referrer",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Japan Shop - Hàng Nội Địa Nhật Bản Chính Hãng",
    description: "Chuyên cung cấp mỹ phẩm, thực phẩm chức năng, đồ dùng mẹ và bé chính hãng nội địa Nhật Bản chất lượng cao.",
    url: baseUrl,
    siteName: "Japan Shop",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${baseUrl}/logo.jpg`,
        width: 600,
        height: 600,
        alt: "Japan Shop Logo",
      },
    ],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Japan Shop",
  url: baseUrl,
  logo: `${baseUrl}/logo.jpg`,
  description: "Chuyên cung cấp mỹ phẩm, thực phẩm chức năng, đồ dùng mẹ và bé chính hãng nội địa Nhật Bản chất lượng cao.",
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
  name: "Japan Shop",
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
