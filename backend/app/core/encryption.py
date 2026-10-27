import logging
from cryptography.fernet import Fernet
from app.config import settings

logger = logging.getLogger(__name__)

_fernet_instance = None

def get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        key = settings.TOKEN_ENCRYPTION_KEY
        if not key or key == "replace_with_fernet_key_base64":
            # Deterministic development fallback key (never for production)
            logger.warning("Using fallback development encryption key. Do not use in production!")
            key = "devDevDevDevDevDevDevDevDevDevDevDevDevDev0="
        try:
            _fernet_instance = Fernet(key.encode() if isinstance(key, str) else key)
        except Exception as e:
            logger.error(f"Invalid TOKEN_ENCRYPTION_KEY: {e}. Generating ephemeral key.")
            _fernet_instance = Fernet(Fernet.generate_key())
    return _fernet_instance

def encrypt_token(token: str) -> str:
    """Encrypt a plaintext sensitive token."""
    if not token:
        return ""
    f = get_fernet()
    return f.encrypt(token.encode("utf-8")).decode("utf-8")

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt an encrypted token."""
    if not encrypted_token:
        return ""
    f = get_fernet()
    try:
        return f.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
    except Exception as e:
        logger.error(f"Failed to decrypt token: {e}")
        return ""
