import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { readFile, writeFile } from "node:fs/promises";

const app = express();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    credentials: false,
    origin: "*",
  },
});

type RoomT =
  | {
      [key: string]: { message: string }[];
    }
  | {};

async function writeMessagesToRoom(msg: string, room: string, roomData: RoomT) {
  const options = {
    flag: "w",
  };

  if (!roomData || !Object.keys(roomData).length) {
    await writeFile(
      "messages.json",
      JSON.stringify({
        [room]: [{ message: msg }],
      }),
      options
    );
  } else {
    const registredMessages = roomData[room];

    if (!registredMessages || !Object.keys(registredMessages).length) {
      await writeFile(
        "messages.json",
        JSON.stringify({
          ...roomData,

          [room]: [{ message: msg }],
        }),
        options
      );
    } else {
      const data = JSON.stringify({
        ...roomData,
        [room]: [...registredMessages, { message: msg }],
      });
      await writeFile("messages.json", data, options);
    }
  }
}
async function readAllMessages() {
  try {
    const file = await readFile("messages.json", { flag: "r" });
    const content = JSON.parse(file.toString());
    return content;
  } catch (error) {
    console.log(error);
  }
}

async function readAllMessagesOfRoom(room: string) {
  try {
    const file = await readFile("messages.json", { flag: "r" });
    const messages = JSON.parse(file.toString());
    return messages[room];
  } catch (error) {
    console.log(error);
  }
}

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("room:join", async (roomName) => {
    socket.join(roomName);

    console.log(socket.handshake.auth, "joined", roomName);

    const roomMessages = await readAllMessagesOfRoom(roomName);
    io.to(roomName).emit("room:chat", roomMessages);
  });

  socket.on("room:message", async (message, room) => {
    const rooms = Array.from(socket.rooms);
    console.log(rooms);
    if (!rooms.includes(room)) {
      socket.emit("error", {
        message: ` "${socket.id} cannot send to this channel until you join " ${room}`,
      });
      return;
    }

    const allMessages = await readAllMessages();
    await writeMessagesToRoom(message, room, allMessages);
    const roomMessages = await readAllMessagesOfRoom(room);
    console.log(roomMessages);
    io.to(room).emit("room:chat", roomMessages);
  });

  socket.on("room:leave", (room) => {
    console.log(socket.handshake.auth, "leave", room);

    socket.leave(room);
  });

  socket.on("disconnect", () => {
    console.log("bye user", socket.id);
  });
});

server.listen(4000, () => console.log("serving messges..."));
