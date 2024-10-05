import { currencyAmountToBinanceAmount, type L2Token } from "@repo/contracts";
import { CurrencyAmount } from "@uniswap/sdk-core";
import { Decimal } from "decimal.js";
import ky from "ky";
import { assert } from "ts-essentials";
import type { Binance } from "./binance";

export class ProlsBackendService {
  constructor(
    private binance: Binance,
    private managerAccountId: string,
  ) {}

  async hedge({
    amountIn,
    amountOut,
  }: {
    amountIn: CurrencyAmount<L2Token>;
    amountOut: CurrencyAmount<L2Token>;
  }) {
    await this.binance.trade(
      this.managerAccountId,
      currencyAmountToBinanceAmount(amountIn),
      currencyAmountToBinanceAmount(amountOut),
    );
  }

  async getQuote({
    amountIn,
    currencyOut,
  }: {
    amountIn: CurrencyAmount<L2Token>;
    currencyOut: L2Token;
  }) {
    assert(
      amountIn.currency.symbol || currencyOut.symbol,
      "One of tokens must be USDT",
    );
    const isInverted = amountIn.currency.symbol === "USDT";
    const ticker = isInverted
      ? `${currencyOut.symbol}USDT`
      : `${amountIn.currency.symbol}USDT`;

    // get price from binance api
    const response = await ky
      .get("https://api.binance.com/api/v3/ticker/price", {
        searchParams: {
          symbol: ticker,
        },
      })
      .json<{ price: string }>();
    const price = new Decimal(response.price);
    console.log("price", ticker, price);
    const amountInDecimal = new Decimal(amountIn.quotient.toString()).div(
      new Decimal(10).pow(amountIn.currency.decimals),
    );
    const amountOutDecimal = !isInverted
      ? amountInDecimal.mul(price)
      : amountInDecimal.div(price);
    return CurrencyAmount.fromRawAmount(
      currencyOut,
      amountOutDecimal
        .mul(new Decimal(10).pow(currencyOut.decimals))
        .toFixed(0),
    );
  }
}
