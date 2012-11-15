(function(glu, gldebug, window) {
  var canvas,
  gl,
  theProgram,
  positionBuffer,
  vertexPositions = [
    0.75, 0.75, 0.0, 1.0,
    0.75, -0.75, 0.0, 1.0,
    -0.75, -0.75, 0.0, 1.0
  ],
  vertexArray;

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

    shaders.forEach(function(shader) { gl.detachShader(theProgram, shader); });
  }

  function initialiseVertexBuffer() {
    //in the tutorial this is glGenBuffers, but webGL makes things a bit easier
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
    //not sure if this is needed in webGL, but still...
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  
  function init() {
    initialiseProgram();
    initialiseVertexBuffer();    
  }

  function display() {
    reshape();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(theProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    //tidying up.
    gl.disableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);

    /* won't need this until we're animating frames */
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
