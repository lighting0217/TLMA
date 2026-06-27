import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import { SOCKET_URL } from "../config";

const SOCKET_CONFIG = {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
};

// กำหนดว่าต้อง Timeout กี่ครั้งถึงจะเปลี่ยนเป็นสีแดง (เช่น 3 ครั้ง = 90 วินาที)
const TIMEOUT_THRESHOLD = 3;

export const useWebSocketPing = (onDataReceived) => {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const onDataReceivedRef = useRef(onDataReceived);
  const [isConnected, setIsConnected] = useState(false);

  // useRef สำหรับเก็บนับจำนวนครั้งที่ Timeout ของแต่ละ IP
  const statusHistory = useRef({}); 

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  // ฟังก์ชันกรองข้อมูล (The Debounce Logic)
  const processData = (newData) => {
    return newData.map((item) => {
      const ip = item.ip;
      
      // ถ้าไม่มีประวัติ IP นี้ ให้สร้างค่าเริ่มต้น
      if (!statusHistory.current[ip]) {
        statusHistory.current[ip] = { count: 0 };
      }

      const history = statusHistory.current[ip];

      if (item.status === "TIMEOUT") {
        history.count += 1; // เพิ่มนับ
        
        // ถ้ายังไม่ถึงเกณฑ์ (3 ครั้ง) ให้ "ตบตา" ว่ายังเป็น ONLINE อยู่
        if (history.count < TIMEOUT_THRESHOLD) {
          return { ...item, status: "ONLINE", ping: "-" }; // Mask it
        }
        return item; // เกินเกณฑ์แล้ว เปลี่ยนเป็น TIMEOUT จริงๆ
      } else {
        // ถ้า ONLINE มา ให้รีเซ็ตตัวนับเป็น 0 ทันที
        history.count = 0;
        return item;
      }
    });
  };

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(SOCKET_URL, SOCKET_CONFIG);

    socketRef.current.on("connect", () => {
      console.log("✅ WebSocket connected to", SOCKET_URL);
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
        // กรองข้อมูลก่อนส่งให้ UI
        const filteredData = processData(data);
        onDataReceivedRef.current(filteredData);
      }
    });

    socketRef.current.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }, []);

  // ... (ส่วนของ disconnect และ useEffect เหมือนเดิม)
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