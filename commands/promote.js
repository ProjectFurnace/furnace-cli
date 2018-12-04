const request = require("superagent")
    , workspace = require("../utils/workspace")
    , config = require("../utils/config")
    , ops = require("../utils/ops")
    ;

module.exports = async (environment) => {
    
    const context = await workspace.getContext()
        , deployUrl = context.apiUrl + "/api/deploy"
        , stackConfig = config.getConfig("stack")
        ;

    if (!stackConfig.environments || stackConfig.environments.length === 0) throw new Error(`no environments specified in stack`);
    if (!stackConfig.environments.includes(environment)) throw new Error(`environment ${environment} not found in stack, must be one of ${stackConfig.environments.join(", ")}`);

    ops.deploy(deployUrl, context.remoteUrl, context.lastCommitRef, environment);

}