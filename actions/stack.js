const workspace = require("../utils/workspace")
    , github = require("../utils/github")
    ;

module.exports.updateWebhook = async () => {
    await github.updateHook();
}