

class Polygon3DTool extends GenericTool {

    constructor() {
        super()
        this.vertices = [];
        
        this.lines = []
        this.lastVertex = null;
        this.polygonDrawing = false;
        this.allowNewPoints = false;
        
        this.vertexP = null;
        this.polygon = null;
    }

    init(){
        return
    }

    handleMouseDown(e){
        if(this.polygonDrawing && this.allowNewPoints){

            var cursor = getCurrentPosition()
         

            if(this.vertices.length == 0){
                this.initializePoly()
              
            }

            this.vertices.push(cursor)
            this.lastVertex = cursor;

            this.drawPoints()
            this.drawPoly()
            
           
            
        }
    }

    handleMouseUp(e){
        return
    }

    handleMouseMove(e){
        if(this.polygonDrawing && this.allowNewPoints){
            if(this.polygon){
                var cursor = getCurrentPosition();
                this.vertices.push(cursor);
                this.drawPoly();
                this.vertices.pop(cursor);
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
                this.toggleAllowNewPoints(true)
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
                this.toggleAllowNewPoints(false)
                break;
            
            default:
                break;
        }
    }

    handleSubmit(){

        app.cur_frame.recordPCHistory()

        app.toggleStatusText(true)
        
        var addedPointsIndices, classification, instance_id
        var new_instance = false;
        console.log(app.cur_frame.instance_counter)
        classification = $("#classSelector :selected").val()
        var onlyClass = $("#onlyClassSelector :selected").val()

        if(onlyClass == 'All'){
            onlyClass = -2
        }else{
            onlyClass = app.class_order[onlyClass]
        }
        

        addedPointsIndices = this.getPointsInPoly(this.vertices, false);
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

        var newAddedPointsIndices = []

        if(onlyClass != -2){
            var pointClasses = app.cur_frame.class_tracker;
            for(var i=0;i<addedPointsIndices.length;i++){
                var idx = addedPointsIndices[i]
                if(pointClasses[idx] == onlyClass){
                    newAddedPointsIndices.push(idx)
                }
            }
        }else{
            newAddedPointsIndices = addedPointsIndices
        }

        app.addPoints(classification, instance_id, newAddedPointsIndices,new_instance=new_instance);
        this.togglePolyDraw()
        app.toggleStatusText(false)
    }
  
    reset(){
        this.vertices = [];
        this.lastVertex = null;
        this.polygonDrawing = false;
        scene.remove(this.polygon)
        scene.remove(this.vertexP)
        this.polygon = null;  
        this.vertexP = null;
        submitBuilder.hideSubmitPanel();
        controls.enabled = true;
        controls.update()

    }

    initializePoly(){
        var geometry = new THREE.BufferGeometry();
        var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        var newPoly = new THREE.Line( geometry, material );
        scene.add( newPoly );
        this.polygon = newPoly;
    }

    togglePolyDraw(){
        if(this.polygonDrawing){
            this.polygonDrawing = false;
            this.clearPoly();
            submitBuilder.hideSubmitPanel();
            controls.enabled = true;
            controls.update()
        }else{
            this.polygonDrawing = true;

        
        

            submitBuilder.buildSubmitPanel(['classSelector', 'instanceCont', 'onlyClassSelector'], {},  true);
            controls.enabled = false;
            controls.update()
        }

    }

    toggleAllowNewPoints(b){
        if(!b){
            this.allowNewPoints = false;
            if(this.vertices.length < 3){
                this.togglePolyDraw()
            }else{
                this.drawPoly();
            }
            
        }else{
            this.allowNewPoints = true;
        }
    }


    drawPoints(){
        var dotGeometry = new THREE.Geometry();
        var dotMaterial = new THREE.PointsMaterial( { size: 3, sizeAttenuation: false, color:"#FF0000" } );
        dotGeometry.vertices = this.vertices;
        var points = new THREE.Points( dotGeometry, dotMaterial );

        if(this.vertexP){
            scene.remove(this.vertexP)
        }
        scene.add(points)
        this.vertexP = points;
       
    }

    drawPoly(){
        var points;
        points = []
        for(i=0;i<this.vertices.length;i++){
            points.push(this.vertices[i])
        }

        this.polygon.geometry.setFromPoints(points);
       
        this.polygon.geometry.verticesNeedUpdate = true;
      
    }

    clearPoly(){
        this.vertices = [];
        this.lastVertex = null;
        this.polygonDrawing = false;
        scene.remove(this.polygon)
        scene.remove(this.vertexP)
        this.polygon = null;  
        this.vertexP = null
    }

    getPointsInPoly(polyVerts, removeZ=false){
        var v, pt;

        var origPoints = app.cur_pointcloud.geometry.clone();
        
        origPoints = origPoints.vertices;

        camera.updateMatrixWorld();
        var cscreen = camera.position.clone();

        var polyPoints = []
        for(i=0;i<polyVerts.length;i++){
            v = pointToScreen(polyVerts[i])
            polyPoints.push([v.x, v.y])
        }
        
        var addedIndices = []

        for(i=0;i<origPoints.length;i++){
            pt = origPoints[i]
            if ( removeZ && (pt.z < cscreen.z)){
                continue
            }
        
            pt = pointToScreen(pt)
            
            pt = [pt.x, pt.y]
            if(this.checkPointInPolygon(pt, polyPoints)){
                addedIndices.push(i)
            }
            
        }
        
        

        return addedIndices

    }

    checkPointInPolygon(point, vs) {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
        
        var x = point[0], y = point[1];
        
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];
            
            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    };

    
    
    

  }