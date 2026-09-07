import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://personalcarebd.com"),
  title: {
    default: "Personal Care BD | টপ নচ ম্যাজিক কনডম - বাংলাদেশের সেরা কনডম | ৳৮৯৯",
    template: "%s | Personal Care BD",
  },
  description:
    "Personal Care BD - বাংলাদেশের সেরা রিইউজেবল সিলিকন ম্যাজিক কনডম। টপ নচ চায়না কনডম মাত্র ৳৮৯৯। সারাদেশে ফ্রি ডেলিভারি। পণ্য দেখে পেমেন্ট করুন। Magic condom Bangladesh 899 taka free delivery cash on delivery.",
  keywords: [
    "ম্যাজিক কনডম বাংলাদেশ",
    "টপ নচ কনডম",
    "সিলিকন রিইউজেবল কনডম",
    "চায়না কনডম বাংলাদেশ",
    "কনডম দাম বাংলাদেশ",
    "personal care bd",
    "magic condom bangladesh",
    "reusable silicone condom bd",
    "top notch condom price bangladesh",
    "condom 899 taka",
    "ব্যক্তিগত যত্ন বাংলাদেশ",
    "কনডম ৮৯৯ টাকা",
    "ফ্রি ডেলিভারি কনডম",
    "পুরুষ স্বাস্থ্য পণ্য বাংলাদেশ",
    "intimate care bangladesh",
    "TPE silicone condom bd",
  ],
  openGraph: {
    title: "Personal Care BD | টপ নচ ম্যাজিক কনডম - মাত্র ৳৮৯৯",
    description:
      "বাংলাদেশে সর্বোচ্চ মানের রিইউজেবল ম্যাজিক কনডম। সারাদেশে ফ্রি ডেলিভারি। হাতে পণ্য পেয়ে টাকা দিন।",
    url: "https://personalcarebd.com",
    siteName: "Personal Care BD",
    images: [
      {
        url: "/images/hero-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Personal Care BD - Top Notch Magic Condom Bangladesh",
      },
    ],
    locale: "bn_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Care BD | টপ নচ ম্যাজিক কনডম",
    description: "বাংলাদেশের সেরা রিইউজেবল কনডম মাত্র ৳৮৯৯। সারাদেশে ফ্রি ডেলিভারি।",
    images: ["/images/hero-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "https://personalcarebd.com",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://personalcarebd.com/#website",
      url: "https://personalcarebd.com",
      name: "Personal Care BD",
      description: "বাংলাদেশের সেরা ম্যাজিক কনডম - টপ নচ চায়না রিইউজেবল সিলিকন কনডম",
      inLanguage: "bn",
    },
    {
      "@type": "Organization",
      "@id": "https://personalcarebd.com/#org",
      name: "Personal Care BD",
      url: "https://personalcarebd.com",
      description: "Premium intimate care products for Bangladesh",
    },
    {
      "@type": "Product",
      name: "Top Notch Magic Condom (China) - রিইউজেবল ম্যাজিক কনডম",
      description:
        "উচ্চমানের TPE সিলিকন রাবার দিয়ে তৈরি রিইউজেবল ম্যাজিক কনডম। পুরুত্ব ৬ মিমি, দৈর্ঘ্য ৬.৭ ইঞ্চি। ৭০০-৮০০ বার ব্যবহারযোগ্য।",
      brand: { "@type": "Brand", name: "Top Notch" },
      offers: {
        "@type": "Offer",
        price: "899",
        priceCurrency: "BDT",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "Personal Care BD" },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "BDT" },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
        },
      },
    },
  ],
};

import { ReduxProvider } from "@/lib/redux/providers";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ReduxProvider>
          {children}
          <Toaster richColors position="top-center" theme="dark" closeButton />
        </ReduxProvider>
      </body>
    </html>
  );
}


