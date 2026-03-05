import { SiteConfig, SiteSettings, defaultSiteSettings } from "@/lib/types";
import { defaultSiteConfig } from "@/lib/data";

export async function loadSiteConfig(): Promise<SiteConfig> {
    try {
        const res = await fetch("/api/config");
        const data = await res.json();
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("site_config");
            if (stored) return { ...data, ...JSON.parse(stored) };
        }
        return data as SiteConfig;
    } catch {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("site_config");
            if (stored) return { ...defaultSiteConfig, ...JSON.parse(stored) };
        }
        return defaultSiteConfig;
    }
}

export async function loadSiteSettings(): Promise<SiteSettings> {
    try {
        const res = await fetch("/api/site/settings");
        const data = await res.json();
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("site_settings");
            if (stored) return { ...data, ...JSON.parse(stored) };
        }
        return data as SiteSettings;
    } catch {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("site_settings");
            if (stored) return { ...defaultSiteSettings, ...JSON.parse(stored) };
        }
        return defaultSiteSettings;
    }
}
