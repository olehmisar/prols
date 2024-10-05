import {
  AccountWallet,
  AztecAddress,
  computeSecretHash,
  ExtendedNote,
  Fr,
  Note,
  TxHash,
} from "@aztec/aztec.js";
import type { CurrencyAmount } from "@uniswap/sdk-core";
import type { L2Token } from "./aztec-currency.js";
import { ProlsRouterContract, TokenContract } from "./contracts.js";
import { tokenContract } from "./index.js";
import { currencyAmountToBigInt } from "./utils.js";

export class ProlsFrontendService {
  constructor(private routerAddress: AztecAddress) {}

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

export function createFrontendSdk(prolsRouterAddress: AztecAddress) {
  return {
    prols: new ProlsFrontendService(prolsRouterAddress),
  };
}

type Quote = {
  amountIn: CurrencyAmount<L2Token>;
  amountOut: CurrencyAmount<L2Token>;
};
