import { productSrcSet } from "@/core/lib/image-display";

export function ContentImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
  width,
  height,
  draggable,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  draggable?: boolean;
}) {
  const srcSet = sizes ? productSrcSet(src) : null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      srcSet={srcSet ?? undefined}
      sizes={srcSet ? sizes : undefined}
      className={className}
      width={width}
      height={height}
      draggable={draggable}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
