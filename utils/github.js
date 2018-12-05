const octokit = require("@octokit/rest")();

module.exports.createRepoHook = async (token, repoUrl, url, secret) => {
    if (token) auth(token);

    const config = {
        url, 
        content_type: "json", 
        secret, 
        insecure_ssl: 0
    }

    const { owner, repo } = getOwnerRepoFromUrl(repoUrl);

    const name = "web"
        , events = ["push"]
        , active = true
        ;

    const hook = { owner, repo, name, config, events, active };

    const result = await octokit.repos.createHook(hook)
    if (result.status !== 201) {
        throw new Error(`unable to create hook`);
    }
}

module.exports.getRepository = async (token, url) => {
    if (token) auth(token);

    try {
        const repo = getOwnerRepoFromUrl(url);
        const result = await octokit.repos.get(repo);

        return result;
    } catch (err) {
        return null;
    }

}

module.exports.createRepository = async (token, url, prvt) => {
    if (token) auth(token);

    const { owner, repo } = getOwnerRepoFromUrl(url);
    const obj = { org: owner, name: repo, private: prvt };

    const result = await octokit.repos.createInOrg(obj);

    return result;
}

getOwnerRepoFromUrl = (url) => {
    const repoParts = url.split("/");
    const repo = repoParts.pop().replace(".git", "");
    const owner = repoParts.pop();

    return { owner, repo }
}

auth = token => {
    octokit.authenticate({ type: 'token', token });
}