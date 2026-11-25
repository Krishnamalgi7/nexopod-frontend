
"use client";

import { useEffect, useState } from "react";

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  className,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <img
      src={hasError || !src ? "/FallBack.png" : src}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true);
        }
      }}
    />
  );
}
