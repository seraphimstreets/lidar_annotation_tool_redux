class PaintBrush2DTool extends GenericTool{

    constructor(){
        super();
        this.beginPaint = false;
        this.activeBrush = false;
        this.paintContext =  document.getElementById("imgCanvas").getContext('2d')
        this.drawing = false;
        this.origData =  null;
        this.tempInstanceTracker = {}
        this.orgPoint;
        this.strokeBuffer = [];
        this.strokeComponents = [];
        this.canvasTarget = $("#imgCanvas")[0]
      

    }
    
    
    init(){
        $("#imgCanvas").show()
        this.beginPaint = false;
        this.activeBrush = false;
        this.pathHistory = [];
        var co = Object.keys(app.class_order)
        var class_str, class_color, identifier
        for(var i=0;i<co.length;i++){
            class_str = co[i]
            class_color = app.class_colors[app.class_order[class_str]]
            identifier = class_str + ":None"
            this.tempInstanceTracker[identifier] = class_color
          


        }
  
        imagePanel.realInfo.context.imageSmoothingEnabled = false;


        
        imagePanel.drawMaskOnCanvas()

    }
   

    handleMouseUp(e){

        this.activeBrush = false;
        if(this.strokeBuffer.length > 5){
            this.strokeBuffer.shift()
        }
        this.strokeBuffer.push(this.strokeComponents)
        this.strokeComponents = [];
    }


    handleMouseDown(e){
        if(this.activeBrush){
            return
        }

        this.activeBrush = true;
  
        var mouse = imagePanel.getMousePosition(e)
        this.startStroke([mouse.x, mouse.y])
      
    }

   
    handleMouseMove(e){

        
        
        if (e.target != this.canvasTarget){
            this.activeBrush = false;
     
        }

        var mouse = imagePanel.getMousePosition(e) 


       
        if(this.beginPaint){

            if(this.activeBrush){
                var classification = $("#classSelector :selected").val() 
              
                var color = app.class_colors[app.class_order[classification]]
                var rad = $("#brushSizeRange").val()

           
          
                var instance_id, identifier, new_instance
               
                if($("#instanceSelector")[0].checked){
                
                    instance_id = app.cur_frame.create_new_image_instance_id(parseInt(app.class_order[classification]))
                    new_instance = true;
                }else if($("#instanceChoice")[0]){
          
                    if($("#instanceChoice")[0].value != "None"){
                        instance_id = $("#instanceChoice")[0].value
                    }else{
                        instance_id = "None"
                    }
                    
                }else{
                    
                    instance_id = "None"



                }
               

                identifier = classification + ":" + instance_id
                

                if(!(identifier in this.tempInstanceTracker)){
                    this.tempInstanceTracker[identifier] = this.generateRandomNewColor()
                }

                if(new_instance){
                    $("#instChoiceCont").remove();
                    var classification = $("#classSelector :selected").val()
                    var isl = submitBuilder.buildImageInstanceChoice(classification)
                    $('#classCont').after(isl)
                    $("#instanceChoice").val(instance_id)
                    $("#instanceSelector").prop('checked',false)
                }

           

                if(classification == 'Default'){
             
                    this.continueStroke(imagePanel.imageInfo.context, [mouse.x, mouse.y], rad, color, false, false, false)
                }else{
                    this.continueStroke(imagePanel.imageInfo.context, [mouse.x, mouse.y], rad, color, true, false, false)
                }

                var paintCtx = $("#paintCanvas")[0].getContext('2d')
                this.continueStroke(paintCtx, [mouse.x, mouse.y], rad , this.tempInstanceTracker[identifier], true, true, false)



                

                    
                    
                    
                    
            }else{
                
      
            }


        }
    }

    handleKeyDown(e){
        var keyID = e.keyCode;
       
       
        switch(keyID)
        {
            case 66: // b key
                if(this.beginPaint){
                   
                    this.reset()
                }else{
                    $("#imgCanvas").show()
                    this.beginPaint = true;
                    var brushSize = '<tr class="boxCont boxModi"> \
                        <td> \
                            <label for="brushSizeRange" class="rangeLabel">Brush Size: <span id="brushSizeVal">4</span></label> \
                            <input type="range" min="1" max="50" value="4" step="1" name="brushSizeRange" id="brushSizeRange"> \
                        </td> \
                    </tr> '
                    $(document).on('input', '#brushSizeRange', (e) => {
                        var id = e.target.id
                        var newId = id.replace('Range', 'Val')
                       
                        $(e.target).blur()
                        $('#' + newId).html(e.target.value)
                        this.maxPoints = parseInt(e.target.value)
                        
                    })
               

                    
    
    
                    submitBuilder.buildSubmitPanel(['classSelector', 'instanceCont', 'brushSize', 'onlyClassSelector'],
                        {'brushSize':brushSize }, true, true);


                    var context =  $('#imgCanvas')[0].getContext('2d')
                    context.globalCompositeOperation = "source-over";  
                
            
                    $('#imgBox').draggable("disable")
            
                    $("#maskImage").hide()
                    $('#imgBox').resizable("disable")

               
                    var opacity = parseInt($('#maskOpacity')[0].value)/100
                    $('#imgCanvas').css({"opacity":opacity}); 

                    $('#maskOpacity')[0].oninput =  () => {
                        var opacity = parseInt($('#maskOpacity')[0].value)/100
                    
                        $('#imgCanvas').css({"opacity":opacity}); 
                   
                    }
                

                    imagePanel.drawMaskOnCanvas()

         

                   
                    
                    
    
                }
             
                break;

            case 68: //d key

                break;
    
            default:
                break;
        }
    }

    handleKeyUp(e){
        return
    }

    handleSubmit(){

        app.toggleStatusText(true)
        
        app.cur_frame.recordImageHistory()

        

        var origLeft, origTop

       
        origLeft = 0
        origTop = 0

        var img = $('#maskImage')[0]

        var iw = $(img).css('width')
        var iw = parseInt(iw.slice(0, iw.length - 2))
        var ih  = $(img).css('height')
        var ih  = parseInt(ih.slice(0, ih.length - 2))
        var rscale = iw/imagePanel.origWidth

        var displayWidth = $("#imgDisplay").css('width')
        displayWidth = parseInt(displayWidth.slice(0, displayWidth.length-2))
        var displayHeight = $("#imgDisplay").css('height')
        displayHeight = parseInt(displayHeight.slice(0, displayHeight.length-2))

        console.log(displayWidth)
        console.log(rscale)


        var leftBound = origLeft/rscale 
        var topBound  = origTop/rscale

        var rightBound = Math.round(leftBound + (displayWidth/rscale))
        var bottomBound = Math.round(topBound + (displayHeight/rscale))

        leftBound = Math.round(leftBound)
        topBound = Math.round(topBound)

        var width = rightBound - leftBound
        var height = bottomBound - topBound

        var sourceCvs = $("#paintCanvas")[0]

        sourceCvs.getContext('2d').imageSmoothingEnabled = false;
        sourceCvs.getContext('2d').mozImageSmoothingEnabled = false;

        var zoomCanvas = document.createElement('canvas')
        var zoomCtx = zoomCanvas.getContext('2d')
        zoomCtx.drawImage(sourceCvs, 0, 0, displayWidth, displayHeight, 0, 0, width, height)
        
    

        $("#realCanvas")[0].getContext('2d').imageSmoothingEnabled = false;
        $("#realCanvas")[0].getContext('2d').mozImageSmoothingEnabled = false;


        $("#realCanvas")[0].getContext('2d').drawImage(sourceCvs, 0, 0, displayWidth, displayHeight, 0, 0, width, height)


        var pixelClass = app.cur_frame.cur_image.pixelClass
        var pixelInst = app.cur_frame.cur_image.pixelInst
        var numPixels = imagePanel.origHeight * imagePanel.origWidth;
        


        if(pixelClass.length == 0){
            for(i=0;i<numPixels;i++){
                pixelClass.push(0)
                pixelInst.push(-1)
            }
        }


        var cred, cl, inst_id, targetColor, idx, nah;
        var creds = Object.keys(this.tempInstanceTracker)
        console.log(creds)
        for(i=0;i<creds.length;i++){
            cred = creds[i]
            console.log(this.tempInstanceTracker[cred])
            this.tempInstanceTracker[cred] = magicWandTool.hexToRgb(this.tempInstanceTracker[cred].substring(1), 1)
        }

        
        var r = 0
        var maskData = $("#realCanvas")[0].getContext('2d').getImageData(0, 0, width, height).data
        var onlyClass = $("#onlyClassSelector :selected").val()

        if(onlyClass == 'All'){
            onlyClass = -2
        }else{
            onlyClass = app.class_order[onlyClass]
        }

        
        for(var i=topBound;i<bottomBound;i++){
            for(var j=leftBound;j<rightBound;j++){
                idx = i*imagePanel.origWidth + j
                for(var k=0;k<creds.length;k++){
                
                    cred = creds[k]
                    
                
                    cl = cred.split(":")[0]
                    inst_id = cred.split(":")[1]
                    cl = app.class_order[cl]
            
                    if(inst_id == "None"){
                        inst_id = -1
                    }else{
                        inst_id = parseInt(inst_id)
              
                        
                        if(inst_id === null){
                            inst_id = -1
                        }
                    }

           
                    targetColor = this.tempInstanceTracker[cred]
    
                
    
                    if(Math.abs(maskData[r*4] - targetColor[0]) < 4 && Math.abs(maskData[r*4+1]  - targetColor[1]) < 4
                        && Math.abs(maskData[r*4+2]  - targetColor[2]) < 4 ){


                        
                        if(onlyClass != -2){
                            if(pixelClass[idx] == onlyClass){
                                pixelClass[idx] = cl;
                                pixelInst[idx] = inst_id;
                            }
                        }else{
                              
                            pixelClass[idx] = cl;
                            pixelInst[idx] = inst_id;
                        }
                    }
                }
                
                r++
            }
        }

    

        
       


        
        $.ajax({
            url: '/saveImage',
            data: JSON.stringify({'pixelClass':pixelClass, 'pixelInst':pixelInst, 
            'classColors':app.class_colors, 'classOrder': app.class_order, 'fname':app.cur_frame.fname,
                 'baseImage':app.cur_frame.cur_image.baseImage}),
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


        this.beginPaint = false;
        this.activeBrush = false;
        this.origData = null;
        this.pathHistory = [];
       
      
        $("#maskImage").show()
        submitBuilder.hideSubmitPanel()
        $('#imgBox').draggable("enable")
        $('#imgBox').resizable("enable")

    
        this.tempInstanceTracker = {}
        imagePanel.clearSelectCanvas()
        $('#maskOpacity')[0].oninput =  () => {
            var opacity = parseInt($('#maskOpacity')[0].value)/100
            $('#maskImage').css({"opacity":opacity}); 
          
        }
    
        $('#imgCanvas').css({"opacity":1}); 
        
    }


}