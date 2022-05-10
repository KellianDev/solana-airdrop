const fs = require('fs');
const web3 = require('@solana/web3.js');
const bs58 = require('bs58')
const dotenv = require('dotenv');

dotenv.config();

const list = fs.readFileSync(process.env.AIRDROP_LIST);
const json = JSON.parse(list);

let logs = [];
let err = [];

const amount = parseInt(process.env.AMOUNT)

async function run(json) {
    const connection = new web3.Connection(process.env.RPC_URL);
    const keypair = web3.Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

    let i = 0;
    const length = json.length;

    for(const wallet of json) {

        const transaction = new web3.Transaction();
        transaction.feePayer = keypair.publicKey;
        transaction.add(web3.SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new web3.PublicKey(wallet),
            lamports: web3.LAMPORTS_PER_SOL*AMOUNT
        }));

        const signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair]
        );

        if(!signature) {
            err.push(wallet);
            console.log(`Wallet: ${wallet} | Failed. | ${((i/length)*100).toFixed(2)}% Completed.`);
        }else{
            i++;
            logs.push({wallet: wallet, signature: signature});
            console.log(`Wallet: ${wallet} | Success. | ${((i/length)*100).toFixed(2)}% Completed.`);
        }
    }
}

run(json);

fs.writeFileSync('err.json', JSON.stringify(err));
fs.writeFileSync('logs.json', JSON.stringify(logs));