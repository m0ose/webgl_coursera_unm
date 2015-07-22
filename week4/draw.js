var painter = {

    pathHistory: [],
    path2:[],
    pathColors: [],
    vertex1prog: paintShaders.vertex1,
    frag1prog: paintShaders.fragment1,
    canvas:null,
    projMatrix:null,
    lineWidth:12,
    currrentColor:vec4(1.0,1.0,0.0,1.0),
    MIN_OPACITY:0.8,

    init:function() {
        console.log('init called')
        // Get canvas
        this.canvas = document.getElementById("gl-canvas")
        gl = WebGLUtils.setupWebGL( this.canvas )
        if ( !gl ) { 
            throw( "WebGL isn't available" ) 
        }
        //  Configure WebGL
        gl.viewport( 0, 0, this.canvas.width, this.canvas.height )
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.clearColor( 1.0, 1.0, 1.0, 0.0 )
        gl.clear( gl.COLOR_BUFFER_BIT  )
        //
        //projection matrix. Transform cordinates to screen space.
        this.projMatrix = mat4()
        this.projMatrix[0][0] = 2/this.canvas.width
        this.projMatrix[1][1] = -2/this.canvas.height
        this.projMatrix[0][3] = -1
        this.projMatrix[1][3] = 1
        // setup program 1
        this.setupProgram()
        // Get the mouse working
        mouseHandler(this.canvas)
        //color picker
        setupColorPicker()
    },

    setupProgram: function() {
        // Load shaders
        this.program1 = initShadersFromStrings( gl, this.vertex1prog, this.frag1prog )
        gl.useProgram( this.program1 )
        // vertices
        var vPosition = gl.getAttribLocation( this.program1, "vPosition" )
        this.bufferVPos = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferVPos)
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(vPosition)
        // Colors
        var vColor = gl.getAttribLocation( this.program1, "vColor" )
        this.bufferVColor = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferVColor)
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(vColor)
        // model view projection matrix or MVP
        gl.uniformMatrix4fv(gl.getUniformLocation( this.program1, "projection" ), false, flatten(this.projMatrix))
    },

    redrawPath: function() {
        requestAnimationFrame(this._redrawPath.bind(this))
    },

    _redrawPath: function() {
        gl.clear( gl.COLOR_BUFFER_BIT  )
        //gl.lineWidth( this.lineWidth)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVPos)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.path2), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVColor)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.pathColors), gl.STATIC_DRAW)
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.path2.length )
    },
    //
    // Drawing routines
    //
    moveTo: function(x,y) {
        this.pathHistory.push(new vec4(x, y, 0, 1))
        //seperate segments using very thin line.
        var color = this.currrentColor || new vec4(Math.random(), Math.random(), Math.random(),1.0)
        this.path2.push(new vec4(x, y, 0, 1))
        this.path2.push(new vec4(x, y, 0, 1))
        this.pathColors.push(color)
        this.pathColors.push(color)
        this.redrawPath()
    },

    widAvg : 1.0,
    dirAvg : vec4(0,0,0,0),
    lineTo: function(x,y) {
        // make 2 points perpindicular to the motion of the brush
        var p1 = this.pathHistory[this.pathHistory.length-1]
        var p2 = new vec4(x, y, 0, 1)
        var diff = subtract(p2, p1)
        var velo = Math.sqrt(dot(diff,diff))
        var minVelo = Math.max(1, this.lineWidth/5)
        if(velo > minVelo) {
            var dir = normalize(diff)
            this.dirAvg = add( scale(0.4,vec4(dir)), scale(0.6,vec4(this.dirAvg)))
            var dir2 = this.dirAvg
            var wid = this.lineWidth - Math.min(this.lineWidth*0.8, velo/5)
            this.widAvg = 0.3*wid + 0.7*this.widAvg
            var wid2 = this.widAvg
            var p3 = add(p2, vec4(-wid2*dir2[1], wid2*dir2[0], 0, 0))
            var p4 = add(p2, vec4(wid2*dir2[1], -wid2*dir2[0], 0, 0))
            this.path2.push(p3)
            this.path2.push(p4)
            //
            var opacity = Math.max(this.MIN_OPACITY, 0.2+this.widAvg/this.lineWidth)
            var color = new vec4(this.currrentColor) || new vec4(Math.random(), Math.random(), Math.random(),1.0)
            color[3] = opacity
            this.pathColors.push(color)
            this.pathColors.push(color)
            // history
            this.pathHistory.push(p2)
            this.redrawPath()
        }
    },

    closePath: function() {
        this.pathHistory = []
        //add ing a point at the end helps seperate the sgements
        if( this.path2[this.path2.length-1]) {
            this.path2.push(this.path2[this.path2.length-1])
            this.pathColors.push(this.pathColors[this.pathColors.length-1])
        }
    },

    clear: function() {
        this.path2 = []
        this.pathColors = []
        gl.clear( gl.COLOR_BUFFER_BIT)
        this.redrawPath()
    },
}

window.onload = function(){
    painter.init()
}

//////////////////////////////////// UI ////////////////////////////////////


//
// Setup the mouse over and out events
//
function mouseHandler(element) {

    function relativePos(event, element) {
        var rect = element.getBoundingClientRect();
        return {x: Math.floor(event.clientX - rect.left), y: Math.floor(event.clientY - rect.top)};
    }
    
    var _mousedown = false
    element.addEventListener("mousemove", function (e) {
        var xy = relativePos(e, this)
        if( _mousedown) {
            painter.lineTo(xy.x, xy.y)
        }
    }, false);
    element.addEventListener("mousedown", function (e) {
        var xy = relativePos(e, this)
        painter.moveTo(xy.x, xy.y)
        _mousedown = true
    }, false);
    element.addEventListener("mouseup", function (e) {
        painter.closePath()
        _mousedown = false
    }, false);
    element.addEventListener("mouseout", function (e) {
        painter.closePath()
        _mousedown = false
    }, false);
}

//
// Use the behive picker
//
function setupColorPicker() {
    var div = document.getElementById('colorPicker');
    Beehive.Picker(div);
    div.addEventListener('click', function(e){
        var color = Beehive.getColorCode(e.target);
        if( color) {
            var r = parseInt(color.substr(1,2),16) / 256
            var g = parseInt(color.substr(3,2),16) / 256
            var b = parseInt(color.substr(5,2),16) / 256
            //console.log(r,g,b)
            painter.currrentColor = vec4(r,g,b,1.0)
        }
        else{ console.log('it is not beehive picker color elemnt.'); }
    });
}

