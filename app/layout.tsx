import type { Metadata, Viewport } from "next";
import "./globals.css";

// Extend Window interface for Meta Pixel
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

export const viewport: Viewport = {
  themeColor: "#06060e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.selfcaresolution.online"),
  title: {
    default: "টপ নচ ম্যাজিক কনডম বাংলাদেশ | Magic Condom Price in BD ৳৮৯৯ | SelfCare Solution",
    template: "%s | SelfCare Solution",
  },
  description:
    "বাংলাদেশে অরিজিনাল টপ নচ ম্যাজিক কনডম মাত্র ৳৮৯৯। রিইউজেবল সফট সিলিকন, ৭০০-৮০০ বার ব্যবহারযোগ্য ও ওয়াশেবল। সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি এবং ১০০% গোপনীয় প্যাকেজিং।",
  keywords: [
    // Primary Bangla Keywords
    "ম্যাজিক কনডম",
    "ম্যাজিক কনডম বাংলাদেশ",
    "ম্যাজিক কনডমের দাম কত",
    "টপ নচ ম্যাজিক কনডম",
    "টপ নচ কনডম",
    "অরিজিনাল ম্যাজিক কনডম",
    "সিলিকন রিইউজেবল কনডম",
    "পুনঃব্যবহারযোগ্য কনডম",
    "চায়না ম্যাজিক কনডম",
    "ওয়াশেবল কনডম",
    "সেলফ কেয়ার সলিউশন",
    "সেলফকেয়ার সলিউশন",
    "কনডম দাম বাংলাদেশ",
    "ক্যাশ অন ডেলিভারি কনডম",
    "গোপনীয় প্যাকেজিং কনডম",
    "সেরা কনডম বাংলাদেশ",
    "মিলনের সময় বাড়ানোর কনডম",
    "পুরুষদের পার্সোনাল কেয়ার",
    // Primary English / Banglish Keywords
    "magic condom",
    "magic condom bangladesh",
    "magic condom price in bd",
    "magic condom price in bangladesh",
    "top notch magic condom",
    "reusable condom bd",
    "silicone condom sleeve",
    "washable condom bangladesh",
    "selfcare solution",
    "self care solution bd",
    "buy condom online bangladesh",
    "delay condom bangladesh",
    "dotted condom bd",
    "discreet packaging condom",
    "cash on delivery condom bd",
  ],
  authors: [{ name: "SelfCare Solution", url: "https://www.selfcaresolution.online" }],
  creator: "SelfCare Solution",
  publisher: "SelfCare Solution",
  formatDetection: {
    telephone: true,
    address: true,
    email: false,
  },
  openGraph: {
    title: "টপ নচ ম্যাজিক কনডম বাংলাদেশ | মাত্র ৳৮৯৯ | SelfCare Solution",
    description:
      "বাংলাদেশে অরিজিনাল টপ নচ ম্যাজিক কনডম মাত্র ৳৮৯৯। রিইউজেবল সফট সিলিকন, ৭০০-৮০০ বার ব্যবহারযোগ্য। সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি।",
    url: "https://www.selfcaresolution.online",
    siteName: "SelfCare Solution",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SelfCare Solution - টপ নচ ম্যাজিক কনডম বাংলাদেশ",
      },
    ],
    locale: "bn_BD",
    alternateLocale: ["en_US"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "টপ নচ ম্যাজিক কনডম বাংলাদেশ | SelfCare Solution",
    description: "বাংলাদেশে অরিজিনাল রিইউজেবল সিলিকন ম্যাজিক কনডম মাত্র ৳৮৯৯। সারাদেশে ফ্রি ক্যাশ অন ডেলিভারি।",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://www.selfcaresolution.online",
    languages: {
      "bn-BD": "https://www.selfcaresolution.online",
      "en-US": "https://www.selfcaresolution.online",
    },
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
  category: "Intimate Care & Health",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.selfcaresolution.online/#website",
      url: "https://www.selfcaresolution.online",
      name: "SelfCare Solution",
      description: "বাংলাদেশের বিশ্বস্ত অনলাইন শপ - অরিজিনাল টপ নচ ম্যাজিক কনডম ও পার্সোনাল কেয়ার সামগ্রী",
      inLanguage: ["bn", "en"],
      publisher: {
        "@id": "https://www.selfcaresolution.online/#org",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://www.selfcaresolution.online/#org",
      name: "SelfCare Solution",
      url: "https://www.selfcaresolution.online",
      logo: {
        "@type": "ImageObject",
        url: "https://www.selfcaresolution.online/images/selfcaresolution2.PNG",
        width: 200,
        height: 100,
      },
      description: "Official online store for authentic intimate care and personal wellness products in Bangladesh.",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+8801932787942",
        contactType: "customer service",
        areaServed: "BD",
        availableLanguage: ["Bengali", "English"],
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.selfcaresolution.online/#breadcrumbs",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.selfcaresolution.online",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "টপ নচ ম্যাজিক কনডম",
          item: "https://www.selfcaresolution.online/#product",
        },
      ],
    },
    {
      "@type": "Product",
      "@id": "https://www.selfcaresolution.online/#product",
      name: "Top Notch Magic Condom (China) - অরিজিনাল রিইউজেবল সিলিকন ম্যাজিক কনডম",
      image: [
        "https://www.selfcaresolution.online/images/products/product-main.jpg",
        "https://www.selfcaresolution.online/images/products/product-1.webp",
        "https://www.selfcaresolution.online/images/products/product-2.webp",
      ],
      description:
        "উচ্চমানের মেডিকেল-গ্রেড TPE সিলিকন দিয়ে তৈরি রিইউজেবল ম্যাজিক কনডম। পুরুত্ব ৬ মিমি, দৈর্ঘ্য ৬.৭ ইঞ্চি। ডটেড সারফেস ও ডাবল লক রিং সিস্টেম সহ ৭০০-৮০০ বার ব্যবহারযোগ্য ও ওয়াশেবল।",
      brand: { "@type": "Brand", name: "Top Notch" },
      category: "Intimate Care / Personal Wellness",
      sku: "SC-TNC-01",
      mpn: "SC-TNC-01",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "128",
        bestRating: "5",
        worstRating: "1",
      },
      review: [
        {
          "@type": "Review",
          author: { "@type": "Person", name: "মোঃ রফিকুল ইসলাম" },
          datePublished: "2026-03-01",
          reviewBody: "প্যাকেজিং খুবই গোপনীয় ছিল, ডেলিভারি ম্যান কিছুই বুঝতে পারেনি। প্রোডাক্টের কোয়ালিটি অসাধারণ।",
          reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
        },
        {
          "@type": "Review",
          author: { "@type": "Person", name: "তানভীর আহমেদ" },
          datePublished: "2026-03-05",
          reviewBody: "ম্যাটেরিয়াল অনেক সফট ও কম্ফোর্টেবল। ১০০% জেনুইন মাল পেয়েছি।",
          reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
        },
      ],
      offers: {
        "@type": "Offer",
        price: "899",
        priceCurrency: "BDT",
        availability: "https://schema.org/InStock",
        url: "https://www.selfcaresolution.online",
        priceValidUntil: "2027-12-31",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "SelfCare Solution" },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "BDT" },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
          },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "BD",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 3,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/FreeReturn",
        },
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.selfcaresolution.online/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "কিভাবে ব্যবহার করবেন?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "কনডমের সামনের ফুটোতে পুরুষাঙ্গ ঢুকিয়ে নিচের ফুটোতে পুরুষাঙ্গের থলিটি আটকে রাখবেন। ব্যবহারের পর ভালো ভাবে সাবান এবং পানি দিয়ে ধুয়ে রেখে দিতে হবে।",
          },
        },
        {
          "@type": "Question",
          name: "ম্যাজিক কনডমের সুবিধা কি কি?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "টপ নচ কোয়ালিটি পাবেন, ৭০০-৮০০ বার রিইউজেবল, এক মাসের মধ্যে ছিঁড়ে গেলে ৫০% ডিসকাউন্টে নতুন পাবেন।",
          },
        },
        {
          "@type": "Question",
          name: "প্রোডাক্ট পছন্দ না হলে কি করব?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "প্রোডাক্ট ১০০% দেখানো মতো হওয়ার পরও যদি পছন্দ না হয়, তবে ডেলিভারি চার্জ দিয়ে সহজে রিটার্ন করে দিতে পারবেন।",
          },
        },
        {
          "@type": "Question",
          name: "ডেলিভারি হতে কত দিন লাগে?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ঢাকার মধ্যে ১ দিন, ঢাকার পাশে ২ দিন এবং ঢাকার বাইরে ৩ দিন সময় লাগে।",
          },
        },
        {
          "@type": "Question",
          name: "কত কত সাইজ পাওয়া যায়?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "আপনার সাইজ ৩, ৪, ৫ বা ৬ ইঞ্চি যাই হোক না কেন, এটি উচ্চ স্থিতিস্থাপক সিলিকন হওয়ায় সবার সাইজে নিখুঁতভাবে ফিট হয়।",
          },
        },
        {
          "@type": "Question",
          name: "গোপনীয়তা রক্ষা করা হয় কি?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "১০০% গোপনীয় প্যাকেজিংয়ে পণ্য ডেলিভারি করা হয়। প্যাকেটের উপর কোনো প্রোডাক্টের নাম বা আপত্তিকর ছবি থাকে না।",
          },
        },
      ],
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

        {/* ===== Meta Pixel ===== */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '2477817319364552');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2477817319364552&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* ===== End Meta Pixel ===== */}
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
