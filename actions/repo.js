const repository = require("../utils/repository");

module.exports.add = async (baseDir, name, url) => {
    await repository.add(baseDir, name, url);
}

module.exports.list = async (baseDir) => {
    await repository.list(baseDir);
}

module.exports.remove = async (baseDir, name) => {
    await repository.remove(baseDir, name);
}