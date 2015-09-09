var shapeTypes = {
    sphere: function(x, theta, dx) {
        var x2 = Math.sin(Math.PI*x)//makes for much better looking ends
        var r = Math.sqrt(1-x2*x2) 
        var y = Math.cos(theta) * r
        var z = Math.sin(theta) * r
        return {vertex:vec4(x2,y,z,1), normal:vec4(-x2,-y,-z,0), uv:vec4( (theta+Math.PI)/Math.PI, (x2+1)/2, 0, 0) }
    },

    shell: function(x, theta, dx) {
        var theta2 = 1.22*theta
        var r = Math.sqrt(1-x*x) + (theta+Math.PI)/6 + Math.sin(15*theta2)/12
        if(x>1 || x<-1){ //this is only because of numerical error where sqrt(-0.00000000001) if bad.
            r=0
        }
        var y = Math.cos(theta2) * r
        var z = Math.sin(theta2) * r
        return {vertex:vec4(x,y,z,1)}
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
    // a leaf with 7 points
    cannabis: function(x, theta, dx) {
        var sin = Math.sin
        var cos = Math.cos
        var rad = 1-x*x
        rad = Math.max(rad,0)
        var r= ( 1+(9/10)*cos(8*theta) ) * (1+(1/10)*cos(24*theta)) * ((9/10)+(1/10)*cos(200*theta)) * (1+sin(theta)) 
        r = r * rad
        return { vertex:vec4(x/12,cos(theta)*r,sin(theta)*r) }
    },
}

// parameterize a shape
var shapeMaker = function(options){
    this.init = function(options) {
        var defaults = {
            type:shapeTypes.sphere,
            name:'sphere',
            __color:vec4(0.9,0.9,0.9,1),
            stepsX:10,
            stepsTheta:10,
            axis:vec4(1,0,0,0),
            rotation:0,
            center:vec4(0,0,-15,0),
            randomColor:false,
            scale:vec4(3,3,3,0),
            selected:true,
            wireFrame:false,
            isLight:false,
            useTexture:false,
            __texture:null,
            __dirtyFlag:true,
        }
        options = options || {}
        for(var x in options) {
            defaults[x] = options[x]
        }
        for(var x in defaults) {
            this[x] = defaults[x]
        }

    }

    Object.defineProperty(this, "texture", {
      get: function() {return this.__texture },
      set: function(val) { 
            if(!val){
                this.useTexture = false
            } else {
                this.useTexture = true
            }
            this.__texture = val
            this.glTexture = null
            console.log('texture set')
         }
    });

    Object.defineProperty(this, "color", {
      get: function() {return this.__color },
      set: function(val) { 
            this.__color = val
            this.__dirtyFlag = true
            console.log('color set')
         }
    });

    this.generateVertices = function() {
        var result= {
            vertices:[],
            colors:[],
            normals:[],
            texCoords:[]
        }
        //_.extend(defaults, options)
        var params = this.parameterizeShape(this.type, this.stepsX, this.stepsTheta)
        // prepare object
        result.vertices = params.vertices
        result.normals = params.normals
        result.texCoords = params.texCoords
        for(var i=0; i < result.vertices.length; i++) {
            result.colors.push(this.color)
        }
        console.log('generated',result.vertices.length, 'vertices' )
        return result
    }

    this.generateVerticesFlat = function( forceCalculation) {
        var verts = this.generateVertices()
        return {
            colors:flatten(verts.colors),
            vertices:flatten(verts.vertices),
            normals:flatten(verts.normals),
            texCoords:flatten(verts.texCoords),
        }
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
        var texUVs = []
        for(var x = -1; x <= 1.01+dx; x+=dx) {
            var xtmp = Number(x)
            var dx2 = Number(dx)
            //console.log(xtmp)
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
                    // texture coords
                    if( s1.uv && s2.uv && s3.uv) {
                        texUVs.push(s1.uv)
                        texUVs.push(s2.uv)
                        texUVs.push(s3.uv)
                    } else {
                        texUVs.push(this.getUVfromXt(xtmp, theta)) //s1
                        texUVs.push(this.getUVfromXt(xtmp, theta - dt)) //s2
                        texUVs.push(this.getUVfromXt(xtmp-dx2, theta-dt)) //s3
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
                    // texture coords
                    if( s3.uv && s4.uv && s1.uv) {
                        texUVs.push(s3.uv)
                        texUVs.push(s4.uv)
                        texUVs.push(s1.uv)
                    } else {
                        texUVs.push(this.getUVfromXt(xtmp-dx2, theta-dt)) //s3
                        texUVs.push(this.getUVfromXt(xtmp-dx2, theta)) //s4
                        texUVs.push(this.getUVfromXt(xtmp, theta)) //s1
                    }
                }
            }
        }
        return {vertices:triangles, normals:normals, texCoords:texUVs}
    }

    this.getUVfromXt = function(xx, theta) {
        var u2 = (xx+1)/2
        var v2 = (theta + Math.PI)/(2*Math.PI)//Math.cos(theta)
        return vec4(v2,u2,0,0)
    }

    this.getLightMat4 = function() {
        var mat = mat4()
        mat[0] = this.center
        mat[1] = this.color
        mat[2] = [1,1,1,1]
        mat[3] = [1,1,1,1]
        return transpose(mat)
    }

    this.init(options)
}