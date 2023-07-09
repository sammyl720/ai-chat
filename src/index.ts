import express from "express";
import 'dotenv/config';
import { ROOT_DIRECTORY } from "./config.js";
import path from "path";
import { Configuration, OpenAIApi } from "openai";
import { AIWrapper } from "./ai.js";
import { database } from "./database/index.js";
import { ChatRoom } from "./database/chat-room.js";
import { DataBaseWrapper } from "./database/db-wrapper.js";
import { Message } from "./database/message.js";
import { marked } from 'marked';

const PORT = process.env.PORT || 3000;
const app = express();

const dbWrapper = new DataBaseWrapper(database);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
app.use(express.json());

app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const id = parseInt(roomId);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Expected query param roomId' });
    }
    const messages = await database.getRepository(Message).find({
      where: {
        chatRoom: {
          id
        }
      },
      order: {
        id: "ASC"
      }
    });
    return res.json(messages.map(message => ({
      ...message,
      text: marked.parse(message.text)
    })))
  } catch (error) {
    console.error(error);
    return res.json([]);
  }
})
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await database.getRepository(ChatRoom).find({
      order: {
        id: "ASC",
        messages: {
          id: "ASC"
        }
      }
    });
    return res.json(rooms)
  } catch (error) {
    return [];
  }
})

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await database.getRepository(Message).find({
      relations: {
        chatRoom: true
      }
    });
    return res.json(messages)
  } catch (error) {

  }
})

app.post('/api', async (req, res) => {
  let { prompt, assistantId } = req.body as { prompt?: string, assistantId?: number };
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).send('Inproper format');
  }

  assistantId = !!assistantId ? Number(assistantId) : undefined;
  const aiWrapper = await AIWrapper.CreateAiAssistant(openai, dbWrapper, assistantId, prompt);
  const responseMessage = await aiWrapper?.askAI(prompt);
  return res.json({ answer: { text: marked.parse(responseMessage?.text ?? ''), assistantId: responseMessage?.chatRoom?.id } })
})

app.use(express.static(path.join(ROOT_DIRECTORY, 'public')))
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await database.initialize();
    console.log('Database initialized')
  } catch (error) {
    console.log('Database error: ', error)
  }
})