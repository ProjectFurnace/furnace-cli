const workspace = require("../utils/workspace")
    , AWS = require("aws-sdk")
    , awsUtil = require("../utils/aws")
    , inquirer = require("inquirer")
    , which = require("which")
    , chalk = require("chalk")
    ;

module.exports = async () => {
    const config = workspace.getConfig();

    const questions = [
        { type: 'confirm', name: 'proceed', message: `This will delete the Furnace instance named ${config.current}. This process is not reversible, are you sure you wish to proceed?` } //, when: current => current.gitProvider === "github" }
    ];

    answers = await inquirer.prompt(questions);
    
    if( !answers.proceed ) {
        console.log('Operation cancelled');
        return;
    }

    const awsCli = which.sync("aws", { nothrow: true });
    if (!awsCli) console.log(chalk.red('warning: no AWS CLI installed'));

    const credentials = awsUtil.getCredentials(config[config.current].awsProfile);
    if (!credentials || !(credentials.aws_access_key_id && credentials.aws_secret_access_key)) {
      console.error(`unable to get credentials for aws profile ${config[config.current].awsProfile}`);
      return;
    }
        
    AWS.config.region = config[config.current].region;

    const cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15'} );

    const stackParams = {
        StackName: config.current
    }

    try {
        let stackExists = false;

        const stackList = await cloudformation.listStacks().promise();
        
        for (let stack of stackList.StackSummaries) {
            // we need to check both the name and the status
            if (stack.StackName === config.current && stack.StackStatus !== 'DELETE_COMPLETE') {
                stackExists = true;
                break;
            }
        }
        
        if (stackExists) {
            console.log('Proceeding to delete instance...');
            const deleteStackResponse = await cloudformation.deleteStack(stackParams).promise();
        } else {
            console.log('Stack does not exist in AWS...');
        }
        
        console.log('waiting for AWS stack deletion to complete...');

        const result = await cloudformation.waitFor('stackDeleteComplete', stackParams).promise();

        delete config[config.current];

        // if there is another context, set the first one found as the default, if not just leave none selected
        if (Object.keys(config).length > 1) {
            for(const key in config) {
                if (key != 'current') {
                    config.current = key;
                    break;
                }
            }
        } else {
            delete config.current;
        }

        workspace.saveConfig(config);

        console.log('Furnace instance deleted successfully!');

    } catch (err) {
        throw err
    }
}
