const path = require("path");
const fs = require("fs");

const defaultPropQuestion = {
  string: {
    type: "input",
    default: ""
  },
  number: {
    type: "number",
    default: 0
  },
  bool: {
    type: "checkbox",
    default: false,
    choices: [true, false]
  }
};

module.exports = {
  name: "component",
  config: async (ctx, projectConfig) => {
    const {
      log,
      services: { inquirer }
    } = ctx;
    log.info("Configuring component");
    const config = await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "What do you want to call this component?"
      },
      {
        type: "list",
        name: "type",
        message: "What type of component do you want to make?",
        choices: [
          "Function Component",
          "Class Component",
          "Styled Component",
          "Pure Component"
        ]
      }
    ]);

    let definingPropTypes = true;
    const propTypes = {};
    while (definingPropTypes) {
      const response = await inquirer.prompt([
        {
          type: "confirm",
          name: "definingPropTypes",
          message: "Would you like to define a propType?"
        }
      ]);
      definingPropTypes = response.definingPropTypes;
      if (definingPropTypes) {
        const propConfig = await inquirer.prompt([
          {
            type: "input",
            name: "title",
            message: "What will you call this prop?"
          },
          {
            type: "list",
            name: "type",
            message: "What type of prop is this?",
            choices: [
              "string",
              "bool",
              "number",
              "func",
              "array",
              "object",
              "node",
              "any"
            ]
          },
          {
            type: "confirm",
            name: "required",
            message: "Will this prop be required?"
          }
        ]);
        propTypes[propConfig.title] = {
          title: propConfig.title,
          type: propConfig.type,
          required: propConfig.required
        };
        if (!propConfig.required && defaultPropQuestion[propConfig.type]) {
          const { defaultValue } = await inquirer.prompt([
            {
              name: "defaultValue",
              message: "What shall be the default value for this property?",
              ...defaultPropQuestion[propConfig.type]
            }
          ]);
          propTypes[propConfig.title].defaultValue = defaultValue;
        }
      }
    }
    config.propTypes = propTypes;
    config.template = {
      "Function Component": "func",
      "Class Component": "class"
    }[config.type];

    const componentDir = path.resolve(
      process.cwd(),
      projectConfig.component_path || "./client/components"
    );

    if (!fs.existsSync(componentDir)) {
      log.info(`Attempting to create components directory: ${componentDir}`);
      fs.mkdirSync(componentDir);
    }

    config.path = path.resolve(componentDir, `${config.title}.js`);
    return config;
  },
  templates: {
    func: ({ title, propTypes }) => {
      const propTypesArray = Object.entries(propTypes);
      const hasPropTypes = propTypesArray.length;
      const defaultProps = propTypesArray.filter(
        pt => pt.defaultValue !== undefined
      );

      return `
        ${renderIf(hasPropTypes, `import PropTypes from "prop-types";`)}
        import React from "react";
        function ${title}(${renderIf(
        hasPropTypes,
        stringifyPropParams(propTypes)
      )}) {
          return <div></div>
        }
        ${renderIf(
          hasPropTypes,
          `${title}.propTypes = ${stringifyPropTypes(propTypes)}`
        )};
        ${renderIf(
          defaultProps.length,
          `${title}.defaultProps = ${JSON.stringify(
            defaultProps.map(
              pt => ({
                [pt.title]: pt.defaultValue
              }),
              {}
            )
          )};`
        )}
        export default ${title};
      `;
    },
    class: ({ title, propTypes }) => {
      const hasPropTypes = Object.entries(propTypes).length;
      const defaultProps = Object.entries(propTypes).map(
        pt => pt.defaultValue !== undefined
      );
      const hasDefaultProps = defaultProps.length;
      return `
        ${renderIf(hasPropTypes, `import PropTypes from "prop-types";`)}
        import React, { Component } from "react";
        class ${title} extends Component {
            ${renderIf(
              hasPropTypes,
              `static propTypes = ${stringifyPropTypes(propTypes)};`
            )}
            ${renderIf(
              hasDefaultProps,
              `static defaultProps = ${JSON.stringify(
                defaultProps.reduce(
                  (obj, pt) => ({
                    ...obj,
                    [pt.title]: pt.defaultValue
                  }),
                  {}
                )
              )};`
            )}
          render() {
            ${renderIf(
              hasPropTypes,
              `const ${stringifyPropParams(propTypes)} = this.props;`
            )}
            return <div></div>;
          }
        }
        export default ${title};
      `;
    }
  }
};

function renderIf(condition, thing) {
  return condition ? thing : "";
}

function stringifyPropTypes(propTypes) {
  return `{ ${(Array.isArray(propTypes) ? propTypes : Object.values(propTypes))
    .map(
      pt =>
        `${pt.title}: PropTypes.${pt.type}${pt.required ? ".isRequired" : ""}`
    )
    .join(`,\n`)}}`;
}

function stringifyPropParams(propTypes) {
  return `{ ${(Array.isArray(propTypes) ? propTypes : Object.values(propTypes))
    .map(pt => pt.title)
    .join(", ")} }`;
}
