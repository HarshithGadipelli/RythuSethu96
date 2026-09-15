"use client";

import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("../../src/views/Admin/AdminDashboard"), { ssr: false });

export default function Page() {
  return <DynamicComponent  />;
}
