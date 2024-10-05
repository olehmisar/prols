import {
  AccountWallet,
  AztecAddress,
  computeSecretHash,
  ExtendedNote,
  Fr,
  Note,
  TxHash,
} from "@aztec/aztec.js";
import { CurrencyAmount } from "@uniswap/sdk-core";
import ky from "ky";
import type { L2Token } from "./aztec-currency";
import { addresses, ProlsRouterContract, TokenContract } from "./contracts";
import { CurrencyListService } from "./currency-list";
import { tokenContract } from "./index";
import { currencyAmountToBigInt } from "./utils";

export class ProlsFrontendService {
  constructor(private routerAddress: AztecAddress) {}

  async getQuote({
    amountIn,
    currencyOut,
  }: {
    amountIn: CurrencyAmount<L2Token>;
    currencyOut: L2Token;
  }) {
    const amountOutResp = await ky
      .post("/quote", {
        json: {
          amountIn: amountIn.quotient.toString(),
          amountInSymbol: amountIn.currency.symbol,
          amountOutSymbol: currencyOut.symbol,
        },
      })
      .json<{ amountOut: string }>();

    return CurrencyAmount.fromRawAmount(currencyOut, amountOutResp.amountOut);
  }

  async swap(account: AccountWallet, quote: Quote) {
    const secret = Fr.random();
    const secretHash = computeSecretHash(secret);
    const nonce = Fr.random();
    const router = await this.#getRouter(account);
    const swapTx = await router.methods
      .swap(
        AztecAddress.fromString(quote.amountIn.currency.address),
        AztecAddress.fromString(quote.amountOut.currency.address),
        currencyAmountToBigInt(quote.amountIn),
        currencyAmountToBigInt(quote.amountOut),
        secretHash,
        nonce,
      )
      .send()
      .wait();

    return await this.redeemShield({
      account,
      amount: quote.amountOut,
      secret,
      txHash: swapTx.txHash,
    });
  }

  async redeemShield({
    txHash,
    account,
    amount,
    secret,
  }: {
    txHash: TxHash;
    account: AccountWallet;
    amount: CurrencyAmount<L2Token>;
    secret: Fr;
  }) {
    const secretHash = computeSecretHash(secret);
    const note = new Note([new Fr(currencyAmountToBigInt(amount)), secretHash]);
    await account.addNote(
      new ExtendedNote(
        note,
        account.getAddress(),
        AztecAddress.fromString(amount.currency.address),
        TokenContract.storage.pending_shields.slot,
        TokenContract.notes.TransparentNote.id,
        txHash,
      ),
    );
    const contract = await tokenContract(
      AztecAddress.fromString(amount.currency.address),
      account,
    );
    return await contract.methods
      .redeem_shield(
        account.getAddress(),
        currencyAmountToBigInt(amount),
        secret,
      )
      .send()
      .wait();
  }

  async mintPrivateAndRedeem({
    minter,
    to,
    amount,
  }: {
    minter: AccountWallet;
    to: AccountWallet;
    amount: CurrencyAmount<L2Token>;
  }) {
    const secret = Fr.random();
    const secretHash = computeSecretHash(secret);

    const receipt = await (
      await tokenContract(
        AztecAddress.fromString(amount.currency.address),
        minter,
      )
    ).methods
      .mint_private(currencyAmountToBigInt(amount), secretHash)
      .send()
      .wait();

    await this.redeemShield({
      account: to,
      amount,
      secret,
      txHash: receipt.txHash,
    });
  }

  async #getRouter(account: AccountWallet) {
    return await ProlsRouterContract.at(this.routerAddress, account);
  }
}

export function createFrontendSdk(routerAddress = addresses.prolsRouter) {
  const currencyList = new CurrencyListService();
  const prols = new ProlsFrontendService(routerAddress);
  return {
    prols,
    currencyList,
  };
}

type Quote = {
  amountIn: CurrencyAmount<L2Token>;
  amountOut: CurrencyAmount<L2Token>;
};
