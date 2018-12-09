const workspace = require("../utils/workspace")
    , config = require("../utils/config")
    , aws = require("../utils/aws")
    ;

module.exports = () => {
    const stack = config.getConfig("stack")
        , stackName = stack.stack

    const functionList = aws.listFunctions();
    console.log(functionList);
}