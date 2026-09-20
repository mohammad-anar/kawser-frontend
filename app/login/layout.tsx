import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "কাস্টমার লগইন | Customer Login | Care Zone BD",
  description:
    "Care Zone BD একাউন্টে লগইন করে পূর্ববর্তী অর্ডার ও প্রোফাইল বিস্তারিত দেখুন।",
  alternates: {
    canonical: "https://carezonebd.store/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
