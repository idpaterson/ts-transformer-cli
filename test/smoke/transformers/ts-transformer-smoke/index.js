module.exports = function (transformerConfig) {

  console.log("config", transformerConfig)

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