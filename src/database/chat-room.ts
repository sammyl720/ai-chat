import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Message } from "./message.js";

@Entity()
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => Message, message => message.chatRoom)
  messages!: Message[];
}
