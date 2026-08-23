"""Per-token pricing (USD) for common models. Used for usage cost analytics."""

PRICING_PER_1M: dict[str, tuple[float, float]] = {
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4o": (2.50, 10.00),
    "gpt-4.1-mini": (0.40, 1.60),
    "gpt-4.1": (2.00, 8.00),
    "gpt-4-turbo": (10.00, 30.00),
    "o1": (15.00, 60.00),
    "o3-mini": (1.10, 4.40),
    "claude-sonnet-4-5": (3.00, 15.00),
    "claude-opus-4": (15.00, 75.00),
    "claude-3-5-sonnet": (3.00, 15.00),
    "claude-3-haiku": (0.25, 1.25),
    "deepseek-chat": (0.27, 1.10),
    "gemini-1.5-pro": (1.25, 5.00),
    "gemini-2.0-flash": (0.10, 0.40),
    "llama-3.1-8b": (0.05, 0.25),
    "llama-3.1-70b": (0.27, 0.27),
    "mistral-small": (0.20, 0.60),
    "mistral-large": (2.00, 6.00),
}

# Fallback when a model isn't in the map.
DEFAULT_INPUT_PER_1M = 0.50
DEFAULT_OUTPUT_PER_1M = 1.50


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    rates = PRICING_PER_1M.get(model, PRICING_PER_1M.get(model.split("-")[0], (DEFAULT_INPUT_PER_1M, DEFAULT_OUTPUT_PER_1M)))
    input_rate, output_rate = rates
    return (prompt_tokens / 1_000_000 * input_rate) + (completion_tokens / 1_000_000 * output_rate)