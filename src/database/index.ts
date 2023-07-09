import { DataSource, createConnection } from "typeorm";
import { ChatRoom } from "./chat-room.js";
import { Message } from "./message.js";

export const database = new DataSource({
  type: 'sqlite',
  database: 'ai-chatrooms',
  entities: [ChatRoom, Message],
  synchronize: true
});