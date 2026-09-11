import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "অর্ডার ট্র্যাক করুন | Track Your Order",
  description:
    "আপনার সেলফ কেয়ার সলিউশন অর্ডারের সর্বশেষ স্ট্যাটাস ও ডেলিভারি আপডেট সরাসরি ট্র্যাক করুন। ফোন নম্বর বা অর্ডার আইডি দিন।",
  alternates: {
    canonical: "https://www.selfcaresolution.online/track",
  },
  openGraph: {
    title: "অর্ডার ট্র্যাকিং | SelfCare Solution",
    description: "আপনার অর্ডারের বর্তমান অবস্থা ট্র্যাক করুন — দ্রুত ও নির্ভরযোগ্য হোম ডেলিভারি।",
    url: "https://www.selfcaresolution.online/track",
  },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
