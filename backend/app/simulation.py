import asyncio
import random
import uuid
from typing import Dict
from app.schema import OrderBook, Order, SimulationStatus, ComponentHealth

COINS = {
    "BTC": 70000.0,
    "ETH": 3500.0,
    "USDT": 1.0,
    "USDC": 1.0,
    "SOL": 150.0,
    "XRP": 0.6,
    "BNB": 600.0,
    "LINK": 20.0,
    "AVAX": 40.0,
    "BCH": 500.0,
    "LTC": 80.0,
    "PEPE": 0.00001,
    "SUI": 1.5,
    "HYPE": 5.0,
    "TRX": 0.12,
    "DOGE": 0.15
}

class CoreEngine:
    def __init__(self):
        self._init_status()
        self.prices = COINS.copy()
        self.order_books: Dict[str, OrderBook] = {}
        self.lock = asyncio.Lock()
        for coin in COINS:
            self.order_books[coin] = self.generate_initial_book(coin)

    def _init_status(self):
        comp_ids = ["api", "oracle", "nodes", "kyc", "circuit", "matcher", "ledger", "wallets", "liquidity"]
        self.status = SimulationStatus(
            running=True,
            scenario="Normal",
            active_failure=False,
            components={cid: ComponentHealth(status="normal", latency_pc=0.0) for cid in comp_ids},
            metrics={"throughput": 100.0, "var_usd": 0.0, "withdrawals": 0.0, "latency_ms": 12.0, "affected_count": 0.0}
        )

    def generate_initial_book(self, coin: str) -> OrderBook:
        bp = self.prices[coin]
        step = bp * 0.0005  # 0.05% step
        vol = max(100.0 / bp, 0.1) # Higher volume for cheaper coins
        bids = [Order(id=str(uuid.uuid4()), price=bp - i*step, volume=random.uniform(vol*0.5, vol*2.0), side='buy') for i in range(1, 21)]
        asks = [Order(id=str(uuid.uuid4()), price=bp + i*step, volume=random.uniform(vol*0.5, vol*2.0), side='sell') for i in range(1, 21)]
        return OrderBook(bids=bids, asks=asks)

    async def _simulate_market_movement(self):
        while True:
            if not self.status.running:
                await asyncio.sleep(1)
                continue
            
            await asyncio.sleep(random.uniform(0.5, 1.5))
            
            async with self.lock:
                self._apply_propagation()
                for coin in COINS:
                    # Logic: If oracle failed, price varies wildly
                    bp = self.prices[coin]
                    
                    if self.status.components["oracle"].status == "error":
                        noise = random.uniform(-bp * 0.05, bp * 0.05) if coin not in ["USDT", "USDC"] else 0
                        self.prices[coin] += noise
                    
                    if self.status.active_failure and self.status.scenario == "Flash Crash" and coin not in ["USDT", "USDC"]:
                        self.prices[coin] -= random.uniform(bp * 0.01, bp * 0.03)
                    elif coin not in ["USDT", "USDC"]:
                        # Normal market movement
                        self.prices[coin] *= (1 + random.uniform(-0.001, 0.001))
                    
                    bp = self.prices[coin]
                    step = bp * 0.0005
                    vol = max(1000.0 / bp, 0.1)
                    
                    # Liquidity drain thins the bids
                    if self.status.components["liquidity"].status == "error":
                        bids = [Order(id=str(uuid.uuid4()), price=bp - i*step*10, volume=random.uniform(vol*0.01, vol*0.05), side='buy') for i in range(1, 5)] 
                    else:
                        bids = [Order(id=str(uuid.uuid4()), price=bp - i*step, volume=random.uniform(vol*0.5, vol*2.0), side='buy') for i in range(1, 21)]
                    
                    asks = [Order(id=str(uuid.uuid4()), price=bp + i*step, volume=random.uniform(vol*0.5, vol*2.0), side='sell') for i in range(1, 21)]
                    self.order_books[coin] = OrderBook(bids=bids, asks=asks)

    def _apply_propagation(self):
        if not self.status.active_failure:
            return

        # Phase 2: Propagation Logic
        affected = sum(1 for c in self.status.components.values() if c.status != 'normal')
        self.status.metrics["affected_count"] = float(affected)

        if self.status.scenario == "API Outage":
            self.status.components["api"].status = "error"
            self.status.components["matcher"].status = "warning"
            self.status.metrics["throughput"] = max(5.0, self.status.metrics["throughput"] - 10)
            self.status.metrics["latency_ms"] = 5000.0
            
        elif self.status.scenario == "Order Book Lag":
            self.status.components["ledger"].status = "error"
            self.status.components["matcher"].status = "warning"
            self.status.metrics["throughput"] = 30.0
            self.status.metrics["latency_ms"] = 2500.0
            
        elif self.status.scenario == "Liquidity Drain":
            self.status.components["liquidity"].status = "error"
            self.status.components["matcher"].status = "error"
            self.status.components["circuit"].status = "warning"
            self.status.metrics["var_usd"] = min(self.status.metrics["var_usd"] + 50000, 2000000)
            self.status.metrics["latency_ms"] = 800.0
            
        elif self.status.scenario == "API DDoS":
            self.status.components["api"].status = "warning"
            self.status.components["nodes"].status = "warning"
            self.status.metrics["throughput"] = 10.0
            self.status.metrics["latency_ms"] = 8000.0
            
        elif self.status.scenario == "Flash Crash":
            self.status.components["matcher"].status = "error"
            self.status.components["oracle"].status = "warning"
            self.status.components["circuit"].status = "error"
            self.status.metrics["var_usd"] = min(self.status.metrics["var_usd"] + 250000, 10000000)
            self.status.metrics["latency_ms"] = 350.0
            
        elif self.status.scenario == "Stablecoin Depeg":
            self.status.components["oracle"].status = "error"
            self.status.components["liquidity"].status = "error"
            self.status.components["wallets"].status = "warning"
            self.status.metrics["var_usd"] = min(self.status.metrics["var_usd"] + 1000000, 50000000)
            self.status.metrics["withdrawals"] = min(self.status.metrics["withdrawals"] + 500, 25000)
            self.status.metrics["latency_ms"] = 1200.0

        elif self.status.scenario == "Wallet Hack":
            self.status.components["wallets"].status = "error"
            self.status.components["liquidity"].status = "error"
            self.status.components["kyc"].status = "error"
            self.status.components["circuit"].status = "error"
            self.status.metrics["var_usd"] = min(self.status.metrics["var_usd"] + 5000000, 100000000)
            self.status.metrics["throughput"] = 0.0
            self.status.metrics["withdrawals"] = min(self.status.metrics["withdrawals"] + 2000, 50000)
            self.status.metrics["latency_ms"] = 99999.0

        # Recalculate affected after propagation
        affected = sum(1 for c in self.status.components.values() if c.status != 'normal')
        self.status.metrics["affected_count"] = float(affected)

    async def get_order_book(self, coin: str = "BTC") -> OrderBook:
        async with self.lock:
            if coin not in self.order_books:
                coin = "BTC"
            return self.order_books[coin]

    def trigger_failure(self, scenario: str):
        self.status.active_failure = True
        self.status.scenario = scenario

    def reset_status(self):
        self._init_status()
        self.prices = COINS.copy()
        for coin in COINS:
            self.order_books[coin] = self.generate_initial_book(coin)

engine = CoreEngine()
