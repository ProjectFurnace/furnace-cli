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
  } catch (err) { }

  return profiles;
}

module.exports.getInstance = () => {
  const context = workspace.getCurrentContext();

  if (!context) throw new Error(`unable to get current context, check the furnace config file at ~/.furnace/config.json`);

  const profile = context.awsProfile
    , region = context.region
    ;

  if (profile) {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  }

  AWS.config.region = region;

  return AWS;
}

module.exports.getDefaultRegion = profile => {
  let region = "";
  if (profile) {
    const p = module.exports.getConfig()[profile];
    if (p) region = p.region;
  }
  return region;
}

module.exports.getRegions = () => {
  return [{name: "US East (Ohio)", value: "us-east-2"},
          {name: "US East (N. Virginia)", value: "us-east-1"},
          {name: "US West (N. California)", value: "us-west-1"},
          {name: "US West (Oregon)", value: "us-west-2"},
          {name: "Asia Pacific (Hong Kong)", value: "ap-east-1"},
          {name: "Asia Pacific (Mumbai)", value: "ap-south-1"},
          {name: "Asia Pacific (Seoul)", value: "ap-northeast-2"},
          {name: "Asia Pacific (Singapore)", value: "ap-southeast-1"},
          {name: "Asia Pacific (Sydney)", value: "ap-southeast-2"},
          {name: "Asia Pacific (Tokyo)", value: "ap-northeast-1"},
          {name: "Canada (Central)", value: "ca-central-1"},
          {name: "China (Beijing)", value: "cn-north-1"},
          {name: "China (Ningxia)", value: "cn-northwest-1"},
          {name: "EU (Frankfurt)", value: "eu-central-1"},
          {name: "EU (Ireland)", value: "eu-west-1"},
          {name: "EU (London)", value: "eu-west-2"},
          {name: "EU (Paris)", value: "eu-west-3"},
          {name: "EU (Stockholm)", value: "eu-north-1"},
          {name: "South America (São Paulo)", value: "sa-east-1"},
          {name: "AWS GovCloud (US-East)", value: "us-gov-east-1"},
          {name: "AWS GovCloud (US)", value: "us-gov-west-1"}];
}