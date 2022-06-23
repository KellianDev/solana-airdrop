import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Environment } from "./Environment";
import { Session } from "./Session";
import { COLORS, STYLES } from "./utils";
import prompts from "prompts";

async function airdrop() {
    const environment = new Environment();
    const { success, error } = await environment.setup();

    if(!success) return console.log(`${STYLES.BOLD}error${STYLES.RESET}`);

    const session = new Session(environment);
    
    const balance = await environment.connection!.getBalance(environment.keypair!.publicKey);
    console.log(`${COLORS.BLUE}[LOG] Current balance: ${STYLES.BOLD}${(balance/LAMPORTS_PER_SOL).toFixed(3)} SOL${STYLES.RESET}`);

    if(balance/LAMPORTS_PER_SOL <= session.cache.data!.totalAmountLeft) return console.log(`${STYLES.BOLD}${COLORS.RED}[!] Balance too low. (need ${session.cache.data!.totalAmountLeft-balance/LAMPORTS_PER_SOL} more SOL)${STYLES.RESET}`);
    console.log(`${COLORS.BLUE}[LOG] Balance after airdrop: ${STYLES.BOLD}${(balance/LAMPORTS_PER_SOL-session.cache.data!.totalAmountLeft).toFixed(3)} SOL${STYLES.RESET}`);

    const response = await prompts({
        type: `confirm`,
        name: `confirmed`,
        message: `${COLORS.YELLOW}Confirm airdrop`,
        initial: false,
    })

    if(!response.confirmed) return console.log(`${COLORS.YELLOW}[LOG] Canceling airdrop session...`);

    await session.start();
}

airdrop().then(()=>{
    console.log(`${COLORS.MAGENTA}${STYLES.BOLD}[KellianDev] Hope you had a great time airdropping!${COLORS.WHITE}${STYLES.RESET}`);
    process.exit();
});
