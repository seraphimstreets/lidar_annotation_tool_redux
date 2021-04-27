class ImagePanel{

    constructor(){

        this.imageInfo = null;
        this.realInfo = null;
        this.tempInfo = null;
        this.zoomInfo = null;
        this.scaleFactor = 1;
        this.imageWidth = null;
        this.imageHeight = null;
        this.cameraMarker = null;

        this.origWidth;
        this.origHeight;
        this.targetWidth;
        this.isLoaded = false;

        
 
    }

    init(){
        if(!this.imageInfo){
            var img = $('#frameImage')[0]
            console.log(img)
            var cvs = document.getElementById("imgCanvas");
            cvs.width = img.width;
            cvs.height = img.height;
            
            this.imageInfo = {
                width: img.width,
                height: img.height,
                context: cvs.getContext("2d"),
                data:cvs.getContext("2d").getImageData(0, 0, img.width, img.height).data
            };

            cvs.getContext("2d").imageSmoothingEnabled = false

            var cvs = document.getElementById("paintCanvas");
            cvs.getContext("2d").imageSmoothingEnabled = false

    
        }

        var cvs = document.getElementById("realCanvas");
        this.realInfo = {
            width: this.origWidth,
            height: this.origHeight,
            context: cvs.getContext("2d"),
            data:cvs.getContext("2d").createImageData(this.origWidth, this.origHeight).data
        }

        


    }

    updateSize(scaleFactor) {

        
        var img = $('#maskImage')[0]

        var cvs = document.getElementById("imgCanvas");
        
        cvs.width = img.width;
        cvs.height = img.height;


        this.imageInfo = {
            width: img.width,
            height: img.height,
            context: cvs.getContext("2d"),
            data:cvs.getContext("2d").getImageData(0, 0, img.width, img.height).data
        };
  
        this.imageWidth = img.width
        this.imageHeight = img.height
        
        this.scaleFactor = scaleFactor;

        this.clearSelectCanvas()

        var cvs = document.getElementById("paintCanvas");

        


        
        cvs.width = img.width;
        cvs.height = img.height;

  

        $("#imgDisplay").css({width:img.width, height:img.height})

        

  
        if(activeToolStr == 'poly2D'){
            activeTool.emptyPoints();

        }


    }

    getMousePosition(e) {
        
        var p = $(e.target).offset(),
            x = Math.round((e.clientX || e.pageX) - p.left),
            y = Math.round((e.clientY || e.pageY) - p.top);
        return { x: x, y: y };
    }

    getZoomMousePosition(e) {
        var p = $("#zoomCanvas").offset(),
            x = Math.round((e.clientX || e.pageX) - p.left),
            y = Math.round((e.clientY || e.pageY) - p.top);
        return { x: x, y: y };
    }

    updateImageData(){
        var img = $('#frameImage')[0]

        var cvs = document.getElementById("imgCanvas");
        

        cvs.getContext("2d").drawImage(img, 0, 0, img.width, img.height);

   
      
        imagePanel.imageInfo.data = cvs.getContext("2d").getImageData(0, 0, img.width, img.height).data
        imagePanel.clearSelectCanvas();
    }

    

    getCursorPos(e) {
        var a, x = 0, y = 0;
        e = e || window.event;
        /* Get the x and y positions of the image: */
        a = img.getBoundingClientRect();
        /* Calculate the cursor's x and y coordinates, relative to the image: */
        x = e.pageX - a.left;
        y = e.pageY - a.top;
        /* Consider any page scrolling: */
        x = x - window.pageXOffset;
        y = y - window.pageYOffset;
        return {x : x, y : y};
      }

    drawPoint(x, y, color="#FF0000"){
        var ps = 1
        this.imageInfo.context.fillStyle = color
        this.imageInfo.context.fillRect(x,y,ps,ps)
    }

    highlightInstance(classification, instance_id){
        var instancePixs = this.getInstancePixels(classification, instance_id)
        var color = app.class_colors[app.class_order[classification]]
       
        $.ajax({
			url: '/highlightInstance',
            data: JSON.stringify({'instancePixs':instancePixs, 'color':color,
             "baseImage":app.cur_frame.cur_image.baseImage, "fname":app.cur_frame.fname,
            "classification":classification, "instance_id":instance_id}),
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {
                var res = response.split("\'").join("\"");
			
				$('#maskImage').attr({'src':res})
		
			},
			error: function(error) {
				console.log(error);
			}
        });
    }

    getInstancePixels(classification, instance_id){
        classification = app.class_order[classification]
        var classes = app.cur_frame.cur_image.pixelClass;
        var instances = app.cur_frame.cur_image.pixelInst;
        var numPixels = this.origWidth*this.origHeight
        var instancePixs = [];
        instance_id = parseInt(instance_id)
        classification = parseInt(classification)
        for(i=0;i<numPixels;i++){
            if(classes[i] == classification & instances[i] == instance_id){
                instancePixs.push(i)
            }

        }
       

        return instancePixs
    }

   

   


    applyPolygonsPointcloud(raw_poly, poly, class_str, instance_id, new_instance=false, applyPointcloud=false, onlyClass=-2, brightnessThresh=false){

        var classification = app.class_order[class_str];

        this.formRealCanvas(poly, classification);
        
    
        if(new_instance){
        
            addImageObjectRow(class_str, instance_id)
        }


        app.cur_frame.cur_image.updatePixelStore(classification, instance_id, new_instance, onlyClass, brightnessThresh)

        console.log(app.cur_frame.cur_image.pixelInst)
        $.ajax({
			url: '/saveImage',
            data: JSON.stringify({'pixelClass':app.cur_frame.cur_image.pixelClass, 'pixelInst':app.cur_frame.cur_image.pixelInst, 
            'classColors':app.class_colors, 'classOrder': app.class_order, 'fname':app.cur_frame.fname,
             'imageInstanceCounter':app.cur_frame.cur_image.imageInstanceCounter, 'baseImage':app.cur_frame.cur_image.baseImage}),
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {

                
                
                app.load_frame_image(app.cur_frame.cur_image.baseImage);

                
			},
			error: function(error) {
				console.log(error);
			}
        });
        

        
        

        
        if(applyPointcloud){

            var [cp, look_at] = this.getImageCP()
            var transform =  this.getImageTransform()

            app.cur_frame.recordPCHistory()
            $.ajax({
                url: '/projImage2Pointcloud',
                data: JSON.stringify({outerVertices:poly, cp:cp, look_at:look_at, transform:transform}),
                type: 'POST',
                contentType: 'application/json;charset=UTF-8',
                success: function(response) {
                    
                    var pcoords = parsePythonJSON(response)["pts_3d"]
                  
                   
                    var pts = [];

                    var cameraDir = camera.getWorldDirection() // create once and reuse it!
                    var cameraPos = camera.position
                
                 
                    console.log(cameraDir)
                    console.log(camera.position)
                    
                    var vex, v1, v2;
                    for(i=0;i<pcoords[0].length;i++){

                        var cp, look_at
                        [cp, look_at] = imagePanel.getImageCP();
                        var normal = new THREE.Vector3(look_at[0], look_at[1], look_at[2]).sub(new THREE.Vector3(cp[0], cp[1], cp[2]));
                        
                        
                        vex = new THREE.Vector3(pcoords[0][i], pcoords[1][i], pcoords[2][i])
                        vex = vex.applyAxisAngle(new THREE.Vector3(0,0,1), -Math.PI/2)
                        vex = vex.applyAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2)

                        vex.x += cp[0]
                        vex.y += cp[1]
                        vex.z += cp[2]

                        var quaternion = new THREE.Quaternion(); // create one and reuse it
                       
                        v1 =  new THREE.Vector3(look_at[0],look_at[1],look_at[2])
                            
                        v2 = new THREE.Vector3(cp[0],cp[1],cp[2])
                            
                        quaternion.setFromUnitVectors( v2, v1 );

                        var euler = new THREE.Euler()
                  
                        euler.setFromQuaternion(quaternion.normalize())
                       
                    

                        vex.applyAxisAngle(new THREE.Vector3(0,1,0), -euler.z)

            
                 

         

                        pts.push(vex)
                    }
                    
                    // this.drawPolygonLOL(pts)
          
                    instance_id = -1;
                    
                    var addedIndices = poly3dTool.getPointsInPoly(pts, true)
           
                    app.addPoints(class_str, instance_id, addedIndices);
            
                    activeTool.reset();
                   
                   
              
                },
                error: function(error) {
                    console.log(error);
                }
            });
            console.timeEnd('projImage2Pointcloud')
        }else{
            activeTool.reset();
        }
        
    }
       

    clearSelectCanvas(){
        var img = $('#frameImage')[0]
        var w = img.width ,
            h = img.height;
        
 
        this.imageInfo.context.clearRect(0, 0, w, h);
        var cvs = document.getElementById("imgCanvas");
    
        cvs.getContext("2d").clearRect(0, 0, cvs.width, cvs.height);
    }

    clearRealCanvas(){
        var img = $('#frameImage')[0]
        var w = img.width ,
            h = img.height;
        
 
        this.realInfo.context.clearRect(0, 0, w, h);
        var cvs = document.getElementById("realCanvas");
    
        cvs.getContext("2d").clearRect(0, 0, cvs.width, cvs.height);
    }

    
  


    trace(cs, color='#0703fc', width=1, ctx=this.imageInfo.context){

      
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
      
        if(cs){
            ctx.moveTo(cs[0][0], cs[0][1]);
        

            for (var i = 1; i < cs.length; i++) {
            
                ctx.lineTo(cs[i][0], cs[i][1]);
            
            }
        
        
        }

     
        ctx.stroke();
        
    }

    traceAndFill(ctx, cs, color) {

        if(cs.length == 2){
            return;
        }

        ctx.beginPath();
        ctx.moveTo(cs[0][0], cs[0][1]);
        

        for (var i = 1; i < cs.length-1; i++) {
           
            ctx.lineTo(cs[i][0], cs[i][1]);
        
        }

        
    
        ctx.closePath();
   
     
        ctx.fillStyle = color;
        ctx.fill();
        
    
    }

    updatePanel(origColor, newColor){
       
        var width = this.origWidth;
        var height = this.origHeight;
        

        var img = $('#realImage')[0]
        var cvs = document.getElementById("realCanvas")
        cvs.getContext("2d").drawImage(img, 0, 0, img.width, img.height)
        var ctx = cvs.getContext("2d")
        var imageData = ctx.getImageData(0, 0, width, height)
        var data = imageData.data;
        

        
    
        for(var x=0;x<width;x++){
            for(var y=0;y<height;y++){
                var index = (x + y * width) * 4;

                if(data[index+0]== origColor[0] && data[index+1]== origColor[1] && data[index+2]== origColor[2] && data[index+3]== origColor[3]){
                    data[index+0] = newColor[0]
                    data[index+1] = newColor[1]
                    data[index+2] = newColor[2]
                    data[index+3] = newColor[3]
                }
            }
        }

        ctx.putImageData(imageData, 0, 0)

        imagePanel.realInfo.data = cvs.getContext("2d").getImageData(0, 0,
            img.width, img.height).data
    }




    formRealCanvas(resizedPoly, classification){
        
        var cvs = document.getElementById("realCanvas")
        var img = $('#realImage')[0]

        cvs.getContext('2d').clearRect(0,0,cvs.width, cvs.height)
        cvs.getContext("2d").createImageData( this.origWidth,this.origHeight)

      
       
        var clr = app.class_colors[classification]

        this.traceAndFill(imagePanel.realInfo.context, resizedPoly,clr)
        imagePanel.realInfo.data = cvs.getContext("2d").getImageData(0, 0,
            this.origWidth, this.origHeight).data
    }

    getResizedPolygon(vertices){
      
        var normVertices = [];

        var v;
        
        for(var j=0;j<vertices.length;j++){
            v = vertices[j]
            normVertices.push([v[0] / this.scaleFactor, v[1] / this.scaleFactor])
    
        }
            
        return normVertices;
      
    }

    getImageCP(){
        var accum_object = app.cur_frame.accum_object
        console.log(accum_object)
        var idx = accum_object['image_names'].indexOf(app.cur_frame.activeImage)
        var cp = accum_object['camera_positions'][idx]
        var look_at = accum_object['look_ats'][idx]


        return [cp, look_at]
    }

    getImageTransform(){
        var accum_object = app.cur_frame.accum_object
        console.log(accum_object)
        var idx = accum_object['image_names'].indexOf(app.cur_frame.activeImage)
        var vt = accum_object['velo_transforms'][idx]

        return vt
    }

    createCameraMarker(){

        var accum_object = app.cur_frame.accum_object
        console.log(accum_object)
        var idx = accum_object['image_names'].indexOf(app.cur_frame.activeImage)
        var cp = accum_object['camera_positions'][idx]

        var dotGeometry = new THREE.Geometry();
        var dotMaterial = new THREE.PointsMaterial( { size: 3, sizeAttenuation: false, color:"#FF0000" } );
        dotGeometry.vertices = [new THREE.Vector3(cp[1], cp[2],  cp[0])]
        this.cameraMarker = new THREE.Points( dotGeometry, dotMaterial );
        scene.add(this.cameraMarker)

    }

    removeCameraMarker(){
        if(this.cameraMarker){
            scene.remove(this.cameraMarker)
            this.cameraMarker = null
        }
    }

    drawMaskOnCanvas(){

        var img = $("#maskImage")[0]
        var cvs = $('#imgCanvas')[0]
        var iw = $(img).css('width')
        var iw = parseInt(iw.slice(0, iw.length - 2))
        var ih  = $(img).css('height')
        var ih  = parseInt(ih.slice(0, ih.length - 2))


        console.log(iw)

        cvs.getContext("2d").drawImage(img, 0, 0, iw, ih);

        

    }

    drawPolygonLOL(pts){
        console.log(pts)
        var geometry = new THREE.BufferGeometry().setFromPoints(pts);
        var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        
        
        var newPoly = new THREE.Line( geometry, material );
        scene.add( newPoly );
    }
    






}