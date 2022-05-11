import { Environment } from "./Environment";
import fs from "fs";
import { COLORS, STYLES } from "./utils";
import { LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";

export type CacheData = {
    totalAmountLeft: number,
    accounts: {pubkey: string, amountLeft: number}[];
}

export class Cache {
    data: CacheData | undefined

    constructor(environment: Environment) {

        if(environment.cache && environment.cache.accounts.length > 0) this.retrieve(environment.cache);
        else this.generate(environment);

        console.log(`${COLORS.YELLOW}[LOG] Accounts to airdrop: ${STYLES.BOLD}${this.getAirdropsLeft()}${STYLES.RESET}`);

        console.log(`${COLORS.YELLOW}[LOG] Total amount to airdrop: ${STYLES.BOLD}${this.data!.totalAmountLeft} SOL${STYLES.RESET}`);
    }

    retrieve(rawCache: any) {
        console.log(`${COLORS.GREEN}[LOG] Found a cache, resuming airdrop session.`);

        this.data = rawCache;
    }

    generate(environment: Environment) {
        console.log(`${COLORS.GREEN}[LOG] No cache, starting new airdrop session.`);

        const pubkeys: Array<string> = [];

        let data: CacheData = {
            totalAmountLeft: 0,
            accounts: []
        };

        (environment.list as Array<string>).forEach(pubkey => {
            if(pubkeys.indexOf(pubkey) == -1) {
                pubkeys.push(pubkey);
                data.accounts.push({pubkey: pubkey, amountLeft: environment.airdropAmount!});
            }else{
                data.accounts[data.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft+=environment.airdropAmount!;
                data.accounts[data.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft = parseFloat(data.accounts[data.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft.toFixed(9));
            }
            data.totalAmountLeft += environment.airdropAmount!;
        });
        
        this.data = data;
        this.data!.totalAmountLeft = parseFloat(this.data!.totalAmountLeft.toFixed(9));

    }

    airdropProcessed(pubkey: string) {
        this.data!.totalAmountLeft -= this.data!.accounts[this.data!.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft;
        this.data!.totalAmountLeft = parseFloat(this.data!.totalAmountLeft.toFixed(9));
        this.data!.accounts[this.data!.accounts.findIndex(account => account.pubkey == pubkey)].amountLeft = 0;
        
    }

    getAirdropsLeft(): number {
        let total = 0;
        this.data!.accounts.forEach(account => account.amountLeft > 0 ? total++ : {});
        return total;
    }

    getAirdropsDone(): number {
        let total = 0;
        this.data!.accounts.forEach(account => account.amountLeft == 0 ? total++ : {});
        return total;
    }

    save(): boolean {
        try{
            fs.writeFileSync('./cache.json', JSON.stringify(this.data));
        }catch(err){
            return false;
        }

        return true;
    }
}

export class Session {
    environment: Environment

    cache: Cache

    constructor(environment: Environment) {
        this.environment = environment;

        this.cache = new Cache(environment);
        
    }

    async airdrop(pubkey: string, amount: number) {
        try {
            const transaction = new Transaction();
            transaction.feePayer = this.environment.keypair!.publicKey;
            transaction.add(SystemProgram.transfer({
                fromPubkey: this.environment.keypair!.publicKey,
                toPubkey: new PublicKey(pubkey),
                lamports: LAMPORTS_PER_SOL*amount
            }));
    
            const signature = await sendAndConfirmTransaction(
                this.environment.connection!,
                transaction,
                [this.environment.keypair!],
            );
    
            return {signature: signature};
        }catch(err){
            return {error: `[ERR] Tx failed. ${err}`};
        }
    }

    async start() {
        this.cache.save();

        for(const account of this.cache.data!.accounts) {
            if(account.amountLeft != 0) {
                const {signature, error} = await this.airdrop(account.pubkey, account.amountLeft);

                if(!error) {
                    console.log(`${COLORS.BLUE}[LOG] Tx succeeded. ${signature}`);
                    console.log(`${COLORS.BLUE}[LOG] Recipient pubkey. ${account.pubkey}`);
                    console.log(`${COLORS.BLUE}[LOG] Amount received. ${STYLES.BOLD}${account.amountLeft} SOL${STYLES.RESET}`);
                    this.cache.airdropProcessed(account.pubkey);
                    console.log(`${COLORS.GREEN}${STYLES.BOLD}[${((this.cache.getAirdropsDone()/this.cache.data!.accounts.length)*100).toFixed(2)}%]${STYLES.RESET}`);
                }else{
                    console.log(`${COLORS.RED}${error}`);
                }
    
                this.cache.save();
            }
        }
    }
}