import { ChatCompletionRequestMessage, OpenAIApi } from 'openai';
import { IDatabase } from './database/db-wrapper.js';
import { ChatRoom } from './database/chat-room.js';
import { Message } from './database/message.js';

const DEFAULT_MODEL = 'gpt-4-0613';

export class AIWrapper {
  model = DEFAULT_MODEL;

  constructor(private ai: OpenAIApi, private assistant: ChatRoom, private database: IDatabase) {
  }

  static async GetAIAssistant(ai: OpenAIApi, database: IDatabase, assistantId: number) {
    try {
      const assistant = await database.getChatRoom(assistantId);
      if (assistant) {
        return new AIWrapper(ai, assistant, database);
      }
      throw new Error('Could not find assistant');
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static async CreateAiAssistant(ai: OpenAIApi, database: IDatabase, assistantId?: number, prompt?: string): Promise<AIWrapper | null> {
    try {
      if (!!assistantId) {
        return AIWrapper.GetAIAssistant(ai, database, assistantId) ?? AIWrapper.CreateAiAssistant(ai, database);
      }
      const name = await AIWrapper.GenerateChatRoomName(ai, prompt);
      const assistant = await database.createChatRoom(name);
      return new AIWrapper(ai, assistant!, database);
    } catch (error) {
      console.error('Error: ', error);
      return null;
    }
  }

  private static async GenerateChatRoomName(ai: OpenAIApi, prompt?: string) {
    if (!prompt) {
      return "Chat Room";
    }

    try {
      const response = await ai.createChatCompletion({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Generate a chat room name based on the following prompt within angle brackets: <${prompt}>`
          }
        ]
      });

      return response.data.choices[0].message?.content ?? 'Chat Room';
    } catch (error) {
      return "Chat Room";
    }
  }

  async askAI(message: string) {
    try {
      const dbMessage = await this.database.createMessage(message, 'user', this.assistant);
      this.assistant = await this.database.addChatRoomMessage(this.assistant, dbMessage);
      const messages = this.assistant.messages.map(message => message.toChatAiMessage());
      const response = await this.ai.createChatCompletion({
        model: this.model,
        messages
      })
      const responseMessage = response.data.choices[0].message;
      if (!responseMessage?.content) {
        throw "No Response";
      }
      const newAiMessage = await this.database.createMessage(responseMessage.content, 'assistant', this.assistant);
      this.assistant = await this.database.addChatRoomMessage(this.assistant, newAiMessage);

      return newAiMessage;

    } catch (error) {
      console.error(error);
      return { text: 'System Error. Try again.', sender: 'system', id: 0 } as Partial<Message>;
    }
  }
}