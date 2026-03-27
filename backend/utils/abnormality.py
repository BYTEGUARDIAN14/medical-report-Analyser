import re
from typing import List

ABNORMAL_KEYWORDS = {
    "high": "High value detected",
    "low": "Low value detected",
    "elevated": "Elevated level detected",
    "abnormal": "Abnormal result found",
    "critical": "Critical value detected",
    "deficiency": "Deficiency detected",
    "positive": "Positive result - consult doctor",
    "detected": "Condition detected",
}


def detect_abnormalities(text: str) -> List[str]:
    """
    Scan report text for abnormality indicators using regex word matching.
    Returns a deduplicated list of human-readable alert messages.
    """
    if not text or not text.strip():
        return []

    alerts: List[str] = []
    normalized_text = text.lower()

    for keyword, message in ABNORMAL_KEYWORDS.items():
        pattern = rf"\b{re.escape(keyword)}\b"
        if re.search(pattern, normalized_text):
            alerts.append(message)

    # Preserve insertion order while deduplicating.
    return list(dict.fromkeys(alerts))
