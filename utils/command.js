module.exports.handleResponse = response => {
  if (!response) return;

  const { code, message } = response;
  if (code > 0) {
    if (message) console.error(message);
    process.exit(code);
  } else if (message) {
    console.log(message);
  }
};
