from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging
import certifi

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

mongodb = MongoDB()

async def connect_to_mongo():
    if settings.MONGODB_URL:
        try:
            mongodb.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                tlsCAFile=certifi.where()
            )
            mongodb.db = mongodb.client[settings.MONGODB_DB_NAME]
            logger.info("Connected to MongoDB Atlas")
        except Exception as e:
            logger.error(f"Could not connect to MongoDB: {e}")
    else:
        logger.warning("MONGODB_URL not set, MongoDB features will be disabled")

async def close_mongo_connection():
    if mongodb.client:
        mongodb.client.close()
        logger.info("Closed MongoDB connection")

async def get_mongodb():
    return mongodb.db
