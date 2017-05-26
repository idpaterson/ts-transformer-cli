module.exports = function (fileNames, compilerOptions, beforeTransformers, afterTransformers) {
  const ts = require('typescript')
  const { reportDiagnostics } = require('./utils')

  const compilerHost = ts.createCompilerHost(compilerOptions)

  const program = ts.createProgram(
    fileNames,
    compilerOptions,
    compilerHost
  )

  let before, after

  if (beforeTransformers)
    before = beforeTransformers.map(
      transformer => transformer.handler(transformer.config)
    )

  if (afterTransformers)
    after = afterTransformers.map(
      transformer => transformer.handler(transformer.config)
    )

  const transformers = { before, after }

  const emitResult = program.emit(
    undefined, undefined, undefined, false,
    transformers
  )

  if (emitResult.diagnostics.length > 0) {
    reportDiagnostics(emitResult.diagnostics, undefined)
    ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped)
    return
  }

  ts.sys.exit(ts.ExitStatus.Success)
}