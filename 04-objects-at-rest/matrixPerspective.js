(function(glu, gldebug, window) {
  var canvas,
  gl,
  theProgram,
  positionBuffer,
  vertexData = [
//vertices
     0.25,  0.25, -1.25, 1.0,
     0.25, -0.25, -1.25, 1.0,
    -0.25,  0.25, -1.25, 1.0,

     0.25, -0.25, -1.25, 1.0,
    -0.25, -0.25, -1.25, 1.0,
    -0.25,  0.25, -1.25, 1.0,

     0.25,  0.25, -2.75, 1.0,
    -0.25,  0.25, -2.75, 1.0,
     0.25, -0.25, -2.75, 1.0,

     0.25, -0.25, -2.75, 1.0,
    -0.25,  0.25, -2.75, 1.0,
    -0.25, -0.25, -2.75, 1.0,

    -0.25,  0.25, -1.25, 1.0,
    -0.25, -0.25, -1.25, 1.0,
    -0.25, -0.25, -2.75, 1.0,

    -0.25,  0.25, -1.25, 1.0,
    -0.25, -0.25, -2.75, 1.0,
    -0.25,  0.25, -2.75, 1.0,

     0.25,  0.25, -1.25, 1.0,
     0.25, -0.25, -2.75, 1.0,
     0.25, -0.25, -1.25, 1.0,

     0.25,  0.25, -1.25, 1.0,
     0.25,  0.25, -2.75, 1.0,
     0.25, -0.25, -2.75, 1.0,

     0.25,  0.25, -2.75, 1.0,
     0.25,  0.25, -1.25, 1.0,
    -0.25,  0.25, -1.25, 1.0,

     0.25,  0.25, -2.75, 1.0,
    -0.25,  0.25, -1.25, 1.0,
    -0.25,  0.25, -2.75, 1.0,

     0.25, -0.25, -2.75, 1.0,
    -0.25, -0.25, -1.25, 1.0,
     0.25, -0.25, -1.25, 1.0,

     0.25, -0.25, -2.75, 1.0,
    -0.25, -0.25, -2.75, 1.0,
    -0.25, -0.25, -1.25, 1.0,
//colour data
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,

    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,

    0.8, 0.8, 0.8, 1.0,
    0.8, 0.8, 0.8, 1.0,
    0.8, 0.8, 0.8, 1.0,

    0.8, 0.8, 0.8, 1.0,
    0.8, 0.8, 0.8, 1.0,
    0.8, 0.8, 0.8, 1.0,

    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,

    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,

    0.5, 0.5, 0.0, 1.0,
    0.5, 0.5, 0.0, 1.0,
    0.5, 0.5, 0.0, 1.0,

    0.5, 0.5, 0.0, 1.0,
    0.5, 0.5, 0.0, 1.0,
    0.5, 0.5, 0.0, 1.0,

    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,

    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,

    0.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,

    0.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    0.0, 1.0, 1.0, 1.0
  ],  
  vertexArray,
  startTime = Date.now();

  function start() {
    canvas = document.getElementById("glcanvas");
    gl = gldebug.makeDebugContext(glu.setupWebGL(canvas)); 
    if (gl) {
      canvas.addEventListener("resize", reshape);
      init();
      display();
    }
  }

  /**
   * Taken from https://developer.mozilla.org/en-US/docs/WebGL/Adding_2D_content_to_a_WebGL_context
   */
  function getShader(id) {
    var shaderScript = document.getElementById(id), 
    theSource = "", 
    currentChild, 
    shader;
    
    if (!shaderScript) {
      return null;
    }
    
    currentChild = shaderScript.firstChild;
    while(currentChild) {
      if (currentChild.nodeType == currentChild.TEXT_NODE) {
        theSource += currentChild.textContent;
      }
     
      currentChild = currentChild.nextSibling;
    }

    if (shaderScript.type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      // Unknown shader type
      return null;
    }

    gl.shaderSource(shader, theSource);     
    // Compile the shader program
    gl.compileShader(shader);  
     
    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
      console.error("An error occurred compiling the shaders: ", gl.getShaderInfoLog(shader));  
      return null;  
    }
     
    return shader;
  }

  /* only works for 4x4 matrix, because I'm too lazy 
   * to come up with a generic algorithm
   */
  function transpose(matrix) {
    return [
      matrix[0], matrix[4], matrix[8], matrix[12],
      matrix[1], matrix[5], matrix[9], matrix[13],
      matrix[2], matrix[6], matrix[10], matrix[14],
      matrix[3], matrix[7], matrix[11], matrix[15]
    ];
  }

  function initialiseProgram() {
    var shaders = [
      getShader('vertexShader'),
      getShader('fragmentShader')
    ];

    theProgram = gl.createProgram();
    shaders.forEach(function(shader) { gl.attachShader(theProgram, shader); });
    gl.linkProgram(theProgram);
    
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(theProgram, gl.LINK_STATUS)) {
      console.error("Unable to initialize the shader program.");
    }

    shaders.forEach(function(shader) { 
      gl.detachShader(theProgram, shader);
      gl.deleteShader(shader);
    });

    var frustumScale = 1.0,
    zNear = 0.5,
    zFar = 3.0,
    perspectiveMatrix = transpose([
      frustumScale, 0.0,          0.0,                                   0.0,
      0.0,          frustumScale, 0.0,                                   0.0,
      0.0,          0.0,          (zFar + zNear) / (zNear - zFar),      -1.0,
      0.0,          0.0,          (2.0 * zFar * zNear) / (zNear - zFar), 0.0
    ]);

    gl.useProgram(theProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(theProgram, "perspectiveMatrix"), false, new Float32Array(perspectiveMatrix));
    gl.useProgram(null);

  }

  function initialiseVertexBuffer() {
    //in the tutorial this is glGenBuffers, but webGL makes things a bit easier
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    //not sure if this is needed in webGL, but still...
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  
  function init() {
    initialiseProgram();
    initialiseVertexBuffer();    

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CW);
  }

  function display() {
    // refering to attributes by number is unreliable in webgl
    // so we'll get their locations to use later
    var position = gl.getAttribLocation(theProgram, "position"),
    colour = gl.getAttribLocation(theProgram, "colour"),
    offset = gl.getUniformLocation(theProgram, "offset");
    
    reshape();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(theProgram);
    gl.uniform2f(offset, 0.5, 0.5);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(colour);
    gl.vertexAttribPointer(position, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(colour, 4, gl.FLOAT, false, 0, 12 * 3 * 4 * 4);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    //tidying up.
    gl.disableVertexAttribArray(position);
    gl.disableVertexAttribArray(colour);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);

    //window.requestAnimFrame(display, canvas);
  }

  function reshape() {
    if (canvas.clientWidth == canvas.width && canvas.clientHeight == canvas.height) {
      return;
    }

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;    
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  window.document.addEventListener("DOMContentLoaded", start);
})(WebGLUtils, WebGLDebugUtils, window);
