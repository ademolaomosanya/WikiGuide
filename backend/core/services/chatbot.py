class ChatbotService:
    """Boundary for the future conversational learning provider."""

    def reply(self, message: str) -> str:
        if not message.strip():
            raise ValueError("Message cannot be empty")
        return "Chat assistance is not configured yet."
