const workspace = require("../utils/workspace")
    , chalk = require("chalk")
    ;

module.exports.list = () => {
    const config = workspace.getConfig();

    for (let item in config) {
        if (item !== "current") {
            const instance = config[item];
            console.log(`name: ${chalk.green(item)} platform ${chalk.green(instance.platform)} region ${chalk.green(instance.region)} url: ${chalk.green(instance.apiUrl)}`);
        }
    }
}