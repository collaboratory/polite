const DEFAULT_TYPE_COLORS = {
  info: "cyan",
  warn: "orange",
  error: "red",
  success: "green"
};

module.exports = config => async (ctx, next) => {
  const TYPE_COLORS = config.loggingColors || DEFAULT_TYPE_COLORS;
  ctx.log = {
    message: (message, type = "info", prefix = false, data = false) =>
      console.info(
        `${
          ctx.prefix ? ctx.services.chalk.yellow(ctx.prefix) : ""
        }${ctx.services.chalk[TYPE_COLORS[type]](message)}${
          ctx.data ? ctx.services.chalk.gray(JSON.stringify(data, null, 2)) : ""
        }`
      ),
    info: (message, prefix = false, data = false) =>
      ctx.log.message(message, "info", prefix, data),
    warn: (message, prefix = false, data = false) =>
      ctx.log.message(message, "warn", prefix, data),
    error: (message, prefix = false, data = false) =>
      ctx.log.message(message, "error", prefix, data),
    success: (message, prefix = false, data = false) =>
      ctx.log.message(message, "success", prefix, data)
  };
  await next();
};
