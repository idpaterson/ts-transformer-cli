# Syntax Transformer CLI for Typescript

[![Build Status](https://img.shields.io/travis/ts-contrib/ts-transformer-cli/master.svg)](http://travis-ci.org/ts-contrib/ts-transformer-cli "Check this project's build status on TravisCI")
[![npm version](https://badge.fury.io/js/ts-transformer-cli.svg)](https://badge.fury.io/js/ts-transformer-cli)

This is a wrapper for the Typescript CLI that allows consumers to specifiy custom syntax transformers.

Transformers are specified in the tsconfig.json file and will be acquired via node require or a path that is specified in the transformer config. 

When using npm packages to acquire a transformer the following naming convention is supported `ts-transformer-<name>`

Local paths are resolved from the $cwd.

## Usage

```
Syntax:   tstc [options]

Examples: tstc
          tstc -p tsconfig.json

Options:

  -p --project FILE OR DIRECTORY

  Compile the project given the path to its configuration file, 
  or to a folder with a 'tsconfig.json'.

 ```

The tsconfig is exactly same format as [specified in typescript](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

## Transformers

#### Example tsconfig

```js
{
  "transformers": {
    // Required. Transformer name
    "mytransformer": {

      // Optional. Will attempt to require the path provided using the $cwd.
      // When omitted the cli will attempt to require('ts-transformer-<NAME>')
      "require": "./ts-transformer-mytransformer/index.js", 

      // Optional. Can be "before" and/or "after". "before" is the default. 
      // When omitted it will use "before" as the default
      "when": ["before", "after"],

      // Config that will be given to the entry method  of the transformer
      "config": {                   
        "hello": "world"
      }

    }

  },

  // all other typescript properties supported
  ...
}

```

#### Example Transformer

```js
module.exports = function (transformerConfig) {

  console.log("config", transformerConfig)

  // this is the function given to the typescript compiler
  return function (context) {
    const ts = require('typescript')

    function visit(node) {
      console.log("visited")
      console.log(node.text)
      return ts.visitNodes(node, visit, context)
    }

    return function transform(sourceFile) {
      return ts.visitNode(sourceFile, visit)
    }
  }

}
```