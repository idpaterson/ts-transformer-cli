const ts = require('typescript')
const {
  printVersion,
  reportDiagnostic,
  reportDiagnostics
} = require('./utils')

const commandLine = ts.parseCommandLine(ts.sys.args)

if (commandLine.errors.length > 0) {
  reportDiagnostics(commandLine.errors)
  return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
}

if (commandLine.options.version) {
  printVersion()
  return ts.sys.exit(ts.ExitStatus.Success)
}

let configFileName
if (commandLine.options.project) {

  if (commandLine.fileNames.length !== 0) {
    reportDiagnostic(
      ts.createCompilerDiagnostic(
        ts.Diagnostics.Option_project_cannot_be_mixed_with_source_files_on_a_command_line
      ),
      undefined
    )
    return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
  }

  let fileOrDirectory = ts.normalizePath(commandLine.options.project)
  if (!fileOrDirectory || ts.sys.directoryExists(fileOrDirectory)) {
    configFileName = ts.combinePaths(fileOrDirectory, "tsconfig.json")
    if (!ts.sys.fileExists(configFileName)) {
      reportDiagnostic(
        ts.createCompilerDiagnostic(
          ts.Diagnostics.Cannot_find_a_tsconfig_json_file_at_the_specified_directory_Colon_0,
          commandLine.options.project
        ),
        undefined
      )
      return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
    }
  } else {
    configFileName = fileOrDirectory
    if (!ts.sys.fileExists(configFileName)) {
      reportDiagnostic(
        ts.createCompilerDiagnostic(
          ts.Diagnostics.The_specified_path_does_not_exist_Colon_0,
          commandLine.options.project
        ),
        undefined
      )
      return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
    }
  }
} else if (commandLine.fileNames.length === 0) {
  const searchPath = ts.normalizePath(ts.sys.getCurrentDirectory());
  configFileName = ts.findConfigFile(searchPath, ts.sys.fileExists);
}

if (commandLine.fileNames.length === 0 && !configFileName) {
  reportDiagnostic(
    ts.createCompilerDiagnostic(
      ts.Diagnostics.Cannot_find_a_tsconfig_json_file_at_the_specified_directory_Colon_0,
      commandLine.options.project
    ),
    undefined
  )
  return ts.sys.exit(ts.ExitStatus.Success)
}

const configFilePath = ts.getNormalizedAbsolutePath(
  configFileName,
  ts.sys.getCurrentDirectory()
)

const loadedConfigFile = require(configFilePath)

if (!loadedConfigFile.compilerOptions) {
  reportDiagnostics([result.error], undefined)
  ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
  return
}

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
const compile = require('./compile')
const transformers = loadedConfigFile.transformers

let transformerPromises
if (transformers) {
  const acquireTransformers = require('./acquire-transformers')
  transformerPromises = acquireTransformers(transformers)
}

// process transformers
transformerPromises.then(transformers => {
  if (!transformers.length) {
    // no transformers but we made it here so compile anyway
    compile(loadedConfigFile.files, compilerOptions, null, null)
    return
  }

  const [before, after] = transformers
  compile(loadedConfigFile.files, compilerOptions, before, after)
})
  .catch(error => {
    console.error(error)
  })
