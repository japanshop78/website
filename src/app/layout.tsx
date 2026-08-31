import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MessengerFloatingButton from "@/components/MessengerFloatingButton";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProductDataProvider } from "@/context/ProductDataContext";
import { CartProvider } from "@/context/CartContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Japan Shop",
  description: "",
  referrer: "no-referrer",
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
        <ThemeProvider>
          <ProductDataProvider>
            <CartProvider>
              <Header />
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


