(function(_, glu, gldebug, window) {
  "use strict";
  var canvas,
  gl,
  ext,
  startTime = Date.now(),
  theProgram,
  cameraToClipMatrix,
  frustumScale = calcFrustumScale(45.0),
  numberOfVertices = 8,
  GREEN_COLOR = [ 0.0, 1.0, 0.0, 1.0 ],
  BLUE_COLOR  = [ 0.0, 0.0, 1.0, 1.0 ],
  RED_COLOR   = [ 1.0, 0.0, 0.0, 1.0 ],
  GREY_COLOR  = [ 0.8, 0.8, 0.8, 1.0 ],
  BROWN_COLOR = [ 0.5, 0.5, 0.0, 1.0 ],
  vertexData = _.flatten([
    +1.0, +1.0, +1.0,
    -1.0, -1.0, +1.0,
    -1.0, +1.0, -1.0,
    +1.0, -1.0, -1.0,

    -1.0, -1.0, -1.0,
    +1.0, +1.0, -1.0,
    +1.0, -1.0, +1.0,
    -1.0, +1.0, +1.0,

    GREEN_COLOR,
    BLUE_COLOR,
    RED_COLOR,
    BROWN_COLOR,

    GREEN_COLOR,
    BLUE_COLOR,
    RED_COLOR,
    BROWN_COLOR,
  ]),
  indexData = [
    0, 1, 2,
    1, 0, 3,
    2, 3, 0,
    3, 2, 1,

    5, 4, 6,
    4, 5, 7,
    7, 6, 4,
    6, 7, 5,
  ],
  vertexBufferObject,
  indexBufferObject,
  vertexArrayObject,
  instances = [
    new Instance(function stationaryOffset() { return [0, 0, -20.0]; }),
    new Instance(function ovalOffset(elapsedTime) {
      var loopDuration = 3.0,
      scale = Math.PI * 2.0 / loopDuration,
      currTimeThroughLoop = elapsedTime % loopDuration;

      return [ 
        Math.cos(currTimeThroughLoop * scale) * 4.0, 
        Math.sin(currTimeThroughLoop * scale) * 6.0, 
          -20.0 
      ];
    }),
    new Instance(function bottomCircleOffset(elapsedTime) {
      var loopDuration = 12.0,
      scale = Math.PI * 2.0 / loopDuration,
      currTimeThroughLoop = elapsedTime % loopDuration;

      return [ 
        Math.cos(currTimeThroughLoop * scale) * 5.0, 
          -3.5, 
        Math.sin(currTimeThroughLoop * scale) * 5.0 - 20.0 
      ];
    })
  ];

  function calcFrustumScale(fovDeg) {
    var degToRad = Math.PI / 180,
    fovRad = fovDeg * degToRad;
    return 1.0 / Math.tan(fovRad / 2.0);
  }

  function Instance(offsetFn) {
    this.constructMatrix = function(elapsedTime) {
      var offset = offsetFn(elapsedTime);
      return new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        offset[0], offset[1], offset[2], 1.0
      ]);
    };
  }

  function logGLCall(functionName, args) {   
    console.log("gl." + functionName + "(" + 
                gldebug.glFunctionArgsToString(functionName, args) + ")");   
  } 

  function validateNoneOfTheArgsAreUndefined(functionName, args) {
    for (var ii = 0; ii < args.length; ++ii) {
      if (args[ii] === undefined) {
        console.error("undefined passed to gl." + functionName + "(" +
                      gldebug.glFunctionArgsToString(functionName, args) + ")");
      }
    }
  } 
  
  function logAndValidate(functionName, args) {
    logGLCall(functionName, args);
    validateNoneOfTheArgsAreUndefined(functionName, args);
  }

  function start() {
    canvas = document.getElementById("glcanvas");
    gl = gldebug.makeDebugContext(glu.setupWebGL(canvas), undefined, logAndValidate); 
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

    var zNear = 1.0, zFar = 45.0;
    //webgl can't handle a row-first matrix, so we have to transpose ourselves
    cameraToClipMatrix = transpose([
      frustumScale, 0.0,          0.0,                                   0.0,
      0.0,          frustumScale, 0.0,                                   0.0,
      0.0,          0.0,          (zFar + zNear) / (zNear - zFar),      -1.0,
      0.0,          0.0,          (2.0 * zFar * zNear) / (zNear - zFar), 0.0
    ]);

    gl.useProgram(theProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(theProgram, "cameraToClipMatrix"), false, new Float32Array(cameraToClipMatrix));
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
    position = gl.getAttribLocation(theProgram, "position"),
    colour = gl.getAttribLocation(theProgram, "colour");

    vertexArrayObject = ext.createVertexArrayOES();
    ext.bindVertexArrayOES(vertexArrayObject);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(colour);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(colour, 4, gl.FLOAT, false, 0, colorDataOffset);
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

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    gl.depthRange(0.0, 1.0);
  }

  function display() {
    var modelToCameraMatrix = gl.getUniformLocation(theProgram, "modelToCameraMatrix"),
    elapsedTime = (Date.now() - startTime) / 1000.0;

    reshape();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(theProgram);

    ext.bindVertexArrayOES(vertexArrayObject);
    instances.forEach(function(instance) {
      var transformMatrix = instance.constructMatrix(elapsedTime);
      gl.uniformMatrix4fv(modelToCameraMatrix, false, transformMatrix);
      gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);
    });

    ext.bindVertexArrayOES(null);
    gl.useProgram(null);

    window.requestAnimFrame(display, canvas);
  }

  function reshape() {
    if (canvas.clientWidth == canvas.width && canvas.clientHeight == canvas.height) {
      return;
    }

    cameraToClipMatrix[0] = frustumScale * (canvas.clientHeight / canvas.clientWidth);
    gl.useProgram(theProgram);
    gl.uniformMatrix4fv(gl.getUniformLocation(theProgram, "cameraToClipMatrix"), true, new Float32Array(cameraToClipMatrix));
    gl.useProgram(null);
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;    
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  window.document.addEventListener("DOMContentLoaded", start);
})(_, WebGLUtils, WebGLDebugUtils, window);
