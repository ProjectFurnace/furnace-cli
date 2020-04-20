module.exports.execPromise = (command, options) => {
  const exec = require("child_process").exec;

  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        // console.log("got error", stderr, stdout);
        reject({ error, stdout, stderr });
        return;
      }
      resolve(stdout);
    });
  });
};
