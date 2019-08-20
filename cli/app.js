const inquirer = require("inquirer");
const chalk = require("chalk");
const boxen = require("boxen");
const App = require("@emitterware/app");

inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
);
inquirer.registerPrompt(
  "checkbox-plus",
  require("inquirer-checkbox-plus-prompt")
);

const procedureMiddleware = require("./middleware/procedure");
const loggingMiddleware = require("./middleware/logging");

function buildContext(ctx, cmd) {
  ctx.cmd = cmd;
  const { _: args, ...params } = ctx.argv;
  ctx.args = args;
  ctx.params = params;
  ctx.services = {
    inquirer,
    chalk,
    boxen
  };
}

async function acceptInput() {
  return inquirer.prompt([
    {
      type: "input",
      name: "cmd",
      message: "What would you like to do now?",
      default: "exit"
    }
  ]);
}

module.exports = async function(argv, cfg) {
  const {
    middleware = [],
    postMiddleware = [],
    withoutProcedures = false,
    withoutLogging = false,
    ...config
  } = cfg;
  const app = new App();

  const provider = {
    id: "cli",
    handler: async () => {
      // Actual CLI "emitter"
      const ctx = { inputLoop: false, config, argv };
      if (argv._.length) {
        const cmd = argv._.shift();
        buildContext(ctx, cmd);
        await app.request(ctx, "cli");
      } else {
        ctx.inputLoop = true;
      }

      if (ctx.inputLoop) {
        let running = true;
        while (running) {
          const { cmd } = await acceptInput();
          if (cmd === "exit") {
            process.exit();
          }

          buildContext(ctx, cmd);
          await app.request(ctx, "cli");
          if (ctx.inputLoop === false) {
            running = false;
          }
        }
      }
    }
  };

  app.subscribe(provider);

  if (Array.isArray(middleware)) {
    middleware.map(m => app.on("cli", m));
  }
  if (!withoutLogging) {
    app.on("cli", loggingMiddleware(config));
  }
  if (!withoutProcedures) {
    app.on("cli", procedureMiddleware(config.procedures));
    if (Array.isArray(postMiddleware)) {
      postMiddleware.map(m => app.on("cli", m));
    }
  }
  await provider.handler();
};
