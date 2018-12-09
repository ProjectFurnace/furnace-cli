const workspace = require("../utils/workspace")
    , config = require("../utils/config")
    , ops = require("../utils/ops")
    ;

module.exports = async () => {
    
    const context = await workspace.getContext()
        , deployUrl = context.apiUrl + "/api/deploy"
        , stackConfig = config.getConfig("stack")
        ;

    if (!stackConfig.environments || stackConfig.environments.length === 0) throw new Error(`no environments specified in stack`);
    const environment = stackConfig.environments[0];

    ops.deploy(deployUrl, context.remoteUrl, context.lastCommitRef, environment);

}