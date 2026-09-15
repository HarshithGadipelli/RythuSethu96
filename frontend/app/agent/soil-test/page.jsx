"use client";

import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("../../../src/views/Agent/SoilTestAgentPortal"), { ssr: false });

export default function Page() {
  return <DynamicComponent  />;
}
