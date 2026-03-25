from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
from app.schema import OrderBook, SimulationStatus
from app.simulation import engine

app = FastAPI(title="Crypto Simulator Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(engine._simulate_market_movement())

@app.get("/status", response_model=SimulationStatus)
async def get_status():
    if engine.status.components["api"].status == "error":
        if random.random() < 0.8:
            raise HTTPException(status_code=503, detail="Service Unavailable - API Outage Generated")
    return engine.status

@app.get("/order-book", response_model=OrderBook)
async def get_order_book(coin: str = "BTC"):
    if engine.status.components["api"].status == "error":
        if random.random() < 0.8:
            raise HTTPException(status_code=503, detail="Service Unavailable - API Outage Generated")
            
    if engine.status.components["ledger"].status == "error":
        await asyncio.sleep(2.0) # Artificial lag for ledger failure
        
    return await engine.get_order_book(coin)

@app.post("/trigger-failure")
async def trigger_failure(scenario: str):
    engine.trigger_failure(scenario)
    return {"message": f"Failure {scenario} triggered", "status": engine.status}

@app.post("/reset")
async def reset_simulation():
    engine.reset_status()
    return {"message": "Simulation reset", "status": engine.status}
