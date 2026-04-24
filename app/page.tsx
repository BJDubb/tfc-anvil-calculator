import { AnvilCalculator } from "./components/AnvilCalculator";

// Server component: renders the static page chrome (gradient background,
// centred container, footer) and mounts the client-side calculator in the
// middle. All interactivity lives inside `<AnvilCalculator />`.

export default function Page() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-100">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                <AnvilCalculator />
            </div>
        </div>
    );
}
