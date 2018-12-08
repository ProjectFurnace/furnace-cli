const fsutils = require("@project-furnace/fsutils")
    , os = require("os")
    , path = require("path")
    , ini = require("ini")
    ;

const awsDir = path.join(os.homedir(), ".aws");

module.exports.getConfig = () => {

    const configPath = path.join(awsDir, "config");
    let config;

    if (fsutils.exists(awsDir)) {
        const file = fsutils.readFile(configPath);
        config = ini.parse(file);
    }

    return config
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