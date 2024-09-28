# Sonic Odyssey Bot

Sonic Odyssey Bot is an application designed for interacting with the Sonic Odyssey platform. It supports multiple features including sending SOL (Solana) cryptocurrency transactions, claiming rewards, opening mystery boxes, and daily login operations.

## Features

- **Transaction Sending**: Sends SOL transactions from multiple accounts to random addresses or predefined addresses.
- **Claim Box**: Automates the process of claiming rewards boxes.
- **Open Box**: Automates the process of opening mystery boxes.
- **Daily Login**: Automates the daily login process.
- **Input Methods**: Supports input via seed phrases or private keys.
- **Random Address Generation**: Generates a specified number of random addresses for sending transactions.
- **Adjustable Amount of SOL**: Allows users to specify the amount of SOL to send in each transaction.
- **Transaction Delay**: Allows users to specify a delay between each transaction.

## Prerequisites

- Node.js installed on your machine
- `npm` or `yarn` package manager

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/prettyanita348/sonic-bot.git
   ```

2. Navigate into the project directory:

   ```bash
   cd sonic-bot
   ```

3. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

4. Prepare input files:

   - Create `accounts.json` with an array of seed phrases.
   - Create `privateKeys.json` with an array of private keys (base58 encoded).

   Example `accounts.json`:
   ```json
   [
     "seed_phrase_1",
     "seed_phrase_2"
   ]
   ```

   Example `privateKeys.json`:
   ```json
   [
     "base58_private_key_1",
     "base58_private_key_2"
   ]
   ```

## Usage

Run the bot using Node.js:

```bash
npm start
```

or

```bash
npm run claim
```


Run the Script:

1. When running the script, the user will be prompted to choose between using predefined addresses or generating random
ones. Afterward, the transfer process will proceed as specified.
2. Predefined Addresses File:

Create a predefinedAddresses.json file with an array of addresses, for example:
json
Copy code
[
  "YourAddress1Here",
  "YourAddress2Here",
  ...
]
## Generating random Addresses Enter the amount of SOL to send in each transaction.
3. Enter the delay between each transaction in milliseconds (default is 1000ms).
4. Workflow:
User selects the network (devnet or testnet).
User chooses the action (dailyClaim, dailyLogin, or mysteryBox opening).
The script executes the action across all private keys.
After completion, the user can either perform another action or exit.

## Key Insights:
The bot is useful for automating tasks related to the Sonic game on the Solana network, 
including managing mystery box rewards and daily check-ins.
Extensive use of Solana blockchain functionalities, like signing transactions and sending them over the network.
The program includes robust error handling to ensure smooth execution, even in the face of network or API failures.
This script would be suitable for someone managing multiple Solana accounts to automate their game-related activities.
It also integrates with the game's testnet based on the selected network.

##Donations
🌟 Join Us on This Journey! 🌟

We believe in the power of community and the magic that happens when people come together for a common cause. 
Your support means the world to us and helps us bring this project to life. 
If you feel inspired to contribute to our mission and help us grow, you can make a donation using the addresses below. Every contribution, no matter how small, brings us one step closer to achieving our vision. Thank you for being a part of our journey!

💖 Donate Today:

Solana: FgorTbSeoqBFXvS8QnxEza6kvp5npWr8e3x7J33dghpv
EVM: 0x84C049034E8399847B0E35c7d2Cd364CE2bB8096
Bitcoin: bc1q8uk50v6ts424uaswqyaa403jhdjhztwyllwyha
With your generosity, we can create something truly special together! Thank you for your support! 🌈


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.