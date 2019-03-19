const workspace = require("../utils/workspace")
    , github = require("../utils/github")
    , stack = require("../utils/stack")
    , chalk = require("chalk")
    ;

module.exports = async () => {
    const remoteUrl = await workspace.getRemoteUrl()
        , context = workspace.getCurrentContext()
        , stackConfig = stack.getConfig("stack")
        , environments = stackConfig.environments
        ;

    if (!environments) throw new Error(`unable to load environments from stack.`);

    console.log(chalk.green.bold("deployments:"))
    for (let environment of environments) {
        console.log(`environment ${chalk.blue(environment)}`)
        const deployments = await github.listDeployments(context.gitToken, remoteUrl, environment);

        for (let deployment of deployments) {
            console.log(`  timestamp ${chalk.green(deployment.created_at)} ref ${chalk.green(deployment.ref)} sha ${chalk.green(deployment.sha.substring(0, 8))}`);
    
            const statuses = await github.listDeploymentStatuses(context.gitToken, remoteUrl, deployment.id);
            console.log('    statuses the deployment has gone through:');
            for ( let status of statuses) {
                console.log(`      ${stateToColour(status.state)}: ${status.description} [${status.updated_at}]`);
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