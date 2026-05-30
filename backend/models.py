# models.py

from sqlalchemy import Column, Integer, String, Float
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id          = Column(Integer, primary_key=True, index=True)
    date        = Column(String) 
    description = Column(String)
    type        = Column(String) 
    category    = Column(String)
    amount      = Column(Float)
    status      = Column(String)  