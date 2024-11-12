import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { readFile, writeFile } from "node:fs/promises";
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

  socket.on("room:join", (roomName) => {
    console.log("joined");
    const currentRoom = Array.from(socket.rooms)[0];
    console.log(currentRoom); // this is a hash
        if (currentRoom && currentRoom !== roomName) {
          socket.leave(roomName);
        }
    socket.join(roomName);
    console.log(socket.handshake.auth, "joined", roomName);
  });

  socket.on("room:message", async (message) => {
    const currentRoom = Array.from(socket.rooms)[0];

    console.log({ message, currentRoom });

    socket.to(currentRoom).emit("room:chat", message);
  });

  socket.on("room:leave", (room) => {
    console.log(socket.handshake.auth, "leave", room);

    socket.leave(room);
  });
  console.log(socket.handshake.auth);

  //   socket.on("join room", async (room) => {
  //     socket.join(room);
  //     const messages: RoomT = await readAllMessages();
  //     if (!Object.keys(messages[room] || {}).length) {
  //       socket.emit("joined", []);
  //     } else {
  //       socket.emit("joined", messages[room]);
  //     }
  //   });

  //   socket.on("sent message", async (message, roomName) => {
  //     try {
  //       const file = await readFile("messages.json", { flag: "r" });
  //       const content = JSON.parse(file.toString());
  //       await writeMessagesToRoom(message, roomName, content);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //     const uniqueMessages = await readAllMessagesOfRoom(roomName);
  //     io.to(roomName).emit("forward message", uniqueMessages);
  //   });

  socket.on("disconnect", () => {
    console.log("bye user", socket.id);
  });
});

server.listen(4000, () => console.log("serving messges..."));
