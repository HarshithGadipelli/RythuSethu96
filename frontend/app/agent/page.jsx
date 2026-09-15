"use client";

import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("../../src/views/Agent/AgentDashboard"), { ssr: false });

export default function Page() {
  return <DynamicComponent  />;
}
