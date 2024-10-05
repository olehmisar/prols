contract ProlsRouter {
    use aztec::prelude::{AztecAddress};
    use token::Token;

    #[aztec(private)]
    fn settle(
        sell_token: AztecAddress,
        buy_token: AztecAddress,
        sell_amount: Field,
        buy_amount: Field,
        secret_hash: Field,
        nonce: Field,
    ) {
        Token::at(buy_token).shield(context.this_address(), buy_amount, secret_hash, 0);
        Token::at(sell_token).unshield(context.msg_sender(), context.this_address(), sell_amount, nonce);
    }

    #[aztec(private)]
    fn withdraw(token: AztecAddress, amount: Field, to: AztecAddress) {
        Token::at(token).transfer_public(context.this_address(), to, amount, 0);
    }
}
