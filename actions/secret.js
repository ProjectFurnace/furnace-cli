const AWS = require("../utils/aws").getInstance
    , stack = require("../utils/stack")
    ;

module.exports.add = async (environment, name, secret) => {
    const aws = AWS();

    if( !environment || !name || !secret ) {
        console.error(`Parameters missing. Please use 'furnace secret add [env] [name] [secret]`);
        return;
    }
    const stackConfig = stack.getConfig("stack")
        , workspace = require("../utils/workspace")
        , stackName = stackConfig.name
        , context = workspace.getCurrentContext()
        ;

    const sm = new aws.SecretsManager();

    const secretFullName = `${context.name}/${stackName}-${name}-${environment}`;

    const existingSecrets = sm.listSecrets({}).promise();

    if (existingSecrets.SecretList ) {
        for (let secret of existingSecrets.SecretList) {
            if (secret.Name == secretFullName) {
                console.log(`Secret ${name} already exists. If you want to recreate it, delete it first`);
                return;
            }
        }
    }

    const params = {
        Name: secretFullName,
        SecretString: secret
    };
    
    try {
        await sm.createSecret(params).promise();
        console.log(`Secret ${name} for environment ${environment} created successfully`);
    } catch(e) {
        console.log(`Secret ${name} for environment ${environment} already exists`);
    }
}

module.exports.del = async (environment, name) => {
    const aws = AWS();

    if( !environment || !name ) {
        console.error(`Parameters missing. Please use 'furnace secret del [env] [name]`);
        return;
    }

    const stackConfig = stack.getConfig("stack")
        , workspace = require("../utils/workspace")
        , stackName = stackConfig.name
        , context = workspace.getCurrentContext()
        ;

    const sm = new aws.SecretsManager();

    const secretFullName = `${context.name}/${stackName}-${name}-${environment}`;

    const params = {
        SecretId: secretFullName,
        ForceDeleteWithoutRecovery: true
    };
    
    try {
        await sm.deleteSecret(params).promise();
        console.log(`Secret ${name} for environment ${environment} deleted successfully`);
    } catch( e ) {
        console.error(`Secret ${name} not found in environment ${environment}`);
    }
}