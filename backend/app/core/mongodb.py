import asyncio
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
            # Robust connection settings for MongoDB Atlas
            # Using tlsAllowInvalidCertificates to bypass SSL issues in specific Docker/VPN network configurations
            # Adding directConnection=False and other Atlas recommended params
            mongodb.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
                retryWrites=True,
                retryReads=True,
                tls=True,
                tlsAllowInvalidCertificates=True,
                tlsCAFile=certifi.where(),
                connect=False,
                appname="ENGUNITY"
            )
            # Verify connection with a short timeout to prevent hanging
            await asyncio.wait_for(mongodb.client.admin.command('ping'), timeout=5.0)
            mongodb.db = mongodb.client[settings.MONGODB_DB_NAME]
            logger.info("✅ Connected to MongoDB Atlas")
        except Exception as e:
            logger.warning(f"⚠️  MongoDB connection failed: {str(e)}")
            logger.info("📝 MongoDB features will be disabled. Application will continue without MongoDB.")
            mongodb.db = None
            mongodb.client = None
    else:
        logger.info("📝 MONGODB_URL not set, MongoDB features will be disabled")

async def close_mongo_connection():
    if mongodb.client:
        mongodb.client.close()
        logger.info("Closed MongoDB connection")

async def get_mongodb():
    return mongodb.db
