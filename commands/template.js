const templateUtil = require("../utils/template");

module.exports = async (subCommand, name, url) => {

    switch(subCommand) {
        case "ls":
            list();
            break;
        case "rm":
            rm(name);
            break;
        case "add":
            add(name, url);
            break;
        default:
            throw new Error(`unknown template command '${cmd}'`)
    }
}

list = () => {
    templateUtil.listTemplates();
}

rm = (name) => {
    templateUtil.removeTemplate(name);
}

add = async (name, url) => {
    await templateUtil.addTemplate(name, url);
}