

class Polygon2DTool extends GenericTool {

    constructor() {
        super()
        this.vertices = [];
        
    
        
        this.polygonStart = false;
        this.polygonDrawing = false;
        

    }

    init(){
        return
      
    }

    handleMouseDown(e){

        if ($(e.target).attr('id') != "imgCanvas") return;

        if(this.polygonStart && this.polygonDrawing){
            
            var mouse = imagePanel.getMousePosition(e)

            imagePanel.drawPoint(mouse.x, mouse.y)
            this.vertices.push([mouse.x, mouse.y])

        }
      
    }

    handleMouseUp(e){
        return
    }

    handleMouseMove(e){
  
        if ($(e.target).attr('id') != "imgCanvas") return;
        if(this.polygonStart){
            imagePanel.clearSelectCanvas()
            for (i=0;i<this.vertices.length;i++){
                imagePanel.drawPoint(this.vertices[i][0], this.vertices[i][1]);
            }
            if(this.polygonDrawing){
                var mouse = imagePanel.getMousePosition(e)
                this.vertices.push([mouse.x, mouse.y])
                if(this.vertices.length > 0){
                    imagePanel.trace(this.vertices)
                }
                
                this.vertices.pop()
            }else{
                if(this.vertices.length > 0){
                    imagePanel.trace(this.vertices)
                }
            }
            
        }
    }

    handleKeyDown(e){
        var keyID = e.keyCode;
   
       
        switch(keyID)
        {
            case 66: // b key
                this.togglePolyDraw();
                break;
    
            case 82: // r key
                this.togglePolygonDrawing(true)
                break;
    
            default:
                break;
        }
    }

    handleKeyUp(e){
        var keyID = e.keyCode;
        switch(keyID)
        {
            case 82: // r key
                this.togglePolygonDrawing(false)
                break;
            
            default:
                break;
        }
    }

    handleSubmit(){

        app.cur_frame.recordImageHistory()

        var addedPointsIndices, classification
        
        classification = $("#classSelector :selected").val()

        var instance_id = -1;
        var new_instance = false;
        var applyPointcloud=false;
        var brightnessThresh = false

        if($("#instanceSelector")[0].checked){
            instance_id = app.cur_frame.create_new_image_instance_id(parseInt(app.class_order[classification]))
            new_instance = true;
        }else if($("#instanceChoice")[0]){
            if($("#instanceChoice")[0].value != "None"){
                instance_id = parseInt($("#instanceChoice")[0].value)
            }
            
        }else{
            instance_id = -1
        }
        if(instance_id === null){
            instance_id = -1
        }

        var onlyClass = $("#onlyClassSelector :selected").val()

        if(onlyClass == 'All'){
            onlyClass = -2
        }else{
            onlyClass = app.class_order[onlyClass]
        }

        
        var brightnessThresh = $("#brightnessThreshRange").val();
        

  
    
        
        
        var resizedPoly= imagePanel.getResizedPolygon(this.vertices)
         imagePanel.applyPolygonsPointcloud(this.vertices, resizedPoly, classification, instance_id, new_instance=new_instance, applyPointcloud, onlyClass=onlyClass,
             brightnessThresh=brightnessThresh)

    }
  
    reset(){
        console.log('reset')
        this.vertices = [];

        this.polygonStart = false;
        this.polygonDrawing = false;
        submitBuilder.hideSubmitPanel();

        imagePanel.clearSelectCanvas()
        camera.position.set(0, 100, 0);
        camera.lookAt(new THREE.Vector3(0,0,0));
        controls.enabled=true;
        controls.update();
        this.emptyPoints();
        $('#imgBox').draggable("enable")

    }

    initializePoly(){
        var geometry = new THREE.BufferGeometry();
        var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        var newPoly = new THREE.Line( geometry, material );
        scene.add( newPoly );
        this.polygon = newPoly;
    }

    togglePolyDraw(){
        if(this.polygonStart){
            this.reset()
        }else{
            this.polygonStart = true;

            var brightnessThresh = '<tr class="boxCont boxModi"> \
                <td> \
                    <label for="brightnessThreshRange" class="rangeLabel">Luminosity Threshold: <span id="brightnessThreshVal">0</span></label> \
                    <input type="range" min="0" max="255" value="0" step="1" name="brightnessThreshRange" id="brightnessThreshRange"> \
                </td> \
            </tr> '
            $(document).on('input', '#brightnessThreshRange', (e) => {
                var id = e.target.id
                var newId = id.replace('Range', 'Val')
                
                $(e.target).blur()
                $('#' + newId).html(e.target.value)
 
                
            })

            submitBuilder.buildSubmitPanel(['classSelector', 'instanceCont', 'onlyClassSelector', 'brightnessThresh'],
                {'brightnessThresh':brightnessThresh}, true, true);
        
            controls.enabled=false;
            controls.update()
           
            $('#imgBox').draggable("disable")
 


            

        }

    }

    togglePolygonDrawing(b){
        if(b){
            this.polygonDrawing = true;
            
        }else{
            this.polygonDrawing = false;
        }
    }

    emptyPoints(){
        this.vertices = [];
        this.polygonDrawing = false;
    }







    
    
    

  }