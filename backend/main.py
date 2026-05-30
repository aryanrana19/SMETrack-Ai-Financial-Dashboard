
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import models
from database import engine, get_db

# Create all tables in the DB automatically on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS — allows your frontend HTML files to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schema (what the API expects to receive) ──────────────────
class TransactionIn(BaseModel):
    date:        str
    description: str
    type:        str
    category:    str
    amount:      float
    status:      str


# ── Routes ────────────────────────────────────────────────────

# Health check — open this in browser to confirm server is running
@app.get("/")
def root():
    return {"message": "SMETrack API is running"}


# GET all transactions
@app.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    return db.query(models.Transaction).all()


# POST — add a new transaction
@app.post("/transactions")
def add_transaction(txn: TransactionIn, db: Session = Depends(get_db)):
    new_txn = models.Transaction(**txn.dict())
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    return new_txn


# DELETE — remove a transaction by ID
@app.delete("/transactions/{txn_id}")
def delete_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(models.Transaction).filter(models.Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()
    return {"message": "Deleted successfully"}

from ml import forecast_cashflow, investment_readiness_score


# ── GET Forecast ────────────────────────────────────────────
@app.get("/forecast")
def get_forecast(horizon: int = 3, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()
    if not transactions:
        return { "error": "No transactions found" }
    return forecast_cashflow(transactions, horizon)


# ── GET Investment Readiness Score ──────────────────────────
@app.get("/score")
def get_score(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()
    if not transactions:
        return { "error": "No transactions found" }
    return investment_readiness_score(transactions)