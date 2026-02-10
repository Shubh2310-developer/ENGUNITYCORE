import logging
import sys
import os
from logging.handlers import RotatingFileHandler

def setup_logging():
    """
    Configure centralized application logging with both console and rotating file output.
    """
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    # Ensure logs directory exists
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            RotatingFileHandler(
                os.path.join(log_dir, "app.log"),
                maxBytes=10*1024*1024, # 10MB
                backupCount=5
            )
        ]
    )

    # Set levels for specific libraries if needed
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("app").setLevel(logging.DEBUG)

    logger = logging.getLogger(__name__)
    logger.info("Centralized logging system initialized.")

logger = logging.getLogger("engunity")
