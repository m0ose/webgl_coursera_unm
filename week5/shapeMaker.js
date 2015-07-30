var shapeTypes = {
    sphere: function(x, theta) {
        var r = Math.sqrt(1-x*x)
        var y = Math.cos(theta) * r
        var z = Math.sin(theta) * r
        return {vertex:vec4(x,y,z,1), normal:vec4(-x,-y,-z,0)}
    },

    cone: function(x, theta, dx) {
        var r = (x + 1)/2
        //normal is not right
        var useNormal = true//true
        if(x>1 || x<-1){ //end cap
            r=0
            x=x-dx
            useNormal = false
        }
        var y = Math.cos(theta) * r
        var z = Math.sin(theta) * r
        var normal = vec4(2, -Math.cos(theta), -Math.sin(theta), 0)
        if( !useNormal){
            normal = undefined
        } else {
            normal = normalize(normal)
        }
        return {vertex:vec4(x,y,z,1), normal:normal}
    },

    cylinder: function( x, theta, dx) {
        var r = 1
        var useNormal = true
        if(x>1) { //right end cap
            r=0
            x=x-dx
            useNormal = false
        }
        if(x<-1) { // left end cap
            r=0
            x=x+dx
            useNormal = false
        }
        var y = Math.cos(theta) * r
        var z = Math.sin(theta) * r
        var normal = vec4(0,-Math.cos(theta),-Math.sin(theta),0)
        if( !useNormal){
            normal = undefined
        }
        return {vertex:vec4(x,y,z,1), normal:normal}
    },
}

// parameterize a shape
var shapeMaker = function(options){

    this.init = function(options) {
        var defaults = {
            type:shapeTypes.sphere,
            color:vec4(0,0,1,1),
            stepsX:10,
            stepsTheta:10,
            axis:vec4(1,0,0,0),
            rotation:0,
            center:vec4(0,0,0,0),
            randomColor:false,
        }
        options = options || {}
        for(var x in options) {
            defaults[x] = options[x]
        }
        for(var x in defaults) {
            this[x] = defaults[x]
        }
    }

    this.generateVertices = function() {
        var result= {
            vertices:[],
            colors:[],
            axis:[],
            rotations:[],
            centers:[],
            normals:[],
        }
        //_.extend(defaults, options)
        var params = this.parameterizeShape(this.type, this.stepsX, this.stepsTheta)
        result.vertices = params.vertices
        result.normals = params.normals
        for(var i=0; i < result.vertices.length; i++) {
            if(this.randomColor){
                result.colors.push(vec4(Math.random(), Math.random(), Math.random(), 1))
            } else {
                result.colors.push(this.color)
            }
            result.axis.push(this.axis)
            result.rotations.push(this.rotation)
            result.centers.push(this.center)
        }
        return result
    }

    // if any of the points are the same than its a bad triangle
    this.isGoodTriangle = function( p1, p2, p3) {
        var noNans = true
        for( var i=0; i<3; i++){
            if( isNaN(p1[i]) || isNaN(p2[i]) || isNaN(p3[i]) ) {
                noNans = false
            }
        }
        var independent = !( equal(p1,p2) || equal(p1,p3) || equal(p2,p3))
        if( independent === false || noNans == false) {
            return false
        }
        return true
    }

    this.findNormal = function(p1,p2,p1b,p3) {
        v1 = normalize(subtract(p2,p1))
        v2 = normalize(subtract(p3,p1b))
        var n1 = cross(v2,v1)
        var n2 = normalize(n1)
        n2[3]=0
        return n1
    }

    this.parameterizeShape = function( shapeFunction, stepsX, stepsTheta) {
        var dx = 2/stepsX
        var dt = 2/stepsTheta
        var pi = Math.PI
        var triangles = []
        var normals = []
        for(var x = -1-dx; x <= 1+dx; x+=dx) {
            for(var theta = -pi; theta <= pi; theta+=dt) {
                var s1 = shapeFunction( x, theta, dx)
                var s2 = shapeFunction( x, theta - dt, dx)
                var s3 = shapeFunction( x-dx, theta-dt, dx)
                var s4 = shapeFunction( x-dx, theta, dx)
                var p1 = s1.vertex
                var p2 = s2.vertex
                var p3 = s3.vertex
                var p4 = s4.vertex

                if( this.isGoodTriangle(p1, p2, p3)) {
                    if(!this.isGoodTriangle(p1, p2, p3) ) {
                        console.log(p1,p2,p3)
                    }
                    triangles.push(p1)
                    triangles.push(p2)
                    triangles.push(p3)
                    //normals
                    if( s1.normal && s2.normal && s3.normal) {
                        normals.push( s1.normal)
                        normals.push( s2.normal)
                        normals.push( s3.normal)
                    } else { //find normals per triangle
                        normals.push(this.findNormal(p1,p2,p1,p3))
                        normals.push(this.findNormal(p2,p3,p2,p1))
                        normals.push(this.findNormal(p3,p1,p3,p2))
                    }
                }
                if( this.isGoodTriangle(p3, p4, p1)) {
                    if(!this.isGoodTriangle(p3,p4,p1) ) {
                        console.log(p1,p2,p3)
                    }
                    triangles.push(p3)
                    triangles.push(p4)
                    triangles.push(p1)
                    //normals
                    if( s3.normal && s4.normal && s1.normal) {
                        normals.push( s3.normal)
                        normals.push( s4.normal)
                        normals.push( s1.normal)
                    } else {
                        normals.push(this.findNormal(p3,p4,p3,p1))
                        normals.push(this.findNormal(p4,p1,p4,p3))
                        normals.push(this.findNormal(p1,p3,p1,p4))
                    }
                }
            }
        }
        return {vertices:triangles, normals:normals}
    }

    this.init(options)
}