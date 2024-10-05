contract ProlsRouter {
    use aztec::prelude::AztecAddress;
    use token::Token;

    #[aztec(private)]
    fn swap(
        sell_token: AztecAddress,
        buy_token: AztecAddress,
        sell_amount: Field,
        buy_amount: Field,
        secret_hash: Field,
        nonce: Field
    ) {
        // TODO: check that quote is coming from the admin: recoverPublicKey(poseidon2([sell_token, buy_token, sell_amount, buy_amount]), signature) == admin

        Token::at(sell_token).unshield(
            context.msg_sender(),
            context.this_address(),
            sell_amount,
            nonce
        ).call(&mut context);
        Token::at(buy_token).shield(context.this_address(), buy_amount, secret_hash, 0).enqueue(&mut context);
    }

    #[aztec(public)]
    fn withdraw(token: AztecAddress, amount: Field, to: AztecAddress) {
        // TODO assert is admin
        Token::at(token).transfer_public(context.this_address(), to, amount, 0).call(&mut context);
    }
}
