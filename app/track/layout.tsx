import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "অর্ডার ট্র্যাক করুন | Track Your Order | Care Zone BD",
  description:
    "আপনার Care Zone BD অর্ডারের সর্বশেষ স্ট্যাটাস ও ডেলিভারি আপডেট সরাসরি ট্র্যাক করুন। মোবাইল নম্বর বা অর্ডার আইডি দিন।",
  alternates: {
    canonical: "https://carezonebd.store/track",
  },
  openGraph: {
    title: "অর্ডার ট্র্যাকিং | Care Zone BD",
    description: "আপনার অর্ডারের বর্তমান অবস্থা ট্র্যাক করুন — দ্রুত ও নির্ভরযোগ্য ফ্রি হোম ডেলিভারি।",
    url: "https://carezonebd.store/track",
    siteName: "Care Zone BD",
  },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
