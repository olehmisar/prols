import { CurrencyAmount, type Currency } from "@uniswap/sdk-core";
import { Decimal } from "decimal.js";
import { ethers } from "ethers";
import type { L2Token } from "./aztec-currency";

export function currencyAmountToDecimal(amount: CurrencyAmount<Currency>) {
  return new Decimal(amount.quotient.toString()).div(
    new Decimal(10).pow(amount.currency.decimals),
  );
}

export function currencyAmountToBigInt(amount: CurrencyAmount<Currency>) {
  return BigInt(amount.quotient.toString());
}

export function currencyAmountToBinanceAmount(
  amount: CurrencyAmount<Currency>,
) {
  return {
    symbol: amount.currency.symbol!,
    amount: currencyAmountToDecimal(amount),
  };
}

/**
 * Converts user input to a CurrencyAmount. Takes into account the token's decimals.
 * E.g., for a token with 9 decimals, `"1.23"` becomes `CurrencyAmount(1230000000)`.
 *
 */
export function parseCurrencyAmount<T extends L2Token>(
  token: T,
  userAmount: string | number,
): CurrencyAmount<T> {
  let rawAmount: bigint;
  try {
    rawAmount = ethers.parseUnits(userAmount.toString(), token.decimals);
  } catch (e) {
    throw new Error(`${userAmount} is too small or too large.`);
  }
  if (rawAmount === 0n && userAmount !== "0") {
    throw new Error(`${userAmount} is too small`);
  }
  return CurrencyAmount.fromRawAmount(token, rawAmount.toString());
}
