const fs = require('fs');
const web3 = require('@solana/web3.js');
const bs58 = require('bs58');
const dotenv = require('dotenv');
const prompts = require('prompts');

const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";
const WHITE = "\x1b[37m";

const BRIGHT = "\x1b[1m";
const RESET = "\x1b[0m";

async function setupEnvironment() {
    dotenv.config();

    let amount = parseFloat(process.env.AMOUNT) || 0;
    let wallet_list_url = process.env.ACCOUNT_LIST;
    let keypair;

    try{
        keypair = web3.Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));
    }catch(err){}

    const connection = new web3.Connection(process.env.RPC_URL);

    try {  
        await connection.getLatestBlockhash('finalized');
    }catch(err){
        return {error: `Could not establish RPC Connection with ${process.env.RPC_URL}`};
    }

    if(!keypair) return {error: `Invalid secret key.`};

    if(amount == 0) return {error: `Airdrop amount is either invalid or was set to 0.`};

    let wallet_list;
    let cache_list;

    try {
        wallet_list = JSON.parse(fs.readFileSync(wallet_list_url));

        if(wallet_list.length == 0) return {error: 'Wallet list contains no wallet.'}

    }catch(err){
        return {error: `Could not load wallet list (must be .json)`}
    }

    try {
        cache_list = JSON.parse(fs.readFileSync('./cache.json'));
    }catch(err){}

    return {
        connection: connection,
        wallet_list: wallet_list,
        cache_list: cache_list,
        keypair: keypair,
        amount: amount,
    }
}

function getLogs() {
    return JSON.parse(fs.readFileSync('./logs.json'));
}

function writeLogs(logs) {
    fs.writeFileSync('./logs.json', JSON.stringify(logs));
}

function setupSession(wallet_list, cache_list, amount) {
    if(!cache_list) {
        console.log(GREEN, `[LOG] No cache, starting new airdrop session.`);
        console.log(BLUE, `[LOG] Accounts to airdrop: ${BRIGHT}${wallet_list.length}${RESET}`);
        console.log(BLUE, `[LOG] Total amount to airdrop: ${BRIGHT}${wallet_list.length*amount} SOL${RESET}`);
        writeLogs([]);
        return wallet_list;
    }

    if(!cache_list.wallets.length) {
        console.log(GREEN, `[LOG] Empty cache, starting new airdrop session.`);
        console.log(BLUE, `[LOG] Accounts to airdrop: ${BRIGHT}${wallet_list.length}${RESET}`);
        console.log(BLUE, `[LOG] Total amount to airdrop: ${BRIGHT}${wallet_list.length*amount} SOL${RESET}`);
        writeLogs([]);
        return wallet_list;
    }

    console.log(GREEN, `[LOG] Found a cache, resuming airdrop session.`);
    console.log(BLUE, `[LOG] Accounts to airdrop: ${BRIGHT}${cache_list.wallets.length}${RESET}`);
    console.log(BLUE, `[LOG] Total amount to airdrop: ${BRIGHT}${cache_list.wallets.length*cache_list.amount} SOL${RESET}`);

    return cache_list.wallets;
}

function writeCache(airdrop_list, amount) {
    const cache = {
        amount: amount,
        wallets: airdrop_list
    };

    fs.writeFileSync('./cache.json', JSON.stringify(cache));
}

function deleteCache() {
    fs.unlinkSync('./cache.json');
}

async function airdrop(connection, keypair, wallet, amount) {
    try {
        const transaction = new web3.Transaction();
        transaction.feePayer = keypair.publicKey;
        transaction.add(web3.SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new web3.PublicKey(wallet),
            lamports: web3.LAMPORTS_PER_SOL*amount
        }));

        signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair]
        );

        if(!signature) return {error: `[ERR] Tx failed.`};

        return {signature: signature};
    }catch(err){
        return {error: `[ERR] Tx failed.`};
    }
}

async function startAirdrops(connection, keypair, airdrop_list, amount) {
    let cache = [...airdrop_list];
    let logs = getLogs();

    let index = 0;
    let i = 0;

    for(const wallet of airdrop_list) {
        const {signature, error} = await airdrop(connection, keypair, wallet, amount);
        if(signature){
            i++;
            
            cache.splice(index, 1);
            writeCache(cache, amount);
            console.log(BLUE, `[LOG] Tx succeeded. ${signature}`);
            console.log(GREEN, `[${((i/airdrop_list.length)*100).toFixed(2)}%] Last account airdropped: ${wallet}`);
            
            logs.push({timestamp: Date.now(), wallet: wallet, amount: amount, success: true, signature: signature});
        }else{
            console.log(RED, error);
            logs.push({timestamp: Date.now(), wallet: wallet, amount: amount, success: false});
        }

        writeLogs(logs);

        index++;
    }


    return i;
}

async function beginAirdropSession() {
    const {connection, wallet_list, cache_list, keypair, amount, error} = await setupEnvironment();

    if(error != undefined) return console.log(RED, `[ERR] ${error}`);

    airdrop_list = setupSession(wallet_list, cache_list, amount);
    
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(BLUE, `[LOG] Current balance: ${BRIGHT}${(balance/web3.LAMPORTS_PER_SOL).toFixed(3)} SOL${RESET}`);

    if(balance/web3.LAMPORTS_PER_SOL-amount*airdrop_list.length <= 0) return console.log(RED, `[ERR] Balance too low.`);

    console.log(BLUE, `[LOG] Balance after airdrop: ${BRIGHT}${(balance/web3.LAMPORTS_PER_SOL-amount*airdrop_list.length).toFixed(3)} SOL${RESET}`);

    const response = await prompts({
        type: `confirm`,
        name: `confirmed`,
        message: `${YELLOW}Confirm airdrop`,
        initial: false,
    })

    if(!response.confirmed) return console.log(YELLOW, `[LOG] Canceling airdrop session...`);

    writeCache(airdrop_list, amount);

    const successes = await startAirdrops(connection, keypair, airdrop_list, amount);
    
    if(successes != airdrop_list.length) return console.log(RED, `[LOG] Only ${successes} of ${airdrop_list.length} airdrops succeeded due to Tx failing. ${YELLOW}Run 'npm run airdrop' to complete the airdrop.`);
    else {
        console.log(GREEN, `${BRIGHT}[LOG] All airdrops succeeded. (logs.json)${RESET}`);
        deleteCache();
    }
}

console.log(YELLOW, `${BRIGHT}[WARNING] This script is not responsible for any Tx failing. Consider using a custom RPC.${RESET}`)
beginAirdropSession().then(()=>{
    console.log(MAGENTA, `${BRIGHT}[KellianDev] Hope you had a great time airdropping! If you're willing to support me, here's my addy!`);
    console.log(MAGENTA, `[KellianDev] KELLMni8U7HoUK6pKqCcKDJDxDsUuhEMqdUcgyLFHRk${WHITE}${RESET}`);
});
