const ts = require('typescript')

module.exports = {
  reportDiagnostic,
  reportDiagnostics,
  printVersion,
  getDiagnosticText,
}

function reportDiagnostic(diagnostic) {
  if (!diagnostic.file) {
    console.log(`${diagnostic.messageText}`)
    return
  }
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  ts.sys.write(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
}

function reportDiagnostics(diagnostics) {
  diagnostics.forEach(reportDiagnostic)
}

function printVersion() {
  ts.sys.write(
    getDiagnosticText(ts.Diagnostics.Version_0, ts.version) + ts.sys.newLine
  )
}

function getDiagnosticText(...args) {
  var diagnostic = ts.createCompilerDiagnostic.apply(undefined, args)
  return diagnostic.messageText
}