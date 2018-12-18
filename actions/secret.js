const awsutil = require("../utils/aws");

module.exports.add = (name, secret) => {
    awsutil.createSecret(name, secret);
}