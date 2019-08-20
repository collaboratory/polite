const path = require("path");
const fs = require("fs");

let linter = false;
try {
  const ESLint = require("eslint").CLIEngine;
  linter = new ESLint({
    useEslintrc: true,
    fix: true
  });
} catch (err) {
  console.warn("eslint not loaded. expect strange scaffold formatting.");
}

const ScaffoldProcedure = {
  name: "scaffold",
  description: "Scaffold one or more stubs",
  initialized: false,
  config: {},
  initialize: ctx => {
    if (ScaffoldProcedure.initialized) {
      return;
    }

    let configPath = false;
    for (let potentialConfig of [
      "scaffold.js",
      "scaffold.json",
      ".scaffoldrc"
    ]) {
      const resolved = path.resolve(process.cwd(), potentialConfig);
      if (fs.existsSync(resolved)) {
        configPath = resolved;
        break;
      }
    }

    let config = false;
    if (configPath) {
      try {
        ctx.log.info(`Using scaffold config at ${configPath}`);
        config = require(configPath);
      } catch (err) {
        ctx.log.warn(`Failed loading scaffold config at ${configPath}`);
        ctx.log.error(err);
      }
    } else if (ctx.config.scaffold) {
      ctx.log.info(`Using scaffold options found in ${ctx.config.configPath}`);
      config = ctx.config.scaffold;
    }

    if (!config) {
      ctx.log.error("Unable to scaffold without config file");
    }

    const stubs = config.stubs || [];
    if (config.stubs_path) {
      const stubsPath = path.resolve(process.cwd(), config.stubs_path);
      if (!fs.existsSync(stubsPath)) {
        ctx.log.error(`Stubs directory does not exist: ${stubsPath}`);
      } else {
        const dirContent = fs.readdirSync(stubsPath);
        for (let dirFile of dirContent) {
          if (dirFile.split(".").pop() === "js") {
            const dirFilePath = path.resolve(stubsPath, dirFile);
            try {
              ctx.log.info(`Registering stub at ${dirFilePath}`);
              stubs.push(require(dirFilePath));
            } catch (err) {
              ctx.log.warn(`Failed to register stub at ${dirFilePath}`);
              ctx.log.error(err);
            }
          }
        }
      }
    }

    ctx.scaffoldPlugins = [];
    if (config.plugins) {
      for (let plugin of config.plugins) {
        if (!ctx.scaffoldPlugins.includes(plugin.id)) {
          ctx.scaffoldPlugins.push(plugin.id);
          for (let stub of plugin.stubs) {
            stubs.push({
              ...stub,
              supportURL: plugin.supportURL
            });
          }
        }
      }
    }

    ScaffoldProcedure.stubs = stubs;
    ScaffoldProcedure.config = config;
    ScaffoldProcedure.initialized = true;
  },
  prepareStub: async (requestedStub, ctx) => {
    const {
      services: { chalk, boxen }
    } = ctx;

    const activeStub = ScaffoldProcedure.stubs
      .filter(s => s.name === requestedStub)
      .shift();
    if (!activeStub) {
      ctx.log.error(`Unable to scaffold non-existant stub: ${requestedStub}`);
      return;
    }

    const stubConfig = await activeStub.config(ctx, ScaffoldProcedure.config);
    if (stubConfig.template) {
      ctx.log.info(
        `Stubbing output from template: ${chalk.white(stubConfig.template)}`
      );
      stubConfig.body = activeStub.templates[stubConfig.template](stubConfig);
    }

    if (!stubConfig.body) {
      ctx.log.error(
        boxen(
          `
  ERROR! ${chalk.yellow("No body found after stub execution.")}

  ${chalk.white(
    `Either the stub did not define a template for the body, or an unexpected error has been encountered.`
  )}
  
  ${chalk.gray(
    `For support, visit ${
      activeStub.supportURL
        ? chalk.blue(activeStub.supportURL)
        : `the repository for the ${chalk.white(requestedStub)} stub provider.`
    }`
  )}
`,
          { margin: 1, padding: 1, color: "red" }
        )
      );
      return;
    }

    return stubConfig;
  },
  run: async ctx => {
    ScaffoldProcedure.initialize();

    const requestedStub = ctx.args.shift();
    if (!requestedStub) {
      ctx.log.error(`No stub requested`);
      return;
    }

    const stubConfig = await ScaffoldProcedure.prepareStub(requestedStub, ctx);
    await ScaffoldProcedure.writeStub(stubConfig, ctx, true);

    ctx.log.info(`All done!`);
  },
  writeStub: (stubConfig, ctx, lint = false) => {
    const {
      services: { chalk }
    } = ctx;
    if (stubConfig.body && stubConfig.path) {
      if (lint) {
        ScaffoldProcedure.lintStub(stubConfig, ctx);
      }
      ctx.log.info(
        `Writing scaffolded file to ${chalk.white(stubConfig.path)}`
      );
      fs.writeFileSync(stubConfig.path, stubConfig.body);
    } else if (stubConfig.files) {
      stubConfig.files.forEach(file => {
        if (lint) {
          ScaffoldProcedure.lintStub(file, ctx);
        }
        ctx.log.info(`Writing scaffolded file to ${chalk.white(file.path)}`);
        fs.writeFileSync(file.path, file.body);
      });
    }
  },
  lintStub: (stubConfig, ctx) => {
    // Lint the body
    if (linter) {
      ctx.log.info(`Linting scaffolded output`);
      const messages = linter.executeOnText(stubConfig.body);
      stubConfig.body = messages.results[0].output;
    }

    return stubConfig;
  }
};

module.exports = ScaffoldProcedure;
