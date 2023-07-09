const outputElement = document.querySelector('#output');
const inputElement = document.querySelector('#prompt-input');
const btnElement = document.querySelector('#prompt-btn');
const chatRoomsElement = document.querySelector(".chatrooms");
const newChatBtn = document.querySelector('.chat.new-chat');
const toggleChatBtn = document.querySelector('.toggle-chat-icon');
const contentContainer = document.querySelector('.page-container');

const ROOT_API_ENDPOINT = '/api';
let currentRoomId = null;

window.addEventListener('DOMContentLoaded', async () => {
  const rooms = await getChatRooms();
  rooms.forEach(room => {
    const roomLabel = createChatRoomLabel(room);
    roomLabel.addEventListener('click', getRoomClickListener(room.id));
    chatRoomsElement.appendChild(roomLabel);
  });
})

function createChatRoomLabel(chatRoom) {
  const { id, name } = chatRoom;
  const element = document.createElement('div');
  element.title = name;
  element.classList.add('chat');
  element.dataset.id = `${id}`;
  element.innerHTML = `<span>${name}</span>`;
  return element;
}

function getRoomClickListener(roomId) {
  return async (e) => {
    chatRoomsElement.classList.remove('expand');
    generateRoomMessages(roomId);
  }
}


async function generateRoomMessages(roomId) {
  try {
    const messages = await getRoomMessages(roomId);
    clearOutputElements();
    currentRoomId = roomId;
    setActiveRoom(roomId);
    createAndRenderAllMessages(messages);
  } catch (error) {
    console.error(error);
  }
}

async function getRoomMessages(roomId) {
  try {
    const url = `${ROOT_API_ENDPOINT}/rooms/${roomId}`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(error);
    return []
  }
}

function setActiveRoom(roomId) {
  const roomLabels = chatRoomsElement.querySelectorAll('.chat');
  roomLabels.forEach(roomLabel => {
    const isActive = roomLabel.dataset.id == roomId;
    roomLabel.classList.toggle('chat--active', isActive);
  })
}

inputElement.addEventListener('keyup', (event) => {
  if (event.keyCode === 13) {
    event.preventDefault();
    btnElement.click();
  }
});

btnElement.addEventListener('click', (e) => {
  const message = inputElement.value;
  if (!message) return;
  if (!currentRoomId) {
    clearOutputElements();
  }
  addUserMessage(message);
  scrollToBottomOfOutput();
  inputElement.value = '';
  addBotResponse(message);
});

function clearOutputElements() {
  outputElement.innerHTML = '';
}

async function addBotResponse(message) {
  inputElement.disabled = true;
  const loading = getLoadingMessage();
  const botMessage = createBotMessage(loading);
  outputElement.appendChild(botMessage);
  scrollToBottomOfOutput();

  const messageContentElement = botMessage.querySelector('.message-content');
  const answer = await getBotResponse(message);
  await simulateTypingOnElement(messageContentElement, answer);
  inputElement.disabled = false;
}

async function getBotResponse(prompt) {
  const response = await fetch(ROOT_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt, assistantId: currentRoomId })
  });
  const json = await response.json();
  const aId = json.answer?.assistantId;
  if (aId) {
    currentRoomId = aId;
  }
  return json.answer.text;
}
async function simulateTypingOnElement(element, content) {
  let renderedContent = '';
  for (let i=0 ;i<content.length; i++) {
    renderedContent += content[i];
    const delayDelta = Math.round(Math.random() * 5);
    const delay = 2 + delayDelta;
    await setElementContent(element, renderedContent, delay);
    if (renderedContent.length % 120 === 0) {
      scrollToBottomOfOutput();
    }
  }
  scrollToBottomOfOutput();
}

async function setElementContent(element, content, delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      element.innerHTML = content;
      resolve();
    }, delay);
  })
}

function createAndRenderAllMessages(messages) {
  messages.forEach(message => {
    const type = getMessageType(message.sender);
    const element = createMessage(message.text, type);
    outputElement.appendChild(element);
    scrollToBottomOfOutput();
  });
}

function scrollToBottomOfOutput() {
  const canScroll = outputElement.scrollHeight > (outputElement.clientHeight + outputElement.scrollTop);
  if (!canScroll) {
    return;
  };

  outputElement.scrollTo({
    top: outputElement.scrollHeight,
    behavior: 'smooth'
  })
}
function getMessageType(sender) {
  return sender === 'user' ? sender : 'bot';
}
function createMessage(message, type) {
  const element = document.createElement('div');
  element.classList.add('message');
  element.classList.add(`${type}-message`);

  element.innerHTML = `
    <div class="message-avatar">
      <img src="/assets/${type}.svg" alt="${type} avatar">
    </div>
    <div class="message-content">
    ${message}
    </div>
  `;
  return element;
}

function addUserMessage(message) {
  const element = createMessage(message, 'user');
  outputElement.appendChild(element);
}

function createBotMessage(message) {
  return createMessage(message, 'bot');
}

function getLoadingMessage() {
  return `
    <div class="loading">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
}

async function getChatRooms() {
  try {
    const url = `${ROOT_API_ENDPOINT}/rooms`;
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error(error)
  }
}

toggleChatBtn.addEventListener('click', () => {
  chatRoomsElement.classList.toggle('expand');
})

contentContainer.addEventListener('click', () => {
  chatRoomsElement.classList.remove('expand');
})

newChatBtn.addEventListener('click', (e) => {
  chatRoomsElement.classList.remove('expand');
  clearOutputElements();
  outputElement.innerHTML = `
  <div class="initial">
    <h3>AI Assistant Here to Help</h3>
  </div>
  `
  currentRoomId = null;
})