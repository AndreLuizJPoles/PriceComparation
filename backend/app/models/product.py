"""Product and identifier ORM models."""

import uuid

from sqlalchemy import ForeignKey, Index, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Product(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_name", "name"),
        Index("ix_products_brand", "brand"),
        Index("ix_products_category", "category"),
        Index("ix_products_canonical_key", "canonical_key", unique=True),
    )

    name: Mapped[str] = mapped_column(String(512), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    canonical_key: Mapped[str] = mapped_column(String(512), nullable=False)

    identifiers = relationship(
        "ProductIdentifier",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    store_products = relationship("StoreProduct", back_populates="product")
    favorites = relationship("Favorite", back_populates="product")
    price_alerts = relationship("PriceAlert", back_populates="product")


class ProductIdentifier(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "product_identifiers"
    __table_args__ = (
        UniqueConstraint("type", "value", name="uq_product_identifier_type_value"),
        Index("ix_product_identifiers_type_value", "type", "value"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    value: Mapped[str] = mapped_column(String(128), nullable=False)

    product = relationship("Product", back_populates="identifiers")