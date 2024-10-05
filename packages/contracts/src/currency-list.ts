import _ from "lodash";
import { L2Token } from "./aztec-currency";
import { addresses } from "./contracts";

export class CurrencyListService {
  #currencies: L2Token[] = [];

  constructor() {
    this.addCurrencies([
      new L2Token(0, addresses.USDT.toString(), 6, "USDT"),
      new L2Token(0, addresses.ETH.toString(), 9, "ETH"),
    ]);
  }

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
