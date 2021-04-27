

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

//some global variables

var renderer, scene, camera,  raycaster;
var mouse2D = new THREE.Vector2();
var mouse = new THREE.Vector3();

var classEditing = false, classSelecting = false, classOldName = "";
var app;


//some constants
var selected_color = new THREE.Color(0x78F5FF);
var hover_color = new THREE.Color(1, 0, 0);
var default_color = new THREE.Color(0xffff00);


COLOR_RED =  new THREE.Color( 1,0,0 );
COLOR_WHITE = new THREE.Color( 1,1,1 );
DATA_STRIDE = 4;




//panel for displaying images

var imagePanel = new ImagePanel();

//instantiating different tools
var cbh = new CuboidHandler();
var defTool = new DefaultTool();
var poly3dTool = new Polygon3DTool();
var poly2dTool = new Polygon2DTool();
var magicWandTool = new MagicWandTool();
var submitBuilder = new SubmitBuilder();
var paintBrush2DTool = new PaintBrush2DTool();
var miscellaneousTools = new MiscellaneousTools();
var miscellaneous3DTools = new Miscellaneous3DTools();
var straightLineTool = new StraightLineTool();



var activeToolStr = "";
var activeTool = null;

//mapping the html ids to classes
var allTools = {"default3D":defTool, "boundingBox3D":cbh , "poly3D":poly3dTool, "magicWand2D":magicWandTool,
 'poly2D':poly2dTool, "paintBrush2D":paintBrush2DTool, 
  "miscellaneousTools2D":miscellaneousTools, 
 "miscellaneous3DTools":miscellaneous3DTools, "straightLine2D":straightLineTool}



init();





// called first, populates scene and initializes renderer
function init() {

    

    var container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    // scene.background = new THREE.Color( 0xffffff );
   

    // set up PerspectiveCamera
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
    camera.position.set(0, 100, 0);
    camera.lookAt(new THREE.Vector3(0,0,0));


    //
    grid = new THREE.GridHelper( 200, 20, 0xffffff, 0xffffff );

    // set up renderer
    renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );


    domEvents	= new THREEx.DomEvents(camera, renderer.domElement)
    raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.5;
    controls = new THREE.OrbitControls( camera, renderer.domElement );


    
    app = new App();
    app.init();
    
}




$(document).ready(function(){

 
     
    //minimizes tables when clicked
    $(".minimize-arrow").click(minimizeModule);

    //intensity filter
    $("#intensityFilter").click(intensityToggle)

    

    //3d tools
    $( '#default3D' ).click(changeActiveTool);
    $( '#boundingBox3D' ).click(changeActiveTool);
    $( '#poly3D' ).click(changeActiveTool);
    $("#rangenet").click(rangenetHandler)
    $( '#miscellaneous3DTools' ).click(changeActiveTool);
    


    //2d tools
    $( '#poly2D' ).click(changeActiveTool);
    $( '#paintBrush2D' ).click(changeActiveTool);
    $( '#magicWand2D' ).click(changeActiveTool);
    $( '#straightLine2D' ).click(changeActiveTool);
    $("#detectron").click(autoSegmentHandler);
    $( '#miscellaneousTools2D' ).click(changeActiveTool);
    
  
    //allows canvas to read mouse input
    $( '#imgCanvas' ).mousedown(mouseDownHandler);
    $( '#imgCanvas' ).mouseup(mouseUpHandler);
    $( '#imgCanvas' ).mousemove(mouseMoveHandler);

    
    
    $('#container').mousedown(mouseDownHandler);
    $('#container').mouseup(mouseUpHandler);
    $('#container').mousemove(mouseMoveHandler);


    // makes the image panel resizable and draggable
    $('#imgBox').resizable({
        handles:"s, w, sw",
        aspectRatio:true,
        resize : function(event,ui) {
            startW = $(this).outerWidth();
            startH = $(this).outerHeight();
            var scaleFactor = startW/imagePanel.origWidth;
            var w = imagePanel.origWidth * scaleFactor
            var h = imagePanel.origHeight * scaleFactor

            $('#frameImage')[0].width = w
            $('#frameImage')[0].height = h
            $('#maskImage')[0].width = w
            $('#maskImage')[0].height = h
    
            ui.size.width = w
            ui.size.height = h + 60
            
           imagePanel.updateSize(scaleFactor);
        }
      });
    $('#imgBox').draggable()

    //handles mask opacity
    $('#maskOpacity')[0].oninput =  () => {
        var opacity = parseInt($('#maskOpacity')[0].value)/100
        $('#maskImage').css({"opacity":opacity}); 
 
    }

    
    //settings (changes point size)
    $("#settings-box").click((e) => {
        settingsHandler(e)
    })

    //closing the modals
    $("#confirmError").click(() => {
        $("#errorBox").css("display","none")
    })

    $('.panelExit').click((e) => {
        $('.modal').css({'display':'none'})
    })


    
    //handling submit
    $("#submitBBox").click(submitHandler);


    //changing viewing modes
    $( '#orthographic-mode' ).click((e)  => {
        projectOntoXZ()
 
    });
    $( '#perspective-mode' ).click((e)  => {
        unprojectFromXZ()
  
    });
    


    window.addEventListener( 'resize', onWindowResize, false );
    document.getElementById( 'save' ).addEventListener( 'click', write_frame_out, false );
    
   
    container = document.getElementById('container')
    document.addEventListener("keydown", miscKeyDownHandler);
    document.addEventListener("keydown", keyDownHandler); 
    document.addEventListener("keyup", keyUpHandler);
    
    
   
    window.onbeforeunload = (function(evt) {
        app.deleteExtraPictures();
        return null;
    })

    window.onunload = (function(evt) {
        app.deleteExtraPictures();
        return null;
    })

    

    
    
});





















