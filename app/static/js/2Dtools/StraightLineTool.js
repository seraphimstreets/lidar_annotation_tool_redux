class StraightLineTool extends GenericTool{

    constructor(){
        super();
        this.startTool = false;
     

        this.paintContext =  document.getElementById("imgCanvas").getContext('2d')
     
        this.tempInstanceTracker = {}
        this.lineDrawing = false;
    
   
        this.canvasTarget = $("#imgCanvas")[0]
        this.vertices = []
      
       
        
    }
    
    
    init(){
        $("#imgCanvas").show()

      
        var co = Object.keys(app.class_order)
        var class_str, class_color, identifier
        for(var i=0;i<co.length;i++){
            class_str = co[i]
            class_color = app.class_colors[app.class_order[class_str]]
            identifier = class_str + ":None"
            this.tempInstanceTracker[identifier] = class_color
          


        }
  
        imagePanel.realInfo.context.imageSmoothingEnabled = false;

  

        

    }
   

    handleMouseUp(e){
        return

    }


    handleMouseDown(e){


        var mouse = imagePanel.getMousePosition(e)
        if(this.startTool){
            imagePanel.drawPoint(mouse.x, mouse.y)
            this.vertices.push([mouse.x, mouse.y])

        }
    

      
    }

   
    handleMouseMove(e){

        var color = "#0703fc"
        var rad = $("#brushSizeRange").val()
        
        if (e.target != this.canvasTarget){
            return
     
        }

        

        var mouse = imagePanel.getMousePosition(e) 

        if(this.startTool){
            imagePanel.clearSelectCanvas()
            for (i=0;i<this.vertices.length;i++){
                imagePanel.drawPoint(this.vertices[i][0], this.vertices[i][1]);
            }
            if(this.lineDrawing){
      
                this.vertices.push([mouse.x, mouse.y])
                if(this.vertices.length > 0){
                    imagePanel.trace(this.vertices,color, rad)
                    
                }
                
                this.vertices.pop()
            }else{
                if(this.vertices.length > 0){
                    imagePanel.trace(this.vertices, color, rad)
                 
                }
            }
        }


     
        
    }

    handleKeyDown(e){
        var keyID = e.keyCode;
       
       
        switch(keyID)
        {
            case 66: // b key
                if(this.startTool){
                   
                    this.reset()
                }else{
                    this.startTool = true
                    $("#imgCanvas").show()
                  
                    var brushSize = '<tr class="boxCont boxModi"> \
                        <td> \
                            <label for="brushSizeRange" class="rangeLabel">Brush Size: <span id="brushSizeVal">2</span></label> \
                            <input type="range" min="1" max="10" value="2" step="1" name="brushSizeRange" id="brushSizeRange"> \
                        </td> \
                    </tr> '
                    $(document).on('input', '#brushSizeRange', (e) => {
                        var id = e.target.id
                        var newId = id.replace('Range', 'Val')
                       
                        $(e.target).blur()
                        $('#' + newId).html(e.target.value)
                        
                    })
               

    
                    submitBuilder.buildSubmitPanel(['classSelector', 'instanceCont', 'brushSize', 'onlyClassSelector'],
                        {'brushSize':brushSize }, true, true);
    
                    
               


                    var context =  $('#paintCanvas')[0].getContext('2d')
                    context.globalCompositeOperation = "source-over";  
                
            
                    $('#imgBox').draggable("disable")
                    $('#imgBox').resizable("disable")

                   

    
                }
             
                break;

                
            case 82: // r key
              
                this.lineDrawing = true;
                
    
            default:
                break;
        }
    }

    handleKeyUp(e){
        var keyID = e.keyCode;
       
       
        switch(keyID)
        {
       
             
              

                
            case 82: // r key
              
                this.lineDrawing = false;
                
    
            default:
                break;
        }
    }

    handleSubmit(){
        
        app.cur_frame.recordImageHistory()

        app.toggleStatusText(true)

        // var origLeft, origTop
        var color = "#0703fc"
        var rad = $("#brushSizeRange").val()
        var paintCtx = $("#paintCanvas")[0].getContext('2d')
        var parently = []
        console.log(imagePanel.scaleFactor)
        for(i=0;i<this.vertices.length;i++){
            parently.push([this.vertices[i][0]/imagePanel.scaleFactor, this.vertices[i][1]/imagePanel.scaleFactor])
        }
        console.log(parently)
        imagePanel.trace(parently,color, rad/imagePanel.scaleFactor, $("#realCanvas")[0].getContext('2d'))


        
        var pixelClass = app.cur_frame.cur_image.pixelClass
        var pixelInst = app.cur_frame.cur_image.pixelInst
        var numPixels = imagePanel.origHeight * imagePanel.origWidth;
        


        if(pixelClass.length == 0){
            for(i=0;i<numPixels;i++){
                pixelClass.push(0)
                pixelInst.push(-1)
            }
        }
        

        var addedPointsIndices, classification, index
        
        var classification = app.class_order[$("#classSelector :selected").val()]

        var instance_id = -1;
        var new_instance = false;

        var data =  $("#realCanvas")[0].getContext('2d').getImageData(0, 0, imagePanel.origWidth, imagePanel.origHeight).data

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

        var onlyClass = app.class_order[$("#onlyClassSelector :selected").val()]

        if(onlyClass == 'All'){
            onlyClass = -2
        }else{
            onlyClass = app.class_order[onlyClass]
        }

  
        var origColor = []

        console.log(classification)
        console.log(instance_id)
        
        for(var index=0;index<numPixels;index++){


            if( Math.abs(data[4*index+0] - 7 < 3) && Math.abs(data[4*index+1] - 3) < 3 && Math.abs(data[4*index+2] - 252) < 3 ){
              
                pixelClass[index] = classification
                pixelInst[index] = instance_id
            }
            
        }

    

        
       


        
        $.ajax({
            url: '/saveImage',
            data: JSON.stringify({'pixelClass':pixelClass, 'pixelInst':pixelInst, 
            'classColors':app.class_colors, 'classOrder': app.class_order, 'fname':app.cur_frame.fname,
                'imageInstanceCounter':app.cur_frame.cur_image.imageInstanceCounter, 'baseImage':app.cur_frame.cur_image.baseImage}),
            type: 'POST',
            contentType: 'application/json;charset=UTF-8',
            success: function(response) {

                
                
                app.load_frame_image(app.cur_frame.cur_image.baseImage);
                
                activeTool.reset();
                activeTool.init();

                
            },
            error: function(error) {
                console.log(error);
            }
        });


        

    
        
       
        



   
      

    }




    drawBrushCircle(x, y, radius){
        

        
        imagePanel.clearSelectCanvas()
        var ctx = imagePanel.imageInfo.context

       
        ctx.beginPath();
        ctx.arc(x, y, radius , 0, 2 * Math.PI);
        ctx.stroke(); 
    }

    paintBrushCircle(x, y, radius, color){
        var ctx = imagePanel.imageInfo.context
       
        ctx.beginPath();
        ctx.arc(x, y, radius , 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill(); 
    }

    restorePreviousStroke(){

        if(this.strokeBuffer.length > 0){
            var latestStroke = this.strokeBuffer.pop()
            for(i=0;i<latestStroke.length;i++){
                var info = latestStroke[i]
      
                this.latestPoint = info[0]
                var paintCtx = $("#paintCanvas")[0].getContext('2d')
                this.continueStroke(imagePanel.imageInfo.context, info[1], info[2], this.tempInstanceTracker["Default:None"], false, false, true)
                this.continueStroke(paintCtx, info[1], info[2], this.tempInstanceTracker["Default:None"], true, false, true)
            }
        }

       
      
     
    }

    continueStroke(context, newPoint, width, color, gco=false, updatePoint = false, restore=false) {

    
        var maxWidth = $("#imgCanvas")[0].width
        var maxHeight = $("#imgCanvas")[0].height
        var latestPoint = this.latestPoint

        if(newPoint[0] <= 0 || newPoint[1] <= 0  ||  newPoint[0] >= maxWidth || newPoint[1] >= maxHeight){
            return;
        }


        if(!restore){
            
            this.strokeComponents.push([latestPoint, newPoint, width])
        }
   
        
        context.beginPath();
        
       
        
     
        context.moveTo(latestPoint[0]  , latestPoint[1]);
        
        context.strokeStyle = color;
        context.lineWidth = width;
    
        context.lineCap = "round";
        // context.lineJoin = "round";
        if(gco){
            context.globalCompositeOperation = "source-over";  
          
            
        }else{
            context.globalCompositeOperation = "destination-out";  
            context.strokeStyle = "rgba(255,255,255,1)";
        }

    

        context.lineTo(newPoint[0] , newPoint[1]);
        
        context.stroke();

        

        if(updatePoint){
                this.latestPoint = newPoint;
            
            
        }
        
        
      
        
      };

     

      startStroke(point) {
        this.activeBrush = true;
        this.latestPoint = point;
      };
    
      generateRandomNewColor(){
          var magnus = true;
          var c
          while(magnus){
            c = this.getRandomColor()
            if(!(c in Object.values(this.tempInstanceTracker))){
                magnus = false;
                return c
            }
          }
        }
      
      getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }
      

    reset(){


        this.startTool = false;
        this.vertices = []
       

        submitBuilder.hideSubmitPanel()
        $('#imgBox').draggable("enable")
        $('#imgBox').resizable("enable")
    
    
        this.tempInstanceTracker = {}
        imagePanel.clearSelectCanvas()

    
        
    }


}