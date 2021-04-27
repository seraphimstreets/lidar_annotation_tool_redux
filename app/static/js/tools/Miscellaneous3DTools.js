class Miscellaneous3DTools extends GenericTool{

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
         

                    var clearLabels = '<tr id="clearLabelsCont" class="boxCont"> \
                            <td> \
                                <label for="clearLabels">Clear Labels</label> \
                                <input type="checkbox" name="clearLabels" id="clearLabels"> \
                            </td> \
                        </tr>'

                    submitBuilder.buildSubmitPanel([ 'clearLabels','classSelector'],
                    { 'clearLabels':clearLabels }, true, true, 'Fill Remaining:');
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

        var point_classes = app.cur_frame.class_tracker
        var point_insts = app.cur_frame.instance_tracker
        var instance_counter = app.cur_frame.instance_counter

        var bounds = app.cur_frame.cur_pointcloud_offset;

        var class_colors = app.class_colors

        if($("#clearLabels")[0].checked){
            for(i=0;i<point_classes.length;i++){
                point_classes[i] = 0
                point_insts[i] = -1
            }
            var iic = {}
            var class_names = Object.keys(class_colors) 
            for(i=0;i<class_names.length;i++){
                iic[class_names[i]] = []
            }
            instance_counter = iic
            
        }else{
            var classification = $("#classSelector :selected").val()
            var fillClass = app.class_order[classification]
            console.log(fillClass)
            for(i=0;i<point_classes.length;i++){
                if(point_classes[i] == 0){
                    point_classes[i] = fillClass
                }
                
            }
            
        }

        updatePointCloudColorsFromClasses()
        this.reset()
    }

    reset(){
        this.swatched = false
        submitBuilder.hideSubmitPanel()

        return
    }
    


}