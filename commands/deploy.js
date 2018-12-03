const request = require("superagent")
    , workspace = require("../utils/workspace")
    ;

module.exports = async () => {
    const config = workspace.getConfig();

    const currentConfig = config[config.current];

    if (!currentConfig.apiUrl) throw new Error(`unable to get current config`);

    const response = await request
        .post(currentConfig.apiUrl + "/api/deploy")
        .send({ name: 'Manny', species: 'cat' });

    console.log(response);
}