
import { io, type Socket } from "socket.io-client";
import API_BASE_URL from "@/services/api";

let superAdminSocket: Socket | null = null;

export const connectSuperAdminSocket = (token: string): Socket => {
  if (superAdminSocket) {
    superAdminSocket.disconnect();
  }

  superAdminSocket = io(API_BASE_URL, {
    auth: {
      token,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  return superAdminSocket;
};

export const disconnectSuperAdminSocket = () => {
  if (superAdminSocket) {
    superAdminSocket.disconnect();
    superAdminSocket = null;
  }
};
