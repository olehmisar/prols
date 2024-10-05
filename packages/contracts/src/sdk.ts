import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import {
  AccountWallet,
  AztecAddress,
  computeSecretHash,
  createPXEClient,
  ExtendedNote,
  Fr,
  Note,
  TxHash,
  type PXE,
} from "@aztec/aztec.js";
import { CurrencyAmount } from "@uniswap/sdk-core";
import ky from "ky";
import type { L2Token } from "./aztec-currency";
import { addresses, ProlsRouterContract, TokenContract } from "./contracts";
import { CurrencyListService } from "./currency-list";
import { tokenContract } from "./index";
import { currencyAmountToBigInt } from "./utils";

export const API_URL = "http://localhost:3000";

export class ProlsFrontendService {
  readonly pxe: PXE;
  constructor(readonly routerAddress: AztecAddress) {
    this.pxe = createPXEClient("https://sandbox.shieldswap.org");
  }

  async connectWallet() {
    const accounts = await getInitialTestAccountsWallets(this.pxe);
    return accounts[1]!;
  }

  async getQuote({
    amountIn,
    currencyOut,
  }: {
    amountIn: CurrencyAmount<L2Token>;
    currencyOut: L2Token;
  }): Promise<Quote> {
    const amountOutResp = await ky
      .post(API_URL + "/quote", {
        json: {
          amountIn: amountIn.quotient.toString(),
          amountInSymbol: amountIn.currency.symbol,
          amountOutSymbol: currencyOut.symbol,
        },
      })
      .json<{ amountOut: string }>();

    const amountOut = CurrencyAmount.fromRawAmount(
      currencyOut,
      amountOutResp.amountOut,
    );
    return {
      amountIn,
      amountOut,
    };
  }

  async getBinanceBalances() {
    const res = await ky
      .get(`${API_URL}/binance-balances`)
      .json<{ [symbol: string]: string }>();
    return res;
  }

  async balanceOfPrivate(account: AccountWallet, token: L2Token) {
    const raw = await (
      await tokenContract(AztecAddress.fromString(token.address), account)
    ).methods
      .balance_of_private(account.getAddress())
      .simulate();
    return CurrencyAmount.fromRawAmount(token, raw.toString());
  }

  async balanceOfPublic(account: AztecAddress, token: L2Token) {
    const raw = await (
      await tokenContract(
        AztecAddress.fromString(token.address),
        await this.connectWallet(),
      )
    ).methods
      .balance_of_public(account)
      .simulate();
    return CurrencyAmount.fromRawAmount(token, raw.toString());
  }

  async swap(account: AccountWallet, quote: Quote) {
    const secret = Fr.random();
    const secretHash = computeSecretHash(secret);
    const nonce = Fr.random();
    const router = await this.#getRouter(account);

    await account.createAuthWit({
      caller: router.address,
      action: (
        await tokenContract(
          AztecAddress.fromString(quote.amountIn.currency.address),
          account,
        )
      ).methods
        .unshield(
          account.getAddress(),
          router.address,
          currencyAmountToBigInt(quote.amountIn),
          nonce,
        )
        .request(),
    });
    const swapTx = await router
      .withWallet(account)
      .methods.swap(
        AztecAddress.fromString(quote.amountIn.currency.address),
        AztecAddress.fromString(quote.amountOut.currency.address),
        currencyAmountToBigInt(quote.amountIn),
        currencyAmountToBigInt(quote.amountOut),
        secretHash,
        nonce,
      )
      .send()
      .wait();

    setTimeout(async () => {
      // background job

      // ideally, backend should monitor the blockchain for swaps and create a hedging position. But we don't have time for that, so we trust user to be honest and notify us about the swap
      await ky.post(API_URL + "/hedge", {
        json: {
          amountIn: quote.amountIn.quotient.toString(),
          amountInSymbol: quote.amountIn.currency.symbol,
          amountOut: quote.amountOut.quotient.toString(),
          amountOutSymbol: quote.amountOut.currency.symbol,
        },
      });
    }, 0);

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
    minter?: AccountWallet;
    to: AccountWallet;
    amount: CurrencyAmount<L2Token>;
  }) {
    minter ??= await this.getAdmin();

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

  async mintPublic({
    to,
    amount,
  }: {
    to: AztecAddress;
    amount: CurrencyAmount<L2Token>;
  }) {
    const token = await tokenContract(
      AztecAddress.fromString(amount.currency.address),
      await this.getAdmin(),
    );
    return await token.methods
      .mint_public(to, currencyAmountToBigInt(amount))
      .send()
      .wait();
  }

  async #getRouter(account: AccountWallet) {
    return await ProlsRouterContract.at(this.routerAddress, account);
  }

  async getAdmin() {
    const accounts = await getInitialTestAccountsWallets(this.pxe);
    return accounts[0]!;
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

export type Quote = {
  amountIn: CurrencyAmount<L2Token>;
  amountOut: CurrencyAmount<L2Token>;
};
