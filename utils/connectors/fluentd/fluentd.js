const nc = require('nunjucks');
const path = require('path');
const fs = require('fs');

function getTemplate(type){
    const parts = type.split('.');
    return path.join('.', parts[0], parts[1] + '.njk');
}

function renderTemplate(type, data)
{
    return nc.render(type, data);
}

function checkDir(){
    const dir = './config_files';
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

function saveFile(filename, contents){
    fs.writeFile("./config_files/" + filename + ".conf", contents, function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log('Saved ' + filename + ' configuration successfully.');
    });
}

module.exports.get_template = (connector) => {
    checkDir(); 
    connector.config.inputs.forEach(input => {
             nc.configure(__dirname + '/templates', {trimBlocks: true});
             const completed_template = renderTemplate(getTemplate(input.type), input.options);
             saveFile(input.name, completed_template.replace(/&quot;/g, "\""))

             })
};