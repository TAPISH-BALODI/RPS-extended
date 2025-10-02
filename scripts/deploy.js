const { ethers } = require("hardhat");

async function main() {
    console.log("RPS contracts are deployed per game instance.");
    console.log("No central deployment needed - each game creates its own contract.");
    console.log("The frontend handles contract deployment automatically.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
