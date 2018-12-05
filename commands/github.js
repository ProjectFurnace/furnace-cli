const github = require("../utils/github")
    , workspace = require("../utils/workspace")
    ;

module.exports.createHook = async (secret, token) => {
    const context = await workspace.getContext();
    // if (!context.gitToken) throw new Error(`git token not stored in workspace`)
    github.createRepoHook(token, context.remoteUrl, context.apiUrl + "/hook", secret);
}