"""Email port — console stub for development."""

from abc import ABC, abstractmethod

from app.core.logging import get_logger

logger = get_logger(__name__)


class EmailPort(ABC):
    @abstractmethod
    async def send_password_reset(self, to_email: str, reset_token: str, reset_url: str) -> None:
        ...


class ConsoleEmailPort(EmailPort):
    """Logs password reset e-mails instead of sending via SMTP."""

    async def send_password_reset(self, to_email: str, reset_token: str, reset_url: str) -> None:
        logger.info(
            "email_password_reset_stub",
            to=to_email,
            reset_token=reset_token,
            reset_url=reset_url,
            message="Configure SMTP to deliver real e-mails.",
        )


def get_email_port() -> EmailPort:
    return ConsoleEmailPort()