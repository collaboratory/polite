const procedures = require("../procedures");
function procedureMiddleware(localProcedures = []) {
  const allProcedures = [...procedures, ...localProcedures];
  return async (ctx, next) => {
    const proc = ctx.cmd.toLowerCase();
    const namedProcedure = allProcedures.filter(p => p.name === proc).pop();
    if (namedProcedure) {
      try {
        namedProcedure.run(ctx, next);
      } catch (err) {
        const helpProcedure = allProcedures
          .filter(p => p.name === "help")
          .pop();
        if (helpProcedure) {
          helpProcedure.run(ctx, next, err);
        } else {
          console.error(
            "Unable to execute help procedure. You've done something terribly stupid."
          );
        }
      }
    } else {
      const { chalk } = ctx.services;
      console.log(`
      ${chalk.red(`Error!`)}
      ${chalk.yellow(`Unknown procedure:`)} ${ctx.cmd}
      ${chalk.yellow(`Available procedures:`)} ${allProcedures
        .map(p => p.name)
        .join(", ")}
    `);
      await next();
    }
  };
}

module.exports = procedureMiddleware;
