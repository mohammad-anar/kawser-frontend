import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/checkout", "/account", "/api/", "/admin/", "/admin"],
      },
    ],
    sitemap: "https://www.selfcaresolution.online/sitemap.xml",
  };
}

