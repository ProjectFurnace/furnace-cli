const stack = require("../utils/stack");

module.exports.get = async (environment, name) => {
  const ssm = getSSM()
      , secretName = getSecretFullName(environment, name)
      , secret = await getSecret(ssm, secretName)
      ;

  if (secret) {
    console.log(secret);
  } else {
    console.error(`unable to retrieve secret ${name}`);
  }
}

module.exports.add = async (environment, name, secret) => {

  const ssm = getSSM()
      , secretName = getSecretFullName(environment, name)
      ;

  const params = {
    Name: secretName,
    Type: "SecureString",
    Value: secret,
    Overwrite: true
  };

  try {
    await ssm.putParameter(params).promise();
    console.log(`Secret ${name} for environment ${environment} created successfully`);
  } catch (error) {
    console.log(`error adding secret ${secretName}`, error);
  }
}

module.exports.del = async (environment, name) => {

  const ssm = getSSM()
      , secretName = getSecretFullName(environment, name)
      , secret = await getSecret(ssm, secretName)
      ;

  if (!secret) {
    console.log(`secret does not currently exist`);
    process.exit(2);
  }

  const params = {
    Name: secretName
  };

  try {
    await ssm.deleteParameter(params).promise();
    console.log(`Secret ${name} for environment ${environment} deleted successfully`);
  } catch (error) {
    console.log(`error deleting secret ${secretName}`, error);
  }
}

async function getSecret(ssm, secretName) {
  try {
    const params = {
      Name: secretName,
      WithDecryption: true
    };

    const result = await ssm.getParameter(params).promise();
    return result.Parameter.Value;
  } catch (error) {
    return null;
  }
}

function getSecretFullName(environment, name) {
  const stackConfig = stack.getConfig("stack")
      , workspace = require("../utils/workspace")
      , stackName = stackConfig.name
      , context = workspace.getCurrentContext()
      ;

  return `/${context.name}/${stackName}/${name}/${environment}`;
}

function getSSM() {
  const AWS = require("../utils/aws").getInstance
      , aws = AWS()
      , ssm = new aws.SSM()
      ;

  return ssm;
}