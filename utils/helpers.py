import random

GIF_LIBRARY = [
    "https://media.giphy.com/media/YO5T2ulyHYkMw/giphy.gif",
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
]

EMOJIS = ["😎", "😂", "🔥", "🤖", "👍", "💯", "🙌", "🎉", "😉", "👀"]


def random_gif() -> str:
    return random.choice(GIF_LIBRARY)


def random_emoji() -> str:
    return random.choice(EMOJIS)