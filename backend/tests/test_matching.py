"""Domain matching tests."""

from app.domain.matching import MatchCandidate, match_product


def test_ean_exact_match() -> None:
    candidates = [
        MatchCandidate(
            product_id="p1",
            canonical_key="apple|iphone",
            name="iPhone",
            brand="Apple",
            model="15",
            ean="123",
        )
    ]
    incoming = MatchCandidate(
        product_id=None,
        canonical_key="x",
        name="Other",
        brand="Apple",
        model="15",
        ean="123",
    )
    result = match_product(incoming, candidates)
    assert result.matched_product_id == "p1"
    assert result.strategy == "ean_exact"


def test_name_below_threshold_is_no_match() -> None:
    candidates = [
        MatchCandidate(
            product_id="p1",
            canonical_key="a",
            name="Sony PlayStation 5 Slim Console",
            brand="Sony",
            model="PS5",
            ean=None,
        )
    ]
    incoming = MatchCandidate(
        product_id=None,
        canonical_key="b",
        name="Cafeteira Elétrica",
        brand="Arno",
        model="X",
        ean=None,
    )
    result = match_product(incoming, candidates)
    assert result.matched_product_id is None
    assert result.strategy == "no_match"