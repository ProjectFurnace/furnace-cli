const nc = require('nunjucks');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
function getTemplate(type) {
    return './aws/default.njk';
}

function renderTemplate(type, data) {
    return nc.render(type, data);
}

function checkDir() {
    const dir = './config_files';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

function saveFile(filename, contents) {
    fs.writeFile("./config_files/" + filename + ".conf", contents, function (err) {
        if (err) {
            return console.log(chalk.red(err));
        }

        console.log(chalk.green('Saved ') + chalk.blue(filename) + chalk.green(' configuration to the /config_files directory.'));
    });
}

module.exports.get_template = (connector, name, environment) => {
    checkDir();
    let completed_template = "";
    let filename = name + '_' + environment;

    connector.config.inputs.forEach(input => {
        nc.configure(__dirname + '/templates', { trimBlocks: true });
        out = renderTemplate(getTemplate(input.type), input.options);
        completed_template += out.replace(/&quot;/g, "\"").replace(/&#39;/g, "\'")
    })

    connector.config.outputs.forEach(output => {
        nc.configure(__dirname + '/templates', { trimBlocks: true });
        out = renderTemplate(getTemplate(output.type), output.options);
        completed_template += out.replace(/&quot;/g, "\"").replace(/&#39;/g, "\'")
    })

    saveFile(filename, completed_template)
    //console.log(completed_template);
};