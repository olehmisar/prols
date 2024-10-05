import type { Currency, CurrencyAmount } from "@uniswap/sdk-core";
import { Decimal } from "decimal.js";

export function currencyAmountToDecimal(amount: CurrencyAmount<Currency>) {
  return new Decimal(amount.quotient.toString()).div(
    new Decimal(10).pow(amount.currency.decimals),
  );
}

export function toBinanceAmount(amount: CurrencyAmount<Currency>) {
  return {
    symbol: amount.currency.symbol!,
    amount: currencyAmountToDecimal(amount),
  };
}
