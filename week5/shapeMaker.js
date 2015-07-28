var shapeMaker = {
  
    // if any of the points are the same than its a bad triangle
    isGoodTriangle: function( p1, p2, p3) {
        return !( equal(p1,p2) || equal(p1,p3) || equal(p2,p3))
    },

    // parameterize a shape
    makeShape: function(options) {
        var defaults = {
            type:this.sphere,
            color:vec4(0,0,1,1),
            stepsX:10,
            stepsTheta:10,
            axis:vec4(1,0,0,0),
            rotation:0,
            center:vec4(0,0,0,0),
        }
        var result= {
            vertices:[],
            colors:[],
            axis:[],
            rotations:[],
            centers:[],
        }
        //_.extend(defaults, options)
        options = options || {}
        for(var x in options) {
            defaults[x] = options[x]
        }
        //
        result.vertices = this.parameterizeShape(defaults.type, defaults.stepsX, defaults.stepsTheta)
        for(var i=0; i < result.vertices.length; i++) {
            result.colors.push(defaults.color)
            result.axis.push(defaults.axis)
            result.rotations.push(defaults.rotation)
            result.centers.push(defaults.center)
        }
        return result
    },

    parameterizeShape: function( shapeFunction, stepsX, stepsTheta) {
        var dx = 2/stepsX
        var dt = 2/stepsTheta
        var pi = Math.PI
        var triangles = []
        for(var x = -1-dx; x <= 1+dx; x+=dx) {
            for(var theta = -pi+dt; theta <= pi; theta+=dt) {
                var p1 = shapeFunction( x, theta, dx)
                var p2 = shapeFunction( x, theta - dt, dx)
                var p3 = shapeFunction( x-dx, theta-dt, dx)
                var p4 = shapeFunction( x-dx, theta, dx)
                if( this.isGoodTriangle(p1, p2, p3)) {
                    triangles.push(p1)
                    triangles.push(p2)
                    triangles.push(p3)
                }
                if( this.isGoodTriangle(p3, p4, p1)) {
                    triangles.push(p3)
                    triangles.push(p4)
                    triangles.push(p1)
                }
            }
        }
        return triangles
    },

    sphere: function(x, theta) {
        var r = Math.sqrt(1-x*x)
        var y = Math.cos(theta) * r
        var z = Math.sin(theta) * r
        return vec4(x,y,z,1)
    },

    cone: function(x, theta, dx) {
        var r = (x + 1)/2
        if(x>1 || x<-1){ //end cap
            r=0
            x=x-dx
        }
        var y = Math.cos(theta) * r
        var z = Math.sin(theta) * r
        return vec4(x,y,z,1)
    },

    cylinder: function( x, theta, dx) {
        var r = 1
        if(x>1) { //right end cap
            r=0
            x=x-dx
        }
        if(x<-1) { // left end cap
            r=0
            x=x+dx
        }
        var y = Math.cos(theta) * r
        var z = Math.sin(theta) * r
        return vec4(x,y,z,1)
    },
}