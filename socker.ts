import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

const server = createServer(app);

const io = new Server(server);


io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("bye");
  });
  console.log("we have new user");
});

server.listen(2024, () => console.log("serving messges..."));
