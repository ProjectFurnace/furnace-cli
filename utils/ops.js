const request = require("superagent")
    , workspace = require("../utils/workspace")
    , config = require("../utils/config")
    ;

module.exports.deploy = async (deployUrl, remoteUrl, commitRef, environment, apikey) => {
  
    console.log(`deploying commit ${commitRef} on remote ${remoteUrl} to environment ${environment}`);

    const response = await request
        .post(deployUrl)
        .send({ 
            remoteUrl,
            commitRef,
            environment
        }).set('X-API-Key', apikey);

    if (!response.ok) throw new Error(`unable to execute deployment: [${remote.body}]`);
}