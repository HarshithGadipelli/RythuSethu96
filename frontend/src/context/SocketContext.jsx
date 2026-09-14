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
    const isVercel = window.location.hostname.includes("vercel.app");
    const defaultSocket = isVercel ? "https://rythusethu96.onrender.com" : BASE_URL;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || defaultSocket;
    const newSocket = io(socketUrl, {
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
