const https = require('https');

const options = {
    host: 'api.github.com',
    path: '/repos/ProjectFurnace/furnace-test/deployments',
    port: 443,
    method: 'POST',
    headers: {
        'User-Agent': 'Project Furnace',
        'Authorization': 'Bearer c473040b53010dbddd20f3f9d60f0a940c95565c',
        'Accept': "application/vnd.github.v3+json",
        'content-type': "application/json"
    }
};

const deployment = {
    owner: "ProjectFurnace",
    repo: "furnace-test",
    ref: "master",
    environment: "dev",
}

const postData = JSON.stringify(deployment);

const req = https.request(options, (res) => {
//   resolve('Success');
    console.log("success", res.statusCode)

    res.on('data', (d) => {
        console.log("got data");
        process.stdout.write(d);
      });
});

req.on('error', (e) => {
//   reject(e.message);
    console.log("err", e);
});

// send the request
req.write(postData);
req.end();