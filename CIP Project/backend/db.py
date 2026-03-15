from pymongo import MongoClient

from config import DB_NAME, MONGODB_URI

_client = MongoClient(MONGODB_URI)
_db = _client[DB_NAME]


def buses_collection():
    return _db["buses"]

