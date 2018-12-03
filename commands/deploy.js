const request = require("superagent")
    , workspace = require("../utils/workspace")
    ;

module.exports = async () => {
    const config = workspace.getConfig();

    const currentConfig = config[config.current];

    if (!currentConfig.apiUrl) throw new Error(`unable to get current config`);

    const deployUrl = currentConfig.apiUrl + "/api/deploy";

    const currentPath = __dirname;

    git = require("simple-git/promise")(currentPath);
    let remoteUrl, commitRef;

    try {
        const remotesResponse = await git.listRemote(['--get-url']);
        let remotes = []
        if (remotesResponse) remotes = remotesResponse.split("\n");
        if (remotes.length === 0) throw new Error("can't get remote url");
        remoteUrl = remotes[0];

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

    if (!response.ok) throw new Error(`unable to execute deployment: ${remote.body}`);
}