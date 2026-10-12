"""Refresh NIFTY 50 constituent histories for a private personal-use workflow."""

from __future__ import annotations

import csv
import io
import json
import math
import os
import tempfile
import time
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ROSTER_PATH = DATA_DIR / "nifty50.json"
CONSTITUENTS_URL = "https://www.niftyindices.com/IndexConstituent/ind_nifty50list.csv"
OVERLAP_DAYS = 7
CURRENT_DAYS = 10
MAX_ATTEMPTS = 3
STATE_PATH = DATA_DIR / "nifty50_update_state.json"


def fetch_constituents() -> list[str]:
    request = urllib.request.Request(
        CONSTITUENTS_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; Nifty50DataUpdater/1.0)",
            "Accept": "text/csv,*/*",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        text = response.read().decode("utf-8-sig")

    rows = csv.DictReader(io.StringIO(text))
    symbols = [row["Symbol"].strip() for row in rows if row.get("Symbol")]
    if len(symbols) != 50 or len(set(symbols)) != 50:
        raise RuntimeError(
            f"Expected 50 unique NIFTY 50 symbols from the official CSV; got {len(symbols)}"
        )
    return symbols


def read_price_file(path: Path, nested: bool) -> dict[str, float]:
    if not path.exists():
        return {}

    with path.open("r", encoding="utf-8") as file:
        content: Any = json.load(file)

    prices = content.get("prices", {}) if nested else content
    if not isinstance(prices, dict):
        raise ValueError(f"Invalid price map in {path}")

    result: dict[str, float] = {}
    for price_date, raw_price in prices.items():
        try:
            value = float(raw_price)
            date.fromisoformat(price_date)
        except (TypeError, ValueError):
            continue
        if math.isfinite(value) and value > 0:
            result[price_date] = value
    return result


def download_prices(symbol: str, start_date: date | None) -> dict[str, float]:
    try:
        import yfinance as yf
    except ImportError as error:
        raise RuntimeError("Install yfinance before running this updater") from error

    ticker = f"{symbol}.NS"
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            options: dict[str, Any] = {
                "interval": "1d",
                "auto_adjust": False,
                "actions": False,
                "timeout": 30,
                "raise_errors": True,
            }
            if start_date is None:
                options["period"] = "max"
            else:
                options["start"] = start_date.isoformat()

            history = yf.Ticker(ticker).history(**options)
            if history.empty or "Close" not in history:
                raise RuntimeError(f"Yahoo returned no daily closing prices for {ticker}")

            prices: dict[str, float] = {}
            for timestamp, row in history.iterrows():
                try:
                    close = float(row["Close"])
                except (TypeError, ValueError):
                    continue
                if math.isfinite(close) and close > 0:
                    price_date = timestamp.date().isoformat()
                    prices[price_date] = close

            if not prices:
                raise RuntimeError(f"Yahoo returned no valid closing prices for {ticker}")
            return prices
        except Exception as error:
            if attempt == MAX_ATTEMPTS:
                raise RuntimeError(f"Failed to fetch {ticker}: {error}") from error
            delay = 2**attempt
            print(f"Retry {attempt}/{MAX_ATTEMPTS - 1} for {ticker} in {delay}s: {error}")
            time.sleep(delay)

    raise RuntimeError(f"Failed to fetch {ticker}")


def write_json_atomic(path: Path, content: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=path.parent, delete=False
        ) as file:
            json.dump(content, file, indent=2)
            file.write("\n")
            temp_path = file.name
        os.replace(temp_path, path)
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


def update_data(force_backfill: bool = False) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    symbols = fetch_constituents()
    backfill_all = force_backfill or not STATE_PATH.exists()
    histories: dict[str, dict[str, float]] = {}
    current_prices: dict[str, dict[str, float]] = {}
    latest_dates: dict[str, str] = {}

    for index, symbol in enumerate(symbols):
        history_path = DATA_DIR / f"{symbol}_history.json"
        current_path = DATA_DIR / f"{symbol}_current.json"
        stored_history = read_price_file(history_path, nested=True)
        stored_current = read_price_file(current_path, nested=False)
        merged = {**stored_history, **stored_current}

        start_date = None
        if stored_history and not backfill_all:
            latest_stored = date.fromisoformat(max(merged))
            start_date = latest_stored - timedelta(days=OVERLAP_DAYS)

        fetched = download_prices(symbol, start_date)
        merged.update(fetched)
        if not merged:
            raise RuntimeError(f"No history available for current NIFTY 50 constituent {symbol}")

        histories[symbol] = merged
        sorted_dates = sorted(merged)
        current_prices[symbol] = {
            price_date: merged[price_date]
            for price_date in sorted_dates[-CURRENT_DAYS:]
        }
        latest_dates[symbol] = sorted_dates[-1]
        print(f"{index + 1}/50 {symbol}: latest close {latest_dates[symbol]}")
        time.sleep(0.25)

    if len(histories) != 50:
        raise RuntimeError(f"Refusing to write incomplete roster: got {len(histories)} histories")

    for symbol in symbols:
        write_json_atomic(
            DATA_DIR / f"{symbol}_history.json",
            {"symbol": symbol, "prices": histories[symbol]},
        )
        write_json_atomic(DATA_DIR / f"{symbol}_current.json", current_prices[symbol])

    write_json_atomic(ROSTER_PATH, symbols)
    write_json_atomic(
        STATE_PATH,
        {
            "full_backfill_complete": True,
            "symbols": symbols,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    latest_overall = max(latest_dates.values())
    print(f"Updated all 50 current constituents. Latest available close: {latest_overall}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Update NIFTY 50 daily price histories")
    parser.add_argument(
        "--full-backfill",
        action="store_true",
        help="Fetch maximum available history for all 50 symbols",
    )
    args = parser.parse_args()
    update_data(force_backfill=args.full_backfill)
