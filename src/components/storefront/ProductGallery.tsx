"use client";

import { useState } from "react";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] || "";

  return (
    <div>
      <div className="relative aspect-square overflow-hidden border border-border bg-surface">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl text-muted">🛍️</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`صورة ${index + 1}`}
              className={`aspect-square overflow-hidden border bg-surface transition-colors ${
                active === index ? "border-foreground" : "border-border hover:border-foreground/40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
