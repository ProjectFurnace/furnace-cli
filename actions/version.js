const getPackageVersion = require("get-pkg-version")
    , { readlinkSync } = require("fs")
    , which = require("which")
    , path = require("path")
    , fsutils = require("@project-furnace/fsutils")
    ;

module.exports = async () => {
  
  try {
    const version = await getPackageVersion("@project-furnace/furnace-cli");
    console.log(version);
  } catch (err) {
    const binPath = which.sync("furnace");
    const linkPath = readlinkSync(binPath);
    const resolvedPath = path.resolve(binPath, "..", linkPath)
    const baseDir = path.dirname(resolvedPath);
    const packageJson = path.join(baseDir, "package.json");

    if (fsutils.exists(packageJson)) {
      const package = JSON.parse(fsutils.readFile(packageJson));
      console.log(package.version);
    } else {
      console.log(`unable to find package.json at ${packageJson}`);
    }
  }
}