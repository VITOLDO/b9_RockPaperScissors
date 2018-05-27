var Owned = artifacts.require("./Owned.sol");
var Stoppable = artifacts.require("./Stoppable.sol");
var RockPaperScissors = artifacts.require("./RockPaperScissors.sol");

module.exports = function(deployer) {
  deployer.deploy(Owned);
  deployer.link(Owned, Stoppable);
  deployer.deploy(Stoppable);
  deployer.link(Stoppable, RockPaperScissors);
  deployer.deploy(RockPaperScissors);
};
