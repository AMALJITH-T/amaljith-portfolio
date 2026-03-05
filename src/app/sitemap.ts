import { MetadataRoute } from "next";

export const revalidate = 86400; // Cache for 24 hours

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://amaljithnair.com";

    const routes = [
        "",
        "/work",
        "/research",
        "/curiosity",
        "/commons",
        "/signal",
        "/privacy",
    ];

    const sitemapEntries: MetadataRoute.Sitemap = routes.map((route) => {
        let priority = 0.8;
        let changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" = "weekly";

        // Assign higher priority to key landing pages
        if (route === "") {
            priority = 1.0;
        } else if (route === "/work" || route === "/research") {
            priority = 0.9;
        } else if (route === "/privacy") {
            priority = 0.5;
            changeFrequency = "yearly";
        }

        return {
            url: `${baseUrl}${route}`,
            lastModified: new Date(),
            changeFrequency,
            priority,
        };
    });

    return sitemapEntries;
}
