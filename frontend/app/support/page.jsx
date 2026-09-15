"use client";

import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("../../src/views/Support/Support"), { ssr: false });

export default function Page() {
  return <DynamicComponent  />;
}
