github_actions = require("../actions/github")

exports.command = 'github tokenUpdate <token>'
exports.desc = 'Update GitHub token to <token>'
exports.builder = {}
exports.handler = async (argv) => {
    await github_actions.updateToken(argv.token);
}