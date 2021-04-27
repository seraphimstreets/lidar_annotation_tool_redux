class CuboidHandler extends GenericTool{

    constructor(){
        super();
        this.mouseDown = false;
        this.isMoving = false;
        this.isResizing = false;
        this.isRotating = false;
        this.selectedBox = null;
        this.potBBMode = true;
        this.modifyBoxMode = false;
        this.autoDrawMode = false;
        this.hoverBoxes = [];
        this.hoverBox = null;
        this.handleSelected = false;
        this.handleMoving = false;
    }
    
    init(){
        
        camera.updateProjectionMatrix();

        
    }
   

    handleMouseUp(e){

        this.mouseDown = false;
        this.isMoving = false;
        this.isRotating = false; 
        this.isResizing = false;
        if(this.selectedBox){
            this.selectedBox.draggingIdx = null;
            this.selectedBox.handlePos = null;
            this.selectedBox.dragStart = null;
        }
        this.handleSelected = false;
        this.handleMoving = false;
        this.selectedBox = null;
     

    }


    handleMouseDown(e){

        this.mouseDown = true;

        if (this.autoDrawMode && this.potBBMode) {

            if(app.cur_frame.potential_bounding_boxes.length == 0){
                this.handleManualDraw(e)
            }

        } else if(this.modifyBoxMode){

            if(app.globalViewMode == "perspective"){
                
                if(this.handleSelected){
                    var temp = new THREE.Vector3(mouse2D.x, mouse2D.y,  0);
                    temp.unproject( camera );
                    if(!this.handleMoving){
                        app.cur_frame.potential_bounding_boxes[0].dragStart = temp;
                    }
                    this.handleMoving = true;
                    
                    // var k = temp.clone()
                    // var dir = k.sub( camera.position ).normalize();
                    // var dir = temp.sub( camera.position ).normalize();
                    // var distance = - camera.position.y / dir.y;
                    // temp = temp.multiplyScalar(distance)
                    app.cur_frame.potential_bounding_boxes[0].handlePos = temp
                    
                }

            }else if (app.globalViewMode == "orthographic"){
                
                var intersection = this.intersectWithCorner();
          
        
                
                if (intersection !== null) {
                
                    var box = intersection[0];
                    // var cent = (box.geometry.vertices[0].y + box.geometry.vertices[1].y)/2
                    var p = intersection[1];
                    var closestIdx = closestPoint(p, box.geometry.vertices);

                    console.log(closestIdx)
                    
                
                    if (closestIdx == 2 || closestIdx == 3) {
                      return
                        
                    } else if(closestIdx == 10){
                        this.isResizing = false;
                        this.isRotating= true;
                        this.selectedBox = box;
                        this.selectedBox.cursor = get3DCoord(e)
                    }else {
                        var box = app.cur_frame.potential_bounding_boxes[0]
                        this.isResizing = true;
                        this.isRotating=false;
                        
                        this.selectedBox = box;
                        this.selectedBox.draggingIdx = closestIdx;
                        this.selectedBox.anchorIdx = getOppositeCorner(closestIdx);
                        
                    }
                    
                // moving box
                } else if (this.hoverBoxes.length >= 1) {
                    this.isRotating=false;
                   
                    this.isMoving = true;
                    this.selectedBox = this.hoverBoxes[0];
                    this.selectedBox.cursor = get3DCoord(e)
               
        
                } 
            }

           

        }
        
      

      
    }




   
    handleMouseMove(e){
        var cursor = getCurrentPosition();
        
        if(this.handleMoving){
            var temp = new THREE.Vector3(mouse2D.x, mouse2D.y,  0);
            temp.unproject( camera );
            if(this.handleSelected.name == 'translation-y'){
   
                app.cur_frame.potential_bounding_boxes[0].translateByHandle(temp, app.cur_frame.potential_bounding_boxes[0].handles)
            }else if(this.handleSelected.name.slice(0,5) == 'scale'){

                var selected_handles = []

                var k = 0
                selected_handles.push(app.cur_frame.potential_bounding_boxes[0].handles[0])
                selected_handles.push(this.handleSelected)
                selected_handles.push(app.cur_frame.potential_bounding_boxes[0].handles[3])
           
                app.cur_frame.potential_bounding_boxes[0].scaleByHandle(temp, this.handleSelected.name, selected_handles)
            }
            
            return
        }

        if(app.globalViewMode == "orthographic"){

            if(!this.isRotating && !this.isMoving){
                this.highlightCorners(e);
                this.updateHoverBoxes2(e);
            }
            
            
        }else if(app.globalViewMode == "perspective"){
            this.updateHandleSelection(e);
        }

        if (this.modifyBoxMode && this.selectedBox && this.selectedBox.modifiable){
   
            var cursor = get3DCoord(e);

            if (this.isResizing) {
                this.selectedBox.resize(cursor);
            } 
            if (this.isMoving) {
                this.selectedBox.translate(cursor);
			   
            }

            if(this.isRotating){
                this.selectedBox.rotate(cursor);
            }
            
      
        }
        
    }


    handleKeyDown(e){
      
        var keyID = e.keyCode;
       
        switch(keyID)
        {
            
    
            case 66: // b key
                this.autoDrawModeToggle(true);
                break;

            case 67: // c key
                this.reset();
                break;
    
            case 82: // r key
                this.modifyBoxModeToggle(true);
                controls.enabled = false;
                controls.update();
                break;
    
            default:
                break;
        }
    }

    handleKeyUp(e){
        var keyID = e.keyCode;
        switch(keyID)
        {
            case 66:
            
            break;
    
            case 82: // r key
            this.modifyBoxModeToggle(false);
            controls.enabled = true;
            controls.update();
            break;
    
            default:
        
        }
    }

    handleSubmit(){

        app.cur_frame.recordPCHistory()

        var box, addedPointsIndices;
        var instance_id = -1
        var new_instance = false;
        
        var boxClass = $("#classSelector :selected").val()
        if($("#instanceSelector")[0].checked){
            instance_id = app.cur_frame.create_new_instance_id(parseInt(app.class_order[boxClass]))
            new_instance = true;
        }else if($("#instanceChoice")[0]){
            if($("#instanceChoice")[0].value != "None" || !$("#instanceChoice")[0].value){
                instance_id = parseInt($("#instanceChoice")[0].value)
            }
    
           
        }else{
            instance_id = -1
        }

        
    
       
       
        box = app.cur_frame.potential_bounding_boxes[0];
        box.box_class = boxClass
        box.instance_id = instance_id
        box.id = boxClass + ":" + instance_id



        addedPointsIndices = box.get_points_in_box();

        app.addPoints(boxClass, instance_id, addedPointsIndices, new_instance=new_instance);

   
        addBoxRow(boxClass, instance_id)

    
      

        if(app.subPC){
            var subType = $($("#associated-pointclouds-table td div[selected]")).text()

            box.subType = subType
        }else{

            console.log(box.YAngle)
            box.origStats = {"vertices":box.geometry.clone(), "min":box.boundingBox.min.clone(), "max":box.boundingBox.max.clone(), "YAngle":box.YAngle}
        }

      
        
        
        if(instance_id != -1){
            app.cur_frame.bounding_boxes.push(box)
            
        }

       
    
        submitBuilder.hideSubmitPanel();
        $('#extrasBox').css({'display':'none'});
        this.potBBMode = true;
        clearScenePotentialBB()
        app.cur_frame.potential_bounding_boxes = [];
        console.log(app.cur_frame)
        this.reset()
    }

    reset(){
        this.mouseDown = false;
        this.isMoving = false;
        this.isResizing = false;
        this.isRotating = false;
        this.selectedBox = null;
        this.potBBMode = true;
        this.modifyBoxMode = false;
        this.autoDrawMode = false;
        this.hoverBoxes = [];
        this.hoverBox = null;
        
  
        $('#extrasBox').css({'display':'none'})
        
        submitBuilder.hideSubmitPanel();

        controls.enabled = true;
        controls.update();
        
        repopulateSceneBB();
    }

    
    

    handleManualDraw(event){
        var clicked = get3DCoord(event)

        console.log(clicked)
        if (clicked){
            var corner1 = new THREE.Vector3(clicked['x'] + 1,
             1,
            clicked['z'] + 1)

            var corner2 = new THREE.Vector3(clicked['x'] - 1,
                         - 1,
                        clicked['z'] - 1)

            var box = createAndDrawBox(corner1, 
                    corner2, 
                    0);

            box.createTranslationHandle()
            box.createScaleHandles()

            box.createFrontFace()

            this.selectedBox = box
            app.cur_frame.potential_bounding_boxes.push(box);
            submitBuilder.buildSubmitPanel(['classSelector', 'instanceCont'], {}, true);
            this.potBBMode = false;
            $('#extrasBox').css({'display':'block'})
        }
      
    }

    autoDrawModeToggle(b){
        
        this.autoDrawMode = b;
        if(!b){
            this.reset()
        }
        
        
    }

    modifyBoxModeToggle(b) {
        this.modifyBoxMode = b;
        if(b){
            controls.enabled = false;
            controls.update();
        }else{
            controls.enabled = true;
            controls.update();
        }
    }

    updateHandleSelection(e){
        var mouse = {}
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        var vector = new THREE.Vector2()
        vector.set( mouse.x, mouse.y );
        var raycaster = new THREE.Raycaster()
        
        raycaster.setFromCamera( vector, camera );	
    
        var intersects;
        
        if(app.cur_frame.potential_bounding_boxes.length > 0){
            intersects = raycaster.intersectObjects(app.cur_frame.potential_bounding_boxes[0].handles, true);

        
         
            
            if(intersects.length > 0){

                var handle = intersects[0].object

                if(handle.name != "front-side"){
                    var color = new THREE.Color( 1,0,0 )
                
                    handle.material.color = color
                    this.handleSelected = handle
                }
               
                    
                
                
            }else{
               
                if(this.handleSelected){
                    
                    var color = new THREE.Color( 0,1,0 )

                    for(let handle of app.cur_frame.potential_bounding_boxes[0].handles){
  
                        for(let child of handle.children){
                            child.material.color = color
                            for(let child2 of child.children){
                                child2.material.color = color;
                            }
                        }
                        
                        
                    }
                    
                    this.handleSelected= false
                
                }
            }
        }

       
    }

    

    updateHoverBoxes2(e){

        var mouse = {}
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        var vector = new THREE.Vector2()
        vector.set( mouse.x, mouse.y );
        var raycaster = new THREE.Raycaster()
        
        raycaster.setFromCamera( vector, camera );	
    
        var intersects;
        let box = app.cur_frame.potential_bounding_boxes[0]

        if(box){
            
            intersects = raycaster.intersectObjects([box.boxHelper] , true);
            
    

          
            if(intersects && intersects.length > 0){
                this.hoverBoxes.push(box);
                box.changeBoundingBoxColor(hover_color.clone())
                
            }else{
                box.changeBoundingBoxColor(default_color.clone())
                this.hoverBoxes = []
            }
        }
        
     

    }



   

    highlightCorners() {
        // get closest intersection with cursor
        var intersection = this.intersectWithCorner();
        
       
        if (intersection) {
            // get closest point and its respective box
            var box = intersection[0];
            var p = intersection[1];
    
            // get index of closest point
            var closestIdx = closestPoint(p, box.geometry.vertices);

            
    
            // if there was a previously hovered box, change its color back to red
            if (this.hoverBox) {
                // hoverBox.changePointColor(hoverIdx, new THREE.Color(7, 0, 0));
                this.hoverBox.changePointColor(this.hoverBox.hoverIdx, hover_color.clone());
            }
    
            // update hover box
            this.hoverBox = box;
            this.hoverBox.hoverIdx = closestIdx;
            // hoverBox.changePointColor(hoverIdx, new THREE.Color(0, 0, 7));
            this.hoverBox.changePointColor(this.hoverBox.hoverIdx, selected_color.clone());
    
        } else {
    
            // change color of previously hovered box back to red
            if (this.hoverBox) {
                // hoverBox.changePointColor(hoverIdx, new THREE.Color(7, 0, 0));

                for(var i=0;i<11;i++){
                    this.hoverBox.changePointColor(i, hover_color.clone());
                }
                
            }
    
            // set hover box to null since there is no intersection
            this.hoverBox = null;
        }
    }



    intersectWithCorner() {
        var boundingBoxes = app.cur_frame.bounding_boxes;
        if (activeToolStr == 'boundingBox3D'){
            boundingBoxes = app.cur_frame.potential_bounding_boxes;
        }
        if (boundingBoxes.length == 0) {
            return null;
        }
        var closestBox = null;
        var closestCorner = null;
        var closestIdx = null;
        var shortestDistance = Number.POSITIVE_INFINITY;
       
        for (var i = 0; i < boundingBoxes.length; i++) {
            
            var b = boundingBoxes[i];
            var intersection = this.getIntersection(b);
            if (intersection) {
                if (intersection.distance < shortestDistance) {
                    closestBox = b;
                    closestCorner = intersection.point;
                    shortestDistance = intersection.distance;
                    closestIdx = i;
                }
            }
        }
        if (closestCorner) {
            return [closestBox, closestCorner, closestIdx];
        } else {
            return null;
        }
    }

    getIntersection(b) {
        var btop = b.geometry.vertices[0].y
        var temp = new THREE.Vector3(mouse2D.x, mouse2D.y, btop);
        temp.unproject( camera );
        var dir = temp.sub( camera.position ).normalize();
        var distance = - camera.position.y / dir.y;
        var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
        var shortestDistance = Number.POSITIVE_INFINITY;
        var closestCorner = null;
        var bottom_plane = [5, 8, 1, 9]
        for (var i = 0; i < b.geometry.vertices.length; i++) {
            if(bottom_plane.includes(i)){
                continue
            }
            if (distance2D(pos, b.geometry.vertices[i]) < shortestDistance &&
                distance2D(pos, b.geometry.vertices[i]) < b.get_cursor_distance_threshold()) {
                shortestDistance = distance2D(pos, b.geometry.vertices[i]);
                closestCorner = b.geometry.vertices[i];
            }
        }
        if (closestCorner == null) {
            return null;
        }
        return {distance: shortestDistance, point: closestCorner};
    }
    
}



