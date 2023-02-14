import fs from "fs"

import * as parser from "@babel/parser"
import {default as generate} from "@babel/generator"
import {default as traverse} from "@babel/traverse"
import * as types from "@babel/types"


//assuming script input file is in location './script.js'
const plainjs = fs.readFileSync("./script.js","utf-8")

const AST = parser.parse(plainjs)

traverse(AST,{
    
})

const clean = generate(AST).code

fs.writeFileSync("cleaned.js",clean)