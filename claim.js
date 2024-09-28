const fs = require('fs');
require('colors');
const solana = require('@solana/web3.js');
const axios = require('axios').default;
const base58 = require('bs58');
const nacl = require('tweetnacl');
const { getConnection, delay, getNetType, setNetType } = require('./src/solanaUtils');
const { HEADERS } = require('./src/headers');
const { displayHeader, getNetworkTypeFromUser } = require('./src/displayUtils');
const readlineSync = require('readline-sync');
const moment = require('moment');

const PRIVATE_KEYS = JSON.parse(fs.readFileSync('privateKeys.json', 'utf-8'));

const apiBaseUrl = 'https://odyssey-api-beta.sonic.game';
var connection;

function getKeypair(privateKey) {
  const decodedPrivateKey = base58.decode(privateKey);
  return solana.Keypair.fromSecretKey(decodedPrivateKey);
}

async function getToken(privateKey) {
  try {
    const { data } = await axios({
      url:
        apiBaseUrl +
        (getNetType() == 2 ? '/testnet' : '/devnet') +  // Modifying for devnet/testnet
        '/auth/sonic/challenge',
      params: {
        wallet: getKeypair(privateKey).publicKey,
      },
      headers: HEADERS,
    });

    const sign = nacl.sign.detached(
      Buffer.from(data.data),
      getKeypair(privateKey).secretKey
    );

    const signature = Buffer.from(sign).toString('base64');
    const publicKey = getKeypair(privateKey).publicKey;
    const encodedPublicKey = Buffer.from(publicKey.toBytes()).toString(
      'base64'
    );

    const response = await axios({
      url:
        apiBaseUrl +
        (getNetType() == 2 ? '/testnet' : '/devnet') +  // Modifying for devnet/testnet
        '/auth/sonic/authorize',
      method: 'POST',
      headers: HEADERS,
      data: {
        address: publicKey,
        address_encoded: encodedPublicKey,
        signature,
      },
    });

    return response.data.data.token;
  } catch (error) {
    console.log(`Error fetching token: ${error}`.red);
  }
}

async function getProfile(token) {
  try {
    const { data } = await axios({
      url:
        apiBaseUrl +
        (getNetType() == 2 ? '/testnet' : '/devnet') +  // Modifying for devnet/testnet
        '/user/rewards/info',
      method: 'GET',
      headers: { ...HEADERS, Authorization: token },
    });

    return data.data;
  } catch (error) {
    console.log(`Error fetching profile: ${error}`.red);
  }
}

async function doTransactions(tx, keypair, retries = 3) {
  try {
    const bufferTransaction = tx.serialize();
    const signature = await connection.sendRawTransaction(bufferTransaction);
    await connection.confirmTransaction(signature);

    return signature;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying transaction... (${retries} retries left)`.yellow);
      await new Promise((res) => setTimeout(res, 1000));

      return doTransactions(tx, keypair, retries - 1);
    } else {
      console.log(`Error in transaction: ${error}`.red);
      throw error;
    }
  }
}

async function openMysteryBox(token, keypair, retries = 3) {
  try {
    const { data } = await axios({
      url:
        apiBaseUrl +
        (getNetType() == 2 ? '/testnet' : '/devnet') +  // Modifying for devnet/testnet
        '/user/rewards/mystery-box/build-tx',
      method: 'GET',
      headers: { ...HEADERS, Authorization: token },
    });

    const txBuffer = Buffer.from(data.data.hash, 'base64');
    const tx = solana.Transaction.from(txBuffer);

    tx.partialSign(keypair);

    const signature = await doTransactions(tx, keypair);

    const response = await axios({
      url:
        apiBaseUrl +
        (getNetType() == 2 ? '/testnet' : '/devnet') +  // Modifying for devnet/testnet
        '/user/rewards/mystery-box/open',
      method: 'POST',
      headers: { ...HEADERS, Authorization: token },
      data: {
        hash: signature,
      },
    });

    return response.data;
  } catch (error) {
    if (retries > 0) {
      console.log(
        `Retrying opening mystery box... (${retries} retries left)`.yellow
      );

      await new Promise((res) => setTimeout(res, 1000));

      return openMysteryBox(token, keypair, retries - 1);
    } else {
      console.log(`Error opening mystery box: ${error}`.red);
      throw error;
    }
  }
}

async function processPrivateKey(privateKey, action) {
  try {
    const publicKey = getKeypair(privateKey).publicKey.toBase58();
    const token = await getToken(privateKey);
    const profile = await getProfile(token);

    if (profile.wallet_balance > 0) {
      const balance = profile.wallet_balance / solana.LAMPORTS_PER_SOL;
      const ringBalance = profile.ring;
      const availableBoxes = profile.ring_monitor;

      console.log(`Hello ${publicKey}! Here are your details:`.green);
      console.log(`Solana Balance: ${balance} SOL`.green);
      console.log(`Ring Balance: ${ringBalance}`.green);
      console.log(`Available Box(es): ${availableBoxes}`.green);
      console.log('');

      if (action === '1') {
        console.log(`[ ${moment().format('HH:mm:ss')} ] Performing dailyClaim...`.yellow);
        await dailyClaim(token);
        console.log(`[ ${moment().format('HH:mm:ss')} ] Daily claim completed!`.cyan);
      } else if (action === '2') {
        console.log(`[ ${moment().format('HH:mm:ss')} ] Performing dailyLogin...`.yellow);
        const claimLogin = await dailyLogin(token, getKeypair(privateKey));
        if (claimLogin) {
          console.log(`[ ${moment().format('HH:mm:ss')} ] Daily login successful!`.green);
        }
      } else if (action === '3') {
        console.log(`[ ${moment().format('HH:mm:ss')} ] Opening mystery box(es)...`.yellow);
        await openMysteryBox(token, getKeypair(privateKey));
        console.log(`[ ${moment().format('HH:mm:ss')} ] Mystery box opening completed!`.cyan);
      }
    } else {
      console.log(`Insufficient balance or network issue`.red);
    }
  } catch (error) {
    console.log(`Error processing private key: ${error}`.red);
  }
  console.log('');
}

async function fetchDaily(token) {
  try {
    const { data } = await axios({
      url:
        apiBaseUrl +
        (getNetType() == 2 ? '/testnet' : '/devnet') +  // Modifying for devnet/testnet
        '/user/transactions/state/daily',
      method: 'GET',
      headers: { ...HEADERS, Authorization: token },
    });

    return data.data.total_transactions;
  } catch (error) {
    console.log(
      `[ ${moment().format('HH:mm:ss')} ] Error in daily fetching: ${error.response.data.message}`.red
    );
  }
}

async function dailyClaim(token) {
  let counter = 1;
  const maxCounter = 3;

  try {
    const fetchDailyResponse = await fetchDaily(token);

    console.log(`[ ${moment().format('HH:mm:ss')} ] Total transactions: ${fetchDailyResponse}`.blue);

    if (fetchDailyResponse > 10) {
      while (counter <= maxCounter) {
        try {
          const { data } = await axios({
            url:
              apiBaseUrl +
              (getNetType() == 2 ? '/testnet' : '/devnet') +  // Modifying for devnet/testnet
              '/user/transactions/rewards/claim',
            method: 'POST',
            headers: { ...HEADERS, Authorization: token },
            data: { stage: counter },
          });

          console.log(`[ ${moment().format('HH:mm:ss')} ] Daily claim for stage ${counter} successful!`.green);
          counter++;
        } catch (error) {
          console.log(`[ ${moment().format('HH:mm:ss')} ] Error claiming for stage ${counter}: ${error.response.data.message}`.red);
          counter++;
        } finally {
          await delay(1000);
        }
      }
    } else {
      throw new Error('Not enough transactions to claim rewards.');
    }
  } catch (error) {
    console.log(`[ ${moment().format('HH:mm:ss')} ] Error in daily claim: ${error.message}`.red);
  }
}

async function dailyLogin(token, keypair) {
  try {
    const { data } = await axios({
      url:
        apiBaseUrl +
        (getNetType() == 2 ? '/testnet' : '/devnet') +  // Modifying for devnet/testnet
        '/user/transactions/rewards/login',
      method: 'POST',
      headers: { ...HEADERS, Authorization: token },
    });

    return data;
  } catch (error) {
    console.log(`Error during daily login: ${error}`.red);
  }
}

async function startAutomation() {
  // Select network type: devnet or testnet
  const networkType = getNetworkTypeFromUser();
  setNetType(networkType);

  let action;
  do {
    // Ask the user what action they want to perform
    action = readlineSync.question(
      'Which action would you like to perform?\n1. Daily Claim\n2. Daily Login\n3. Open Mystery Box\n0. Exit\nYour choice: '
    );

    if (action === '0') {
      console.log('Exiting...'.yellow);
      process.exit(0);
    } else if (['1', '2', '3'].includes(action)) {
      console.log(`Performing action ${action} across all private keys...`.green);
      for (const privateKey of PRIVATE_KEYS) {
        await processPrivateKey(privateKey, action);
      }
    }

    // Ask the user if they'd like to perform another action
    const continueAction = readlineSync.question(
      'Would you like to perform another action? (y/n): '
    );

    if (continueAction.toLowerCase() !== 'y') {
      console.log('Exiting...'.yellow);
      process.exit(0);
    }
  } while (true);
}

(async () => {
  await startAutomation();
})();
