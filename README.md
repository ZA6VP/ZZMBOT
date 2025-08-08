# Zolory Discord Bot

Zolory is an advanced AI-powered Discord bot with a dynamic personality, multi-language support, moderation tools, games and more. Under the hood it leverages Google Gemini LLM running on your own infrastructure – **no OpenAI / ChatGPT required**.

## Features

* Conversational AI with moods and slang (19-year-old Latino male style)
* Supports 24 languages and code generation for multiple programming languages
* Natural-language moderation: ban / kick / timeout / warn by simply talking to Zolory
* Games like Tic-Tac-Toe with score tracking
* Random GIFs, emoji reactions, custom presence and status updates (sleep schedule, naps)
* Proactive conversations and configurable behaviour toggles

## Quick Start

1. Clone the repository and install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and fill in your tokens:

   ```env
   DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
   GEMINI_API_KEY=AIZA...k7M
   OWNER_ID=1219957467690172517  # Zap
   ```

3. Run the bot:

   ```bash
   python bot.py
   ```

## Directory Structure

```
├── bot.py                # Entrypoint
├── cogs/                 # Modular bot logic
│   ├── conversation.py
│   ├── moderation.py
│   ├── games.py
│   └── presence.py
├── utils/
│   ├── gemini_client.py  # Gemini wrapper
│   └── helpers.py        # GIF / Emoji helpers
├── requirements.txt
└── README.md
```

---

### Disclaimer
This project is provided as-is for educational purposes. Running large language models can incur costs and should comply with the provider’s terms of service.
