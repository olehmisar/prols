import { AztecAddress } from "@aztec/aztec.js";
import _ from "lodash";

export { ProlsRouterContract } from "./contracts/prols_router/target/ProlsRouter";
export { TokenContract } from "./contracts/token/target/Token";

export const addresses = _.mapValues(
  {
    USDT: '0x244a5ae682f0ddcd7a4cd5542230b3042ac05febcfb54d2fba018ce1f390ef85',
    ETH: '0x0ceccda494fb24dadcea55c58a9a3977bc54e8ce3419dd5a21d0f3391a491870',
    prolsRouter: '0x009310317e7e9da58ada7271fda6272b57a76e3975c81499738c6a94f664e3f6'
  },
  (a) => AztecAddress.fromString(a),
);
