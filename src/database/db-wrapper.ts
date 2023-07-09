import { DataSource, Repository } from "typeorm";
import { ChatRoom } from "./chat-room.js";
import { Message } from "./message.js";
import { ChatCompletionRequestMessageRoleEnum } from "openai";

export interface IDatabase {
  createChatRoom(name: string): Promise<ChatRoom>;
  getChatRoom(id: number): Promise<ChatRoom | null>;
  addChatRoomMessage(chatroom: ChatRoom, message: Message): Promise<ChatRoom>;
  createMessage(content: string, role: ChatCompletionRequestMessageRoleEnum, chatRoom: ChatRoom): Promise<Message>;
  getMessages(chatRoomId: number): Promise<Message[]>
}

export class DataBaseWrapper implements IDatabase {
  private chatRooms: Repository<ChatRoom>;
  private messages: Repository<Message>;
  constructor(private datasource: DataSource) {
    this.chatRooms = datasource.getRepository(ChatRoom);
    this.messages = datasource.getRepository(Message);
  }

  async createChatRoom(name: string) {
    const chatRoom = new ChatRoom();
    chatRoom.name = name;
    chatRoom.messages = [];
    return await this.datasource.manager.save(chatRoom);
  }

  async getChatRoom(id: number) {
    const chatRoom = await this.chatRooms.find({
      where: { id },
      relations: {
        messages: true
      },
      order: {
        messages: {
          id: "ASC"
        }
      }
    });
    if (chatRoom && chatRoom[0]) {
      return chatRoom[0];
    }
    return null;
  }

  async addChatRoomMessage(chatroom: ChatRoom, message: Message) {
    chatroom.messages.push(message);
    const updated = await this.datasource.manager.save(chatroom);
    return updated;
  }

  async getMessages(chatRoomId: number): Promise<Message[]> {
    try {
      let room = await this.chatRooms.findOneBy({
        id: chatRoomId
      });
      return room?.messages ?? [];
    } catch (error) {
      console.error;
      return [];
    }
  }

  async createMessage(content: string, role: ChatCompletionRequestMessageRoleEnum, chatRoom: ChatRoom) {
    const message = new Message();
    message.text = content;
    message.sender = role;
    message.chatRoom = chatRoom;
    await this.messages.save(message);
    return message;
  }
}