import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "রেজিস্ট্রেশন | Register New Account",
  description:
    "SelfCare Solution-এ নতুন একাউন্ট খুলুন এবং সহজ ও দ্রুত অর্ডারের সুবিধা উপভোগ করুন।",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
