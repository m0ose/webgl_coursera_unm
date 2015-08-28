
var houghHelpers = {

  // expand blobs just a little bit because there are small holes in them
  spread : function(w,h,data) {
    var dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]]
    var d2 = new Int32Array(w*h)
    for(var i=0;i<d2.length;i++){
      d2[i] = -1
    }
    for(var y=0; y<h;y++){
      for(var x=0; x<w; x++) {
        var index = w*y + x
        if( data[index] > 0){
          for(var d of dirs) {
            var indx2 = (y + d[1])*w + x + d[0]
            d2[indx2] = 1
          }
        }
      }
    }
    return d2
  },

  lookForBlobs : function(imgdata) {
    //mask for blob detector
    var masked = new Int32Array(imgdata.data.length/4)
    for( var i=0; i<imgdata.data.length; i+=4) {
      var r = imgdata.data[i]
      if( r > 0) {
        masked[Math.floor(i/4)] = 1
      } else {
        masked[Math.floor(i/4)] = -1
      }
    }
    masked = houghHelpers.spread(imgdata.width, imgdata.height, masked)
    //
    //console.log(masked)
    var blobDetector = new connectedComponentLabeler( imgdata.width, imgdata.height, masked)
    var blobs = blobDetector.connectAll()
    var points = []
    for(b of blobs){
      points.push(b.centroid())
    }
    //console.log(blobs)
    return points
  },

  drawPoints : function(points, context) {
    context.beginPath()
    var radius = 5
    for(p of points) {
      context.moveTo(p[0],p[1])
      context.arc(p[0], p[1], radius, 0, 2 * Math.PI, false);
    }
    context.lineWidth = 1;
    context.strokeStyle = '#ff0000';
    context.stroke();
  },

  drawLines : function( acc, points) {
    var can = document.getElementById('can2db')
    var cw = can.width = acc.image.width
    var ch = can.height = acc.image.height
    var w = acc.accumulatorDims[0]
    var h = acc.accumulatorDims[1]
    var ctx = can.getContext('2d')
    ctx.drawImage(acc.image,0,0)
    ctx.beginPath()
    ctx.strokeStyle = '#ff0000';
    ctx.fillStyle = '#00ff00'
    ctx.lineWidth = 1
    /* // from the shader
     float theta = 1.0*p0.y * 3.141593;
            float r = (2.0*p0.x-1.0)*2.0;
            vec2 p1 = vec2(cos(theta)*r, sin(theta)*r);
            vec2 p1Norm = normalize(p1);
            vec2 lineSlope = vec2(-p1.y, p1.x);//perpindicular to vector to p1
            vec2 lineSlopeNorm = normalize(lineSlope);
            float parallelSum = 0.0;
            for (float i = -1.4 ; i <= 1.4 ; i+=0.001) {
                vec2 p3 = p1 + lineSlopeNorm * i;
                if( p3.x <= 1.0 && p3.y <= 1.0 && p3.x >= 0.0 && p3.y >= 0.0){
                    vec2 t3 = 2.0*texture2D( texture, p3).xy - 1.0;
                    parallelSum += abs( dot(t3, p1Norm));
                }
    */
    for(var p of points) {
      var pUnit = [p[0]/w, p[1]/(h)]
      var theta = 1*(pUnit[1] * Math.PI);
      var r = (2.0*pUnit[0]-1.0)*1.0;
      var p1 = [Math.cos(theta)*r, Math.sin(theta)*r]
      var p2 = [p1[0]*cw, p1[1]*ch]
      var lineSlope = [-Math.sin(theta), Math.cos(theta)]//perpindicular to vector to p1
      //normalize(lineSlope);
      var pL = add(p2, scale(-1000,lineSlope))
      var pR = add(p2, scale(1000,lineSlope))
      //
      ctx.beginPath()
      ctx.strokeStyle = '#ff0000';
      ctx.moveTo(p2[0], ch-p2[1])
      ctx.lineTo(pR[0], ch-pR[1])
      ctx.moveTo(p2[0], ch-p2[1])
      ctx.lineTo(pL[0], ch-pL[1])
      ctx.closePath()
      ctx.stroke()
      ctx.fillRect(p2[0], ch-p2[1], 12,12)
    }
    ctx.stroke()
  },

}