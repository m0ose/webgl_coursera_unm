var painter = {

    pathHistory: [],
    pathColors: [],
    vertex1prog: paintShaders.vertex1,
    frag1prog: paintShaders.fragment1,
    canvas:null,
    projMatrix:null,
    lineWidth:4,

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
        gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA)
        //projection matrix. This makes it soo cordinates are in screen space.
        this.projMatrix = mat4()
        this.projMatrix[0][0] = 2/this.canvas.width
        this.projMatrix[1][1] = -2/this.canvas.height
        this.projMatrix[0][3] = -1
        this.projMatrix[1][3] = 1
        // setup program 1
        this.setupProgram()
        // Get the mouse working
        mouseHandler(this.canvas)
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
        gl.lineWidth( this.lineWidth)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVPos)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.pathHistory), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferVColor)
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.pathColors), gl.STATIC_DRAW)
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT )
        gl.drawArrays( gl.LINES, 0, this.pathHistory.length )
    },
    //
    // Drawing routines
    //
    moveTo: function(x,y) {
        this.pathHistory.push(new vec4(x, y, 0, 1))
        this.pathColors.push(new vec4(Math.random(), Math.random(), Math.random(),1.0))
        this.redrawPath()
        console.log('moveTo', x, y)
    },

    lineTo: function(x,y) {
        if( this.pathHistory.length > 0 && this.pathHistory.length%2 == 0) {
            var lastPoint = this.pathHistory[ this.pathHistory.length - 1]
            var lastColor = this.pathColors[ this.pathColors.length - 1]
            this.pathHistory.push(lastPoint)
            this.pathColors.push(lastColor)
        }
        this.pathHistory.push(new vec4(x, y, 0, 1))
        this.pathColors.push(new vec4(Math.random(), Math.random(), Math.random(),1.0))
        this.redrawPath()
        console.log('line to', x, y )
    },

    closePath: function() {
        //this.pathHistory = []
        console.log('close path')
    },


}

window.onload = function(){
    painter.init()
}

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

