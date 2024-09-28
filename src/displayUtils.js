require('colors');
const readlineSync = require('readline-sync');
const { setNetType } = require('./solanaUtils');

function displayHeader() {
  process.stdout.write('\x1Bc');
  console.log('========================================'.purple);
  console.log('=              Sonic-B0T               ='.purple);
  console.log('=     Cre@ted by PrettyAnita348        ='.purple);
  console.log('========================================'.purple);
  console.log();
}

function getNetworkTypeFromUser() {
  const net = readlineSync.question('Select network type (1 for Devnet, 2 for Testnet): '.pink);

  if (net == '1') {
    setNetType(1);
  }
  else if (net == '2') {
    setNetType(2);
  }
}

module.exports = {
  displayHeader,
  getNetworkTypeFromUser
};
