"""Price comparison helpers."""

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class OfferSnapshot:
    store_slug: str
    store_name: str
    total_price: Decimal
    promotional_price: Decimal | None
    shipping_price: Decimal
    is_demo: bool
    currency: str = "BRL"


@dataclass(frozen=True)
class ComparisonSummary:
    best_offer: OfferSnapshot | None
    offers: list[OfferSnapshot]
    savings_vs_worst: Decimal | None


def compare_offers(offers: list[OfferSnapshot]) -> ComparisonSummary:
    if not offers:
        return ComparisonSummary(best_offer=None, offers=[], savings_vs_worst=None)

    sorted_offers = sorted(offers, key=lambda o: o.total_price)
    best = sorted_offers[0]
    worst = sorted_offers[-1]
    savings = worst.total_price - best.total_price if len(sorted_offers) > 1 else None
    return ComparisonSummary(best_offer=best, offers=sorted_offers, savings_vs_worst=savings)


def compute_total_price(
    promotional: Decimal | None,
    original: Decimal,
    shipping: Decimal,
) -> Decimal:
    base = promotional if promotional is not None else original
    return base + shipping


def pick_best_offer[T](offers: list[T]) -> T | None:
    """Return the offer with the lowest total_price attribute."""
    if not offers:
        return None
    return min(offers, key=lambda o: getattr(o, "total_price"))