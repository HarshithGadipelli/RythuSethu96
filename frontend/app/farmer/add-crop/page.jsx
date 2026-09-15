"use client";

import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("../../../src/views/Farmer/FarmerDashboard"), { ssr: false });

export default function Page() {
  return <DynamicComponent initialTab="add" />;
}
