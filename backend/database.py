# database.py
# Sets up the SQLite database connection

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# This creates smetrack.db file automatically in the backend folder
DATABASE_URL = "sqlite:///./smetrack.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency — used in every endpoint to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()