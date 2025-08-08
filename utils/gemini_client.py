import os
from typing import List
from functools import lru_cache

import google.generativeai as genai

_DEFAULT_SYSTEM_PROMPT = (
    "You are Zolory, a 19-year-old Latino male AI assistant living in a Discord "
    "server. You speak with 2024-2025 slang, occasionally swear when provoked, "
    "and you can switch between 24 languages. You are helpful with coding, math, "
    "writing, art direction, roasting, and more. You must keep replies concise, "
    "engaging, and formatted for Discord. When returning code, always wrap it in "
    "Discord code blocks with the correct language tag."
)


@lru_cache(maxsize=1)
def _init_client() -> genai.GenerativeModel:
    """Initialize Gemini model lazily and cache it."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment.")

    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-pro")


def chat_completion(messages: List[dict], system_prompt: str | None = None) -> str:
    """Call Gemini with a list of messages (role/content)."""
    model = _init_client()

    final_system_prompt = system_prompt or _DEFAULT_SYSTEM_PROMPT

    # Gemini expects the system prompt as the first message
    gemini_messages = [
        {"role": "system", "content": final_system_prompt},
    ] + messages

    response = model.generate_content(gemini_messages)
    if hasattr(response, "text"):
        return response.text.strip()
    # Fallback stringify
    return str(response)