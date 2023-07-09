import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation } from "typeorm";
import { ChatRoom } from "./chat-room.js";
import { ChatCompletionRequestMessage } from "openai";

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  text!: string;

  @Column()
  sender!: string;

  @ManyToOne(type => ChatRoom, chatRoom => chatRoom?.messages, {
    cascade: true
  })
  chatRoom!: Relation<ChatRoom>;

  toChatAiMessage(): ChatCompletionRequestMessage {
    return <ChatCompletionRequestMessage>{
      role: this.sender,
      content: this.text
    }
  }
}
