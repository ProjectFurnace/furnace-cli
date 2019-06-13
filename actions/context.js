const workspace = require("../utils/workspace")
    , chalk = require("chalk")
    , fsutils = require("@project-furnace/fsutils")
    ;

module.exports.list = () => {
    const config = workspace.getConfig();

    for (let item in config) {
        if (item !== "current") {
            const instance = config[item];
            console.log(`name: ${chalk.green(item)} platform ${chalk.green(instance.platform)} region ${chalk.green(instance.region)} url: ${chalk.green(instance.apiUrl)}`);
        }
    }
}

module.exports.import = file => {
    if (!fsutils.exists(file)) throw new Error(`unable to find specified file`);
    const json = fsutils.readFile(file)
        , imported = JSON.parse(json)
        , config = workspace.getConfig()
        ;

    const keys = Object.keys(imported);
    if (!keys.length === 1) throw new Error(`expecting 1 key in definition`)

    Object.assign(config, imported);

    workspace.saveConfig(config);
}

module.exports.export = (name, file) => {
    const config = workspace.getConfig();

    const def = config[name];
    if (!def) throw new Error(`can't find context by that name`);

    fsutils.writeFile(file, JSON.stringify({
        [name]: def
    }));
}

module.exports.select = name => {
    const config = workspace.getConfig();

    const def = config[name];
    if (!def) throw new Error(`can't find context by that name`);

    config.current = name;
    workspace.saveConfig(config);
}

module.exports.remove = name => {
    const config = workspace.getConfig();

    const def = config[name];
    if (!def) throw new Error(`can't find context by that name`);

    delete config[name];
    workspace.saveConfig(config);
}

module.exports.status = () => {

    const context = workspace.getCurrentContext();

    const { name, platform, location, gitProvider, apiUrl } = context;

    console.log(`Current Context: ${chalk.green(name)}`);
    console.log(`Platform: ${chalk.green(platform)}`);
    console.log(`Region: ${chalk.green(location)}`);
    console.log(`Git Provider: ${chalk.green(gitProvider)}`);
    console.log(`API URL: ${chalk.green(apiUrl)}`)
    
}