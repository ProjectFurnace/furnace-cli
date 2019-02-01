// const github = require("../utils/github")
const workspace = require("../utils/workspace")
//     ;

// module.exports.createHook = async (token, secret) => {
//     const context = await workspace.getContext();
//     // if (!context.gitToken) throw new Error(`git token not stored in workspace`)
//     github.createRepoHook(token, context.remoteUrl, context.apiUrl + "/hook", secret);
// }

module.exports.updateToken = async (token) => {
    const config = await workspace.getConfig();
    // if (!context.gitToken) throw new Error(`git token not stored in workspace`)
    config[config.current].gitToken = token;
    workspace.saveConfig(config);
}