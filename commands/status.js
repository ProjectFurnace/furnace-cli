const workspace = require("../utils/workspace")
    , github = require("../utils/github")
    , config = require("../utils/config")
    , chalk = require("chalk")
    ;

module.exports = async () => {
    const context = await workspace.getContext()
        , currentConfig = workspace.getCurrentConfig()
        , stackConfig = config.getConfig("stack")
        , environments = stackConfig.environments
        ;

    if (!environments) throw new Error(`unable to load environments from stack.`);

    console.log(chalk.green.bold("deployments:"))
    for (let environment of environments) {
        console.log(`environment ${chalk.blue(environment)}`)
        const deployments = await github.listDeployments(currentConfig.gitToken, context.remoteUrl, environment);

        for (let deployment of deployments) {
            console.log(`  timestamp ${chalk.green(deployment.created_at)} ref ${chalk.green(deployment.ref)} sha ${chalk.green(deployment.sha.substring(0, 8))}`);
    
            const statuses = await github.listDeploymentStatuses(currentConfig.gitToken, context.remoteUrl, deployment.id);
            for (let status of statuses) {
                console.log(`    ${stateToColour(status.state)}`);
            }
            break;   
        }
    }
}

function stateToColour(state) {
    switch (state) {
        case "success":
        return chalk.green(state);
        case "in_progress":
            return chalk.yellow(state);
        case "failed":
            return chalk.red(state);
        default:
            return chalk.red(state);
    }
}