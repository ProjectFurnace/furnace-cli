const repository = require("../utils/repository");

const basedir = "repo";

module.exports.add = async (name, url) => {
    await repository.add(basedir, name, url);
}

module.exports.list = async () => {
    await repository.list(basedir);
}

module.exports.remove = async (name) => {
    await repository.remove(basedir, name);
}