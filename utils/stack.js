const yaml = require("yamljs")
    , path = require("path")
    , fsutils = require("@project-furnace/fsutils")
    ;

module.exports.getConfig = (file) => {
    const filePath = path.join(process.cwd(), file + ".yaml")
        ;

    if (!fsutils.exists(filePath)) throw new Error(`unable to find config file ${filePath}`);

    return yaml.load(filePath);
}