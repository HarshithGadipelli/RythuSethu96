"use client";

import dynamic from "next/dynamic";

// Force CSR (Client-Side Rendering) to prevent Leaflet, Socket.io, and React Router from crashing on the server
const ClientAppWrapper = dynamic(() => import("../ClientAppWrapper"), {
  ssr: false,
});

export default function Page() {
  return <ClientAppWrapper />;
}
