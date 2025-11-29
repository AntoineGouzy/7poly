import { io } from "socket.io-client";

// Connect to server at the same host/port as dev server will proxy /socket.io
const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000')

export default socket;
