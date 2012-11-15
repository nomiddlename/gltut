(function(glu, gldebug, window) {
  var canvas,
  gl,
  theProgram,
  positionBuffer,
  vertexData = [
    0.25, 0.25, 0.0, 1.0,
    0.25, -0.25, 0.0, 1.0,
    -0.25, -0.25, 0.0, 1.0
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

    gl.useProgram(theProgram);
    gl.uniform1f(gl.getUniformLocation(theProgram, "loopDuration"), 5.0);
    gl.uniform1f(gl.getUniformLocation(theProgram, "fragLoopDuration"), 10.0);
    gl.useProgram(null);
  }

  function initialiseVertexBuffer() {
    //in the tutorial this is glGenBuffers, but webGL makes things a bit easier
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STREAM_DRAW);
    //not sure if this is needed in webGL, but still...
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  
  function init() {
    initialiseProgram();
    initialiseVertexBuffer();    
  }

  function display() {
    // refering to attributes by number is unreliable in webgl
    // so we'll get their locations to use later
    var position = gl.getAttribLocation(theProgram, "position"),
    time = gl.getUniformLocation(theProgram, "time");

    reshape();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(theProgram);
    gl.uniform1f(time, (startTime - Date.now()) / 1000.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 4, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    //tidying up.
    gl.disableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);

    window.requestAnimFrame(display, canvas);
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
