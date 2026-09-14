"use client";

import React, { useEffect, useState } from "react";
import App from "../src/App";

export default function ClientAppWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Avoid hydration mismatch on initial render

  return <App />;
}
