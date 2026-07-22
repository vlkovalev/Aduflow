import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/for-builders", "/configurator", "/pricing", "/privacy", "/terms"].map((path) => ({ url: `https://aduflow.ca${path}`, lastModified: new Date(), changeFrequency: path ? "monthly" : "weekly", priority: path === "/for-builders" ? 0.9 : path ? 0.7 : 1 }));
}
