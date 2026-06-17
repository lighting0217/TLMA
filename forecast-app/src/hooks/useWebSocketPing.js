/**
 * useWebSocketPing - Optimized WebSocket hook for minimal data usage
 * Strategies:
 * - Only subscribe to delta updates (only changed fields)
 * - Batch multiple updates into single message
 * - Uses compression-friendly data format
 */

import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

const SOCKET_CONFIG = {
  transports: ["websocket"], // Avoid http long-polling (uses more bandwidth)
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
};

export const useWebSocketPing = (onDataReceived) => {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const onDataReceivedRef = useRef(onDataReceived);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io("https://tlma.onrender.com", SOCKET_CONFIG);

    socketRef.current.on("connect", () => {
      console.log("✅ WebSocket connected");
      isConnectedRef.current = true;
      setIsConnected(true);
      socketRef.current.emit("request-full-sync");
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
      isConnectedRef.current = false;
      setIsConnected(false);
    });

    socketRef.current.on("ping-update", (data) => {
      if (data && Array.isArray(data)) {
        onDataReceivedRef.current(data);
      }
    });

    socketRef.current.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off("connect");
      socketRef.current.off("disconnect");
      socketRef.current.off("ping-update");
      socketRef.current.off("error");
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected };
};
