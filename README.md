# Syntax Transformer CLI for Typescript

This is a wrapper for the Typescript CLI that allows consumers to specifiy custom syntax transformers.

Transformers are specified in the tsconfig.json file and will be acquired via node require or a path that is specified in the transformer config. Local paths are resolved from the $cwd.

When using npm packages to acquire a transformer the following naming convention is supported `ts-transformer-<name>`

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

Example tsconfig

```js
{
  "transformers": {
    // Required. Transformer name
    "mytransformer": {

      // Optional. Will attempt to require the path provided using the $cwd.
      // When omitted the cli will attempt to require('ts-transformer-<name>')
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
}

```