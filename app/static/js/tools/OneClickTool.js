class OneClickTool extends GenericTool{

    constructor() {
        super()
        this.toolOp = false;
        this.beginClick = false;
    }

    init(){
        this.toolOp = false;
        this.beginClick = false;
        this.ctrlPressed = false;
        this.maxPoints = 1000;
        this.distThreshold = 0.007;
        this.prevClasses = [];
        this.prevIndices = [];
        $("#submitBBox").hide()
    }

    handleMouseDown(e){
        console.log(this.beginClick)
        if(this.toolOp & this.beginClick){
        
            app.cur_frame.recordPCHistory()
            
            var classification = $("#classSelector :selected").val()
            var instance_id;
            var new_instance = false;

            if($("#instanceSelector")[0].checked){
                instance_id = app.cur_frame.create_new_instance_id(parseInt(app.class_order[classification]))
                new_instance = true;
            }else if($("#instanceChoice")[0]){
                if($("#instanceChoice")[0].value != "None"){
                    instance_id = parseInt($("#instanceChoice")[0].value)
                }
               
            }else{
                instance_id = -1
            }
           
            var point = getPoint(e)
          
            if(point){
                var addedPointsIndices = []
                var origPoints = app.cur_pointcloud.geometry.vertices;
   
                var maxPoints = this.maxPoints;
                var distThreshold = this.distThreshold;
                var groundThreshold = 0.1;
                var pt, dist, minDist, maxDist
               
              
                maxDist = -10000000000;
                var distances = []
                var all_ys = []
                var c_y;
                for(var i=0;i<origPoints.length;i++){
                   
                    pt = origPoints[i]
                 
                
                    dist = Math.abs(point.x - pt.x) + Math.abs(point.y - pt.y) + Math.abs(point.z - pt.z)
                    c_y = Math.round(pt.y * 10)  /10
                    distances.push([dist, i, c_y])
                    all_ys.push(c_y)
                  
                }

             
                const mode = a => {
                    var counts =
                        a.reduce((count, e) => {
                        if (!(e in count)) {
                            count[e] = 0;
                        }
                        
                        count[e]++;
                       
                        return count;
                        }, {})
                  
                    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3).map(Number) ;
                }
                    
                    
                // all_ys.sort(function(a,b){return a - b})
                var modeYs = mode(all_ys)

                var min_y = -1.6
                var dist_a, dist_b
                distances.sort(function(a,b){
                    dist_a = a[0]
                    dist_b = b[0]
                    if (dist_a < dist_b) return -1
                    if (dist_b < dist_a) return 1
                    return 0;
                })
            

                var pointCandidates = distances.slice(0, maxPoints)
                var addedPointsIndices = []
                var candY;
                var y_dist, distMovement;
  
                for(i=0;i<pointCandidates.length;i++){
                    if(i > 0){
                        distMovement = pointCandidates[i][0] - pointCandidates[i-1][0]
                    }
                    candY = pointCandidates[i][2]
                    if(distMovement < distThreshold & !modeYs.includes(candY)){
                        addedPointsIndices.push(pointCandidates[i][1])
                    }
                    
                }
                this.prevIndices = addedPointsIndices;
                this.prevClasses = app.cur_frame.getIndicesClasses(addedPointsIndices)
                app.addPoints(classification, instance_id, addedPointsIndices, new_instance)
         
                console.log(instance_id)
                if(instance_id != -1){
                    $("#instChoiceCont").remove();
                    var classification = $("#classSelector :selected").val()
                    var isl = submitBuilder.buildInstanceChoice(classification)
                    $('#classCont').after(isl)
                    $("#instanceChoice").val(instance_id)
                    $("#instanceSelector").prop('checked',false)
                }
                
      
            }
        }else{

        }
    }

    handleMouseUp(e){
        return
    }

    handleMouseMove(e){
        return
    }

    handleKeyDown(e){
        var keyID = e.keyCode;
        console.log(e)
        
       
        switch(keyID)

        {
            case 17:
                this.ctrlPressed = true

            case 66: // b key
                if(!this.toolOp){
                    var maxPointsRange = '<tr class="boxCont boxModi"> \
                        <td> \
                            <label for="maxPointsRange" class="rangeLabel">Max Points: <span id="maxPointsVal">1000</span></label> \
                            <input type="range" min="100" max="10000" value="1000" step="20" name="maxPointsRange" id="maxPointsRange"> \
                        </td> \
                    </tr> '
                    $(document).on('input', '#maxPointsRange', (e) => {
                        var id = e.target.id
                        var newId = id.replace('Range', 'Val')
                        console.log(newId)
                        $(e.target).blur()
                        $('#' + newId).html(e.target.value)
                        this.maxPoints = parseInt(e.target.value)
                        
                    })

                    var distThresholdRange = '<tr class="boxCont boxModi"> \
                        <td> \
                            <label for="distThresholdRange" class="rangeLabel">Dist Threshold: <span id="distThresholdVal">0.007</span></label> \
                            <input type="range" min="0.001" max="0.1" value="0.007" step="0.001" name="distThresholdRange" id="distThresholdRange"> \
                        </td> \
                    </tr> '
                    $(document).on('input', '#distThresholdRange', (e) => {
                        var id = e.target.id
                        var newId = id.replace('Range', 'Val')
                        console.log(newId)
                        $(e.target).blur()
                        $('#' + newId).html(e.target.value)
                        this.distThreshold = parseFloat(e.target.value)
                        
                    })
                 
                 

                    submitBuilder.buildSubmitPanel(['classSelector', 'instanceCont', 'maxPointsRange', 'distThresholdRange'], 
                    {maxPointsRange:maxPointsRange, distThresholdRange:distThresholdRange},true)
                    this.toolOp=true
                }else{
                    submitBuilder.hideSubmitPanel()
                    this.toolOp=false
                }
                
                break;
            case 82:
                this.beginClick = true;
                break;
            
            case 90:
              
                this.undoChange();
                
                break;
                
           
            default:
                break;
        }
    }

    handleKeyUp(e){
        var keyID = e.keyCode;
       
        switch(keyID)
        {
            case 17:
                this.ctrlPressed = false;
                
            case 82:
                this.beginClick = false;
           
            default:
                break;
        }
    }

    handleSubmit(){
        return
    }
  
    reset(){
        this.toolOp = false;
        this.beginClick = false;
        $("#submitBBox").show()
        submitBuilder.hideSubmitPanel();
        controls.enabled = true;
        controls.update()
    }

    undoChange(){
        var color_obj = {}
        var kehs = Object.keys(app.class_colors)
        console.log(kehs)
        for (i=0;i<kehs.length;i++){
            r = parseInt(kehs[i])
            color_obj[r] = new THREE.Color(app.class_colors[r])
            
        }
        var idx, cl, color;
        var ct = app.cur_frame.class_tracker
        var pc_colors = app.cur_pointcloud.geometry.colors
        for(i=0;i<this.prevIndices.length;i++){
            idx = this.prevIndices[i]
            cl = this.prevClasses[i]
            color = color_obj[cl]

            ct[idx] = cl
            pc_colors[idx] = color

        }

        app.cur_pointcloud.geometry.colorsNeedUpdate = true;
    }
  }