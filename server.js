require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const multer = require("multer");
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({ dest: "uploads/" });

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Functions
async function callChatGPT(question) {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return "ChatGPT is not configured. Please add your OpenAI API key to the .env file.";
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant in a chat application. Keep responses concise and friendly."
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("ChatGPT API Error:", error);
    return "Sorry, I'm having trouble connecting to ChatGPT right now. Please try again later.";
  }
}

async function callGemini(question) {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return "Gemini is not configured. Please add your Gemini API key to the .env file.";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(question);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to Gemini right now. Please try again later.";
  }
}

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

let users = {};

// AI Response Generator
async function generateAIResponse(question, aiType = 'chatgpt') {
  try {
    // Check for basic app-related questions first
    const q = question.toLowerCase().trim();

    const appResponses = {
      greetings: {
        keywords: ["hello", "hi", "hey", "greetings", "what's up"],
        reply: "Hello! 👋 I'm the AI assistant. How can I help you today?"
      },
      features: {
        keywords: ["what can you do", "features", "help", "capabilities"],
        reply: "I can help with: 💬 Chat with others, 📊 Create polls, 📁 Share files, 🌐 Translate chat, and answer your questions using AI!"
      },
      chat: {
        keywords: ["how to chat", "start chat", "send message"],
        reply: "Click 'Start Chat' from the sidebar, enter a message, and click Send. You can also translate messages in real-time!"
      },
      poll: {
        keywords: ["how to poll", "create poll", "start poll"],
        reply: "Click 'Start Poll', enter a question and options, then click Create Poll. Others can vote on your options!"
      },
      files: {
        keywords: ["share files", "file sharing", "upload files"],
        reply: "Click 'Share Files', select a file, and click Share File. Your file will be uploaded and shared with everyone!"
      },
      ai: {
        keywords: ["who are you", "what are you", "tell me about yourself"],
        reply: "I'm an AI assistant powered by ChatGPT and Gemini. I help answer questions and assist with app features!"
      },
      thank: {
        keywords: ["thank", "thanks", "appreciate"],
        reply: "You're welcome! 😊 Feel free to ask me anything!"
      },
      time: {
        keywords: ["what time", "current time"],
        reply: `The current time is ${new Date().toLocaleTimeString()}. 🕐`
      },
      date: {
        keywords: ["what date", "today", "current date"],
        reply: `Today is ${new Date().toLocaleDateString()}. 📅`
      }
    };

    // Check if it's an app-related question
    for (const category in appResponses) {
      const { keywords, reply } = appResponses[category];
      if (keywords.some(keyword => q.includes(keyword))) {
        return reply;
      }
    }

    // For general questions, use AI APIs
    if (aiType === 'gemini') {
      return await callGemini(question);
    } else {
      return await callChatGPT(question);
    }

  } catch (error) {
    console.error("AI Response Error:", error);
    return "Sorry, I'm having trouble processing your request right now. Please try again later.";
  }
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // JOIN
  socket.on("join", (username) => {
    users[socket.id] = username;
    io.emit("message", `${username} joined`);
  });

  // MESSAGE
  socket.on("sendMessage", (msg) => {
    const username = users[socket.id];
    io.emit("message", { id: socket.id, user: username, text: msg });

    // 🤖 AI BOT (if only 1 user)
    if (Object.keys(users).length === 1) {
      socket.emit("message", {
        user: "AI Bot",
        text: "No one is online. Ask me anything 🙂",
      });
    }
  });

  socket.on("askAI", async (data) => {
    const username = users[socket.id];
    const { question, aiType = 'chatgpt' } = data;

    // Emit user's question
    io.emit("message", { id: socket.id, user: username, text: question });

    try {
      // Get AI response
      const aiResponse = await generateAIResponse(question, aiType);
      const aiName = aiType === 'gemini' ? '🤖 Gemini AI' : '🤖 ChatGPT';

      // Send AI response after a short delay
      setTimeout(() => {
        socket.emit("message", {
          user: aiName,
          text: aiResponse,
        });
      }, 500);
    } catch (error) {
      console.error("AI Response Error:", error);
      setTimeout(() => {
        socket.emit("message", {
          user: "🤖 AI Bot",
          text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        });
      }, 500);
    }
  });

  // TYPING
  socket.on("typing", () => {
    socket.broadcast.emit("typing", users[socket.id]);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  // REACTION
  socket.on("react", ({ messageId, emoji }) => {
    io.emit("reactionUpdate", { messageId, emoji });
  });

  // DISCONNECT BUTTON
  socket.on("leave", () => {
    socket.disconnect();
  });

  // ADMIN KICK
  socket.on("kickUser", (id) => {
    io.to(id).disconnectSockets();
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];
    io.emit("message", `${username} left`);
  });
});

// FILE UPLOAD
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

http.listen(3000, () => {
  console.log("Server running on port 3000");
});