import urllib.request
import os

coins = [
    {'symbol': 'BTC', 'url': 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=032'},
    {'symbol': 'ETH', 'url': 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=032'},
    {'symbol': 'USDT', 'url': 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=032'},
    {'symbol': 'USDC', 'url': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=032'},
    {'symbol': 'SOL', 'url': 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=032'},
    {'symbol': 'XRP', 'url': 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=032'},
    {'symbol': 'BNB', 'url': 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=032'},
    {'symbol': 'LINK', 'url': 'https://cryptologos.cc/logos/chainlink-link-logo.svg?v=032'},
    {'symbol': 'AVAX', 'url': 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=032'},
    {'symbol': 'BCH', 'url': 'https://cryptologos.cc/logos/bitcoin-cash-bch-logo.svg?v=032'},
    {'symbol': 'LTC', 'url': 'https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=032'},
    {'symbol': 'PEPE', 'url': 'https://cryptologos.cc/logos/pepe-pepe-logo.svg?v=032'},
    {'symbol': 'SUI', 'url': 'https://cryptologos.cc/logos/sui-sui-logo.svg?v=032'},
    {'symbol': 'TRX', 'url': 'https://cryptologos.cc/logos/tron-trx-logo.svg?v=032'},
    {'symbol': 'DOGE', 'url': 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=032'},
    {'symbol': 'HYPE', 'url': 'https://cryptologos.cc/logos/hyperliquid-hype-logo.svg?v=035'}
]

out_dir = r'c:\Users\yashraj.parmar\Desktop\Crypto-exchange-failure-simulator\frontend\public\icons'
os.makedirs(out_dir, exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

for c in coins:
    try:
        req = urllib.request.Request(c['url'], headers=headers)
        with urllib.request.urlopen(req) as response:
            data = response.read()
        
        path = os.path.join(out_dir, f"{c['symbol'].lower()}.svg")
        with open(path, 'wb') as f:
            f.write(data)
        print(f"Downloaded {c['symbol']}")
    except Exception as e:
        print(f"Failed {c['symbol']}: {e}")
