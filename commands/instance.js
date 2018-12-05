const workspace = require("../utils/workspace");

module.exports.list = () => {
    const config = workspace.getConfig();

    for (let item in config) {
        if (item !== "current") {
            const instance = config[item];
            console.log(`${item} ${instance.platform} ${instance.region} ${instance.apiUrl}`);
        }
    }
}