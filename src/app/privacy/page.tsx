import { Metadata } from "next";
import Link from "next/link";
import { BackgroundGeometry } from "@/components/ui/BackgroundGeometry";

export const metadata: Metadata = {
    title: "Privacy Policy | Amaljith Nair",
    description: "Privacy policy and data handling information for amaljithnair.com.",
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen pt-32 pb-24 relative overflow-hidden flex flex-col items-center">
            {/* Background elements to match global site aesthetic */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <BackgroundGeometry />
                <div
                    className="absolute inset-x-0 top-0 h-64 opacity-20 pointer-events-none mix-blend-screen"
                    style={{
                        background: "radial-gradient(ellipse at 50% -20%, var(--accent-gold) 0%, transparent 70%)"
                    }}
                />
            </div>

            <div className="max-w-[760px] w-full px-6 flex flex-col relative z-10">
                {/* Header Section */}
                <div className="mb-16">
                    <p className="mono text-[var(--accent-gold)] tracking-[0.2em] mb-4 uppercase text-sm">
                        Legal / Data Handling
                    </p>
                    <h1 className="font-serif text-5xl md:text-6xl text-[var(--text-primary)] font-light tracking-tight">
                        Privacy Policy
                    </h1>
                </div>

                {/* Content Sections */}
                <div className="prose prose-invert prose-p:font-sans prose-p:text-[var(--text-muted)] prose-p:leading-relaxed prose-h2:font-serif prose-h2:font-light prose-h2:text-3xl prose-h2:text-[var(--text-primary)] prose-h2:mt-12 prose-h2:mb-6 prose-a:text-[var(--accent-gold)] prose-a:no-underline hover:prose-a:underline max-w-none">
                    <section>
                        <h2>Introduction</h2>
                        <p>
                            Welcome to <strong>amaljithnair.com</strong>. This website serves as a personal research platform, portfolio, and experimental laboratory operated by Amaljith Nair. I respect your privacy and am committed to ensuring that any data processed through this site is handled transparently and securely.
                        </p>
                    </section>

                    <section>
                        <h2>Information Collection</h2>
                        <p>
                            The site is designed to minimize data footprint. Minimal non-sensitive information may be collected temporarily when you interact with specific components:
                        </p>
                        <ul>
                            <li><strong>Contact Forms:</strong> Basic submission routing data (Name, Email, Message).</li>
                            <li><strong>Chatbot Interactions:</strong> Conversational telemetry bounded entirely to the active session window.</li>
                            <li><strong>Research Commons:</strong> Public research discussion threads or replies you explicitly choose to publish.</li>
                        </ul>
                        <p>
                            This platform <strong>does not</strong> collect, harvest, or request sensitive personal identifying information (PII) beyond what you voluntarily transmit.
                        </p>
                    </section>

                    <section>
                        <h2>AI Processing Disclosure</h2>
                        <p>
                            Some interactive systems on this site, notably the conversational AI chatbot, utilize external intelligence endpoints (such as OpenAI models). Queries typed into these interfaces may be transmitted to these services strictly for the purpose of generating automated reasoning or conversational responses. Please avoid entering deeply personal or confidential data into the public chat instances.
                        </p>
                    </section>

                    <section>
                        <h2>Data Usage</h2>
                        <p>
                            Any information voluntarily submitted by you is used <em>exclusively</em> for the explicit purpose it was provided for — such as responding to contact inquiries or managing research collaboration discussions.
                        </p>
                    </section>

                    <section>
                        <h2>Data Sharing</h2>
                        <p>
                            Personal data submitted through this platform is <strong>never sold, licensed, or shared</strong> with third parties for marketing, advertising, or profiling purposes under any circumstances.
                        </p>
                    </section>

                    <section>
                        <h2>Cookies</h2>
                        <p>
                            This website uses minimal local storage artifacts or cookies strictly for essential technical functionality (such as secure admin session routing or edge rate-limiting protections). No third-party tracking or behavioral advertising cookies are deployed on the public interface.
                        </p>
                    </section>

                    <section>
                        <h2>Contact</h2>
                        <p>
                            If you have questions regarding this policy or the technical handling of data within the platform, please reach out via:
                        </p>
                        <p className="mono font-medium">
                            <a href="mailto:contact@amaljithnair.com">contact@amaljithnair.com</a>
                        </p>
                    </section>

                    {/* Back Navigation */}
                    <div className="mt-20 pt-8 border-t border-[var(--border)]">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm mono text-[var(--accent-gold)] hover:opacity-80 transition-opacity">
                            <span className="text-lg">←</span> Return to Application
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
