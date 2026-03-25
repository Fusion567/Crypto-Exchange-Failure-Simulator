from pydantic import BaseModel
from typing import List, Optional, Dict

class Order(BaseModel):
    id: str
    price: float
    volume: float
    side: str  # 'buy' or 'sell'

class OrderBook(BaseModel):
    bids: List[Order]
    asks: List[Order]

class ComponentHealth(BaseModel):
    status: str  # 'normal', 'warning', 'error'
    latency_pc: float  # 0 to 1 scaling

class SimulationStatus(BaseModel):
    running: bool
    scenario: str
    active_failure: bool
    components: Dict[str, ComponentHealth]
    metrics: Dict[str, float] # throughput, var, withdrawals, etc.
