import { getInitialTestAccountsWallets } from '@aztec/accounts/testing';
import { AccountWallet, computeSecretHash, createPXEClient, ExtendedNote, Fr, Note, type PXE } from '@aztec/aztec.js';
import { assert } from 'ts-essentials';
import { describe, it, expect, beforeAll } from 'vitest';
import { TokenContract } from './contracts.js';
import { ProlsRouterContract } from './contracts/prols_router/target/ProlsRouter.js';

describe('Token Contract', () => {
    let alice: AccountWallet, bob: AccountWallet, admin: AccountWallet;
    let usdc: TokenContract, eth: TokenContract, prolsRouter: ProlsRouterContract;
    let pxe: PXE;


    beforeAll(async () => {
        pxe = createPXEClient("http://localhost:8080");

        [admin, alice, bob] = await getInitialTestAccountsWallets(pxe);
        assert(bob && alice && admin)

        usdc = await TokenContract.deploy(admin, admin?.getAddress(), "USDC", "USDC", 6).send().deployed();
    });

    it('should mint tokens', async () => {
        await usdc.methods.mint_public(bob.getAddress(), 100n).send().wait()

        expect(await usdc.methods.balance_of_public(bob.getAddress()).simulate()).toBe(100n)
    });

    it('should transfer tokens', async () => {
        await usdc.withWallet(bob).methods.transfer_public(bob.getAddress(), alice.getAddress(), 10n, 0).send().wait();

        expect(await usdc.methods.balance_of_public(alice.getAddress()).simulate()).toBe(10n)
        expect(await usdc.methods.balance_of_public(bob.getAddress()).simulate()).toBe(90n)

    });

    describe('ProlsRouter', () => {
        beforeAll(async () => {
            eth = await TokenContract.deploy(alice, alice?.getAddress(), "ETH", "ETH", 9).send().deployed();

            prolsRouter = await ProlsRouterContract.deploy(admin).send().deployed();
        })

        it('should swap', async () => {
            const secret = Fr.random();
            const secretHash = computeSecretHash(secret);
            const nonce = Fr.random();
            bob.createAuthWit({
                caller: bob.getAddress(), action:
                    usdc.methods.unshield(bob.getAddress(), prolsRouter.address, 20, nonce).request()
            })

            // Token:: at(sell_token).unshield(context.msg_sender(), context.this_address(), sell_amount, nonce);
            await eth.methods.mint_public(prolsRouter.address, 100n).send().wait();

            const receipt = await prolsRouter.withWallet(bob).methods.
                swap(usdc.address, eth.address, 20, new Fr(1), secretHash, 0).send().wait();


            const note = new Note([new Fr(1), secretHash])

            await pxe.addNote(
                new ExtendedNote(
                    note,
                    bob.getAddress(),
                    eth.address,
                    TokenContract.storage.pending_shields.slot,
                    TokenContract.notes.TransparentNote.id,
                    receipt.txHash
                )
            );

            await eth.withWallet(bob).methods.redeem_shield(bob.getAddress(), 1, secret).send().wait();

            expect(await eth.methods.balance_of_private(bob.getAddress()).simulate()).toBe(1n)

        });
    })
})


