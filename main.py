# main.py
from dotenv import load_dotenv
load_dotenv()  # must run before services that read env vars (ANTHROPIC_API_KEY, RAZORPAY_*) get imported

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import init_db
from routers import transactions

app = FastAPI(title="RecoverAI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later if needed
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(transactions.router)
