class MiscellaneousTools extends GenericTool{

    constructor(){
        super();
        this.swatched = false
    }
    
    init(){
        
        return

    }
   

    handleMouseUp(e){

        return
    }


    handleMouseDown(e){

        return
      
    }

   
    handleMouseMove(e){
        return
    }

    handleKeyDown(e){
        var keyID = e.keyCode;
        console.log(keyID)
       
        switch(keyID)
        {
            case 66: // b key
                if(!this.swatched){
                    var copyLast = '<tr id="copyLastCont" class="boxCont"> \
                            <td> \
                                <label for="copyLast">Copy Previous</label> \
                                <input type="checkbox" name="copyLast" id="copyLast"> \
                            </td> \
                        </tr>'

                    var clearLabels = '<tr id="clearLabelsCont" class="boxCont"> \
                            <td> \
                                <label for="clearLabels">Clear Labels</label> \
                                <input type="checkbox" name="clearLabels" id="clearLabels"> \
                            </td> \
                        </tr>'

                    submitBuilder.buildSubmitPanel([ 'copyLast', 'clearLabels','classSelector'],
                    { 'copyLast':copyLast, 'clearLabels':clearLabels }, true, true, 'Fill Remaining');
                    this.swatched = true;
                
                }else{
                    this.reset()
                }

                break;

                
    
            default:
                break;
        }
    
    }

    handleKeyUp(e){
        return
    }

    handleSubmit(){
        var pixelClass = app.cur_frame.cur_image.pixelClass
        var pixelInst = app.cur_frame.cur_image.pixelInst
        var imageInstanceCounter = app.cur_frame.cur_image.imageInstanceCounter
        var class_order = app.class_order
        var class_colors = app.class_colors 

        if(pixelClass.length == 0){
            app.cur_frame.cur_image.createDefault()
        }

        if($("#copyLast")[0].checked){
            var image_names = app.cur_frame.accum_object['image_names']
            var current_name = app.cur_frame.activeImage.split('/')
            current_name = current_name[current_name.length - 1]
            
            console.log(current_name)
            if(!current_name){
                this.reset()
     
            }

            var idx = image_names.indexOf(current_name)
            console.log(image_names)
            console.log(idx)
            if(idx == 0){
                this.reset()
            }else{
                var prevIdx = idx - 1
                var drivename = app.cur_frame.fname.split("/")[0]
                
                var img_path = "static/datasets/" + drivename + "/image/" + image_names[prevIdx]
                console.log(img_path)

                $.ajax({
                    url: '/loadImage',
                    data: JSON.stringify({"baseImage":img_path, "fname":app.cur_frame.fname}),
                    type: 'POST',
                    contentType: 'application/json;charset=UTF-8',
                    success: function(response) {
                    
                        var res = parsePythonJSON(response);
                        console.log(res)
                        app.cur_frame.cur_image.pixelClass = res['pixelClasses']
                        app.cur_frame.cur_image.pixelInst =  res['pixelInst']
                        app.cur_frame.cur_image.imageInstanceCounter = res['imageInstanceCounter']
                        app.save_and_load_image()
  
                        
                    },
                    error: function(error) {
                        console.log(error);
                        
                    }  
                });
            }
         
        }   

        else if($("#clearLabels")[0].checked){
            for(i=0;i<pixelClass.length;i++){
                pixelClass[i] = 0
                pixelInst[i] = -1
            }
            var iic = {}
            var class_names = Object.keys(class_colors) 
            for(i=0;i<class_names.length;i++){
                iic[class_names[i]] = []
            }
            imageInstanceCounter = iic
            app.save_and_load_image()
        }
        else{
            var classification = $("#classSelector :selected").val()
            var fillClass = app.class_order[classification]
            console.log(fillClass)
            for(i=0;i<pixelClass.length;i++){
                if(pixelClass[i] == 0){
                    pixelClass[i] = fillClass
                }
                
            }
            app.save_and_load_image()

        }
    }

    reset(){
        this.swatched = false
        submitBuilder.hideSubmitPanel()

        return
    }
    


}