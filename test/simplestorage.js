var RockPaperScissors = artifacts.require("./RockPaperScissors.sol");

require("../node_modules/js-sha3/src/sha3.js");

const PromisifyWeb3 = require("../utils/promisifyWeb3.js");
PromisifyWeb3.promisify(web3);

web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
  var transactionReceiptAsync;
  interval = interval ? interval : 500;
  transactionReceiptAsync = function(txnHash, resolve, reject) {
    try {
      var receipt = web3.eth.getTransactionReceipt(txnHash);
      if (receipt == null) {
        setTimeout(function () {
          transactionReceiptAsync(txnHash, resolve, reject);
        }, interval);
      } else {
        resolve(receipt);
      }
    } catch(e) {
      reject(e);
    }
  };

  return new Promise(function (resolve, reject) {
      transactionReceiptAsync(txnHash, resolve, reject);
  });
};

var getEventsPromise = function (myFilter, count) {
  return new Promise(function (resolve, reject) {
    count = count ? count : 1;
    var results = [];
    myFilter.watch(function (error, result) {
      if (error) {
        reject(error);
      } else {
        count--;
        results.push(result);
      }
      if (count <= 0) {
        resolve(results);
        myFilter.stopWatching();
      }
    });
  });
};

contract('RockPaperScissors', function(accounts) {

  var contract;

  var owner = accounts[0]
  var player2 = accounts[1]

  beforeEach(function() {
    return RockPaperScissors.new({from: owner})
    .then(function(instance) {
      contract = instance;
    });
  });

  it("should be active by default", function() {
    return contract.enabled()
    .then(function(isEnabled) {
      assert.isTrue(isEnabled, "Contract is not enabled by default.");
    });
  });

  it("should be able to place a bet.", function() {
    var puzzle1;
    var puzzle2;
    var blockNumber;
    return contract.hashHelper(1,"12341234")
    .then(function(value) {
      puzzle1 = value;
      blockNumber = web3.eth.blockNumber + 1;
      return contract.placeBet(puzzle1, {from: owner, value: web3.toWei(1, 'ether')})
    })
    .then (function(txReceipt) {
      return Promise.all([
        getEventsPromise(contract.LogBetPlaced({},
          { fromBlock: blockNumber, toBlock: "latest" })),
        web3.eth.getTransactionReceiptMined(txReceipt.tx)
      ])
    })
    .then(function(event) {
      assert.equal(owner,                  event[0][0].args.caller,  "Caller hasn't been logged");
      assert.equal(web3.toWei(1, 'ether'), event[0][0].args.ammount, "Amount hasn't been logged");
      return contract.hashHelper(3,"43214321")
    })
    .then(function(value) { 
      puzzle2 = value;
      blockNumber = web3.eth.blockNumber + 1;
      return contract.placeBet(puzzle2, {from: player2, value: web3.toWei(1, 'ether')})
    }).then (function(txReceipt) {
      return Promise.all([
        getEventsPromise(contract.LogBetPlaced({},
          { fromBlock: blockNumber, toBlock: "latest" })),
        web3.eth.getTransactionReceiptMined(txReceipt.tx)
      ])
    })
    .then(function(event) {
      assert.equal(player2,                event[0][0].args.caller, "Caller hasn't been logged");
      assert.equal(web3.toWei(1, 'ether'), event[0][0].args.ammount, "Amount hasn't been logged");
      blockNumber = web3.eth.blockNumber + 1;
      return contract.decryptBet(1, "12341234", {from: owner})
    })
    .then(function(txReceipt){
      return Promise.all([
        getEventsPromise(contract.LogReadyToPlay({},
          { fromBlock: blockNumber, toBlock: "latest" })),
        web3.eth.getTransactionReceiptMined(txReceipt.tx)
      ])
    })
    .then(function(event) {
      assert.equal(owner, event[0][0].args.caller,  "Caller hasn't been logged");
      blockNumber = web3.eth.blockNumber + 1;
      return contract.decryptBet(3, "43214321", {from: player2})
    })
    .then(function(txReceipt){
      return Promise.all([
        getEventsPromise(contract.LogReadyToPlay({},
          { fromBlock: blockNumber, toBlock: "latest" })),
        web3.eth.getTransactionReceiptMined(txReceipt.tx)
      ])
    })
    .then(function(event) {
      assert.equal(player2, event[0][0].args.caller,  "Caller hasn't been logged");
      blockNumber = web3.eth.blockNumber + 1;
      return contract.playBets({from: owner})
    })
    .then(function(txReceipt){
      return Promise.all([
        getEventsPromise(contract.LogGame({},
          { fromBlock: blockNumber, toBlock: "latest" })),
        web3.eth.getTransactionReceiptMined(txReceipt.tx)
      ])
    })
    .then(function(event) {
      assert.equal(owner, event[0][0].args.player1,  "Player1 address hasn't been logged");
      assert.equal(1, event[0][0].args.choice1,  "Player1 choice hasn't been logged");
      assert.equal(player2, event[0][0].args.player2,  "Player2 address hasn't been logged");
      assert.equal(3, event[0][0].args.choice2,  "Player2 choice hasn't been logged");
      return contract.playersDeposits(owner)
    })
    .then(function(deposit){
      assert.equal(web3.toWei(2, 'ether'), deposit, "Winning deposit should be 2 ETH");
    });
  });

});
