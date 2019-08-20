## @polite/cli
----
A polite and semantic command line utility powered by middleware.  
Written for and tested on node v8.9.1+ with support for Babel.

----

## How does it work?
Polite uses the `please` command to provide a flexible and easy-to-use command line platform for your application.
Polite scans the working directory for one of the following files:
+ polite.js
+ polite.config.js
+ polite.babel.js
+ polite.{**process.env.NODE_ENV**}.js

You can define procedures and middleware in your configuration file, and polite provides useful help text and common libraries to aid you.

----

## Command Line Options
* `--babel`
    * Enables babel-register & babel-polyfill

## Configuration Options
* procedures &nbsp; <sup>`object`</sup>
    * A hashmap keyed by procedure name and containing procedure objects
* middleware &nbsp; <sup>`array`</sup>
    * An array of middleware methods to be executed _before_ any procedures
* postMiddleware &nbsp; <sup>`array`</sup>
    * An array of middleware methods to be executed _after_ any procedures
* babel &nbsp; <sup>`bool`</sup>
    * Enables babel-register & babel-polyfill

----

## Procedure Object Specification
A procedure object should contain the following keys:
* name &nbsp; <sup>`string`</sup>
    - a string name to be used for help text
* description &nbsp; <sup>`string`</sup>
    - descriptive text for use in the "help" command
* run &nbsp; <sup>`fn(ctx, next)`</sup>
    - a middleware method to be executed for this procedure
 
----

## Example Configuration
```javascript
module.exports = {
  procedures: {
    test: {
      name: "test",
      description: "Descriptive text for use in the 'help' command",
      run: async (ctx, next) => {
        console.log("Test:", ctx.hasTestMiddleware); // Test: true
        await next();
      }
    },
    test2: {
      name: "test2",
      description:
        "This method does not await next, so 'All done!' will not be logged",
      run: async (ctx, next) => {
        console.log("Test2:", ctx.hasTestMiddleware); // Test2: true
        ctx.inputLoop = true; // Begins an infinite input loop until the user requests an "exit"
        // Since this method does not 'await next()' the postMiddleware will not execute
      }
    }
  },
  middleware: [
    // These methods will be added to the stack _before_ procedure execution
    async (ctx, next) => {
      ctx.hasTestMiddleware = true;
      await next();
    }
  ],
  postMiddleware: [
    // These methods will be added to the stack _after_ procedure execution
    async (ctx, next) => {
      console.log("All done!");
    }
  ]
};

```

## Example Usage
```bash
> please test
Test: true
All done!
> please test2
Test2: true
All done!
```