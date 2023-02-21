const fs = require("fs")
const parser = require("@babel/parser")
const generate = require("@babel/generator").default
const traverse = require("@babel/traverse").default
const t = require("@babel/types")

//assuming script input file is in location './script.js'
const plainjs = fs.readFileSync("./resources/obscript.js","utf-8")

//parse AST from script
const AST = parser.parse(plainjs)


traverse(AST,{
    VariableDeclaration:(path) => {
        //if multiple declarations have occured
        if(path.node.declarations.length !== 1){
            return
        }

        const declarator = path.node.declarations[0]

        //check is declaration object expression
        if(!t.isObjectExpression(declarator.init)){
            return
        }

        const map = new Map()
        //check all properties are functionExpression & build param map
        for(let prop of declarator.init.properties){
            if(!t.isFunctionExpression(prop.value)){
                return
            }

            //update map properties
            map.set(prop.key.value,{
                params:prop.value.params,
                body:prop.value.body.body
            })
        }


        //## declaration is identified as being proxy util function ##
        console.log(`identified proxy function object: ${path.node.declarations[0].id.name}`)

        //flag declaring wether to remove the initial declaration
        let shouldRemove = false

        const varName = path.get("declarations.0.id")
        const idPath = path.get("declarations.0.id")
        
        const binding = idPath.scope.getBinding(varName)

        if(!binding){
            return
        }

        const {constant, referencePaths } = binding
        //unsafe to remove if is not constant
        if(!constant) return

        //it is now considered safe to remove
        shouldRemove = true

        for(const referencePath of referencePaths) {
            const {parentPath} = referencePath
            const {object, computed, property} = parentPath.node

            if(!(
                    t.isCallExpression(parentPath.parent) &&
                    t.isMemberExpression(parentPath.node) &&
                    computed == false &&
                    t.isIdentifier(property) &&
                    t.isIdentifier(object)
                )
            ) {
                shouldRemove = false
                continue
            }

            //get relevant proxy function based off property
            const funcDetails = map.get(property.name)

            //return if not found (should not occur)
            if(!funcDetails) {
                shouldRemove = false
                continue
            }

            if(funcDetails.body.length === 1){ //if function only contains single expression

                //reference single line of code
                const expression = funcDetails.body[0]

                //line of code is return statement
                if(!t.isReturnStatement(expression)){
                    shouldRemove = false
                    continue
                }

                //proxy function returns nothing
                if(!expression.argument){

                    //remove reference
                    referencePath.replaceWith(t.identifier("undefined"))
                }


                //map arguments
                const arguments = parentPath.parent.arguments

                const paramReplacementMap = new Map()
                for(let i = 0; i< funcDetails.params.length;i++){
                    const param = funcDetails.params[i].name

                    //map paramater name to argument value
                    arg = arguments[i]

                    paramReplacementMap.set(param,arg)

                    //if argument was not provided but was expected - throw error. (perhaps change to undefined in future)
                    if(!arg) {
                        throw Error("missing argument")
                    }
                }

                //proxy function is call expression
                if(t.isCallExpression(expression.argument)){

                    //SKIP ONLY FOR NOW
                    shouldRemove = false
                    continue
                    //REMOVE IN FUTURE
                }

                //proxy function is call expression
                if(t.isBinaryExpression(expression.argument)){
                    //match each identifier within the binary expression to the argument it should be replaced with.
                    const left = paramReplacementMap.get(expression.argument.left.name)
                    const right = paramReplacementMap.get(expression.argument.right.name)

                    if(!left || !right){
                        throw Error("unexpected error - unable to match binary expression identifier to argument.")
                    }

                    const operator = expression.argument.operator

                    //replace node with binary expression
                    try {
                        parentPath.parentPath.replaceWith(t.binaryExpression(operator,left,right))
                        console.log("replaced binary expression!")
                    } catch(e){
                        console.log("error - replacing.")   
                    }
                }

            } else{ //if function is more complex than single line.

                //unsafe (for now)
                shouldRemove = false
                continue
            }
        }

        //if shouldRemove flag is set to true, remove declaration.
        if(shouldRemove){
            path.remove()
        }
    }
})

const clean = generate(AST).code
fs.writeFileSync("cleaned.js",clean)