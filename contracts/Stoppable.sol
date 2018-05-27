pragma solidity ^0.4.18;

import './Owned.sol';

contract Stoppable is Owned {
	
	bool public enabled;

	event LogSwitchOnOff(bool status);

	function Stoppable() public {
		enabled = true;
	}

	modifier onlyWhenEnabled {
		require(enabled);
		_;
	}

	modifier onlyWhenDisabled {
		require(!enabled);
		_;
	}

	function switchOnOff(bool status) public fromOwner {
		LogSwitchOnOff(status);
		enabled = status;
	}
}