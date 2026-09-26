import * as React from "react";

/** The moving wordmark that ends every public page. Decorative: hidden from assistive technology. */
export function WordmarkMarquee() {
  return (
    <div className="v9-wordmark-marquee" aria-hidden="true">
      <div className="v9-wordmark-track">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>Threadline</span>
        ))}
      </div>
    </div>
  );
}
