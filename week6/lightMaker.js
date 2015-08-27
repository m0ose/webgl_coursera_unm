
var lighting = {
    lights : [],
    
    getFlatArray : function() {
        var res = []
        for(var x of this.lights){
            var tmp = flatten(x.getLightMat4())
            //console.log(x,tmp)
            for(var x2 of tmp) {
                res.push(x2)
            }
        }
        return res
    },

    makeLight : function( options) {
        var sh = glShapes.addShape('light',options)
//        console.log(sh.center, options.center)
        this.lights.push(sh)
    },
}