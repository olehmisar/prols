import _ from "lodash";
import type { L2Token } from "./aztec-currency.js";

export class CurrencyListService {
  #currencies: L2Token[] = [];

  async addCurrencies(currencies: L2Token[]) {
    this.#currencies = _.uniqWith(
      [...this.#currencies, ...currencies],
      (a, b) => a.equals(b),
    );
  }

  getBySymbol(symbol: string) {
    return this.#currencies.find((c) => c.symbol === symbol);
  }
}
