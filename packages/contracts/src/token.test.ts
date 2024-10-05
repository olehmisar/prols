import { getInitialTestAccountsWallets } from '@aztec/accounts/testing';
import { AccountWallet, createPXEClient } from '@aztec/aztec.js';
import { assert } from 'ts-essentials';
import { describe, it, expect, beforeAll } from 'vitest';
import { TokenContract } from './contracts.js';

describe('Token Contract', () => {
    let alice: AccountWallet, bob: AccountWallet;
    let token: TokenContract;

    beforeAll(async () => {
        const pxe = createPXEClient("http://localhost:8080");

        [alice, bob] = await getInitialTestAccountsWallets(pxe);
        assert(bob && alice)

        token = await TokenContract.deploy(alice, alice?.getAddress(), "USDC", "USDC", 18).send().deployed();
    });

    it('should mint tokens', async () => {
        await token.methods.mint_public(bob.getAddress(), 100n).send().wait()

        expect(await token.methods.balance_of_public(bob.getAddress()).simulate()).toBe(100n)
    });

    it('should transfer tokens', async () => {
        await token.withWallet(bob).methods.transfer_public(bob.getAddress(), alice.getAddress(), 10n, 0).send().wait();

        expect(await token.methods.balance_of_public(alice.getAddress()).simulate()).toBe(10n)
        expect(await token.methods.balance_of_public(bob.getAddress()).simulate()).toBe(90n)

    });
});
