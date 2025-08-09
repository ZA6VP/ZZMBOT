# Zolory Discord Bot (TypeScript)

A modular, self-hosted Discord bot with a human-like persona, NLP moderation, games, GIF/emoji reactions, and stubs to connect your OWN AI backend (no OpenAI/Gemini required). Secrets live in `.env`.

## Features
- Natural-language triggers: mention the bot or say "Zolory"
- NLP moderation: ban, kick, timeout, warn with flexible phrasing (e.g., "yo zolory ban @user for 10 minutes because spam")
- Games: TicTacToe (text UI). Say "Zolory let's play tictactoe first to 3" to start
- Persona responses with modern slang; optional playful roasts when provoked
- Mood/presence scheduling with naps
- Rotating GIFs and emoji reactions
- SQLite storage for profiles, warnings, and game sessions
- Pluggable AI backend via `AI_BASE_URL` and `AI_API_KEY`

## Quick start
1. Node 18+ required.
2. Create a Discord application & bot. Enable the following intents: Message Content, Server Members.
3. Copy `.env` and set values:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-client-id
OWNER_ID=1219957467690172517
AI_BASE_URL=http://localhost:8000
AI_API_KEY=optional
TIMEZONE=America/New_York
```

4. Install deps and build:

```
npm install
npm run build
```

5. Run:

```
npm start
```

## AI Backend
Implement a POST /v1/chat endpoint returning `{ text: string }`. See `src/skills/aiClient.ts`.

## Notes
- Moderation requires the invoker and the bot to have the right permissions and role hierarchy.
- Spontaneous chatting/DMs are not enabled to avoid spam. You can add opt-in channels.
- The bot avoids slurs/hate and keeps roasts playful.