import { Connection, Keypair } from "@solana/web3.js";
import base58 from "bs58";
import dotenv from "dotenv";
import { COLORS } from "./utils";
import fs from "fs";
import path from "path";

export class Environment {
    public keypair: Keypair | undefined

    public airdropAmount: number | undefined
    
    public list: any;
    public cache: any;
    public connection: Connection | undefined

    constructor() {
        dotenv.config();
    }

    async setup(): Promise<{success: boolean, error: string | undefined}> {

        try{
            this.keypair = Keypair.fromSecretKey(base58.decode(process.env.SECRET_KEY!));
        }catch(err){
            return {success: false, error: `${COLORS.RED}[!] Invalid secret key.`}
        }

        this.airdropAmount = parseFloat(process.env.AMOUNT!);
        if(!this.airdropAmount) return {success: false, error: `${COLORS.RED}[!] Invalid airdrop amount (undefined or zero).`}

        try{
            this.connection = new Connection(process.env.RPC_URL!, {
                confirmTransactionInitialTimeout: 500000,
            });
            await this.connection.getLatestBlockhash();
        }catch(err){
            return {success: false, error: `${COLORS.RED}[!] Could not connect to RPC endpoint ${process.env.RPC_URL!}, retry or change RPC endpoint.`}
        }

        try{
            this.list = JSON.parse(fs.readFileSync(path.join(process.env.ACCOUNT_LIST_PATH!)).toString());
            if(this.list.length == 0) return {success: false, error: `${COLORS.RED}[!] The account list in ${process.env.ACCOUNT_LIST_PATH} is empty.`}
        }catch(err){
            return {success: false, error: `${COLORS.RED}[!] Could not find a .json formatted account list in ${process.env.ACCOUNT_LIST_PATH}.`}
        }

        try {
            this.cache = JSON.parse(fs.readFileSync(path.join('./cache.json')).toString());
        }catch(err){}

        return {success: true, error: undefined};
    }
}
