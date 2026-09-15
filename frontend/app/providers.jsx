"use client";

import dynamic from "next/dynamic";

const ClientAppShell = dynamic(() => import("./ClientAppShell"), { ssr: false });

export function Providers({ children }) {
  return <ClientAppShell>{children}</ClientAppShell>;
}
