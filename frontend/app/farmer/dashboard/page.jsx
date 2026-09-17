"use client";

import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("../../../src/views/Farmer/FarmerDashboard"), { ssr: false });

export default function FarmerDashboardPage() {
  return <DynamicComponent />;
}
