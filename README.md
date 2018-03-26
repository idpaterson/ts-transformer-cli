# Syntax Transformer CLI for Typescript

[![Build Status](https://img.shields.io/travis/ts-contrib/ts-transformer-cli/master.svg)](http://travis-ci.org/ts-contrib/ts-transformer-cli "Check this project's build status on TravisCI")
[![npm version](https://badge.fury.io/js/ts-transformer-cli.svg)](https://badge.fury.io/js/ts-transformer-cli)

This is a wrapper for the Typescript CLI that allows consumers to specifiy custom syntax transformers.

Transformers are specified in the tsconfig.json file and will be acquired via node require.
  - When using npm packages to acquire a transformer the following naming convention is supported `ts-transformer-<name>`
  - When a local path is pecified the package will be resolved using the $cwd.

## Usage

```
Syntax:   tstc [options]

Examples: tstc
          tstc -p tsconfig.json

Options:

  -p, --project FILE OR DIRECTORY

  Compile the project given the path to its configuration file, 
  or to a folder with a 'tsconfig.json'.

  -v, --version

  Print the compiler's version.

 ```

The tsconfig is exactly same format as [specified in typescript](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

## Transformers

#### Example transformer config

```js
// Transformer config
{

  // Required. Transformer name
  "mytransformer": {

    // Optional. Will attempt to require the path\name provided using the $cwd.
    // When omitted the cli will attempt to require('ts-transformer-<NAME>')
    "as": "./ts-transformer-mytransformer/index.js", 

    // Optional. Can be "before" and/or "after". "before" is the default. 
    // When "module" is specified it will replace typescript's default transform module
    // When omitted it will use "before" as the default
    "when": ["module", "before", "after"],

    // Config that will be given to the entry method  of the transformer
    "config": {                   
      "hello": "world"
    }

  }
}
```

The transformers config can be in a seperate file or inside the tsconfig

#### Example tsconfig

```js
// as a local path specifier
{
  "compilerOptions":{...},
  "transformers": "./transformers.json"
}

```

Transformers in the tsconfig file example

```js
//  tsconfig.json
{
  "compilerOptions":{...},

  "transformers": {
    // ... transformer config as above
  }
}
```

#### Example Transformer

```js
module.exports = function (transformerConfig, program) {

  console.log("config", transformerConfig)

  // this is the function given to the typescript compiler
  return function (context) {
    const ts = require('typescript')
    const typeChecker = program.getTypeChecker();

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

#### Example Module Transformer

```js
// tsconfig compiler options
{
  "compilerOptions": {
    "module": "my-module-transformer"
  }
}

// Transformer config
{
  "my-module-transformer": {
    "when": ["module"],
    "config": {
      "hello": "world"
    }
  }
}
```

```js
module.exports = function (transformerConfig, defaultTransformModule) {

  // this is the function given to the typescript compiler
  // defaultTransformModule is the replaced typescript function
  return function (context) {
    const ts = require('typescript')

    return function transform(sourceFile) {
      // write your own module
      return ts.visitNode(sourceFile, visit)
    }
  }

}
```