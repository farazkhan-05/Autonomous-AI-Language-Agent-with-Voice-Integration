from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

# 1. Fetch our validated config settings (contains our database URL!)
settings = get_settings()

# 2. Create the Database Engine
# This acts as the physical connection pipeline to Neon Postgres.
# pool_pre_ping=True: Checks if the connection is still alive before sending queries,
# preventing random disconnect errors from serverless databases like Neon.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300, # Recycles old connections every 5 minutes to keep things fresh
)
    
# 3. Create a Session Factory
# Generates temporary transactional sessions (like a checkout basket at a store).
# autoflush=False: Prevents SQL from automatically sending partial saves until we explicitly say "commit"
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Modern SQLAlchemy 2.0 Base Class
# This class acts as the parent blueprint. All our database tables (models.py)
# will inherit from this class so SQLAlchemy knows they belong to our schema.
class Base(DeclarativeBase):
    pass

# 5. Dependency Injection Session Generator
# This is a special helper function used in our FastAPI endpoints.
# It opens a database connection when a user requests data,
# and automatically closes it as soon as the request is finished!
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() # Ensures we NEVER leak database connections, preventing crashes
