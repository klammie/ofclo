// lib/hooks/useSocket.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "@/lib/auth/client";

type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

type UseSocketReturn = {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (toUserId: string, content: string) => void;
  markAsRead: (otherUserId: string) => void;
  startTyping: (toUserId: string) => void;
  stopTyping: (toUserId: string) => void;
};

export function useSocket(): UseSocketReturn {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    console.log("[useSocket] Initializing socket connection...");

    // Initialize socket connection
    const socket = io({
      path: "/api/socket/io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on("connect", () => {
      console.log("[useSocket] Connected to socket server");
      setIsConnected(true);
      
      // Authenticate with user ID
      socket.emit("authenticate", session.user.id);
    });

    socket.on("authenticated", (data) => {
      console.log("[useSocket] Authenticated as:", data.userId);
    });

    socket.on("disconnect", () => {
      console.log("[useSocket] Disconnected from socket server");
      setIsConnected(false);
    });

    socket.on("connect_error", async (error) => {
      console.error("[useSocket] Connection error:", error.message);
      
      // Try to initialize the server
      try {
        await fetch("/api/socket");
        socket.connect();
      } catch (err) {
        console.error("[useSocket] Failed to initialize socket server");
      }
    });

    socket.on("error", (error) => {
      console.error("[useSocket] Socket error:", error);
    });

    // Cleanup
    return () => {
      console.log("[useSocket] Cleaning up socket connection");
      socket.off("connect");
      socket.off("authenticated");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("error");
      socket.disconnect();
    };
  }, [session?.user?.id]);

  // Send message
  const sendMessage = useCallback((toUserId: string, content: string) => {
    if (!socketRef.current || !session?.user?.id) {
      console.error("[useSocket] Cannot send message: not connected or not authenticated");
      return;
    }

    console.log("[useSocket] Sending message to:", toUserId);
    
    socketRef.current.emit("send_message", {
      fromUserId: session.user.id,
      toUserId,
      content,
    });
  }, [session?.user?.id]);

  // Mark messages as read
  const markAsRead = useCallback((otherUserId: string) => {
    if (!socketRef.current || !session?.user?.id) return;

    socketRef.current.emit("mark_read", {
      userId: session.user.id,
      otherUserId,
    });
  }, [session?.user?.id]);

  // Typing indicators
  const startTyping = useCallback((toUserId: string) => {
    if (!socketRef.current || !session?.user?.id) return;

    socketRef.current.emit("typing_start", {
      fromUserId: session.user.id,
      toUserId,
    });
  }, [session?.user?.id]);

  const stopTyping = useCallback((toUserId: string) => {
    if (!socketRef.current || !session?.user?.id) return;

    socketRef.current.emit("typing_stop", {
      fromUserId: session.user.id,
      toUserId,
    });
  }, [session?.user?.id]);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  };
}