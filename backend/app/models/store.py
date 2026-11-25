"""Store, store product, price offer and history models."""

from datetime import datetime

import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

MONEY = Numeric(12, 2)


class Store(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "stores"
    __table_args__ = (Index("ix_stores_slug", "slug", unique=True),)

    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    website_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reliability_tier: Mapped[str] = mapped_column(String(32), default="demo", nullable=False)

    store_products = relationship("StoreProduct", back_populates="store")


class StoreProduct(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "store_products"
    __table_args__ = (
        UniqueConstraint("store_id", "external_id", name="uq_store_product_external"),
        Index("ix_store_products_product_id", "product_id"),
        Index("ix_store_products_store_id", "store_id"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    store_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
    )
    external_id: Mapped[str] = mapped_column(String(128), nullable=False)
    url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    availability: Mapped[str] = mapped_column(String(64), default="in_stock", nullable=False)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    product = relationship("Product", back_populates="store_products")
    store = relationship("Store", back_populates="store_products")
    price_offers = relationship(
        "PriceOffer",
        back_populates="store_product",
        cascade="all, delete-orphan",
    )
    price_history = relationship(
        "PriceHistory",
        back_populates="store_product",
        cascade="all, delete-orphan",
    )


class PriceOffer(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "price_offers"
    __table_args__ = (Index("ix_price_offers_store_product_id", "store_product_id"),)

    store_product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("store_products.id", ondelete="CASCADE"),
        nullable=False,
    )
    original_price: Mapped[float] = mapped_column(MONEY, nullable=False)
    promotional_price: Mapped[float | None] = mapped_column(MONEY, nullable=True)
    shipping_price: Mapped[float] = mapped_column(MONEY, default=0, nullable=False)
    total_price: Mapped[float] = mapped_column(MONEY, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="BRL", nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    store_product = relationship("StoreProduct", back_populates="price_offers")


class PriceHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "price_history"
    __table_args__ = (
        Index("ix_price_history_store_product_observed", "store_product_id", "observed_at"),
    )

    store_product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("store_products.id", ondelete="CASCADE"),
        nullable=False,
    )
    total_price: Mapped[float] = mapped_column(MONEY, nullable=False)
    promotional_price: Mapped[float | None] = mapped_column(MONEY, nullable=True)
    shipping_price: Mapped[float] = mapped_column(MONEY, default=0, nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    store_product = relationship("StoreProduct", back_populates="price_history")