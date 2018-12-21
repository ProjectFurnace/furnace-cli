const fsutils = require("@project-furnace/fsutils")
    , os = require("os")
    , path = require("path")
    , ini = require("ini")
    , workspace = require("../utils/workspace")
    , AWS = require("aws-sdk")
    ;

const awsDir = path.join(os.homedir(), ".aws");

module.exports.getConfig = () => {

    const configPath = path.join(awsDir, "config");
    let config;

    if (fsutils.exists(awsDir)) {
        const file = fsutils.readFile(configPath);
        config = ini.parse(file);
    }

    return config;
}

module.exports.getCredentials = profile => {

    const credentialsPath = path.join(awsDir, "credentials");
    let credentials;

    if (fsutils.exists(awsDir)) {
        const file = fsutils.readFile(credentialsPath);
        credentials = ini.parse(file);
    }
    
    if (credentials) {
        return credentials[profile];
    } else return null;

}

module.exports.getProfiles = () => {
    let profiles = [];

    try {
        const config = module.exports.getConfig();
        
        for (let profile in config) {
            profiles.push(profile.replace("profile ", ""));
        }
    } catch (err) {}

    return profiles;
}

module.exports.getInstance = () => {
    const context = workspace.getCurrentContext()
        , profile = context.awsProfile
        , region = context.region
        ;

    if (profile) {
        AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
    }

    AWS.config.region = region;

    return AWS;
}