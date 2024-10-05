import type { BaseCurrency } from "@uniswap/sdk-core/dist/entities/baseCurrency";
import invariant from "tiny-invariant";

export abstract class L2BaseCurrency implements BaseCurrency {
  abstract readonly isNative: boolean;
  abstract readonly isToken: boolean;
  constructor(
    readonly chainId: number, // TODO: when Aztec has this
    readonly decimals: number,
    readonly symbol?: string,
    readonly name?: string,
  ) {
    invariant(Number.isSafeInteger(this.chainId), "CHAIN_ID");
    invariant(
      decimals >= 0 && decimals < 255 && Number.isInteger(decimals),
      "DECIMALS",
    );
  }

  abstract equals(other: L2BaseCurrency): boolean;

  abstract get wrapped(): L2Token;
}

export class L2Token extends L2BaseCurrency {
  isNative = false as const;
  isToken = true as const;
  constructor(
    readonly chainId: number,
    readonly address: string,
    decimals: number,
    symbol?: string,
    name?: string,
  ) {
    super(chainId, decimals, symbol, name);
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   * @param other other token to compare
   */
  public equals(other: L2Token): boolean {
    return (
      other.isToken &&
      this.chainId === other.chainId &&
      this.address.toLowerCase() === other.address.toLowerCase()
    );
  }

  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  public sortsBefore(other: L2Token): boolean {
    invariant(this.chainId === other.chainId, "CHAIN_IDS");
    const thisAddress = this.address.toString().toLowerCase();
    const otherAddress = other.address.toString().toLowerCase();
    invariant(thisAddress !== otherAddress, "ADDRESSES");
    return thisAddress < otherAddress;
  }

  get wrapped() {
    return this;
  }
}
