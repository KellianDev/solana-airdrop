"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const Environment_1 = require("./Environment");
const Session_1 = require("./Session");
const utils_1 = require("./utils");
const prompts_1 = __importDefault(require("prompts"));
function airdrop() {
    return __awaiter(this, void 0, void 0, function* () {
        const environment = new Environment_1.Environment();
        const { success, error } = yield environment.setup();
        if (!success)
            return console.log(`${utils_1.STYLES.BOLD}error${utils_1.STYLES.RESET}`);
        const session = new Session_1.Session(environment);
        const balance = yield environment.connection.getBalance(environment.keypair.publicKey);
        console.log(`${utils_1.COLORS.BLUE}[LOG] Current balance: ${utils_1.STYLES.BOLD}${(balance / web3_js_1.LAMPORTS_PER_SOL).toFixed(3)} SOL${utils_1.STYLES.RESET}`);
        if (balance / web3_js_1.LAMPORTS_PER_SOL <= session.cache.data.totalAmountLeft)
            return console.log(`${utils_1.STYLES.BOLD}${utils_1.COLORS.RED}[!] Balance too low. (need ${session.cache.data.totalAmountLeft - balance / web3_js_1.LAMPORTS_PER_SOL} more SOL)${utils_1.STYLES.RESET}`);
        console.log(`${utils_1.COLORS.BLUE}[LOG] Balance after airdrop: ${utils_1.STYLES.BOLD}${(balance / web3_js_1.LAMPORTS_PER_SOL - session.cache.data.totalAmountLeft).toFixed(3)} SOL${utils_1.STYLES.RESET}`);
        const response = yield (0, prompts_1.default)({
            type: `confirm`,
            name: `confirmed`,
            message: `${utils_1.COLORS.YELLOW}Confirm airdrop`,
            initial: false,
        });
        if (!response.confirmed)
            return console.log(`${utils_1.COLORS.YELLOW}[LOG] Canceling airdrop session...`);
        yield session.start();
    });
}
airdrop().then(() => {
    console.log(`${utils_1.COLORS.MAGENTA}${utils_1.STYLES.BOLD}[KellianDev] Hope you had a great time airdropping! If you're willing to support me, here's my addy!${utils_1.COLORS.WHITE}${utils_1.STYLES.RESET}`);
    console.log(`${utils_1.COLORS.MAGENTA}${utils_1.STYLES.BOLD}[KellianDev] KELLMni8U7HoUK6pKqCcKDJDxDsUuhEMqdUcgyLFHRk${utils_1.COLORS.WHITE}${utils_1.STYLES.RESET}`);
});
//# sourceMappingURL=index.js.map