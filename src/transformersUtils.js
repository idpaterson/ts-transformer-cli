const ts = require('typescript')
const compile = require('./compile')
const { reportDiagnostics } = require('./utils')

function setCustomModuleTransformer(transformer) {
  const moduleOption = ts.optionDeclarations
    .reduce((result, optDecl) => optDecl.name === 'module' ?
      result = optDecl :
      result
    )

  // add the type module id to the module options list
  moduleOption.type.set(transformer.id, 100)

  // swap the default ts transformer module
  const defaultTransformModule = ts.transformModule
  ts.transformModule = transformer.handler(transformer.config, defaultTransformModule)
  transformer.defaultTransformModule = defaultTransformModule
}

function parseTransformers(transformers) {
  const acquire = require('./acquire')

  return Object.keys(transformers)
    .map(function (id) {
      const transformer = transformers[id]

      // determine before and after
      let runBefore = false, runAfter = false, runAsModule = false
      if (transformer.when) {
        runAsModule = transformer.when.indexOf('module') > -1
        runBefore = transformer.when.indexOf('before') > -1
        runAfter = transformer.when.indexOf('after') > -1
      }

      // default before if no "when" entry found
      if (!runBefore && !runAfter && !runAsModule)
        runBefore = true

      // determine require path
      let requirePath = transformer.as || `ts-transformer-${id}`
      if (ts.isRootedDiskPath(requirePath) === false)
        requirePath = ts.combinePaths(process.cwd(), requirePath)

      // get the config
      const config = transformer.config

      return acquire(requirePath)
        .then(function (handler) {
          // TODO check if we have a valid handler
          const isFunction = handler instanceof Function

          return {
            id,
            config,
            runAsModule,
            runBefore,
            runAfter,
            handler
          }
        })
    })
}

module.exports.parseTransformersTsConfigEntry = function (transformersConfig) {
  const transConfigIsString = typeof transformersConfig === 'string'
  const transConfigIsObject = transformersConfig instanceof Object
  if (!transConfigIsString && !transConfigIsObject) 
    return null
  
  if (transConfigIsObject)
    return transformersConfig

  if (!transConfigIsString) {
    ts.sys.write(`Attempted and failed to parse the transformers config. Saw ${transConfigIsString}`)
    return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
  }

  // check if this is a valid path and the file exists
  const transformersConfigPath = ts.combinePaths(ts.sys.getCurrentDirectory(), transformersConfig)
  if (!ts.sys.fileExists(transformersConfigPath)) {
    ts.sys.write(`Attempted and failed to find the transformers config file at ${transformersConfigPath}`)
    return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
  }

  return require(transformersConfigPath)
}

function pluckStagedTransformers(transformers) {
  const before = transformers.filter(t => t.runBefore)
  const after = transformers.filter(t => t.runAfter)
  const modules = transformers.filter(t => t.runAsModule)

  const stagedTransformers = []

  stagedTransformers.push(before)
  stagedTransformers.push(after)
  stagedTransformers.push(modules)

  return stagedTransformers
}

module.exports.compile = function (configFilePath, configFileName, loadedConfigFile, transformersConfig) {
  const parsedTransformers = parseTransformers(transformersConfig)

  // process transformers
  Promise.all(parsedTransformers)
    .then(transformers => {
      let [before, after, modules] = pluckStagedTransformers(transformers)

      if (modules.length)
        setCustomModuleTransformer(modules[0])

      const configParseResult = ts.parseJsonConfigFileContent(
        // config
        loadedConfigFile,
        // host
        ts.sys,
        // base path
        ts.getDirectoryPath(configFilePath),
        // existing options
        null,
        // config file path
        ts.getNormalizedAbsolutePath(
          configFileName,
          ts.sys.getCurrentDirectory()
        )
      )

      if (configParseResult.errors.length > 0) {
        reportDiagnostics(configParseResult.errors, undefined)
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
        return
      }

      const compilerOptions = configParseResult.options

      compile(loadedConfigFile.files, compilerOptions, before, after)
    }).catch(error => {
      ts.sys.write(error.message)
      ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
    })

}