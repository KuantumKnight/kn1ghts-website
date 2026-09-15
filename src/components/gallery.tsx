"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { useState } from "react";
import Image from "next/image";
import type { TeamPostMedia } from "@/lib/types";

export function Gallery({ images }: { images: TeamPostMedia[] }) {
  const [active, setActive] = useState<number | null>(null);
  const image = active === null ? null : images[active];
  function step(direction: -1 | 1) { setActive((current) => current === null ? 0 : (current + direction + images.length) % images.length); }
  return <><div className={images.length === 1 ? "post-gallery single" : "post-gallery"}>{images.map((item, index) => <button key={item.id} type="button" onClick={() => setActive(index)} aria-label={`Enlarge: ${item.altText}`}><Image src={item.url} alt={item.altText} width={item.width} height={item.height} sizes={images.length === 1 ? "100vw" : "(max-width: 600px) 100vw, 50vw"} priority={index < 2} /><span>{String(index + 1).padStart(2, "0")}</span></button>)}</div><Dialog.Root open={active !== null} onOpenChange={(open) => !open && setActive(null)}><Dialog.Portal><Dialog.Overlay className="gallery-overlay" /><Dialog.Content className="gallery-dialog" onKeyDown={(event) => { if (event.key === "ArrowLeft") step(-1); if (event.key === "ArrowRight") step(1); }}><Dialog.Title className="sr-only">Image gallery</Dialog.Title>{image ? <figure><Image src={image.url} alt={image.altText} width={image.width} height={image.height} sizes="90vw" /><figcaption>{image.caption ?? image.altText}</figcaption></figure> : null}<Dialog.Close className="gallery-close" aria-label="Close gallery"><X /></Dialog.Close>{images.length > 1 ? <><button className="gallery-previous" onClick={() => step(-1)} aria-label="Previous photo"><ArrowLeft /></button><button className="gallery-next" onClick={() => step(1)} aria-label="Next photo"><ArrowRight /></button></> : null}</Dialog.Content></Dialog.Portal></Dialog.Root></>;
}
