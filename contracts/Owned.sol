pragma solidity ^0.4.18;

contract Owned {
	
	address public owner;

	function Owned() public {
		owner = msg.sender;
	}

	modifier fromOwner {
        require(msg.sender == owner);
        _;
    }

    function setOwner(address newOwner) public fromOwner {
        require(newOwner != 0);
        owner = newOwner;
    }
}