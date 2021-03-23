const { run, runSimple } = require("run-container");

async function go() {
  const container = await run({
    Image: "pulumi/pulumi",
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    // Entrypoint: "bash",
    Cmd: ["version"],
    // HostConfig: {
    //   AutoRemove: true,
    // },
  });

  console.log(container);

  const stream = await container.attach({
    stream: true,
    stdout: true,
    stderr: true,
  });

  stream.pipe(process.stdout);
}

go();
