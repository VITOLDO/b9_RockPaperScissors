pragma solidity ^0.4.18;

import "./Stoppable.sol";

contract RockPaperScissors is Stoppable {

	//            0      1      2        3        4
	enum Choice {EMPTY, ROCK, PAPER, SCISSORS, ENCRYPTED}

	struct Bet {
	  address player;
	  uint amount;
	  bytes32 puzzle;
	  Choice choice;
	}

	uint count;
	
	mapping(uint=>Bet) public allBets;

	mapping(address=>uint) public playersDeposits;

	event LogBetPlaced(address indexed caller, uint ammount);
	event LogReadyToPlay(address indexed caller);
	event LogGame(address player1, uint choice1, address player2, uint choice2);
	event LogWithdraw(address caller, uint amount);

	function RockPaperScissors() public {
		count = 0;
	}

	function placeBet(bytes32 puzzle) 
		payable
		public
		onlyWhenEnabled
		returns(bool)
	{
		require(msg.value > 0);
		require(count < 2);
		
		allBets[count] = Bet(msg.sender, msg.value, puzzle, Choice.ENCRYPTED);
		
		count++;
		LogBetPlaced(msg.sender, msg.value);

		return true;
	}

	function decryptBet(uint choice, bytes32 password)
		public
		onlyWhenEnabled
		returns(bool)
	{
		require(count >= 2);
		
		if (allBets[0].player == msg.sender) {
			if (allBets[0].puzzle == hashHelper(choice, password))
				allBets[0].choice = Choice(choice);
		} else if(allBets[1].player == msg.sender) {
			if (allBets[1].puzzle == hashHelper(choice, password))
				allBets[1].choice = Choice(choice);
		}
		
		count++;
		LogReadyToPlay(msg.sender);

		return true;
	}

	function playBets()
		public
		onlyWhenEnabled
		returns(bool)
	{
		require(count == 4);
		Bet storage rpsItem1 = allBets[0];
		Bet storage rpsItem2 = allBets[1];
		require(rpsItem1.player == msg.sender || rpsItem2.player == msg.sender);

		count = 0;

		LogGame(rpsItem1.player, uint(rpsItem1.choice), rpsItem2.player, uint(rpsItem2.choice));
		if ((rpsItem1.choice == Choice.ROCK 	&& rpsItem2.choice == Choice.SCISSORS) || 
			(rpsItem1.choice == Choice.SCISSORS && rpsItem2.choice == Choice.PAPER) ||
			(rpsItem1.choice == Choice.PAPER 	&& rpsItem2.choice == Choice.ROCK)) {
			playersDeposits[msg.sender] += rpsItem1.amount;
			if (rpsItem2.amount > rpsItem1.amount) {
				playersDeposits[rpsItem1.player] += rpsItem1.amount;
				playersDeposits[rpsItem2.player] += (rpsItem2.amount - rpsItem1.amount);
			} else {
				playersDeposits[rpsItem1.player] += rpsItem2.amount;
			}

		} else 
		if ((rpsItem1.choice == Choice.ROCK 	&& rpsItem2.choice == Choice.PAPER) || 
			(rpsItem1.choice == Choice.SCISSORS && rpsItem2.choice == Choice.ROCK) ||
			(rpsItem1.choice == Choice.PAPER 	&& rpsItem2.choice == Choice.SCISSORS)) {

			if (rpsItem1.amount > rpsItem2.amount) {
				playersDeposits[rpsItem2.player] += rpsItem2.amount;
				playersDeposits[rpsItem1.player] += (rpsItem1.amount - rpsItem2.amount);
			} else {
				playersDeposits[rpsItem2.player] += rpsItem1.amount;
			}

		} else {
			playersDeposits[rpsItem1.player] += rpsItem1.amount;
			playersDeposits[rpsItem2.player] += rpsItem2.amount;	
		}

		allBets[0] = Bet(0,0,'',Choice.EMPTY);
		allBets[1] = Bet(0,0,'',Choice.EMPTY);

		return true;
	}

	function withdrawFunds() 
		public
		returns(bool)
	{
		require(playersDeposits[msg.sender] > 0);

		var amount = playersDeposits[msg.sender];
		playersDeposits[msg.sender] = 0;

		LogWithdraw(msg.sender, amount);
		msg.sender.transfer(amount);

		return true;
	}

	function hashHelper(uint choice, bytes32 password) public pure returns(bytes32) {
		return keccak256(choice, password);
	}
}