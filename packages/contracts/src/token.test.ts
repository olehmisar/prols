import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import {
  AccountWallet,
  computeSecretHash,
  createPXEClient,
  ExtendedNote,
  Fr,
  Note,
  type PXE,
} from "@aztec/aztec.js";
import { assert } from "ts-essentials";
import { beforeAll, describe, expect, it } from "vitest";
import { L2Token } from "./aztec-currency.js";
import { TokenContract } from "./contracts.js";
import { ProlsRouterContract } from "./contracts/prols_router/target/ProlsRouter.js";
import { createFrontendSdk } from "./sdk.js";
import { parseCurrencyAmount } from "./utils.js";

describe("Token Contract", () => {
  let alice: AccountWallet, bob: AccountWallet, admin: AccountWallet;
  let usdc: TokenContract, eth: TokenContract, prolsRouter: ProlsRouterContract;
  let pxe: PXE;

  beforeAll(async () => {
    pxe = createPXEClient("http://localhost:8080");

    [admin, alice, bob] = await getInitialTestAccountsWallets(pxe);
    assert(bob && alice && admin);

    usdc = await TokenContract.deploy(
      admin,
      admin?.getAddress(),
      "USDC",
      "USDC",
      6,
    )
      .send()
      .deployed();
  });

  it("should mint tokens", async () => {
    await usdc.methods.mint_public(bob.getAddress(), 100n).send().wait();

    expect(
      await usdc.methods.balance_of_public(bob.getAddress()).simulate(),
    ).toBe(100n);
  });

  it.skip("should transfer tokens", async () => {
    await usdc
      .withWallet(bob)
      .methods.transfer_public(bob.getAddress(), alice.getAddress(), 10n, 0)
      .send()
      .wait();

    expect(
      await usdc.methods.balance_of_public(alice.getAddress()).simulate(),
    ).toBe(10n);
    expect(
      await usdc.methods.balance_of_public(bob.getAddress()).simulate(),
    ).toBe(90n);
  });

  describe("ProlsRouter", () => {
    let sdk: ReturnType<typeof createFrontendSdk>;
    beforeAll(async () => {
      eth = await TokenContract.deploy(
        alice,
        alice?.getAddress(),
        "ETH",
        "ETH",
        9,
      )
        .send()
        .deployed();

      prolsRouter = await ProlsRouterContract.deploy(admin).send().deployed();
      sdk = createFrontendSdk(prolsRouter.address);
    });

    it("should swap", async () => {
      const secret = Fr.random();
      const secretHash = computeSecretHash(secret);
      const nonce = Fr.random();

      const usdcAsCurrency = new L2Token(
        0,
        usdc.address.toString(),
        Number(await usdc.methods.public_get_decimals().simulate()),
        "USDC",
      );
      await sdk.prols.mintPrivateAndRedeem({
        minter: admin,
        to: bob,
        amount: parseCurrencyAmount(usdcAsCurrency, "10"),
      });
      await eth.methods.mint_public(prolsRouter.address, 100n).send().wait();

      await bob.createAuthWit({
        caller: prolsRouter.address,
        action: usdc.methods
          .unshield(bob.getAddress(), prolsRouter.address, 20, nonce)
          .request(),
      });
      const receipt = await prolsRouter
        .withWallet(bob)
        .methods.swap(usdc.address, eth.address, 20, 1, secretHash, nonce)
        .send()
        .wait();
      console.log("status", receipt.status);

      const note = new Note([new Fr(1), secretHash]);
      const extendedNote = new ExtendedNote(
        note,
        bob.getAddress(),
        eth.address,
        TokenContract.storage.pending_shields.slot,
        TokenContract.notes.TransparentNote.id,
        receipt.txHash,
      );
      await pxe.addNote(extendedNote, bob.getAddress());

      await eth
        .withWallet(bob)
        .methods.redeem_shield(bob.getAddress(), 1, secret)
        .send()
        .wait();

      expect(
        await eth.methods.balance_of_private(bob.getAddress()).simulate(),
      ).toBe(1n);
    });
  });
});
