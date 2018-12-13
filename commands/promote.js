const request = require("superagent")
    , workspace = require("../utils/workspace")
    , config = require("../utils/config")
    , github = require("../utils/github")
    , ops = require("../utils/ops")
    ;

module.exports = async (environment) => {
    
    const context = await workspace.getContext()
        , currentConfig = workspace.getCurrentConfig()
        , deployUrl = context.apiUrl + "/api/deploy"
        , stackConfig = config.getConfig("stack")
        ;

    if (!stackConfig.environments || stackConfig.environments.length === 0) throw new Error(`no environments specified in stack`);

    const idx = stackConfig.environments.indexOf(environment);

    if( idx == -1 ) {
        throw new Error(`environment ${environment} not found in stack, must be one of ${stackConfig.environments.join(", ")}`);
    } else {
        if( stackConfig.environments[idx + 1] ) {
            const deployments = await github.listDeployments(currentConfig.gitToken, context.remoteUrl, environment);

            if (deployments.length > 0 ) {
                const commitRef = deployments[0].sha;

                ops.deploy(deployUrl, context.remoteUrl, commitRef, stackConfig.environments[idx + 1], currentConfig.apiKey);

                console.log(`Promoted ${environment} to ${stackConfig.environments[idx + 1]}.`)
            } else {
                throw new Error('No deployments found on the environment to promote');
            }
        } else {
            throw new Error(`environment ${environment} is the last one in the stack, cannot promote to any other`);
        }
    }
}