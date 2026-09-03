# main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import init_db
from routers import transactions

app = FastAPI(title="RecoverAI")


@app.get("/debug/razorpay-recovery-test")
def debug_razorpay_recovery_test():
    from services.razorpay_client import create_payment_link

    result = create_payment_link(
        amount_inr=1599.0,
        email="vikram.rao@demo.com",
        reference_id="txn_5_attempt_3",
    )

    return {
        "success": result["success"],
        "response": result["response"],
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(transactions.router)