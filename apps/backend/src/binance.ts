import { Decimal } from "decimal.js";

export class Binance {
  #balances = new Map<string, Map<string, Decimal>>();

  async depositIfNewAccount(accountId: string) {
    const exists = this.#balances.has(accountId);
    if (exists) {
      return;
    }
    const balances = await this.#defaultBalances();
    balances.set("ETH", new Decimal(2000000));
    balances.set("USDT", new Decimal(1000000000));
    this.#balances.set(accountId, balances);
  }

  async getBalances(accountId: string) {
    const balances =
      this.#balances.get(accountId) ?? (await this.#defaultBalances());
    return balances;
  }

  async trade(
    accountId: string,
    amountIn: BinanceAmount,
    amountOut: BinanceAmount,
  ) {
    const balances = await this.getBalances(accountId);

    const balanceIn = balances.get(amountIn.symbol) ?? new Decimal(0);
    if (balanceIn < amountIn.amount) {
      throw new Error(`Insufficient balance for ${amountIn.symbol}`);
    }
    balances.set(amountIn.symbol, balanceIn.sub(amountIn.amount));

    const balanceOut = balances.get(amountOut.symbol) ?? new Decimal(0);
    balances.set(amountOut.symbol, balanceOut.add(amountOut.amount));

    console.log("new balances on binance", balances);
  }

  async #defaultBalances() {
    return new Map<string, Decimal>();
  }
}

export type BinanceAmount = {
  symbol: string;
  amount: Decimal;
};
