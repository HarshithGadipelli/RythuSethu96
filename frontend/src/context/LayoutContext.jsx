import { createContext, useContext, useState, useEffect } from "react";

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [layoutMode, setLayoutModeState] = useState(() => {
    return localStorage.getItem("rs_device_layout_mode") || "auto";
  });

  const setLayoutMode = (mode) => {
    setLayoutModeState(mode);
    try {
      localStorage.setItem("rs_device_layout_mode", mode);
    } catch (e) {
      console.warn("Could not persist device layout mode to localStorage", e);
    }
  };

  useEffect(() => {
    document.body.classList.remove(
      "force-mobile-mode",
      "force-desktop-mode",
      "device-auto",
      "device-mobile",
      "device-tablet",
      "device-desktop"
    );

    document.body.classList.add(`device-${layoutMode}`);

    if (layoutMode === "mobile") {
      document.body.classList.add("force-mobile-mode");
    } else if (layoutMode === "tablet") {
      document.body.classList.add("force-tablet-mode");
    } else if (layoutMode === "desktop") {
      document.body.classList.add("force-desktop-mode");
    }
  }, [layoutMode]);

  return (
    <LayoutContext.Provider value={{ 
      layoutMode, 
      setLayoutMode, 
      deviceMode: layoutMode, 
      setDeviceMode: setLayoutMode 
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}

