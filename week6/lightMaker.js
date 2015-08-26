
var lighting = {
    lights : [],
    
    getFlatArray : function() {
        var res = []
        for(var x of this.lights){
            var tmp = flatten(x.getMatrix4())
            //console.log(x,tmp)
            for(var x2 of tmp) {
                res.push(x2)
            }
        }
        return res
    },

    makeLight : function( options) {
        this.lights.push(new this.light(options))
    },

    light : function(options) {
        this.position = vec4(1,1,1,1)
        this.color = vec4(1,1,1,1)
        options = options || {}
        for(var x in options) {
            this[x] = options[x]
        }

        this.getMatrix4 = function() {
            var mat = mat4()
            mat[0] = this.position
            mat[1] = this.color
            mat[2] = [1,1,1,1]
            mat[3] = [1,1,1,1]
            return transpose(mat)
        }
    }
}