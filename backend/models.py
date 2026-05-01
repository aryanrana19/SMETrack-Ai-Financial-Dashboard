# models.py
# Defines what a Transaction looks like in the database

from sqlalchemy import Column, Integer, String, Float
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id          = Column(Integer, primary_key=True, index=True)
    date        = Column(String)   # 'YYYY-MM-DD'
    description = Column(String)
    type        = Column(String)   # 'income' or 'expense'
    category    = Column(String)
    amount      = Column(Float)
    status      = Column(String)   # 'completed' / 'pending' / 'failed'