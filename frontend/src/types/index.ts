export interface Order {
    id: string;
    price: number;
    volume: number;
    side: 'buy' | 'sell';
}

export interface OrderBook {
    bids: Order[];
    asks: Order[];
}

export interface ComponentHealth {
    status: 'normal' | 'warning' | 'error';
    latency_pc: number;
}

export interface SimulationStatus {
    running: boolean;
    scenario: string;
    active_failure: boolean;
    components: Record<string, ComponentHealth>;
    metrics: Record<string, number>;
}
