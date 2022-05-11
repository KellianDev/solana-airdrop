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
exports.Session = exports.Cache = void 0;
const fs_1 = __importDefault(require("fs"));
const utils_1 = require("./utils");
const web3_js_1 = require("@solana/web3.js");
class Cache {
    constructor(environment) {
        if (environment.cache && environment.cache.accounts.length > 0)
            this.retrieve(environment.cache);
        else
            this.generate(environment);
        console.log(`${utils_1.COLORS.YELLOW}[LOG] Accounts to airdrop: ${utils_1.STYLES.BOLD}${this.getAirdropsLeft()}${utils_1.STYLES.RESET}`);
        console.log(`${utils_1.COLORS.YELLOW}[LOG] Total amount to airdrop: ${utils_1.STYLES.BOLD}${this.data.totalAmountLeft} SOL${utils_1.STYLES.RESET}`);
    }
    retrieve(rawCache) {
        console.log(`${utils_1.COLORS.GREEN}[LOG] Found a cache, resuming airdrop session.`);
        this.data = rawCache;
    }
    generate(environment) {
        console.log(`${utils_1.COLORS.GREEN}[LOG] No cache, starting new airdrop session.`);
        const pubkeys = [];
        let data = {
            totalAmountLeft: 0,
            accounts: []
        };
        environment.list.forEach(pubkey => {
            if (pubkeys.indexOf(pubkey) == -1) {
                pubkeys.push(pubkey);
                data.accounts.push({ pubkey: pubkey, amountLeft: environment.airdropAmount });
            }
            else {
                data.accounts[data.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft += environment.airdropAmount;
                data.accounts[data.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft = parseFloat(data.accounts[data.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft.toFixed(9));
            }
            data.totalAmountLeft += environment.airdropAmount;
        });
        this.data = data;
        this.data.totalAmountLeft = parseFloat(this.data.totalAmountLeft.toFixed(9));
    }
    airdropProcessed(pubkey) {
        this.data.totalAmountLeft -= this.data.accounts[this.data.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft;
        this.data.totalAmountLeft = parseFloat(this.data.totalAmountLeft.toFixed(9));
        this.data.accounts[this.data.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft = 0;
    }
    getAirdropsLeft() {
        let total = 0;
        this.data.accounts.forEach(account => account.amountLeft > 0 ? total++ : {});
        return total;
    }
    getAirdropsDone() {
        let total = 0;
        this.data.accounts.forEach(account => account.amountLeft == 0 ? total++ : {});
        return total;
    }
    save() {
        try {
            fs_1.default.writeFileSync('./cache.json', JSON.stringify(this.data));
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.Cache = Cache;
class Session {
    constructor(environment) {
        this.environment = environment;
        this.cache = new Cache(environment);
    }
    airdrop(pubkey, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = new web3_js_1.Transaction();
                transaction.feePayer = this.environment.keypair.publicKey;
                transaction.add(web3_js_1.SystemProgram.transfer({
                    fromPubkey: this.environment.keypair.publicKey,
                    toPubkey: new web3_js_1.PublicKey(pubkey),
                    lamports: web3_js_1.LAMPORTS_PER_SOL * amount
                }));
                const signature = yield (0, web3_js_1.sendAndConfirmTransaction)(this.environment.connection, transaction, [this.environment.keypair]);
                return { signature: signature };
            }
            catch (err) {
                return { error: `[ERR] Tx failed. ${err}` };
            }
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cache.save();
            for (const account of this.cache.data.accounts) {
                if (account.amountLeft != 0) {
                    const { signature, error } = yield this.airdrop(account.pubkey, account.amountLeft);
                    if (!error) {
                        console.log(`${utils_1.COLORS.BLUE}[LOG] Tx succeeded. ${signature}`);
                        console.log(`${utils_1.COLORS.BLUE}[LOG] Recipient pubkey. ${account.pubkey}`);
                        console.log(`${utils_1.COLORS.BLUE}[LOG] Amount received. ${utils_1.STYLES.BOLD}${account.amountLeft} SOL${utils_1.STYLES.RESET}`);
                        this.cache.airdropProcessed(account.pubkey);
                        console.log(`${utils_1.COLORS.GREEN}${utils_1.STYLES.BOLD}[${((this.cache.getAirdropsDone() / this.cache.data.accounts.length) * 100).toFixed(2)}%]${utils_1.STYLES.RESET}`);
                    }
                    else {
                        console.log(`${utils_1.COLORS.RED}${error}`);
                    }
                    this.cache.save();
                }
            }
        });
    }
}
exports.Session = Session;
//# sourceMappingURL=Session.js.map