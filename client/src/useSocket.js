import { io } from "socket.io-client";

// Connect to server at the same host/port as dev server will proxy /socket.io
const socket = io("/", { path: "/socket.io" });

export default socket;
