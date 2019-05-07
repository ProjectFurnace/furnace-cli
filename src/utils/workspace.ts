const os = require('os')
const path = require('path')
const fsutils = require('@project-furnace/fsutils')

/**
 * Initialize the Furnace deployment process, write a new config
 * file if one doesn't exist already.
 */
export function initialize () {
  const workspaceDir = getWorkspaceDir()
  const configFile = getConfigPath()

  if (!fsutils.exists(workspaceDir)) {
    fsutils.mkdir(workspaceDir)

    console.log(`Furnace workspace does not exist, creating at ${workspaceDir}`)

    const directories = ['bootstrap', 'repo', 'repo/module', 'repo/stack', 'temp', 'templates']

    for (let dir of directories) {
      const p = path.join(workspaceDir, dir)
      if (!fsutils.exists(p)) fsutils.mkdir(p)
    }
  }

  if (!fsutils.exists(configFile)) {
    fsutils.writeFile(configFile, JSON.stringify({}))
  }
}

/**
 * Saves a new config file.
 * 
 * @params {Object} config
 */
export function saveConfig (config: any) {
  const configFile = getConfigPath()
  fsutils.writeFile(configFile, JSON.stringify(config))
}

/**
 * Retrieves the config.
 * 
 * @returns {Object}
 */
export function getConfig () {
  const configFile = getConfigPath()

  if (!fsutils.exists(configFile)) return {}

  return JSON.parse(fsutils.readFile(configFile))
}

/**
 * Retrieves the config file path.
 * 
 * @returns {String}
 */
export function getConfigPath (): String {
  return path.join(getWorkspaceDir(), 'config.json')
}

/**
 * Retrieves the current context.
 */
export function getCurrentContext () {
  const config = getConfig()

  if (!config) return null

  let context = config[config.current]
  context.name = config.current

  return config[config.current]
}

/**
 * Retrieves the remote URL.
 * 
 * @returns {String}
 */
export async function getRemoteUrl (): Promise<String> {
  const currentPath: string = process.cwd()
  const git = require('simple-git/promise')(currentPath)
  let remoteUrl: string

  try {
    const remotesResponse = await git.listRemote(['--get-url'])
    let remotes = []

    if (remotesResponse) remotes = remotesResponse.split('\n')
    if (remotes.length === 0) throw new Error('can\'t get remote url')
    
    remoteUrl = remotes[0]

    const logs = await git.log()
    if (!logs.latest.hash) throw new Error('unable to get last commit')

  } catch (err) {
    throw new Error(`unable to get commit info: ` + err)
  }

  return remoteUrl
}

/**
 * Retrieves the path to the workspace directory.
 * 
 * @returns {String}
 */
export function getWorkspaceDir (): String {
  return path.join(os.homedir(), '.furnace')
}
