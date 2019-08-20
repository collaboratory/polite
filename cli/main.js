const argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");
const path = require("path");
let config = {};
let configPath = path.resolve(process.cwd(), "polite.babel.js");
if (fs.existsSync(configPath)) {
  loadBabel();
  const babelConfig = require(configPath);
  Object.assign(config, babelConfig, { configPath });
} else {
  if (argv.babel) {
    loadBabel();
  }

  ["polite.js", "polite.config.js"].map(f => {
    configPath = path.resolve(process.cwd(), f);
    if (fs.existsSync(configPath)) {
      const extraConfig = require(configPath);
      Object.assign(config, extraConfig, { configPath });
    }
  });

  if (!argv.babel && config.babel) {
    loadBabel();
  }
}

function loadBabel() {
  require("@babel/register");
  require("@babel/polyfill");
}

require("./app")(argv, config);
