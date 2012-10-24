(function(_, glu, gldebug, window) {
  var canvas,
  gl,
  theProgram,
  frustumScale = 1.0,
  perspectiveMatrix,
  numberOfVertices = 36,
  RIGHT_EXTENT = 0.8,
  LEFT_EXTENT = -RIGHT_EXTENT,
  TOP_EXTENT = 0.20,
  MIDDLE_EXTENT = 0.0,
  BOTTOM_EXTENT = -TOP_EXTENT,
  FRONT_EXTENT = -1.25,
  REAR_EXTENT = -1.75,
  GREEN_COLOR = [ 0.75, 0.75, 1.0, 1.0 ],
  BLUE_COLOR = [ 0.0, 0.5, 0.0, 1.0 ],
  RED_COLOR = [ 1.0, 0.0, 0.0, 1.0 ],
  GREY_COLOR = [ 0.8, 0.8, 0.8, 1.0 ],
  BROWN_COLOR = [ 0.5, 0.5, 0.0, 1.0 ],
  // _.flatten will convert the nested colour arrays into a single array 
  vertexData = _.flatten([
    //Object 1 positions
    LEFT_EXTENT,    TOP_EXTENT,     REAR_EXTENT,
    LEFT_EXTENT,    MIDDLE_EXTENT,  FRONT_EXTENT,
    RIGHT_EXTENT,   MIDDLE_EXTENT,  FRONT_EXTENT,
    RIGHT_EXTENT,   TOP_EXTENT,     REAR_EXTENT,

    LEFT_EXTENT,    BOTTOM_EXTENT,  REAR_EXTENT,
    LEFT_EXTENT,    MIDDLE_EXTENT,  FRONT_EXTENT,
    RIGHT_EXTENT,   MIDDLE_EXTENT,  FRONT_EXTENT,
    RIGHT_EXTENT,   BOTTOM_EXTENT,  REAR_EXTENT,

    LEFT_EXTENT,    TOP_EXTENT,     REAR_EXTENT,
    LEFT_EXTENT,    MIDDLE_EXTENT,  FRONT_EXTENT,
    LEFT_EXTENT,    BOTTOM_EXTENT,  REAR_EXTENT,

    RIGHT_EXTENT,   TOP_EXTENT,     REAR_EXTENT,
    RIGHT_EXTENT,   MIDDLE_EXTENT,  FRONT_EXTENT,
    RIGHT_EXTENT,   BOTTOM_EXTENT,  REAR_EXTENT,

    LEFT_EXTENT,    BOTTOM_EXTENT,  REAR_EXTENT,
    LEFT_EXTENT,    TOP_EXTENT,     REAR_EXTENT,
    RIGHT_EXTENT,   TOP_EXTENT,     REAR_EXTENT,
    RIGHT_EXTENT,   BOTTOM_EXTENT,  REAR_EXTENT,

    //Object 2 positions
    TOP_EXTENT,     RIGHT_EXTENT,   REAR_EXTENT,
    MIDDLE_EXTENT,  RIGHT_EXTENT,   FRONT_EXTENT,
    MIDDLE_EXTENT,  LEFT_EXTENT,    FRONT_EXTENT,
    TOP_EXTENT,     LEFT_EXTENT,    REAR_EXTENT,

    BOTTOM_EXTENT,  RIGHT_EXTENT,   REAR_EXTENT,
    MIDDLE_EXTENT,  RIGHT_EXTENT,   FRONT_EXTENT,
    MIDDLE_EXTENT,  LEFT_EXTENT,    FRONT_EXTENT,
    BOTTOM_EXTENT,  LEFT_EXTENT,    REAR_EXTENT,

    TOP_EXTENT,     RIGHT_EXTENT,   REAR_EXTENT,
    MIDDLE_EXTENT,  RIGHT_EXTENT,   FRONT_EXTENT,
    BOTTOM_EXTENT,  RIGHT_EXTENT,   REAR_EXTENT,
                    
    TOP_EXTENT,     LEFT_EXTENT,    REAR_EXTENT,
    MIDDLE_EXTENT,  LEFT_EXTENT,    FRONT_EXTENT,
    BOTTOM_EXTENT,  LEFT_EXTENT,    REAR_EXTENT,
                    
    BOTTOM_EXTENT,  RIGHT_EXTENT,   REAR_EXTENT,
    TOP_EXTENT,     RIGHT_EXTENT,   REAR_EXTENT,
    TOP_EXTENT,     LEFT_EXTENT,    REAR_EXTENT,
    BOTTOM_EXTENT,  LEFT_EXTENT,    REAR_EXTENT,

    //Object 1 colors
    GREEN_COLOR,
    GREEN_COLOR,
    GREEN_COLOR,
    GREEN_COLOR,

    BLUE_COLOR,
    BLUE_COLOR,
    BLUE_COLOR,
    BLUE_COLOR,

    RED_COLOR,
    RED_COLOR,
    RED_COLOR,

    GREY_COLOR,
    GREY_COLOR,
    GREY_COLOR,

    BROWN_COLOR,
    BROWN_COLOR,
    BROWN_COLOR,
    BROWN_COLOR,

    //Object 2 colors
    RED_COLOR,
    RED_COLOR,
    RED_COLOR,
    RED_COLOR,

    BROWN_COLOR,
    BROWN_COLOR,
    BROWN_COLOR,
    BROWN_COLOR,

    BLUE_COLOR,
    BLUE_COLOR,
    BLUE_COLOR,

    GREEN_COLOR,
    GREEN_COLOR,
    GREEN_COLOR,

    GREY_COLOR,
    GREY_COLOR,
    GREY_COLOR,
    GREY_COLOR
  ]),  
  indexData = [
    0, 2, 1,
    3, 2, 0,

    4, 5, 6,
    6, 7, 4,

    8, 9, 10,
    11, 13, 12,

    14, 16, 15,
    17, 16, 14
  ],
  vertexBufferObject,
  indexBufferObject,
  vertexArray1,
  vertexArray2,
  startTime = Date.now(),
  ext;

  function start() {
    canvas = document.getElementById("glcanvas");
    gl = gldebug.makeDebugContext(glu.setupWebGL(canvas)); 
    if (gl) {
      canvas.addEventListener("resize", reshape);
      /**
       * VertexArrayObjects are an extension to WebGL
       * for this to work you may need a bleeding edge
       * browser (Chrome Canary, Chromium, maybe)
       */
      ext = gl.getExtension("OES_vertex_array_object");
      if (!ext) {
        alert("Vertex Array Objects not supported. Get a newer browser or something.");
      }

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

    var zNear = 0.5, zFar = 3.0;

    perspectiveMatrix = [
      frustumScale, 0.0,          0.0,                                   0.0,
      0.0,          frustumScale, 0.0,                                   0.0,
      0.0,          0.0,          (zFar + zNear) / (zNear - zFar),      -1.0,
      0.0,          0.0,          (2.0 * zFar * zNear) / (zNear - zFar), 0.0
    ];

    gl.useProgram(theProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(theProgram, "perspectiveMatrix"), gl.TRUE, new Float32Array(perspectiveMatrix));
    gl.useProgram(null);

  }

  function initialiseVertexBuffer() {
    vertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    indexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indexData), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  function initialiseVertexArrayObjects() {
    var colorDataOffset = 4 * 3 * numberOfVertices,
    posDataOffset = 4 * 3 * (numberOfVertices/2),
    position = gl.getAttribLocation(theProgram, "position"),
    colour = gl.getAttribLocation(theProgram, "colour");

    vertexArray1 = ext.createVertexArrayOES();
    ext.bindVertexArrayOES(vertexArray1);


    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(colour);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, gl.FALSE, 0, 0);
    gl.vertexAttribPointer(colour, 4, gl.FLOAT, gl.FALSE, 0, colorDataOffset);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);

    ext.bindVertexArrayOES(null);

    vertexArray2 = ext.createVertexArrayOES();
    ext.bindVertexArrayOES(vertexArray2);

    colorDataOffset += 4 * 4 * (numberOfVertices/2);

    //Use the same buffer object previously bound to GL_ARRAY_BUFFER.
    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(colour);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, gl.FALSE, 0, posDataOffset);
    gl.vertexAttribPointer(colour, 4, gl.FLOAT, gl.FALSE, 0, colorDataOffset);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);

    ext.bindVertexArrayOES(null);
  }
  
  function init() {
    initialiseProgram();
    initialiseVertexBuffer();    
    initialiseVertexArrayObjects();

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CW);
  }

  function display() {
    // refering to attributes by number is unreliable in webgl
    // so we'll get their locations to use later
    var offset = gl.getUniformLocation(theProgram, "offset");
    
    reshape();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(theProgram);

    ext.bindVertexArrayOES(vertexArray1);
    gl.uniform3f(offset, 0.0, 0.0, 0.0);
    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);

    ext.bindVertexArrayOES(vertexArray2);
    gl.uniform3f(offset, 0.0, 0.0, -1.0);
    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);

    ext.bindVertexArrayOES(null);
    gl.useProgram(null);

    //window.requestAnimFrame(display, canvas);
  }

  function reshape() {
    if (canvas.clientWidth == canvas.width && canvas.clientHeight == canvas.height) {
      return;
    }

    perspectiveMatrix[0] = frustumScale / (canvas.clientWidth / canvas.clientHeight);
    gl.useProgram(theProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(theProgram, "perspectiveMatrix"), gl.TRUE, new Float32Array(perspectiveMatrix));
    gl.useProgram(null);
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;    
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  window.document.addEventListener("DOMContentLoaded", start);
})(_, WebGLUtils, WebGLDebugUtils, window);