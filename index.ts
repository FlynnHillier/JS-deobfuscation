import fs from "fs"
import * as parser from "@babel/parser"
import {default as generate} from "@babel/generator"
import {default as traverse} from "@babel/traverse"
import * as t from "@babel/types"

import util from "./util"

//assuming script input file is in location './script.js'
const plainjs = fs.readFileSync("./resources/obscript.js","utf-8")

const AST = parser.parse(plainjs)
// console.log(AST.program.body)

const proxyUtilityObjects : t.VariableDeclarator[] = []


traverse(AST,{
    VariableDeclarator : function(path) {
        if(t.isObjectExpression(path.node.init)){
            if(path.node.init.properties.every(node=> t.isObjectProperty(node) && t.isFunctionExpression(node.value) )){ //is proxy utility function object
                if(t.isIdentifier(path.node.id)){
                    proxyUtilityObjects.push(path.node)
                }
            }
        }
    },
    CallExpression: (path) => {
        if(!t.isCallExpression(path.node)){
            return
        }

        const INSTANCEARGS = path.node.arguments //arguments passed to call Expression

        if(!t.isMemberExpression(path.node.callee)){ //if calle is not a 'member expression'
            return
        }

        const callee_OBJ = path.node.callee.object
        const callee_PROP = path.node.callee.property

        if(!t.isIdentifier(callee_OBJ) || !t.isIdentifier(callee_PROP)){
            return
        }

        //find matching object
        const OBJ = proxyUtilityObjects.find(node => t.isIdentifier(node.id) && util.isAlikeIdentifier(node.id,callee_OBJ))
        if(!OBJ || !t.isIdentifier(OBJ.id)){
            return
        }
        const OBJNAME = OBJ.id.name


        //find matching property
        if(!t.isVariableDeclarator(OBJ) || !t.isObjectExpression(OBJ.init)){
            return
        }
        const PROP = OBJ.init.properties.find(property => t.isProperty(property) && t.isStringLiteral(property.key) && property.key.value === callee_PROP.name)

        if(!t.isProperty(PROP) || !t.isStringLiteral(PROP.key)){ //for typing purposes
            return
        }
        const PROPNAME = PROP.key.value

        if(!t.isFunctionExpression(PROP.value)){
            return
        }


        //getting paramater indexes
        const paramIndexMap = new Map<string,number>()
        for(let i = 0; i < PROP.value.params.length;i++){
            const PROPVALUE = PROP.value.params[i]
            if(!t.isIdentifier(PROPVALUE)){
                return
            }
            paramIndexMap.set(PROPVALUE.name,i)
        }

        if(PROP.value.body.body.length > 1){ //if the function is more complicated than a single line
        } else{
            
            //##INSERT HERE##
            // - replace all identifier references to params to relevant argument names
            // - remove returnStatement
            // - replace path with newly generated expression.
            
        }
    }
})
// console.log(proxyUtilityObjects)

const clean = generate(AST).code

fs.writeFileSync("cleaned.js",clean)