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
exports.Environment = void 0;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("./utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Environment {
    constructor() {
        dotenv_1.default.config();
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.keypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(process.env.SECRET_KEY));
            }
            catch (err) {
                return { success: false, error: `${utils_1.COLORS.RED}[!] Invalid secret key.` };
            }
            this.airdropAmount = parseFloat(process.env.AMOUNT);
            if (!this.airdropAmount)
                return { success: false, error: `${utils_1.COLORS.RED}[!] Invalid airdrop amount (undefined or zero).` };
            try {
                this.connection = new web3_js_1.Connection(process.env.RPC_URL, {
                    confirmTransactionInitialTimeout: 120000,
                });
                yield this.connection.getLatestBlockhash();
            }
            catch (err) {
                return { success: false, error: `${utils_1.COLORS.RED}[!] Could not connect to RPC endpoint ${process.env.RPC_URL}, retry or change RPC endpoint.` };
            }
            try {
                this.list = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.env.ACCOUNT_LIST_PATH)).toString());
                if (this.list.length == 0)
                    return { success: false, error: `${utils_1.COLORS.RED}[!] The account list in ${process.env.ACCOUNT_LIST_PATH} is empty.` };
            }
            catch (err) {
                return { success: false, error: `${utils_1.COLORS.RED}[!] Could not find a .json formatted account list in ${process.env.ACCOUNT_LIST_PATH}.` };
            }
            try {
                this.cache = JSON.parse(fs_1.default.readFileSync(path_1.default.join('./cache.json')).toString());
            }
            catch (err) { }
            return { success: true, error: undefined };
        });
    }
}
exports.Environment = Environment;
//# sourceMappingURL=Environment.js.map