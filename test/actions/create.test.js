const actions = require("../../actions/create");

describe.only("create source", () => {
  it("should create source component", async () => {
    const result = actions.source(
      process.cwd() + "/test/fixtures/stack/simple",
      "source1",
      "timer"
    );
    console.log(result);
  });
});
