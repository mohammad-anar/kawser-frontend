import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "কাস্টমার লগইন | Customer Login",
  description:
    "SelfCare Solution একাউন্টে লগইন করে পূর্ববর্তী অর্ডার ও প্রোফাইল বিস্তারিত দেখুন।",
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
