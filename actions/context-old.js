const workspace = require("../utils/workspace")
    , chalk = require("chalk")
    ;

module.exports = async () => {
    const context = await workspace.getContext()
        , config = workspace.getConfig()
        , currentConfig = workspace.getCurrentConfig()
        ;

    const { remoteUrl, lastCommitRef, apiUrl } = context;
    const { platform, region, gitProvider } = currentConfig;

    console.log();

    console.log();
    console.log(`${chalk.yellow("Current Stack:")}`);
    console.log(`Remote URL: ${chalk.green(remoteUrl)}`);
    console.log(`Last Commit Ref: ${chalk.green(lastCommitRef.substring(0, 8))}`);
    console.log(`Furnace API Endpoint: ${chalk.green(apiUrl)}`);
}