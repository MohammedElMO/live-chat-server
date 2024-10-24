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
      roomName: { message: string }[];
    }
  | null
  | undefined;


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
    console.log("coontent ", content);
    return content;
  } catch (error) {
    console.log(error);
  }
}

io.on("connection", (socket) => {
  socket.on("join room", async (room) => {
    const data: RoomT = await readAllMessages();
    socket.join(room);
    if (data && !Object.keys(data).length) {
      socket.emit("join", []);
    } else {
      if (data) {
        socket.emit("join", data[room]);
      }
    }
  });

  socket.on("sent message", async (message, roomName) => {
    try {
      const file = await readFile("messages.json", { flag: "r" });
      const content = JSON.parse(file.toString());
      console.log("coontent ", content);
      await writeMessagesToRoom(message, roomName, content);
    } catch (error) {
      console.log(error);
    }

    io.to(roomName).emit("foward message", message);
  });

  socket.on("disconnect", () => {
    console.log("bye");
  });
  console.log("we have new user");
});

server.listen(4000, () => console.log("serving messges..."));
