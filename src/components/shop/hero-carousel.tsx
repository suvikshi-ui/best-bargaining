import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { getShopSettings } from "@/lib/shop/api";
import { cn } from "@/lib/cn";

/** Default slides (repo product photos); the owner can replace them in studio → Storefront. */
const DEFAULT_SLIDES: { src: string; alt: string }[] = [
  { src: "/products/hero.jpg", alt: "Best Bargain picks" },
  { src: "/products/earbuds.jpg", alt: "Wireless earbuds" },
  { src: "/products/kitchen.jpg", alt: "Kitchen tools" },
  { src: "/products/fabric.jpg", alt: "Fabric" },
];

const INTERVAL_MS = 4000;

/** Auto-sliding photo carousel; pauses on hover/focus; children overlay the slides. */
export function HeroCarousel({ children }: { children?: ReactNode }) {
  const settings = useQuery({ queryKey: ["shop-settings"], queryFn: () => getShopSettings(), staleTime: 60_000 });
  const saved = settings.data?.heroSlides ?? [];
  const HERO_SLIDES = saved.length > 0 ? saved.map((src, i) => ({ src, alt: `Best Bargain photo ${i + 1}` })) : DEFAULT_SLIDES;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = HERO_SLIDES.length;
  const current = index % count;

  useEffect(() => {
    if (paused || count < 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  return (
    <section
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-ink"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        {HERO_SLIDES.map((slide, i) => (
          <img
            key={`${i}-${slide.src.slice(0, 40)}`}
            src={slide.src}
            alt={slide.alt}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            aria-hidden={i !== current}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              i === current ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>
      {children}
      <div className="absolute right-0 bottom-3 left-0 z-10 flex justify-center gap-2">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={`${i}-${slide.src.slice(0, 40)}`}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === current}
            onClick={() => setIndex(i)}
            className={cn("h-2.5 rounded-full transition-all", i === current ? "w-6 bg-white" : "w-2.5 bg-white/50")}
          />
        ))}
      </div>
    </section>
  );
}
