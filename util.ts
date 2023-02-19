import { NodePath,Node } from "@babel/traverse"
import * as t from "@babel/types"

class Util {
    constructor(){}

    isAlikeIdentifier(identifier:Node,checkAgainstIdentifer:Node) : boolean {
        if(!t.isIdentifier(identifier) || !t.isIdentifier(checkAgainstIdentifer)){
            throw Error(`invalid identifier.`)
        }
        return identifier.name === checkAgainstIdentifer.name
    }

}

export default new Util()