import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

// app.use(
//   cors({
//     origin: "*",
//   })
// );

const server = createServer(app);

const io = new Server(server, {
  cors: {
    credentials: false,
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("sent message", (message) => {
	console.log("user sent this message : ",message)
    socket.emit("foward message", message);
  });

  socket.on("disconnect", () => {
    console.log("bye");
  });
  console.log("we have new user");
});

server.listen(4000, () => console.log("serving messges..."));
	