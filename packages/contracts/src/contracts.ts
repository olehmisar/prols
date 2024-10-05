import { AztecAddress } from "@aztec/aztec.js";
import _ from "lodash";

export { ProlsRouterContract } from "./contracts/prols_router/target/ProlsRouter";
export { TokenContract } from "./contracts/token/target/Token";

export const addresses = _.mapValues(
  {
    USDT: "0x03f854726e0defe02be1d5fa44166e1f0a5aaa2cef85d42b1f03080d9cee2f45",
    ETH: "0x05da7151e480509d054b5457fa139da3b7149a1b10faaf08793776d38fde4ba8",
    prolsRouter:
      "0x0c9fda146ea2bb20edecb35bcb08be7e9e5d5aa326da01b12481302891faf31e",
  },
  (a) => AztecAddress.fromString(a),
);
