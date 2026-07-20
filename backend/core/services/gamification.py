def points_for_completed_module(difficulty: int = 1) -> int:
    """Return points earned for a module with a positive difficulty level."""
    if difficulty < 1:
        raise ValueError("Difficulty must be at least 1")
    return 10 * difficulty
