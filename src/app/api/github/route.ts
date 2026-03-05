import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        const response = await fetch("https://api.github.com/users/AMALJITH-T/repos?sort=updated&direction=desc&per_page=20", {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Amaljith-Portfolio"
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch repositories" }, { status: response.status });
        }

        const repos = await response.json();
        const formattedRepos = repos
            .filter((repo: any) => !repo.fork) // Focus on original research
            .slice(0, 4)
            .map((repo: any) => ({
                id: repo.id,
                name: repo.name,
                description: repo.description,
                language: repo.language,
                stargazers_count: repo.stargazers_count,
                updated_at: repo.updated_at,
                html_url: repo.html_url
            }));

        return NextResponse.json(formattedRepos);
    } catch (error) {
        // console.error("GitHub Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
