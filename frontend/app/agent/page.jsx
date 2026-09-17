"use client";

import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("../../src/views/Agent/AgentDashboard"), { ssr: false });

export default function Page() {
  return (
    <div className="page-wrapper fade-in" style={{ padding: "1.5rem 1rem", maxWidth: "1280px", margin: "0 auto" }}>
      <DynamicComponent  />
    </div>
  );
}
