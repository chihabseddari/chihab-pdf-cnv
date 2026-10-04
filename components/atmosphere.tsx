"use client";

import { usePathname } from "next/navigation";

export function Atmosphere() {
  const pathname = usePathname();
  const quiet = pathname.startsWith("/studio");

  return (
    <div className={quiet ? "atmosphere atmosphere-quiet" : "atmosphere"} aria-hidden="true">
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
    </div>
  );
}
