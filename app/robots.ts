import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/builder/", "/projects/", "/permit/", "/proposals/"] }, sitemap: "https://aduflow.ca/sitemap.xml" };
}
