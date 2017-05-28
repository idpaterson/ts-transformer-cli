module.exports = function (transformerConfig, defaultTransformModule) {
  console.log("module config", transformerConfig)

  return function (context) {
    const ts = require('typescript')
    const compilerOptions = context.getCompilerOptions()
    const resolver = context.getEmitResolver()
    const moduleInfoMap = []

    return function transform(node /* sourceFile */) {
      const currentSourceFile = node;
      const currentModuleInfo = ts.collectExternalModuleInfo(node, resolver, compilerOptions)
      moduleInfoMap[ts.getOriginalNodeId(node)] = currentModuleInfo

      // Perform the transformation.
      const statements = [
        createFunctionStatementExample(node),
      ]

      const updated = ts.updateSourceFileNode(
        node,
        ts.setTextRange(ts.createNodeArray(statements), node.statements)
      )

      return ts.aggregateTransformFlags(updated)
    }


    function createFunctionStatementExample(node) {
      const body = ts.createBlock(node.statements, /*multiLine*/ true);
      return ts.createFunctionExpression(
        /*modifiers*/ undefined,
        /*asteriskToken*/ undefined,
        /*name*/ 'ExampleModuleWrapper',
        /*typeParameters*/ undefined,
        /*func params*/
        [
          ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, "arg1"),
          ts.createParameter(/*decorators*/ undefined, /*modifiers*/ undefined, /*dotDotDotToken*/ undefined, "arg2")
        ],
        /*type*/ undefined,
        /*body*/ body
      )
    }

  }

}