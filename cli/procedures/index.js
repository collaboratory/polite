const { version } = require("../package.json");
const globalProcedures = [
  {
    name: "help",
    description: "Show this help text",
    run: async (ctx, next, err) => {
      const { boxen, chalk } = ctx.services;
      const procedures = [
        ...globalProcedures,
        ...(ctx.config.procedures || [])
      ];
      console.log(
        boxen(
          `
    ${chalk.blue(`@polite/cli`)}    ${chalk.gray(version)}
    ${err ? chalk.red(`ERROR:    ${err}`) : ""}

        ${chalk.yellow(`Available commands:`)}    

            ${procedures
              .map(
                ({ name, description }) =>
                  `- ${name.padEnd(18, " ")} ${chalk.gray(description)}`
              )
              .join("\n            ")}
`,
          { margin: 1, padding: 2, borderColor: "gray" }
        )
      );
    }
  }
];

module.exports = globalProcedures;
