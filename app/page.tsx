import { AnvilCalculator } from "./components/AnvilCalculator";

// Server component: renders the static page chrome (layered ember glow +
// subtle dot grid background, centred container, footer) and mounts the
// client-side calculator. All interactivity lives inside `<AnvilCalculator />`.

export default function Page() {
    return (
        <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
            <BackgroundLayers />

            <main className="relative max-w-[1440px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
                <AnvilCalculator />

                <footer className="pt-6 border-t border-zinc-900 text-center text-[11px] text-zinc-600 tracking-wide">
                    Recipes &amp; pixel art © their respective mod authors · scraped from
                    the TerraFirmaGreg-Modern serverpack
                </footer>
            </main>
        </div>
    );
}

function BackgroundLayers() {
    return (
        <>
            {/* Warm ember glow at the top — evokes a heated forge */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-x-0 top-0 h-[600px] -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(245,158,11,0.14),transparent_60%)]"
            />
            {/* Cooler steel wash at the bottom */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-x-0 bottom-0 h-[500px] -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(14,165,233,0.05),transparent_60%)]"
            />
            {/* Fine dot pattern for texture without noise */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 opacity-[0.03] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:28px_28px]"
            />
        </>
    );
}
