function Box(anchor, cursor, angle, boundingBox, boxHelper, loadBoxPoints=false) {


    this.id = null; // id (int) of Box
    this.box_class = "Default"; // object id (string)
    // this.instance_id = -1; 
    this.color = hover_color.clone(); // color of corner points
    this.YAngle = angle; // orientation of bounding box
    this.XAngle = 0;
    this.ZAngle = 0;
 
    this.cursor = getCenter(anchor.clone(), cursor.clone()); // cursor
    this.added = false; // (boolean) whether the box has been added to boundingboxes
    this.boundingBox = boundingBox; // Box3; sets the size of the box
    this.boxHelper = boxHelper; // BoxHelper; helps visualize the box
    this.geometry = new THREE.Geometry(); // geometry for corner/rotating points
    this.draggingIdx = null;
    this.hoverIdx = null;
  

    this.text_label = null;
    this.modifiable = true;
    var pointMaterial = new THREE.PointsMaterial( { size: 8, sizeAttenuation: false, vertexColors: THREE.VertexColors } );
    this.points = new THREE.Points( this.geometry, pointMaterial );
    this.points.renderOrder = 999

    this.boundingBox.name = "boundBox"
    this.geometry.name = "potBox"
    this.boxHelper.name = "boxHelp"
    this.points.name = "name"


    this.handlePos = null;

    this.handles = []
  
    this.subType = "ALL"
    
   
    this.colors = []; // colors of the corner points
    GREEN_COLOR = new THREE.Color(0,1,0)

    // add colors to points geometry
    for (var i = 0; i < 11; i++) {
        this.colors.push( this.color.clone().multiplyScalar( 7 ) );
    }

  
    
    this.geometry.colors = this.colors;
    this.dragStart = null;

    

    if(loadBoxPoints){

        console.log(loadBoxPoints)
        allPoints = loadBoxPoints.all_points
        for(i=0;i<allPoints.length;i++){
            pt = allPoints[i];
            this.geometry.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]));
        }
        this.geometry.computeBoundingBox()

       
        this.box_class =  loadBoxPoints.box_class
     
        // this.instance_id = loadBoxPoints.instance_id 
    

        this.id = loadBoxPoints.box_id;
        this.modifiable=false;
        this.subType = loadBoxPoints.subType

        
        this.origStats = {
            "vertices": this.geometry.clone(),
            "boxMin":loadBoxPoints.boxMin,
            "boxMax":loadBoxPoints.boxMax,
            "YAngle":loadBoxPoints.YAngle
        }


        
        
    }else{
        var topRight = anchor.clone()
        var bottomLeft = cursor.clone()
        var bottomCenter = getCenter(anchor.clone(), cursor.clone())
        bottomCenter.y = -1
    
        var topCenter = bottomCenter.clone()
        topCenter.y = 1
    
        var topLeft = bottomLeft.clone()
        topLeft.y = topRight.y
    
        var bottomRight = topRight.clone()
        bottomRight.y = bottomLeft.y
    
        var t2 = topCenter.clone()
        t2.x = topRight.x
        t2.z = topLeft.z
    
        var t4 = topCenter.clone()
        t4.x = topLeft.x
        t4.z = topRight.z
    
        var b2 = bottomCenter.clone()
        b2.x = bottomRight.x
        b2.z = bottomLeft.z
    
        var b4 = bottomCenter.clone()
        b4.x = bottomLeft.x
        b4.z = bottomRight.z

        var rotatePt = getCenter(topLeft, t2);

        
        
    

        this.geometry.vertices.push(topRight); //max
        this.geometry.vertices.push(bottomLeft); //min
    
        this.geometry.vertices.push(bottomCenter);
        this.geometry.vertices.push(topCenter);
    
        this.geometry.vertices.push(topLeft);
        this.geometry.vertices.push(bottomRight);
    
        this.geometry.vertices.push(t2);
        this.geometry.vertices.push(t4);
    
        this.geometry.vertices.push(b2);
        this.geometry.vertices.push(b4);

        this.geometry.vertices.push(rotatePt)
    
       
        
        this.geometry.computeBoundingBox()

       
       
        
    }

    

  
    this.hasPredictedLabel = false;

    this.createRotationHandle = function(){
        let adjust = 0.5;
		let torusGeometry = new THREE.TorusGeometry(1, adjust * 0.06, 8, 64, Math.PI / 2);
		let outlineGeometry = new THREE.TorusGeometry(1, adjust * 0.04, 8, 64, Math.PI / 2);
		let pickGeometry = new THREE.TorusGeometry(1, adjust * 0.1, 6, 4, Math.PI / 2);
        var center = getCenter(this.geometry.vertices[0], this.geometry.vertices[1]).clone()
        var node = new THREE.Object3D()
        node.position.set(center.x, center.y, center.z)


  

        let material = new THREE.MeshBasicMaterial({
            color: 'green',
            opacity: 0.4,
            transparent: true});

        let outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, 
            side: THREE.BackSide,
            opacity: 0.4,
            transparent: true});

        let pickMaterial = new THREE.MeshNormalMaterial({
            opacity: 0,

            transparent: true,
            visible: true
        });

        let box = new THREE.Mesh(torusGeometry, material);
        box.name = 'rotation-y';
        box.scale.set(2, 2, 2);
        var kara = new THREE.Vector3(0, 1, 0)
        box.lookAt(kara);
        node.add(box);
 

        let outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outline.name = 'rotation-y';
        outline.scale.set(1, 1, 1);
        outline.renderOrder = 0;
        box.add(outline);

        let pickVolume = new THREE.Mesh(pickGeometry, pickMaterial);
        pickVolume.name = 'rotation-y';
        pickVolume.scale.set(1, 1, 1);

        box.add(pickVolume);

        scene.add(node)
        this.handles.push(node)
    }

    this.createFrontFace = function(){
        let sgPlane = new THREE.PlaneGeometry(4, 4, 1, 1);

        let node = new THREE.Object3D()

		let texture = new THREE.TextureLoader().load(`static\\resources\\eye_2.png`);


	
		
		var center = getCenter(this.geometry.vertices[1], this.geometry.vertices[6]).clone()
    
        node.lookAt(new THREE.Vector3(0,0,1));


        node.position.set(center.x, center.y, center.z)
        node.rotation.y = this.YAngle;


	
        let material = new THREE.MeshBasicMaterial({
            color: 'green',
            opacity: 0.8,
            transparent: true,
            map:texture,
            side: THREE.DoubleSide,
        });



        let box = new THREE.Mesh(sgPlane, material);
        box.name = `handle`;
        box.scale.set(0.1, 0.1, 0.1);
        box.position.set(0, 0, 0);
        box.visible = true;
        node.add(box);


        scene.add(node);
        node.name = 'front-side'
        this.handles.push(node)
        
       

		
    }

    

    this.createTranslationHandle = function(){
        let boxGeometry = new THREE.BoxGeometry(2, 2, 2);
        var node = new THREE.Object3D()
        var center = getCenter(this.geometry.vertices[0], this.geometry.vertices[1]).clone()
  
        node.position.set(center.x, center.y, center.z)
        
        let material = new THREE.MeshBasicMaterial({
            color: 'green',
            opacity: 0.4,
            transparent: true
            });
    
        let outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, 
            side: THREE.BackSide,
            opacity: 0.4,
            transparent:true
            });
    
        let pickMaterial = new THREE.MeshNormalMaterial({
            opacity: 0.2,
            transparent:true,
            visible: true
        });
    
        let box = new THREE.Mesh(boxGeometry, material);
        box.name = 'translation-y';
        box.scale.set(0.02, 0.02, 2);
        var kara = new THREE.Vector3(0,1,0)
        
        box.lookAt(kara);
        box.renderOrder = 10;
        node.add(box);
        // handle.translateNode = box;
    
        let outline = new THREE.Mesh(boxGeometry, outlineMaterial);
        outline.name = `outline`;
        outline.scale.set(1, 1, 1.03);
        outline.renderOrder = 0;
        box.add(outline);
    
        let pickVolume = new THREE.Mesh(boxGeometry, pickMaterial);
        pickVolume.name = `pick_volume`;
        pickVolume.scale.set(1, 1, 1.1);
     
        box.add(pickVolume);
    
        scene.add(node)
        node.name = "translation-y"

        this.handles.push(node)
    }

  

    this.createScaleHandles = function(){

        var alignments = [[+0, +1, +0, 'scale-y+'], [+0, -1, +0, 'scale-y-']]

        var center = getCenter(this.geometry.vertices[0], this.geometry.vertices[1]).clone()
       
        for(let alignment of alignments){
			
			let node = new THREE.Object3D();

            let sgSphere = new THREE.SphereGeometry(1, 32, 32);
		    let sgLowPolySphere = new THREE.SphereGeometry(1, 16, 16);

            var pos = [center.x + alignment[0], center.y + alignment[1], center.z + alignment[2]]

			
			node.position.set(pos[0], pos[1], pos[2])

			let material = new THREE.MeshBasicMaterial({
				color: 'green',
				opacity: 0.4,
				transparent: true
				});

			let outlineMaterial = new THREE.MeshBasicMaterial({
				color: 0x000000, 
				side: THREE.BackSide,
				opacity: 0.4,
				transparent: true});

			let pickMaterial = new THREE.MeshNormalMaterial({
				opacity: 0.2,
				transparent: true,
				visible: true});

			let sphere = new THREE.Mesh(sgSphere, material);
			sphere.scale.set(0.12, 0.12, 0.12);
      
			sphere.name = alignment[3];
			node.add(sphere);
			
			let outline = new THREE.Mesh(sgSphere, outlineMaterial);
			outline.scale.set(0.12, 0.12, 0.12);
			outline.name = `outline`;
			sphere.add(outline);

			let pickSphere = new THREE.Mesh(sgLowPolySphere, pickMaterial);
			pickSphere.name = `pick_volume`;
			pickSphere.scale.set(0.12, 0.12, 0.12);
			sphere.add(pickSphere);
		
		
            scene.add(node)
            this.handles.push(node)
        }
    }



    

    this.translateByHandle = function(handlePos, hands){

        if(!this.handlePos){
            return;
        }
        var dy = handlePos.y - this.handlePos.y
        
        dy *= 30

    
  
     

        for (var i = 0; i < this.geometry.vertices.length; i++) {
            var p = this.geometry.vertices[i];

            p.y +=  dy
              
        }


        this.geometry.computeBoundingBox()
        this.geometry.verticesNeedUpdate = true;
        var new_center = getCenter(this.geometry.vertices[1], this.geometry.vertices[0])
        this.geometry.translate(-new_center.x, -new_center.y, -new_center.z)
        this.geometry.rotateX(-this.XAngle);
        this.geometry.rotateY(-this.YAngle);
        this.geometry.rotateZ(-this.ZAngle);
        this.geometry.translate(new_center.x, new_center.y, new_center.z)
        this.boundingBox.set(this.geometry.vertices[1].clone(), this.geometry.vertices[0].clone())
        
        this.geometry.translate(-new_center.x, -new_center.y, -new_center.z)
        this.geometry.rotateX(this.XAngle);
        this.geometry.rotateY(this.YAngle);
        this.geometry.rotateZ(this.ZAngle);
        this.geometry.translate(new_center.x, new_center.y, new_center.z)

        this.handlePos = handlePos

        for(h of hands){
            h.translateY(dy)
        
        }

    }

    this.scaleByHandle = function(handlePos, handleName, hands){
        if(!this.handlePos){
            return;
        }

        var dy = handlePos.y - this.handlePos.y
        
        dy *= 30

        var XAngle = this.XAngle
        var YAngle = this.YAngle
        var ZAngle = this.ZAngle



        var xz_plane_1 = [0, 6, 4, 7]
        var xz_plane_2 = [5, 8, 1, 9]

       

        if(handleName == "scale-y+"){
            
            var chosen_xz_plane = xz_plane_1

            
        }else if(handleName == "scale-y-"){

            var chosen_xz_plane = xz_plane_2

        
        }

        let vt;

        var testTop = this.geometry.vertices[0].clone();
        var testBottom = this.geometry.vertices[1].clone();

        if (chosen_xz_plane.includes(0)){
            testTop.y += dy
        }else{
            testBottom.y += dy
        }

        if (testBottom.y >= testTop.y){
            return
        }
        

        for(i=0;i<this.geometry.vertices.length;i++){
            vt = this.geometry.vertices[i]
            if(chosen_xz_plane.includes(i)){
                vt.y += dy
            }

       
          
        }   

        this.geometry.vertices[3] = getCenter(this.geometry.vertices[0], this.geometry.vertices[4])
        this.geometry.vertices[2] = getCenter(this.geometry.vertices[1], this.geometry.vertices[5])
        this.geometry.vertices[10] = getCenter(this.geometry.vertices[4], this.geometry.vertices[6])
        


      

        var new_center = getCenter(this.geometry.vertices[1], this.geometry.vertices[0])



        this.geometry.translate(-new_center.x, -new_center.y, -new_center.z)
        this.geometry.rotateX(-this.XAngle);
        this.geometry.rotateY(-this.YAngle);
        this.geometry.rotateZ(-this.ZAngle);
        this.geometry.translate(new_center.x, new_center.y, new_center.z)
        this.boundingBox.set(this.geometry.vertices[1].clone(), this.geometry.vertices[0].clone())
        
        this.geometry.translate(-new_center.x, -new_center.y, -new_center.z)
        this.geometry.rotateX(this.XAngle);
        this.geometry.rotateY(this.YAngle);
        this.geometry.rotateZ(this.ZAngle);
        this.geometry.translate(new_center.x, new_center.y, new_center.z)
        

         this.geometry.computeBoundingBox()

        this.geometry.verticesNeedUpdate = true;

        

        this.boxHelper.rotation.x = XAngle;
        this.boxHelper.rotation.y = YAngle;
        this.boxHelper.rotation.z = ZAngle;

       
        this.handlePos = handlePos

        for(h of hands){
            if(h.name == "front-side"){

                var center = getCenter(this.geometry.vertices[1].clone(), this.geometry.vertices[6].clone())
       
                
                h.position.set(center.x, center.y, center.z)
                h.rotation.y = this.YAngle
                continue
            }else if (h.name == "translation-y"){
                var center = getCenter(this.geometry.vertices[1].clone(), this.geometry.vertices[0].clone())
       
                
                h.position.set(center.x, center.y, center.z)

                continue
            }
            h.translateY(dy)
        }




        
        
       
    }
 

    this.resize = function(v) {
            


    
             //get clicked point and point directly opposite it
            XAngle = this.XAngle
            YAngle = this.YAngle
            ZAngle = this.ZAngle


            pointIdx = this.draggingIdx;
            oppIdx = getOppositeCorner(pointIdx)
            oppPoint = this.geometry.vertices[oppIdx].clone()

          

            if (v.x == oppPoint.x || v.y == oppPoint.y || v.z == oppPoint.z) {
                return
            }

            origTop = this.geometry.vertices[3].clone()
            origBottom = this.geometry.vertices[2].clone()

            //Rotates the cursor relative to the clicked point
            v1 = v.clone()
            v2 = this.geometry.vertices[pointIdx].clone()
            mov_vec = v1.sub(v2)
            mov_vec = mov_vec.applyAxisAngle(new THREE.Vector3(1,0,0), -XAngle );
            mov_vec = mov_vec.applyAxisAngle(new THREE.Vector3(0,1,0), -YAngle );
            mov_vec = mov_vec.applyAxisAngle(new THREE.Vector3(0,0,1), -ZAngle );
     
            
          
            
            //rotates points to be axis-aligned
            center = this.boundingBox.getCenter()
            this.geometry.translate(-center.x, 0, -center.z)
            this.geometry.rotateX(-XAngle);
            this.geometry.rotateY(-YAngle);
            this.geometry.rotateZ(-ZAngle);
            this.geometry.translate(center.x, 0, center.z)



         
            
            //Retrieve the change in x, y, z
            dx = mov_vec.x
            dy = mov_vec.y
            dz = mov_vec.z

            var topRight = this.geometry.vertices[0].clone()
            var bottomLeft = this.geometry.vertices[1].clone()

            
            
         
            //
            xy_plane_1 = [0, 5, 7, 9]
            xy_plane_2 = [6, 4, 8, 1]
        
            yz_plane_1 = [0, 5, 6, 8]
            yz_plane_2 = [4, 7, 1, 9]
        
            xz_plane_1 = [0, 6, 4, 7]
            xz_plane_2 = [5, 8, 1, 9]
        
        
            var chosen_xy_plane, chosen_yz_plane, chosen_xz_plane;
        
            if(xy_plane_1.includes(pointIdx)){
                chosen_xy_plane = xy_plane_1
            }else{
                chosen_xy_plane = xy_plane_2
            }
        
            if(yz_plane_1.includes(pointIdx)){
                chosen_yz_plane = yz_plane_1
            }else{
                chosen_yz_plane = yz_plane_2
            }
        
            if(xz_plane_1.includes(pointIdx)){
                chosen_xz_plane = xz_plane_1
            }else{
                chosen_xz_plane = xz_plane_2
            }


            var new_verts = []


            for(i=0;i<this.geometry.vertices.length;i++){
                vt = this.geometry.vertices[i].clone()
          
                if(chosen_xy_plane.includes(i)){
                    vt.z += dz
                } 
                if (chosen_yz_plane.includes(i)){
                    vt.x += dx
                }

                new_verts.push(vt)

              
            }
        
     

            if(new_verts[0].x < new_verts[1].x ||  new_verts[0].z < new_verts[1].z){

                this.geometry.translate(-center.x, 0, -center.z)
                this.geometry.rotateX(XAngle);
                this.geometry.rotateY(YAngle);
                this.geometry.rotateZ(ZAngle);
                this.geometry.translate(center.x, 0, center.z)

                
                return
                
            }

            for(i=0;i<this.geometry.vertices.length;i++){
    
                this.geometry.vertices[i] = new_verts[i]
               

            }

           
            this.geometry.vertices[3] = getCenter(this.geometry.vertices[0], this.geometry.vertices[4])
            this.geometry.vertices[2] = getCenter(this.geometry.vertices[1], this.geometry.vertices[5])
            this.geometry.vertices[10] = getCenter(this.geometry.vertices[4], this.geometry.vertices[6])



            //because we rotated the vertices to be axis aligned, the resulting resized box will not have 
            //have the real center than if we had resized from the original rotated box. This corrects for that.
            new_center = getCenter(this.geometry.vertices[1].clone(), this.geometry.vertices[0].clone())
            real_center = getCenter(oppPoint, v)

            
            this.geometry.translate(-new_center.x, 0, -new_center.z);
            this.geometry.translate(real_center.x, 0, real_center.z);

            
            //setting min and max of boundingBox. Rotating boxHelper to give appearance of rotaton
            
            this.boxHelper.rotation.x = XAngle;
            this.boxHelper.rotation.y = YAngle;
            this.boxHelper.rotation.z = ZAngle;

        

        
            this.boundingBox.set(this.geometry.vertices[1].clone(), this.geometry.vertices[0].clone())
          


            //rotating points back
            this.geometry.translate(-real_center.x,  0, -real_center.z)
            this.geometry.rotateZ(ZAngle);
            this.geometry.rotateY(YAngle);
            this.geometry.rotateX(XAngle);
            
            
            this.geometry.translate(real_center.x, 0, real_center.z)
            
            this.geometry.verticesNeedUpdate = true;

            


            for(h of this.handles){
                var dx = this.geometry.vertices[3].x - origTop.x
                var dy =  this.geometry.vertices[3].y - origTop.y
                var dz = this.geometry.vertices[3].z - origTop.z
                if(h.name == "front-side"){

                    var center = getCenter(this.geometry.vertices[1].clone(), this.geometry.vertices[6].clone())
       
                
                    h.position.set(center.x, center.y, center.z)
                    h.rotation.y = this.YAngle
                    continue
                }else if (h.name == "translation-y"){
                    var center = getCenter(this.geometry.vertices[1].clone(), this.geometry.vertices[0].clone())
           
                    
                    h.position.set(center.x, center.y, center.z)
    
                    continue
                }
                h.translateX(dx)          
                h.translateZ(dz)
            }
    
            
           
            


    }

    this.rotate = function(cursor){

        var bottomCenter = this.geometry.vertices[10].clone()
        var topCenter = getCenter(this.geometry.vertices[0],this.geometry.vertices[7])

        // get relative angle of cursor with respect to 
        var center = getCenter(this.geometry.vertices[0],this.geometry.vertices[4])
        var angle = this.getAngle(center, bottomCenter, cursor, topCenter);
        console.log(topCenter)
        console.log(bottomCenter)
        console.log(center)

        var topRight = this.geometry.vertices[0]
        var bottomLeft = this.geometry.vertices[1]
        var center = getCenter(topRight.clone(), bottomLeft.clone());

        this.boxHelper.rotation.y = this.YAngle + angle;
        this.geometry.translate(-center.x, -center.y, -center.z)
        this.geometry.rotateX(-this.XAngle);
        this.geometry.rotateY(-this.YAngle);
        this.geometry.rotateZ(-this.ZAngle);
        this.geometry.rotateZ(this.ZAngle);
        this.geometry.rotateY(this.YAngle + angle);
        this.geometry.rotateX(this.XAngle)
        this.geometry.translate(center.x, center.y, center.z);
        this.geometry.computeBoundingBox()   
        this.geometry.verticesNeedUpdate = true;

        var h = this.handles[3]
        this.YAngle += angle;
        if(h.name == "front-side"){

            var center = getCenter(this.geometry.vertices[1].clone(), this.geometry.vertices[6].clone())
    
            
            h.position.set(center.x, center.y, center.z)
            h.rotation.y = this.YAngle
            
        }
    }

    this.rotateManual = function(axis, angle){
        angle = angle * 0.0174533;
        
        var topRight = this.geometry.vertices[0]
        var bottomLeft = this.geometry.vertices[1]
    
        var center = getCenter(topRight.clone(), bottomLeft.clone());



        if(axis == 'y'){

            var oldAngle = this.YAngle
            
            this.boxHelper.rotation.x = this.XAngle;
            this.boxHelper.rotation.y = angle;
            this.boxHelper.rotation.z = this.ZAngle;

            this.geometry.translate(-center.x, -center.y, -center.z)
            this.geometry.rotateX(-this.XAngle);
            this.geometry.rotateY(-this.YAngle);
            this.geometry.rotateZ(-this.ZAngle);
            this.geometry.rotateZ(this.ZAngle);
            this.geometry.rotateY(angle);
            this.geometry.rotateX(this.XAngle)
            
            
            this.geometry.translate(center.x, center.y, center.z);
           
            this.geometry.computeBoundingBox()   

            this.geometry.verticesNeedUpdate = true;
            this.YAngle = angle;
            var h = this.handles[3]

            if(h.name == "front-side"){

                var center = getCenter(this.geometry.vertices[1].clone(), this.geometry.vertices[6].clone())
       
               
                h.position.set(center.x, center.y, center.z)
                h.rotation.y = this.YAngle
              
            }
   
        }

    }



    // method to translate bounding box given a reference point
    this.translate = function(v) {

 


        // get difference in x and z coordinates between cursor when 
        // box was selected and current cursor position
        var dx = v.x - this.cursor.x;
        var dy = v.y - this.cursor.y;
        var dz = v.z - this.cursor.z;
  
        

        for (var i = 0; i < this.geometry.vertices.length; i++) {
            var p = this.geometry.vertices[i];
   
            p.x += dx;
            p.y +=  dy
            p.z +=  dz;
            
        }

        for(let handle of this.handles){
            handle.translateX(dx)
            handle.translateY(dy)
            handle.translateZ(dz)
        }

        var h = this.handles[3]

        if(h.name == "front-side"){

            var center = getCenter(this.geometry.vertices[1].clone(), this.geometry.vertices[6].clone())
    
            
            h.position.set(center.x, center.y, center.z)
            h.rotation.y = this.YAngle
            
        }

      

        
        this.cursor = v.clone();
        this.geometry.computeBoundingBox()
        this.boundingBox.translate(new THREE.Vector3(dx,dy,dz))
        this.geometry.verticesNeedUpdate = true;

     
        
    }

    


    // changes and updates a box's point's color given point index and color
    this.changePointColor = function(idx, color) {
        this.colors[idx] = color;
        this.geometry.colorsNeedUpdate = true;
    }
    // method to change color of bounding box
    this.changeBoundingBoxColor = function(color) {
        boxHelper.material.color.set(color);
    }

    this.output = function() {
        return new OutputBox(this);
    }

    this.get_cursor_distance_threshold = function() {
        return Math.min(distance2D(this.geometry.vertices[0], this.geometry.vertices[2]),
            distance2D(this.geometry.vertices[0], this.geometry.vertices[1])) / 4;
    }

    this.set_box_id = function(box_id) {
        if (typeof(box_id) == 'string') {
            box_id = parseInt(box_id);
        }
        this.id = box_id;
        this.text_label.setHTML(this.id.toString());
    }



    this.add_text_label = function() {
        if(!this.text_label){
            var text = this.create_text_label();
            text.setHTML(this.id.toString());
            text.setParent(this.boxHelper);
            container.appendChild(text.element);
            this.text_label = text;
        }
        
    }

    this.create_text_label = function() {
        console.log("creating text label")
        var div = document.createElement('div');
        div.className = 'text-label';
        div.style.position = 'absolute';
        div.style.width = 100;
        div.style.height = 100;
        div.innerHTML = "hi there!";
        div.style.top = -1000;
        div.style.left = -1000;
    
        var _this = this;
    
        return {
          element: div,
          parent: false,
          position: new THREE.Vector3(0,0,0),
          setHTML: function(html) {
            this.element.innerHTML = html;
          },
          setParent: function(threejsobj) {
            this.parent = threejsobj;
          },
          updatePosition: function() {
            if (this.parent) {
              this.position.copy(this.parent.position);
            }            
            var coords2d = this.get2DCoords(this.position, camera);
            this.element.style.left = coords2d.x + 'px';
            this.element.style.top = coords2d.y + 'px';
          },
          get2DCoords: function(position, camera) {
            var vector = position.project(camera);
            vector.x = (vector.x + 1)/2 * window.innerWidth;
            vector.y = -(vector.y - 1)/2 * window.innerHeight;
            return vector;
          }
        };
    }

    this.get_points_in_box = function(){

        box = this.boundingBox;

        center = box.getCenter()
   

        angle = this.YAngle

        origPoints = app.cur_pointcloud.geometry.clone();
        origPoints = origPoints.translate(-center.x, -center.y, -center.z)
        origPoints = origPoints.rotateY(-angle);
        origPoints = origPoints.translate(center.x, center.y, center.z)
        
        
        origPoints = origPoints.vertices;
        
        
        addedPointsIndices = []
        for(i=0;i<origPoints.length;i++){
            pt = origPoints[i]
           
            if(box.containsPoint(pt)){
                addedPointsIndices.push(i)
            }
            
        }

        

        return addedPointsIndices

    }

    this.getAngle = function(origin, v1, v2, v3) {
        v1 = v1.clone();
        v2 = v2.clone();
        origin = origin.clone();
        v1.sub(origin);
        v2.sub(origin);
        v1.y = 0;
        v2.y = 0;
        v1.normalize();
        v2.normalize();
    
        var angle = Math.acos(Math.min(1.0, v1.dot(v2)));
        if (v3) {
            v3 = v3.clone();
            v3.sub(origin);
    
            // calculates distance between v1 and v2 when v1 is rotated by angle
            var temp1 = v1.clone();
            rotate(temp1, v3.clone(), angle);
            var d1 = distance2D(temp1, v2);
    
            // calculates distance between v1 and v2 when v1 is rotated by -angle
            var temp2 = v1.clone();
            rotate(temp2, v3.clone(), -angle);
            var d2 = distance2D(temp2, v2);
            
    
    
            // compares distances to determine sign of angle
            if (d2 > d1) {
                angle = -angle;
            }
        }
    
        return angle;
    }





}

Box.parseJSON = function(json_boxes) {

    var bounding_boxes = [], box;

    if (!Array.isArray(json_boxes)) {
        json_boxes = [json_boxes];
    }
    for (var i = 0; i < json_boxes.length; i++) {
    
        json_box = json_boxes[i]

        bm = json_box.boxMin
        boxMin = new THREE.Vector3(bm[0], bm[1], bm[2])
        bm = json_box.boxMax
        boxMax = new THREE.Vector3(bm[0], bm[1], bm[2])

        if(!json_box.subType){
            json_box.subType = "ALL"
        }

        

        angle = json_box.YAngle;

        

        newBoundingBox = new THREE.Box3(boxMin, boxMax);
    
        newBoxHelper = new THREE.Box3Helper( newBoundingBox, 0xffff00 );
        newBoxHelper.rotation.y = angle;

        box = new Box( boxMax, boxMin, angle, newBoundingBox, newBoxHelper, loadBoxPoints=json_box);
    
    
        bounding_boxes.push(box);
       
    }
    return bounding_boxes;


}



function stringifyBoundingBoxes(boundingBoxes) {
    var outputBoxes = [];
    for (var i = 0; i < boundingBoxes.length; i++) {
        outputBoxes.push(new OutputBox(boundingBoxes[i]));
    }
    return outputBoxes;
}

function createBox(anchor, v, angle) {
    newBoundingBox = new THREE.Box3(v, anchor);
    
    newBoxHelper = new THREE.Box3Helper( newBoundingBox, 0xffff00 );
    let texture = new THREE.TextureLoader().load(`static\\resources\\eye_2.png`);



    let material = new THREE.MeshBasicMaterial({
        color: 'red',
        opacity: 0,
        transparent: true,
        map:texture
    });
    var texturedBox = new THREE.Mesh(newBoundingBox, material)
    newBox = new Box(anchor, v, angle, newBoundingBox, newBoxHelper);
    

    return newBox;
}

function drawBox(box) {
    scene.add(box.points);
    
    scene.add(box.boxHelper);
}


function createAndDrawBox(anchor, v, angle) {
    var newBox = createBox(anchor, v, angle);
    drawBox(newBox);
    
    return newBox;
}




function hideBox(box){
    scene.remove(box.boxHelper);
    scene.remove(box.points);
    if(box.text_label){
        box.text_label.element.remove();
        box.text_label = null;
    }
    
    for (var h of box.handles){
        scene.remove(h)
    }
}

function showBox(box){
    scene.add(box.boxHelper);
    scene.add(box.points);
    box.add_text_label();
    box.createFrontFace();
}

function deleteBox(box_id){
    var bbs = app.cur_frame.bounding_boxes;
    var bb, delIdx;

    new_boxes_arr = []
    for(i=0;i<bbs.length;i++){
        bb = bbs[i]
        if(bb.id == box_id){
            delIdx = i
        }else{
            new_boxes_arr.push(bb)
        }

    }

    var delBox = app.cur_frame.bounding_boxes[delIdx]
    hideBox(delBox)

    app.cur_frame.bounding_boxes = new_boxes_arr

    clearBoxesTable();
    clearSceneBB();
    loadBoxesTable();
    repopulateSceneBB();

}

function clearSceneBB() {
    var boundingBoxes = app.cur_frame.bounding_boxes;
    console.log(app.cur_frame)
    if (boundingBoxes) {
        for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
            hideBox(box)
            
        }
    }
}





function clearScenePotentialBB(){
    var potential_bounding_boxes = app.cur_frame.potential_bounding_boxes
    for (var i = 0; i < potential_bounding_boxes.length; i++) {
        box = potential_bounding_boxes[i];
        hideBox(box)
        
    }
    app.cur_frame.potential_bounding_boxes = [];
}




function repopulateSceneBB() {
    
    
    clearScenePotentialBB();
    

    var boundingBoxes = app.cur_frame.bounding_boxes;
    
    if (boundingBoxes) {

        
     
        for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
        
            if(app.subPC){
                if (box.subType == "ALL" || box.subType == app.subPC){
                    showBox(box)
                }
            }else{
                if (box.subType == "ALL"){
                    showBox(box)
                }
            }
      
        }
  
    }
}


function repopulateSubBB(transform, inv_transform, transition_type, prevSubPC=null){
    console.log(transition_type)
    var boundingBoxes = app.cur_frame.bounding_boxes;
    var accum_object = app.cur_frame.accum_object
    var frame_origin = accum_object['camera_positions'][0]
    console.log(boundingBoxes)
    
    if (boundingBoxes) {
        for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
            if(!(box.subType == "ALL" || box.subType == app.subPC)){
                continue

            }

           if(box.subType == "ALL"){
                if(transition_type == "subToSub"){
                    
                    var prevIdx = accum_object["file_names"].indexOf(prevSubPC)
                    var vt = accum_object['velo_transforms'][prevIdx]
                    var prevTransform = new THREE.Matrix4()
                    prevTransform.set(vt[5], vt[6], vt[4], vt[7], 
                        vt[9], vt[10], vt[8], vt[11], 
                        vt[1],vt[2],vt[0], vt[3], 
                        
                        
                        vt[12], vt[13], vt[14],vt[15])
    
                    var invPrevTransform = prevTransform.invert()
    
                    console.log(invPrevTransform)
                    
                    box.geometry.applyMatrix4(invPrevTransform)
                    box.geometry.translate(-frame_origin[1], -frame_origin[2], -frame_origin[0])
                    box.geometry.translate(frame_origin[1], frame_origin[2], frame_origin[0])
                    box.geometry.applyMatrix4(transform)
    
                    modifyBoundingBoxDisplay(box)
                    
    
                }else if(transition_type == "ALLToSub"){
    
                
                    box.geometry.translate(frame_origin[1], frame_origin[2], frame_origin[0])
                    box.geometry.applyMatrix4(transform)
                    
                    modifyBoundingBoxDisplay(box)
                
                    
                }
    
            }



            box.geometry.verticesNeedUpdate = true

            showBox(box)
            

        }
    }

}

function modifyBoundingBoxDisplay(box){
        var minPt = box.geometry.vertices[1].clone()
        var maxPt = box.geometry.vertices[0].clone()
        var otherPt = box.geometry.vertices[7].clone()
        var rotorPt = box.geometry.vertices[6].clone()

        var width = maxPt.distanceTo(rotorPt)
        var length = maxPt.distanceTo(otherPt)
        var height = maxPt.distanceTo(box.geometry.vertices[5].clone())
        

        var center = getCenter(box.geometry.vertices[0], box.geometry.vertices[1])

        var m1 = center.clone().sub(new THREE.Vector3(length/2, height/2, width/2))
        var m2 = center.clone().add(new THREE.Vector3(length/2, height/2, width/2))

  

        box.boundingBox.set(m1, m2)


        var verts = box.geometry.clone().vertices




        var boxplane_x = new THREE.Plane()
        boxplane_x.setFromCoplanarPoints(verts[0], verts[5], verts[8])

        var boxplane_y = new THREE.Plane()
        boxplane_y.setFromCoplanarPoints(verts[0], verts[6], verts[4])

        var boxplane_z = new THREE.Plane()
        boxplane_z.setFromCoplanarPoints(verts[0], verts[5], verts[9])

        var plane_x = new THREE.Plane(new THREE.Vector3(1,0,0))
        var plane_y = new THREE.Plane(new THREE.Vector3(0,1,0))
        var plane_z = new THREE.Plane(new THREE.Vector3(0,0,1))

    

        

        var angleX = plane_x.normal.angleTo(boxplane_x.normal)
        var angleY = plane_y.normal.angleTo(boxplane_y.normal)
        var angleZ = plane_z.normal.angleTo(boxplane_z.normal)

       
        
        box.boxHelper.rotation.x = 0

        box.boxHelper.rotation.y = angleX
        box.boxHelper.rotation.z = -angleY

        
        box.YAngle = angleX

        return [angleX, m1, m2]
}





function OutputBox(box) {
    this.all_points = []

    var savedPoints = box.geometry.clone()
    console.log(savedPoints)
    var accum_object = app.cur_frame.accum_object

    console.log(box)
    
    if(app.subPC && box.subType == "ALL"){

        savedPoints = box.origStats.vertices


    }


   

    for(i=0;i<savedPoints.vertices.length;i++){
        vert = savedPoints.vertices[i]

        this.all_points.push([vert.x, vert.y, vert.z])
    }
    this.box_class = box.box_class;
    // this.instance_id = box.instance_id;
    this.box_id = box.id;
    this.YAngle = box.YAngle;

    
    if(app.subPC && box.subType == "ALL"){
        this.YAngle = box.origStats.YAngle
    }

    // this.timestamps = box.timestamps;

    var tmp;

    tmp = box.boundingBox.min
    if(app.subPC && box.subType == "ALL"){
        tmp = box.origStats.boxMin
    }


    this.boxMin = [tmp.x, tmp.y, tmp.z]

    tmp = box.boundingBox.max
    if(app.subPC && box.subType == "ALL"){
        tmp = box.origStats.boxMax
    }

    this.boxMax = [tmp.x, tmp.y, tmp.z];

    this.subType = box.subType
    this.frontFace = getCenter(box.origStats.vertices.vertices[1], box.origStats.vertices.vertices[6])
    
    
}
