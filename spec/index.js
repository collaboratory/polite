const Scaffold = require("@polite/scaffold");
const SpecProcedure = {
  name: "spec",
  description: "Scaffold and create spec/test files for stubs",
  run: async ctx => {
    const {
      services: { chalk, inquirer }
    } = ctx;
    Scaffold.initialize(ctx);

    const requestedStub = ctx.args.shift();
    if (!requestedStub) {
      ctx.log.error(`No stub requested`);
      return;
    }

    const stubConfig = await Scaffold.prepareStub(requestedStub, ctx);
    await Scaffold.writeStub(stubConfig, ctx, true);
    ctx.log.info(`${requestedStub} saved to ${stubConfig.path}`);

    const spec = [];
    let describingContext = true;
    while (describingContext) {
      const response = await inquirer.prompt([
        {
          type: "confirm",
          name: "describing",
          message: `Would you like to describe ${
            spec.length ? "another" : "a"
          } feature for testing?`
        }
      ]);
      describingContext = response.describing;
      if (describingContext) {
        const { contextName } = await inquirer.prompt([
          {
            type: "input",
            name: "contextName",
            message: "What feature would you like to describe?"
          }
        ]);
        const context = {
          name: contextName,
          behaviors: []
        };
        let describingBehavior = true;
        while (describingBehavior) {
          const { shouldContinue } = await inquirer.prompt([
            {
              type: "confirm",
              name: "shouldContinue",
              message: `Would you like to describe ${
                context.behaviors.length ? "another" : "an"
              } expected behavior of ${context.name}?`
            }
          ]);
          describingBehavior = shouldContinue;
          if (shouldContinue) {
            const { behavior } = await inquirer.prompt([
              {
                type: "input",
                name: "behavior",
                message: `${context} should:`
              }
            ]);
            context.behaviors.push(behavior);
          }
        }
        spec.push(context);
      }
    }

    const pathParts = stubConfig.path.split(".");
    const specStub = {
      path: `${pathParts.slice(0, -1).join(".")}.spec.js`,
      body: spec
        .map(
          context => `
            describe("${context.name}", () => {
                ${context.behaviors
                  .map(
                    behavior => `
                    it("should ${behavior}", () => {
                        expect(false).toBe(true);
                    });
                `
                  )
                  .join("\n")}
            });
        `
        )
        .join("\n")
    };
    await Scaffold.writeStub(specStub, ctx, true);
    ctx.log.info(`spec saved to ${specStub.path}`);
  }
};
module.exports = SpecProcedure;
