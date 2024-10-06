import { AztecAddress } from "@aztec/aztec.js";
import _ from "lodash";

export { ProlsRouterContract } from "./contracts/prols_router/target/ProlsRouter";
export { TokenContract } from "./contracts/token/target/Token";

export const addresses = _.mapValues(
  {
    USDT: '0x0d076c11eefab774af0466711c1df28b97ca21e9a44546b1c92093b8e7f9508c',
    ETH: '0x1fb16e0433224cc1c3c1be292069db7ad8ab189173e064eff80af2ec221e7ee7',
    prolsRouter: '0x27a4ca3c3d186b4b05f2e44b2e94ba41ec6ebba2e34345cb0b1e76ad1530f5bf'
  },
  (a) => AztecAddress.fromString(a),
);
