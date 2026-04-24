"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Pixel-art item sprite with graceful 404 fallback. When the underlying
 * image fails to load we show a neutral "?" tile of the same size so layout
 * doesn't shift. We disable Next's image optimiser because the icons are
 * already tiny and benefit from nearest-neighbour scaling.
 */
export function ItemIcon({
    src,
    alt,
    size = 40,
    className = "",
}: {
    src: string;
    alt: string;
    size?: number;
    className?: string;
}) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <div
                className={`inline-flex items-center justify-center rounded-sm bg-zinc-800/80 text-zinc-500 text-[10px] font-mono border border-zinc-700 ${className}`}
                style={{ width: size, height: size }}
                aria-label={alt}
                title={alt}
            >
                ?
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={size}
            height={size}
            unoptimized
            onError={() => setFailed(true)}
            className={className}
            style={{ imageRendering: "pixelated" }}
        />
    );
}
