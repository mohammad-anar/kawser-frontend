import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Care Zone BD - টপ নচ ম্যাজিক কনডম",
    short_name: "Care Zone BD",
    description: "বাংলাদেশে সেরা রিইউজেবল সিলিকন ম্যাজিক কনডম ও পার্সোনাল কেয়ার সামগ্রী। মাত্র ৳৮৯৯ টাকায় ফ্রি হোম ডেলিভারি।",
    start_url: "/",
    display: "standalone",
    background_color: "#080817",
    theme_color: "#2563EB",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
