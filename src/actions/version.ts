const getPackageVersion = require('get-pkg-version')
const fsutils = require('@project-furnace/fsutils')
const { readlinkSync } = require('fs')
const path = require('path')
const which = require('which')

export default async () => {
  try {
    const version = await getPackageVersion('@project-furnace/furnace-cli')
    console.log(version)
  } catch (error) {
    const binPath = which.sync('furnace')
    const linkPath = readlinkSync(binPath)
    const resolvedPath = path.resolve(binPath, '..', '..', linkPath)
    const baseDir = path.dirname(resolvedPath)
    const packageJson = path.join(baseDir, 'package.json')

    if (fsutils.exists(packageJson)) {
      const pkg = JSON.parse(fsutils.readFile(packageJson))
      console.log(pkg.version)
    } else {
      console.log(`unable to find package.json at ${packageJson}`)
    }
  }
}
