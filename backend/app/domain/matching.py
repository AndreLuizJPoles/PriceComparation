"""Product matching rules (EAN, brand+model, name similarity)."""

import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher

MATCH_THRESHOLD = 0.92


@dataclass(frozen=True)
class MatchCandidate:
    product_id: str | None
    canonical_key: str
    name: str
    brand: str | None
    model: str | None
    ean: str | None


@dataclass(frozen=True)
class MatchResult:
    matched_product_id: str | None
    confidence: float
    strategy: str


def normalize_text(value: str) -> str:
    folded = unicodedata.normalize("NFKD", value)
    ascii_only = "".join(ch for ch in folded if not unicodedata.combining(ch))
    lowered = ascii_only.lower()
    return re.sub(r"[^a-z0-9]+", " ", lowered).strip()


def build_canonical_key(brand: str | None, model: str | None, name: str) -> str:
    parts = [normalize_text(p) for p in (brand or "", model or "", name) if p]
    return "|".join(parts)


def name_similarity(left: str, right: str) -> float:
    return SequenceMatcher(None, normalize_text(left), normalize_text(right)).ratio()


def match_product(
    incoming: MatchCandidate,
    candidates: list[MatchCandidate],
) -> MatchResult:
    if incoming.ean:
        for candidate in candidates:
            if candidate.ean and candidate.ean == incoming.ean:
                return MatchResult(
                    matched_product_id=candidate.product_id,
                    confidence=1.0,
                    strategy="ean_exact",
                )

    if incoming.brand and incoming.model:
        incoming_key = build_canonical_key(incoming.brand, incoming.model, "")
        for candidate in candidates:
            if candidate.brand and candidate.model:
                candidate_key = build_canonical_key(candidate.brand, candidate.model, "")
                if incoming_key == candidate_key:
                    return MatchResult(
                        matched_product_id=candidate.product_id,
                        confidence=0.97,
                        strategy="brand_model",
                    )

    best: MatchCandidate | None = None
    best_score = 0.0
    for candidate in candidates:
        score = name_similarity(incoming.name, candidate.name)
        if score > best_score:
            best_score = score
            best = candidate

    if best and best_score >= MATCH_THRESHOLD:
        return MatchResult(
            matched_product_id=best.product_id,
            confidence=best_score,
            strategy="name_similarity",
        )

    return MatchResult(matched_product_id=None, confidence=best_score, strategy="no_match")