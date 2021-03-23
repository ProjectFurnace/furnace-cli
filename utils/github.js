const { Octokit } = require("@octokit/rest");

let octokit;

module.exports.authenticateWithToken = (token) => {
  auth(token);
};

getOwnerRepoFromUrl = (url) => {
  const repoParts = url.split("/");
  const repo = repoParts.pop().replace(".git", "");
  const owner = repoParts.pop();

  return { owner, repo };
};

//TODO: Refactor this. It's far from elegant but Octokit was working in quite a different way before and this is a quick fix
auth = (token) => {
  if (token) {
    octokit = new Octokit({
      userAgent: "FurnaceCLI v1.0.6",
      previews: ["machine-man-preview"],
      auth: "token " + token,
    });
  } else {
    octokit = new Octokit();
  }
};

module.exports.createRepoHook = async (token, repoUrl, url, secret) => {
  auth(token);

  const config = {
    url,
    content_type: "json",
    secret,
    insecure_ssl: 0,
  };

  const { owner, repo } = getOwnerRepoFromUrl(repoUrl);

  const name = "web",
    events = ["push", "deployment"],
    active = true;
  const hook = { owner, repo, name, config, events, active };
  // octokit = new Octokit();

  const result = await octokit.repos.createWebhook(hook);
  if (result.status !== 201) {
    throw new Error(`unable to create hook`);
  }
};

module.exports.getRepository = async (token, url) => {
  auth(token);

  try {
    const repo = getOwnerRepoFromUrl(url);
    const result = await octokit.repos.get(repo);

    return result;
  } catch (err) {
    return null;
  }
};

module.exports.createRepositoryInOrg = async (token, url, prvt) => {
  auth(token);

  const { owner, repo } = getOwnerRepoFromUrl(url);
  const obj = { org: owner, name: repo, private: prvt };

  const result = await octokit.repos.createInOrg(obj);

  return result;
};

module.exports.createRepositoryForUser = async (token, url, prvt) => {
  auth(token);

  const { owner, repo } = getOwnerRepoFromUrl(url);
  const obj = { name: repo, private: prvt };

  const result = await octokit.repos.createForAuthenticatedUser(obj);

  return result;
};

module.exports.listDeployments = async (token, url, environment) => {
  auth(token);

  const { owner, repo } = getOwnerRepoFromUrl(url);
  const per_page = 10;

  const result = await octokit.repos.listDeployments({
    owner,
    repo,
    per_page,
    environment,
  });
  return result.data;
};

module.exports.getDeploymentStatus = async (
  token,
  url,
  deployment_id,
  status_id
) => {
  auth(token);

  const { owner, repo } = getOwnerRepoFromUrl(url);

  const result = await octokit.repos.getDeploymentStatus({
    owner,
    repo,
    deployment_id,
    status_id,
  });
  return result.data;
};

module.exports.listDeploymentStatuses = async (token, url, deployment_id) => {
  auth(token);

  const { owner, repo } = getOwnerRepoFromUrl(url);
  const state_id = 0;

  const result = await octokit.repos.listDeploymentStatuses({
    owner,
    repo,
    deployment_id,
    state_id,
  });
  return result.data;
};

module.exports.getOrgs = async (token) => {
  auth(token);

  const result = await octokit.orgs.listForAuthenticatedUser();
  return result.data.map((item) => item.login);
};

module.exports.getAuthenticatedUser = async (token) => {
  auth(token);

  const result = await octokit.users.getAuthenticated({});
  return result.data;
};
