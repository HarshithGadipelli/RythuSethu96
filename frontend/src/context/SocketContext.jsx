import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BASE_URL } from "../api/api";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const backendUrl = BASE_URL;
    const newSocket = io(backendUrl, {
      autoConnect: true,
      reconnection: true
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
