import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Globe, 
  Network, 
  Zap, 
  Fingerprint, 
  ShieldAlert, 
  Cpu, 
  Database, 
  Droplets, 
  Wallet,
  Activity,
  RefreshCw,
  ChevronDown,
  TriangleAlert,
  MessageSquare,
  BarChart2,
  XCircle,
  Sun,
  Moon
} from 'lucide-react';
import type { OrderBook, SimulationStatus } from './types';
import './App.css';

const API_BASE = 'http://localhost:8000';

const ZONES = [
  {
    id: 'connectivity',
    name: '1. Connectivity',
    nodes: [
      { id: 'api', label: 'API Gateway', icon: Globe },
      { id: 'nodes', label: 'Nodes', icon: Network },
      { id: 'oracle', label: 'Oracle', icon: Zap },
    ]
  },
  {
    id: 'security',
    name: '2. Security',
    nodes: [
      { id: 'kyc', label: 'KYC/AML', icon: Fingerprint },
      { id: 'circuit', label: 'Circuit Breaker', icon: ShieldAlert },
    ]
  },
  {
    id: 'execution',
    name: '3. Execution',
    nodes: [
      { id: 'matcher', label: 'Matcher', icon: Cpu },
      { id: 'ledger', label: 'Ledger DB', icon: Database },
    ]
  },
  {
    id: 'storage',
    name: '4. Liquidity',
    nodes: [
      { id: 'liquidity', label: 'Pools', icon: Droplets },
      { id: 'wallets', label: 'Wallets', icon: Wallet },
    ]
  }
];

const COINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '/icons/btc.svg' },
  { symbol: 'ETH', name: 'Ethereum', icon: '/icons/eth.svg' },
  { symbol: 'USDT', name: 'Tether', icon: '/icons/usdt.svg' },
  { symbol: 'USDC', name: 'USDC', icon: '/icons/usdc.svg' },
  { symbol: 'SOL', name: 'Solana', icon: '/icons/sol.svg' },
  { symbol: 'XRP', name: 'XRP', icon: '/icons/xrp.svg' },
  { symbol: 'BNB', name: 'Binance Coin', icon: '/icons/bnb.svg' },
  { symbol: 'LINK', name: 'Chainlink', icon: '/icons/link.svg' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '/icons/avax.svg' },
  { symbol: 'BCH', name: 'Bitcoin Cash', icon: '/icons/bch.svg' },
  { symbol: 'LTC', name: 'Litecoin', icon: '/icons/ltc.svg' },
  { symbol: 'PEPE', name: 'Pepe', icon: '/icons/pepe.svg' },
  { symbol: 'SUI', name: 'Sui', icon: '/icons/sui.svg' },
  { symbol: 'TRX', name: 'TRON', icon: '/icons/trx.svg' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: '/icons/doge.svg' },
  { symbol: 'HYPE', name: 'Hyperliquid', icon: '/icons/hype.svg' },
];

const nodeDescriptions: Record<string, string> = {
  api: "Entry point for all user traffic and trading requests.",
  oracle: "Real-time price feeds from external markets.",
  nodes: "Distributed blockchain validators for settlements.",
  kyc: "Identity verification and anti-fraud monitoring.",
  circuit: "Automated trading halts during extreme volatility.",
  matcher: "The high-frequency sequencer matching buy/sell orders.",
  ledger: "The immutable record of all accounts and trade history.",
  wallets: "Secure storage for exchange and user crypto assets.",
  liquidity: "The pool of available tokens for instant execution."
};

const failureExplanations: Record<string, string> = {
  'API Outage': "API Gateway is returning 503 Service Unavailable. Requests cannot reach the matching engine.",
  'API DDoS': "Inbound traffic surge of 900%. Latency has spiked by 90%, causing price desynchronization.",
  'Order Book Lag': "Database write latency has spiked. The engine is waiting for DB ACKs, causing the order book to freeze or update slowly.",
  'Liquidity Drain': "Market Makers have withdrawn their limit orders, leaving thin order book depth and massive spreads.",
  'Flash Crash': "A massive market sell order has completely wiped out the bid side, dropping the price instantly.",
  'Stablecoin Depeg': "Base currency has lost its 1.00 anchor. Total value at risk is skyrocketing as margin calls trigger.",
  'Wallet Hack': "Exchange Hot Wallets breached. 50M USDT moved to blacklisted address. Liquidity draining instantly."
};

const CONNECTIONS = [
  { from: 'api', to: 'kyc' },
  { from: 'nodes', to: 'kyc' },
  { from: 'oracle', to: 'matcher' },
  { from: 'kyc', to: 'circuit' },
  { from: 'circuit', to: 'matcher' },
  { from: 'matcher', to: 'ledger' },
  { from: 'ledger', to: 'wallets' },
  { from: 'matcher', to: 'liquidity' },
];

const FlowLines = ({ nodeRefs, status }: { nodeRefs: Record<string, HTMLDivElement | null>, status: any }) => {
  const [lines, setLines] = useState<{ id: string, path: string, color: string, error: boolean, health: string }[]>([]);
  const containerRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const newLines = CONNECTIONS.map(conn => {
        const fromEl = nodeRefs[conn.from];
        const toEl = nodeRefs[conn.to];
        
        if (!fromEl || !toEl) return null;
        
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        
        const x1 = (fromRect.left + fromRect.width / 2) - containerRect.left;
        const y1 = (fromRect.top + fromRect.height / 2) - containerRect.top;
        const x2 = (toRect.left + toRect.width / 2) - containerRect.left;
        const y2 = (toRect.top + toRect.height / 2) - containerRect.top;
        
        // Dynamic color based on health
        const fromHealth = status?.components?.[conn.from]?.status || 'normal';
        const toHealth = status?.components?.[conn.to]?.status || 'normal';
        
        let color = '#2ea043'; // Normal - Green
        let error = false;
        let health = 'normal';
        
        if (fromHealth === 'error' || toHealth === 'error') {
          color = '#f85149'; // Error - Red
          error = true;
          health = 'error';
        } else if (fromHealth === 'warning' || toHealth === 'warning') {
          color = '#d29922'; // Warning - Yellow
          health = 'warning';
        }

        // Calculate a nice curve
        const dx = x2 - x1;
        const cp1x = x1 + dx * 0.4;
        const cp2x = x1 + dx * 0.6;
        const path = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
        
        return { id: `${conn.from}-${conn.to}`, path, color, error, health };
      }).filter(Boolean) as any[];
      
      setLines(newLines);
    };

    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [nodeRefs, status]);

  return (
    <svg ref={containerRef} className="flow-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {lines.map(line => (
        <g key={line.id}>
          <path
            d={line.path}
            fill="none"
            stroke={line.color}
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray={line.error ? "5,5" : "none"}
          />
          <motion.path
            d={line.path}
            fill="none"
            stroke={line.color}
            strokeWidth="2"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: line.error ? [0.2, 0.8, 0.2] : 0.8,
              strokeDashoffset: line.error ? [0, -20] : [100, 0]
            }}
            transition={{ 
              pathLength: { duration: 2, ease: "easeInOut" },
              opacity: { duration: 1.5, repeat: Infinity, ease: "linear" },
              strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" }
            }}
          />
          {/* Animated Data Packets (Points) */}
          {(line.health === 'normal' || line.health === 'warning') && [...Array(3)].map((_, i) => (
            <circle key={i} r="3" fill="#ffffff" filter="url(#glow)">
              <animateMotion
                dur={line.health === 'normal' ? "2s" : "6s"}
                repeatCount="indefinite"
                begin={`${i * (line.health === 'normal' ? 0.6 : 1.8)}s`}
                path={line.path}
              />
            </circle>
          ))}
          {(line.health === 'error') && (
            <circle r="4" fill={line.color} filter="url(#glow)">
              <animateMotion
                dur="0.5s"
                repeatCount="indefinite"
                path={line.path}
              />
            </circle>
          )}
        </g>
      ))}
    </svg>
  );
};

function App() {
  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeCoin, setActiveCoin] = useState(COINS[0]);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('nexus-theme') as 'dark' | 'light') || 'dark';
  });
  const [logs, setLogs] = useState<{ id: number; time: string; text: string; type: 'info' | 'error' | 'warning' }[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<{ time: string, throughput: number, var_usd: number, latency_ms: number, withdrawals: number, affected: number }[]>([]);
  const [postMortem, setPostMortem] = useState<{ scenario: string, minThroughput: number, maxVar: number, maxLatency: number, maxWithdrawals: number, maxAffected: number, durationSec: number } | null>(null);
  const [manualLog, setManualLog] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const failureStartRef = useRef<number | null>(null);

  // Track when failure starts
  useEffect(() => {
    if (status?.active_failure && failureStartRef.current === null) {
      failureStartRef.current = Date.now();
    }
    if (!status?.active_failure) {
      failureStartRef.current = null;
    }
  }, [status?.active_failure]);

  // Theme persistence
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const addLog = (text: string, type: 'info' | 'error' | 'warning' = 'info', isManual: boolean = false) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setManualLog(isManual);
    setLogs(prev => {
      const newLogs = [...prev, { id: Date.now(), time, text, type }];
      return newLogs.slice(-50);
    });
  };

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/status`);
      const newStatus = res.data;
      
      // Check if failure just started
      if (newStatus.active_failure && status && !status.active_failure) {
        addLog(`CRITICAL: Scenario [${newStatus.scenario}] triggered!`, 'error');
        addLog(failureExplanations[newStatus.scenario] || "Unknown failure occurred.", 'warning');
      }
      // Check if resolved
      
      setStatus(newStatus);
      setApiError(null);

      // Record Metrics History
      setMetricsHistory(prev => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = {
          time,
          throughput: newStatus.metrics?.throughput || 0,
          var_usd: newStatus.metrics?.var_usd || 0,
          latency_ms: newStatus.metrics?.latency_ms || 12,
          withdrawals: newStatus.metrics?.withdrawals || 0,
          affected: newStatus.metrics?.affected_count || 0,
        };
        const next = [...prev, entry];
        if (next.length > 30) return next.slice(next.length - 30);
        return next;
      });

    } catch (err: any) {
      if (!status?.active_failure) {
        setApiError(err.response?.data?.detail || err.message);
      }
    }
  };

  const fetchOrderBook = async (symbol: string) => {
    try {
      const res = await axios.get(`${API_BASE}/order-book?coin=${symbol}`);
      setOrderBook(res.data);
      if (res.status === 200 && apiError && apiError.includes('Service Unavailable')) {
        setApiError(null);
      }
    } catch (err: any) {
      if (!apiError && (!status || status.scenario !== 'API Outage')) {
        setApiError(err.response?.data?.detail || err.message);
      }
    }
  };

  useEffect(() => {
    addLog("System starting up... Connecting to matching engine.", 'info');
    fetchStatus();
    fetchOrderBook(activeCoin.symbol);
    const interval = setInterval(() => {
      fetchStatus();
      fetchOrderBook(activeCoin.symbol); // Current coin reference
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCoin]); // Re-bind interval when coin changes to fetch the correct symbol

  useEffect(() => {
    if (!manualLog) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setManualLog(false); // Reset for next automatic update
  }, [logs]);

  const handleNodeClick = (nodeId: string) => {
    const desc = nodeDescriptions[nodeId];
    const state = getNodeState(nodeId);
    addLog(`DIAGNOSTIC [${nodeId.toUpperCase()}]: ${desc} (Status: ${state.toUpperCase()})`, 'info', true);
  };

  const selectCoin = (coin: typeof COINS[0]) => {
    setActiveCoin(coin);
    setDropdownOpen(false);
    fetchOrderBook(coin.symbol);
    addLog(`Switched viewing pair to ${coin.symbol} / USDT.`, 'info');
  };

  const triggerFailure = async (scenario: string) => {
    try {
      await axios.post(`${API_BASE}/trigger-failure?scenario=${encodeURIComponent(scenario)}`);
      fetchStatus();
    } catch (err: any) {}
  };

  const resetSimulation = async () => {
    try {
      if (status?.active_failure && metricsHistory.length > 0) {
        const minThroughput = Math.min(...metricsHistory.map(m => m.throughput));
        const maxVar = Math.max(...metricsHistory.map(m => m.var_usd));
        const maxLatency = Math.max(...metricsHistory.map(m => m.latency_ms));
        const maxWithdrawals = Math.max(...metricsHistory.map(m => m.withdrawals));
        const maxAffected = Math.max(...metricsHistory.map(m => m.affected));
        const durationSec = failureStartRef.current ? Math.round((Date.now() - failureStartRef.current) / 1000) : 0;
        setPostMortem({ scenario: status.scenario, minThroughput, maxVar, maxLatency, maxWithdrawals, maxAffected, durationSec });
      } else {
        setPostMortem(null);
      }
      await axios.post(`${API_BASE}/reset`);
      fetchStatus();
      setMetricsHistory([]);
      addLog(`RESOLVED: System returning to normal operations.`, 'info');
    } catch (err) {}
  };

  const getNodeState = (nodeId: string) => {
    return status?.components?.[nodeId]?.status || 'normal';
  };

  const getNodeHoverText = (nodeId: string) => {
    const baseText = nodeDescriptions[nodeId];
    if (!status?.active_failure) return baseText;
    
    // Add context if failed
    const state = getNodeState(nodeId);
    if (state === 'error' || state === 'warning') {
      return `[${state.toUpperCase()}] ${failureExplanations[status.scenario]}`;
    }
    return baseText;
  };



  return (
    <div className={`app-container ${theme}`}>
      {/* Top Navbar Header */}
      <header className="navbar">
        <div className="nav-brand">
          <Activity className="brand-icon" />
          <h1>Nexus Crypto Simulator</h1>
          {status && (
            <div className={`status-chip ${status.active_failure ? 'chip-failure' : 'chip-normal'}`}>
              <div className="status-dot" />
              {status.scenario}
            </div>
          )}
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="main-content">
        <AnimatePresence>
          {apiError && status?.scenario !== 'API Outage' && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="global-error">
              <TriangleAlert className="error-icon" />
              <span>{apiError}</span>
            </motion.div>
          )}

          {postMortem && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="post-mortem-modal-overlay">
              <div className="post-mortem-modal">
                <button className="close-btn" onClick={() => setPostMortem(null)}>
                  <XCircle size={24} />
                </button>
                <h2>Incident Post-Mortem</h2>
                <div className="pm-content">
                  <p><strong>Event:</strong> {postMortem.scenario}</p>
                  <p className="pm-desc">{failureExplanations[postMortem.scenario]}</p>
                  <div className="pm-stats">
                    <div className="pm-stat-box">
                      <span className="pm-stat-label">Duration</span>
                      <span className="pm-stat-value">{postMortem.durationSec}s</span>
                    </div>
                    <div className="pm-stat-box">
                      <span className="pm-stat-label">Min Throughput</span>
                      <span className="pm-stat-value error">{postMortem.minThroughput} ops/sec</span>
                    </div>
                    <div className="pm-stat-box">
                      <span className="pm-stat-label">Peak Value at Risk</span>
                      <span className="pm-stat-value warning">${postMortem.maxVar.toLocaleString()}</span>
                    </div>
                    <div className="pm-stat-box">
                      <span className="pm-stat-label">Peak Latency</span>
                      <span className="pm-stat-value error">{postMortem.maxLatency > 10000 ? '∞' : postMortem.maxLatency.toFixed(0)} ms</span>
                    </div>
                    <div className="pm-stat-box">
                      <span className="pm-stat-label">Pending Withdrawals</span>
                      <span className="pm-stat-value warning">{postMortem.maxWithdrawals.toLocaleString()}</span>
                    </div>
                    <div className="pm-stat-box">
                      <span className="pm-stat-label">Max Affected</span>
                      <span className="pm-stat-value error">{postMortem.maxAffected}/9 components</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="main-grid">
          {/* Left Side: Pipeline & Chat Logs */}
          <div className="left-panel">
            
            {/* Chaos Control Panel */}
            <section className="chaos-section">
              <div className="section-header chaos-header">
                <h2>Chaos Control Panel</h2>
                <span className="subtitle">Trigger systemic failures to observe propagation</span>
              </div>
              <div className="chaos-grid">
                <button className={`launch-btn ${status?.scenario === 'API Outage' ? 'active' : ''}`} onClick={() => triggerFailure('API Outage')}>
                  <div className="btn-indicator" />
                  <div className="btn-content">
                    <span className="btn-title">API Outage</span>
                    <span className="btn-desc">Gateway down (503)</span>
                  </div>
                </button>
                <button className={`launch-btn ${status?.scenario === 'API DDoS' ? 'active' : ''}`} onClick={() => triggerFailure('API DDoS')}>
                  <div className="btn-indicator" />
                  <div className="btn-content">
                    <span className="btn-title">API DDoS</span>
                    <span className="btn-desc">900% Traffic Surge</span>
                  </div>
                </button>
                <button className={`launch-btn ${status?.scenario === 'Order Book Lag' ? 'active' : ''}`} onClick={() => triggerFailure('Order Book Lag')}>
                  <div className="btn-indicator" />
                  <div className="btn-content">
                    <span className="btn-title">DB Lag</span>
                    <span className="btn-desc">Write ACKs delayed</span>
                  </div>
                </button>
                <button className={`launch-btn ${status?.scenario === 'Liquidity Drain' ? 'active' : ''}`} onClick={() => triggerFailure('Liquidity Drain')}>
                  <div className="btn-indicator" />
                  <div className="btn-content">
                    <span className="btn-title">Liquidity Drain</span>
                    <span className="btn-desc">MM Limit Orders Pulled</span>
                  </div>
                </button>
                <button className={`launch-btn ${status?.scenario === 'Flash Crash' ? 'active' : ''}`} onClick={() => triggerFailure('Flash Crash')}>
                  <div className="btn-indicator" />
                  <div className="btn-content">
                    <span className="btn-title">Flash Crash</span>
                    <span className="btn-desc">Massive Market Sell</span>
                  </div>
                </button>
                <button className={`launch-btn ${status?.scenario === 'Stablecoin Depeg' ? 'active' : ''}`} onClick={() => triggerFailure('Stablecoin Depeg')}>
                  <div className="btn-indicator" />
                  <div className="btn-content">
                    <span className="btn-title">Depeg Event</span>
                    <span className="btn-desc">USDT/USDC unanchored</span>
                  </div>
                </button>
                <button className={`launch-btn ${status?.scenario === 'Wallet Hack' ? 'active' : ''}`} onClick={() => triggerFailure('Wallet Hack')}>
                  <div className="btn-indicator" />
                  <div className="btn-content">
                    <span className="btn-title">Wallet Hack</span>
                    <span className="btn-desc">Hot wallets breached</span>
                  </div>
                </button>
                <button className="recover-btn" onClick={resetSimulation}>
                  <RefreshCw size={18} />
                  <span>EMERGENCY RESET</span>
                </button>
              </div>
            </section>

            {/* System Vital Signs */}
            <section className="metrics-section">
              <div className="section-header">
                <h2><BarChart2 size={18} /> System Vital Signs</h2>
                <span className="subtitle">Live infrastructure telemetry</span>
              </div>

              {/* Hero KPI Cards */}
              <div className="kpi-strip">
                <div className={`kpi-card ${(status?.metrics?.throughput ?? 100) < 30 ? 'kpi-critical' : (status?.metrics?.throughput ?? 100) < 60 ? 'kpi-warn' : 'kpi-ok'}`}>
                  <span className="kpi-label">Throughput</span>
                  <span className="kpi-value">{(status?.metrics?.throughput ?? 100).toFixed(0)}</span>
                  <span className="kpi-unit">ops/sec</span>
                </div>
                <div className={`kpi-card ${(status?.metrics?.var_usd ?? 0) > 1000000 ? 'kpi-critical' : (status?.metrics?.var_usd ?? 0) > 100000 ? 'kpi-warn' : 'kpi-ok'}`}>
                  <span className="kpi-label">Value at Risk</span>
                  <span className="kpi-value">${((status?.metrics?.var_usd ?? 0) / 1000).toFixed(0)}K</span>
                  <span className="kpi-unit">USDT exposure</span>
                </div>
                <div className={`kpi-card ${(status?.metrics?.latency_ms ?? 12) > 3000 ? 'kpi-critical' : (status?.metrics?.latency_ms ?? 12) > 500 ? 'kpi-warn' : 'kpi-ok'}`}>
                  <span className="kpi-label">Latency</span>
                  <span className="kpi-value">{(status?.metrics?.latency_ms ?? 12) > 10000 ? '∞' : (status?.metrics?.latency_ms ?? 12).toFixed(0)}</span>
                  <span className="kpi-unit">ms avg</span>
                </div>
                <div className={`kpi-card ${(status?.metrics?.affected_count ?? 0) > 3 ? 'kpi-critical' : (status?.metrics?.affected_count ?? 0) > 0 ? 'kpi-warn' : 'kpi-ok'}`}>
                  <span className="kpi-label">Affected</span>
                  <span className="kpi-value">{(status?.metrics?.affected_count ?? 0).toFixed(0)}/9</span>
                  <span className="kpi-unit">components</span>
                </div>
                <div className={`kpi-card ${(status?.metrics?.withdrawals ?? 0) > 5000 ? 'kpi-critical' : (status?.metrics?.withdrawals ?? 0) > 0 ? 'kpi-warn' : 'kpi-ok'}`}>
                  <span className="kpi-label">Withdrawals</span>
                  <span className="kpi-value">{(status?.metrics?.withdrawals ?? 0).toLocaleString()}</span>
                  <span className="kpi-unit">pending queue</span>
                </div>
              </div>

              {/* Sparkline Charts */}
              <div className="metrics-charts">
                <div className="chart-container">
                  <span className="chart-title">Throughput (ops/sec)</span>
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={metricsHistory}>
                      <defs>
                        <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#58a6ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <YAxis domain={[0, 'auto']} hide />
                      <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff', borderColor: theme === 'dark' ? '#30363d' : '#d0d7de', color: theme === 'dark' ? '#c9d1d9' : '#1f2328', fontSize: '0.75rem' }} itemStyle={{ color: '#58a6ff' }} />
                      <Line type="monotone" dataKey="throughput" stroke="#58a6ff" strokeWidth={2} dot={false} isAnimationActive={false} fill="url(#throughputGrad)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-container">
                  <span className="chart-title">Value at Risk (USDT)</span>
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={metricsHistory}>
                      <defs>
                        <linearGradient id="varGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d29922" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#d29922" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#161b22' : '#ffffff', borderColor: theme === 'dark' ? '#30363d' : '#d0d7de', color: theme === 'dark' ? '#c9d1d9' : '#1f2328', fontSize: '0.75rem' }} itemStyle={{ color: '#d29922' }} />
                      <Line type="monotone" dataKey="var_usd" stroke="#d29922" strokeWidth={2} dot={false} isAnimationActive={false} fill="url(#varGrad)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Main Screen Data Pipeline */}
            <section className="pipeline-section">
              <div className="section-header">
                <h2>System Architecture Pipeline</h2>
                <span className="subtitle">Hover over nodes for real-time diagnostic explanations</span>
              </div>
              
              <div className={`pipeline-grid ${
                !status?.metrics ? 'latency-normal' :
                status.metrics.throughput < 20 ? 'latency-critical' :
                status.metrics.throughput < 60 ? 'latency-high' : 'latency-normal'
              }`}>
                <FlowLines nodeRefs={nodeRefs.current} status={status} />
                {ZONES.map((zone, zIdx) => (
                  <div key={zone.id} className="zone-container">
                    <div className="zone-label">{zone.name}</div>
                    <div className="zone-nodes">
                      {zone.nodes.map((node) => {
                        const nodeState = getNodeState(node.id);
                        const hoverText = getNodeHoverText(node.id);
                        
                        // Phase 4 Domino Logic
                        const isCollateral = status?.active_failure && nodeState === 'normal';
                        const specialState = 
                          (node.id === 'liquidity' && status?.scenario === 'Wallet Hack') ? 'draining' :
                          (node.id === 'kyc' && status?.scenario === 'Wallet Hack') ? 'lockdown' : '';

                        return (
                          <motion.div 
                            key={node.id} 
                            ref={(el) => {
                              nodeRefs.current[node.id] = el;
                            }}
                            animate={{ 
                              filter: isCollateral ? 'grayscale(0.8) opacity(0.6)' : 'grayscale(0) opacity(1)',
                              scale: isCollateral ? 0.95 : 1
                            }}
                            transition={{ delay: zIdx * 0.2 }}
                            className={`pipeline-node node-${nodeState} state-${specialState}`}
                            onClick={() => handleNodeClick(node.id)}
                          >
                            <div className="node-tooltip">{hoverText}</div>
                            <div className="node-icon-wrapper">
                              <div className="node-status-dot" />
                              <node.icon size={24} className="node-icon" />
                              {specialState === 'lockdown' && <div className="lockdown-overlay">LOCKED</div>}
                            </div>
                            <span className="node-label">{node.label}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Live System Logs (Chatbox) */}
            <section className="logs-section">
              <div className="section-header">
                <h2><MessageSquare size={18} /> Diagnostics Terminal</h2>
              </div>
              <div className="logs-window">
                {logs.map(log => (
                  <div key={log.id} className={`log-entry log-${log.type}`}>
                    <span className="log-time">[{log.time}]</span>
                    <span className="log-text">{log.text}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </section>
          </div>

          {/* Right Side: Floating Order Book */}
          <div className="right-panel">
            <section className="floating-orderbook">
              
              <div className="ob-header">
                {/* Custom Token Dropdown */}
                <div className="token-selector-wrapper" onMouseLeave={() => setDropdownOpen(false)}>
                  <div className="active-token" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <img src={activeCoin.icon} alt={activeCoin.symbol} className="token-icon" onError={(e) => { e.currentTarget.src = '/icons/btc.svg' }} />
                    <div className="token-info">
                      <h2>{activeCoin.symbol} / USDT</h2>
                      <span className="subtitle">{activeCoin.name}</span>
                    </div>
                    <ChevronDown size={20} className="dropdown-arrow" />
                  </div>
                  
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="token-dropdown"
                      >
                        {COINS.map(c => (
                          <div key={c.symbol} className="token-item" onClick={() => selectCoin(c)}>
                            <img src={c.icon} alt={c.symbol} onError={(e) => { e.currentTarget.src = '/icons/btc.svg' }} />
                            <span>{c.symbol}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="ob-inner">
                <div className="ob-header-row">
                  <span>Price (USDT)</span>
                  <span>Amount ({activeCoin.symbol})</span>
                </div>
                
                <div className="ob-section asks">
                  {orderBook?.asks.slice().reverse().slice(-14).map((ask) => (
                    <div key={`${ask.id}-${ask.price}`} className="ob-row ask-row">
                      <span className="price">{ask.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: (activeCoin.symbol === 'PEPE' ? 8 : 4) })}</span>
                      <span className="volume">{ask.volume.toFixed(4)}</span>
                      <div className="depth-bar ask-depth" style={{ width: `${Math.min(ask.volume * 15, 100)}%` }} />
                    </div>
                  ))}
                </div>

                <div className="ob-spread">
                  <span className="spread-label">Spread</span>
                  {orderBook && orderBook.asks.length && orderBook.bids.length ? (
                    <span className="spread-value">
                      {(orderBook.asks[0].price - orderBook.bids[0].price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: (activeCoin.symbol === 'PEPE' ? 8 : 4) })}
                    </span>
                  ) : <span className="spread-value">N/A</span>}
                </div>

                <div className="ob-section bids">
                  {orderBook?.bids.slice(0, 14).map((bid) => (
                    <div key={`${bid.id}-${bid.price}`} className="ob-row bid-row">
                      <span className="price">{bid.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: (activeCoin.symbol === 'PEPE' ? 8 : 4) })}</span>
                      <span className="volume">{bid.volume.toFixed(4)}</span>
                      <div className="depth-bar bid-depth" style={{ width: `${Math.min(bid.volume * 15, 100)}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
