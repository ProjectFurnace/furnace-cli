const request = require("superagent")
    , workspace = require("../utils/workspace")
    ;

module.exports = async () => {
    const config = workspace.getConfig();

    const currentConfig = config[config.current];

    if (!currentConfig.apiUrl) throw new Error(`unable to get current config`);

    const deployUrl = currentConfig.apiUrl + "/api/deploy";
    console.log("deploy url is", deployUrl);

    const currentPath = "/Users/danny/Dev/Projects/falanx/furnace/temp/furnace-test";

    git = require("simple-git/promise")(currentPath);
    let remoteUrl, commitRef;

    try {
        remoteUrl = await git.listRemote(['--get-url']);
        if (!remoteUrl) throw new Error("can't get remote url");

        const logs = await git.log();
        commitRef = logs.latest.hash;
        if (!commitRef) throw new Error("unable to get last commit");

    } catch (err) {
        throw new Error(`unable to get commit info: ` + err);
    }

    console.log(`deploying commit ${commitRef} on remote ${remoteUrl}`)

    const response = await request
        .post(deployUrl)
        .send({ remoteUrl, commitRef });

    console.log(response.ok, response.body);
}