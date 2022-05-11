# Solana airdrop by KellianDev

This script was created to airdrop a list of solana accounts with a specified amount of solana.

## How to use

### 1. Install and build

The simplest way to use it is to clone the repository and to run:
```bash
npm install
```

```bash
npm run build
```

### 2. Configure

You can then modify the configuration in the ```.env``` file:<br>
`SECRET_KEY`: This is the secret key of the account that will run the airdrop<br>
`RPC_URL`: This is the RPC connection that will be used to run transactions<br>
`ACCOUNT_LIST`: This is the path to the list of account that you are airdropping (.json)<br>
`AMOUNT`: This is the amount (in ◎) each account will be airdropped.<br>

### 3. Airdrop

After configuring your airdrop session, just run:
```bash
npm run airdrop
```

## Support me

Hope you will have a great time airdropping! If you're willing to support me, here my addy! KELLMni8U7HoUK6pKqCcKDJDxDsUuhEMqdUcgyLFHRk