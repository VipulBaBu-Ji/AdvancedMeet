# Chat App with AI Integration

A real-time chat application with integrated ChatGPT and Gemini AI capabilities.

## Features

- 💬 Real-time chat with Socket.io
- 📊 Interactive polls
- 📁 File sharing
- 🌐 Multi-language support
- 🎨 Light/Dark theme toggle
- 🤖 **ChatGPT & Gemini AI Integration**

## AI Setup Instructions

### 1. Get API Keys

#### OpenAI API Key (for ChatGPT)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

#### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables

1. Open the `.env` file in the project root
2. Replace the placeholder values:

```
OPENAI_API_KEY=your_actual_openai_api_key_here
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

Or directly:
```bash
node server.js
```

### 5. Access the Application

Open your browser and go to: `http://localhost:3000`

## How to Use AI Features

1. Click the **"Ask AI"** button in the sidebar
2. Choose your AI: Type `chatgpt` or `gemini`
3. Ask your question
4. The AI will respond in the chat

## AI Capabilities

- **ChatGPT**: Powered by GPT-3.5-turbo for intelligent conversations
- **Gemini**: Google's latest AI model for comprehensive responses
- **Smart Routing**: App-related questions use optimized responses, general questions use AI APIs
- **Error Handling**: Graceful fallbacks if APIs are unavailable

## Cost Information

- **OpenAI**: Pay per token used (approximately $0.002 per 1K tokens)
- **Gemini**: Free tier available, paid plans for higher usage

## Troubleshooting

- **"AI is not configured"**: Check that your API keys are correctly set in `.env`
- **Connection errors**: Verify internet connection and API key validity
- **Rate limits**: Free tiers have usage limits; upgrade for higher limits

## Security Notes

- Never commit API keys to version control
- Keep `.env` file secure and don't share it
- API keys have associated costs - monitor usage