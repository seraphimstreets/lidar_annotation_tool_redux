
/* Class for handling communication to/from the server,  as well as being a universal hub for the app*/
function App() {
	this.fnames = [];
	this.frames = {};
	this.cur_frame;
	this.cur_pointcloud;
	this.move2D = false;


	this.globalPointSize = 1;
	this.globalViewMode = "perspective";
	this.subPC = false;
	this.classChangeTracker = {"classEditing":"", "classSelecting":"","classOldName":""}


	this.class_colors = {0:"#404040", 1:"#8cff78", 2:"#b32bed", 3:"#cc1616"}
	this.class_order = {"Default":0, "Forest":1, "Car":2, "Person":3}
	this.intensity_mode = false;
	this.image_name = null;
	this.statusSaved = true;
	this.pending_frame;
	$("#imgBox").hide()
	
	
	// loading all pointcloud names from our server and setting the frame
	this.init = function() {
		$.ajax({
			context: this,
			url: '/loadFrameNames',
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {
				app.deleteExtraPictures();
				this.drives = parsePythonJSON(response);
				var drive_keys = Object.keys(this.drives);
				drive_keys.sort();
				for (var i = 0; i < drive_keys.length; i++) {
					var drive = drive_keys[i];
					for (var j = 0; j < this.drives[drive].length; j++) {
						var fname = pathJoin([drive, this.drives[drive][j].split('.')[0]]);
						this.fnames.push(fname);
						addFrameRow(fname);
					
					}
				}

			
				this.set_frame(this.fnames[0]);
				focus_frame_row(getFrameRow(this.fnames[0]));
				
			},
			error: function(error) {
				console.log(error);
			}
		});
	};
	

	this.get_frame = function(fname) {
		if (fname in this.frames) {
			return this.frames[fname];
		} else {
			return false;
		}
	};

	this.clearEverything = function(){
		clearThree(scene)
		clearScenePotentialBB();
		clearSceneBB();
		$( ".text-label" ).remove();
		clearImageObjectTable();
		clearObjectTable();
		clearAssociatedImagesTable();
		clearAssociatedPointcloudsTable();
		clearBoxesTable();
	
		$("#imgBox").hide()
		
	}

	// entry point for loading accumulated pointcloud, associated images, and annotations
	this.set_frame = function(fullname){

		
		this.statusSaved = true;
		
		var drivename = fullname.split("/")[0]
		var binname = fullname.split("/")[1] + ".bin"
		var frame = this.get_frame(fullname);
	
		// do not reload if it is the current frame, unless it is a sub-pointcloud
		if (this.cur_frame == frame && !this.subPC) {
			return;
		} 

		if(!fullname){
			return
		}


		if (this.cur_frame) {
		
			this.clearEverything();
			
			
		}

		this.subPC = false;

		var xmlhttp = new XMLHttpRequest();

		// reading in the bin data directly from accumulated_bins folder
		
	
		xmlhttp.open("GET", "static\\datasets\\" + drivename + "\\" + "accumulated_bins" +'\\' + binname, true);
		xmlhttp.responseType = 'arraybuffer';

		
		xmlhttp.send();
		
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				
				data = new Float32Array(xmlhttp.response);
				console.log(data)
				var frame = new Frame(drivename, fullname, data);
				app.cur_frame = frame;

				// loading class, instance, bounding_box, image data
				app.set_frame_others(drivename, binname)
				
			}
		};
					
	}

	
	
	// loading all annotation information
	this.set_frame_others = function(drivename, binname) {
		
		

		$.ajax({
			context: this,
			url: '/getFramePointCloud',
			data: JSON.stringify({drivename: drivename, binname:binname}),
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {
				thisLoaded = false;

				var res, annotation, bounding_boxes_json, bounding_boxes, box;
				var frame = this.cur_frame

			
				res = response.split('?');

				classArr = []
				instArr = []

				//loading class_colors/class_order/point_classes/point_instance/bounding_box information into pointcloud


				if (res.length > 1 && res[1].length > 0)  {

					annotation = parsePythonJSON(res[1]);

					if(annotation["frame"]["class_colors"] != 0){
						this.class_colors = annotation["frame"]["class_colors"]
						this.class_order = annotation["frame"]["class_order"]

						var classes = Object.keys(this.class_colors)
						var cl;

						console.log(app.cur_frame)
						for(var i=0; i<classes.length; i++){
							cl = classes[i]
							app.cur_frame.instance_counter[cl] = []
					
						}
						
					}
					
					if("bounding_boxes" in annotation["frame"]){
			
				
						bounding_boxes_json = Object.values(annotation["frame"]["bounding_boxes"]);
						bounding_boxes = Box.parseJSON(bounding_boxes_json);
			

			
						for (var i = 0; i < bounding_boxes.length; i++) {
							box = bounding_boxes[i];
					
							frame.bounding_boxes.push(box);
					
						}
						this.cur_frame.recomputeBoxInstanceIds()

					}



					if("point_classes" in annotation["frame"]){
						var classArr = annotation["frame"]["point_classes"]
			
						if(classArr.length != 0){
							this.cur_frame.class_tracker = classArr
				
						}
						
					}

					if("instance_ids" in annotation["frame"]){
						var instArr = annotation["frame"]["instance_ids"]
						if(instArr.length != 0){
							this.cur_frame.instance_tracker = instArr
						}
						
					}


					
				}

	

				this.cur_frame.build_new_instance_counter(this.cur_frame.class_tracker, this.cur_frame.instance_tracker)

				//visualizing the pointcloud
				this.buildPointcloud(classArr, instArr);

				if (this.cur_pointcloud) {
					// threeJS animation loop 
					scene.add( this.cur_pointcloud )
					animate();
				}
		
				
				loadObjectTable();
				loadClassTable();
				loadBoxesTable();
				
				repopulateSceneBB();

				if(activeTool){
					activeTool.reset()
				}
		
				// get the names of all associated images
				app.get_frame_images();

				
			},
			error: function(error) {
				console.log(error);
			}
		});
		
	};

	

	// function for displaying a sub-pointcloud
	this.show_sub_pointcloud = function(drivename, fname, indices, transition_type){
		var prevSubPC = this.subPC

		this.subPC = fname
		clearThree(scene)
		$( ".text-label" ).remove();
		clearImageObjectTable();

	
		var xmlhttp = new XMLHttpRequest();

		console.log("static\\datasets\\" + drivename + "\\" + "bin_data" +'\\' + fname + '.bin')
		
	
		xmlhttp.open("GET", "static\\datasets\\" + drivename + "\\" + "bin_data" +'\\' + fname + '.bin', true);
		xmlhttp.responseType = 'arraybuffer';

		
		xmlhttp.send();
		
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				
				var data = new Float32Array(xmlhttp.response);
				app.cur_frame.data = data

				
				var cl_subset = app.cur_frame.class_tracker.slice(indices[0], indices[1])
				var inst_subset = app.cur_frame.instance_tracker.slice(indices[0], indices[1])
			
				generateNewPointCloud(data,  COLOR_RED, cl_subset ,  inst_subset, true)
				

				clearObjectTable();
				loadObjectTable();
			
				scene.add( app.cur_pointcloud )
				
				animate();
				
			
				clearSceneBB()
				var accum_object = app.cur_frame.accum_object
		
				var idx = accum_object['file_names'].indexOf(fname)
				console.log(idx)
				var vt = accum_object['velo_transforms'][idx]
				var mat = new THREE.Matrix4()
			

				mat.set(
					vt[5], vt[6], vt[4], vt[7], 
					vt[9], vt[10], vt[8], vt[11], 
					vt[1],vt[2],vt[0], vt[3], 
					
					
					vt[12], vt[13], vt[14],vt[15])

				

				
				var inv_mat = mat.clone().invert()



				repopulateSubBB(mat, inv_mat, transition_type, prevSubPC)
				
			}
		};

	}



	// setting names in the Associated Images/Pointclouds table
	this.get_frame_images = function(){

		
		var fullname = this.cur_frame.fname
		
		var drivename = fullname.split("/")[0] 
		var fname = fullname.split("/")[1] 
	
		$.ajax({
			url: '/loadFrameImages',
			data: JSON.stringify({"drivename":drivename, "fname":fname}),
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {
				var res = parsePythonJSON(response)
				console.log(res)
				
				app.cur_frame.accum_object = res;
				loadAssociatedImagesTable()
				loadAssociatedPointcloudsTable()

			},
			error: function(error) {
				console.log(error);
				
			}  
		});

	}


	//displaying a pointcloud
	this.buildPointcloud = function(class_arr, inst_arr){
		if (this.cur_frame) {
			clearObjectTable();
			clearClassTable();

		}
		// add pointcloud to scene
		generateNewPointCloud(app.cur_frame.data, COLOR_RED, class_arr, inst_arr);
		
	}

	//updating class colors

	this.updateClassColors = function(classification, color, add=false){
		if(add){
			
			this.class_order[classification] = Math.max.apply(null, Object.values(this.class_order)) + 1
		}

		var clf = this.class_order[classification]
		this.class_colors[clf] = color;

		
		pointsIndices = this.cur_frame.findPointsOfClass(clf, [app.cur_frame.cur_pointcloud_offset[0], app.cur_frame.cur_pointcloud_offset[1]]);
	
		updatePointCloudColors(pointsIndices, color);

		this.statusSaved = false;

	}

	
	//updating class/instance tables and trackers of the current frame

	this.addPoints = function(classification_str, instance_id, addedPointsIndices, new_instance=false){
	

		var classification = this.class_order[classification_str]
		var offset = app.cur_frame.cur_pointcloud_offset[0]

		for(i=0;i<addedPointsIndices.length;i++){
			addedPointsIndices[i] = addedPointsIndices[i] + offset
		}

        if(this.class_colors[classification]){
            color = this.class_colors[classification];
        }

		if(isNaN(parseInt(instance_id))){
			instance_id = -1
		}

		if(new_instance){
			addObjectRow(classification_str, instance_id)
		}


        updatePointCloudColors(addedPointsIndices, color);
        this.cur_frame.update_point_tracker(addedPointsIndices,classification, instance_id);
		console.log(this.cur_frame.class_tracker)

		this.statusSaved = false;
	}

	// removing a class and updating all tables/trackers

	this.removeClass = function(className){
		var pointsIndices;
		classNo = this.class_order[className]
		
		pointsIndices = this.cur_frame.findPointsOfClass(classNo);
		this.cur_frame.update_point_tracker(pointsIndices,0, -1);
		updatePointCloudColors(pointsIndices,this.class_colors[0]);
		deleteClassRow(className)

		var origClr = magicWandTool.hexToRgb(app.class_colors[classNo].substring(1) , 1)
		delete this.class_colors[classNo]
		delete this.class_order[className]
	

		imagePanel.updatePanel( origClr, [0,0,0,0])
		

        this.cur_frame.cur_image.updatePixels(classNo, 0)
        
		$.ajax({
			url: '/saveImage',
            data: JSON.stringify({'pixelClass':app.cur_frame.cur_image.pixelClass, 'pixelInst':app.cur_frame.cur_image.pixelInst, 
            'classColors':app.class_colors, 'classOrder': app.class_order, 'fname':app.cur_frame.fname,
             'imageInstanceCounter':app.cur_frame.cur_image.imageInstanceCounter,  'baseImage':app.cur_frame.cur_image.baseImage}),
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {

                
                
                app.load_frame_image(app.cur_frame.cur_image.baseImage);

                
			},
			error: function(error) {
				console.log(error);
			}
        });

      
		this.statusSaved = false;
	}

	// removing an instance and updating all tables/trackers

	this.removeInst = function(cl, inst_id){
		var removedPointsIndices = this.cur_frame.getInstIndices(cl, inst_id);
	
		var classification = this.class_order[cl];
		var color = this.class_colors[0];
		this.cur_frame.update_point_tracker(removedPointsIndices, 0, inst_id);
		deleteObjectRow(cl + inst_id)

		var idx = app.cur_frame.instance_counter[classification].indexOf(parseInt(inst_id));

		if(idx != -1){
			app.cur_frame.instance_counter[classification].splice(idx, 1)
		}

		updatePointCloudColorsFromClasses()

		var name = cl + ":" + inst_id
		deleteBox(name)

		this.statusSaved = false;

	
	}

	// saving annotations to the server

	this.write_frame_out = function() {
	
		if (this.cur_frame) {
			
			var output_frame = this.cur_frame.output();
		
			var output = {"frame": output_frame};
			var stringifiedOutput = JSON.stringify(output);

			console.log(output)
			
			$.ajax({
				url: '/writeOutput',
				data: JSON.stringify({output: {filename: this.cur_frame.fname, 
												file: stringifiedOutput}}),
				type: 'POST',
				contentType: 'application/json;charset=UTF-8',
				success: function(response) {
					
					app.statusSaved = true;
					modalMessage("Data has been saved successfully!")
				},
				error: function(error) {
					console.log(error);
					modalMessage("Something went wrong while saving.")
				}
			});
		}
	}


	//saving and loading the current image (basically a refresh)
	
	this.save_and_load_image = function(){
		console.log(app.cur_frame.cur_image.pixelClass)
		$.ajax({
            url: '/saveImage',
            data: JSON.stringify({'pixelClass':app.cur_frame.cur_image.pixelClass, 'pixelInst':app.cur_frame.cur_image.pixelInst, 
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


	// loading image of specified name
	this.load_frame_image = function(baseImage){
		
		$.ajax({
			url: '/loadImage',
			data: JSON.stringify({"baseImage":baseImage, "fname":this.cur_frame.fname}),
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {
	
				var res = parsePythonJSON(response);
				
				$("#imgBox").show()
				$('.contana').show()
				$('#maskImage').attr({'src':res['newPath']})
	
		
				var frameImage = new FrameImage(baseImage, res['pixelClasses'], res['pixelInst'])
				
				

				app.cur_frame.cur_image = frameImage;
				app.cur_frame.cur_image.build_new_image_instance_tracker()
			
				app.cur_frame.cur_image.fullMaskSrc = res['newPath'];
				app.show_frame_image(baseImage, res['origWidth'], res['origHeight'])

				clearImageObjectTable();
				
				loadImageObjectTable();
				if (!(imagePanel.cameraMarker)){
					imagePanel.createCameraMarker()
				}

				app.toggleStatusText(false)

			},
			error: function(error) {
				console.log(error);
				
			}  
		});
	}

	// handles appearance of loaded image
	this.show_frame_image = function(path, ow, oh){

		
		if(app.cur_frame){
			var nuname = path
	
			$('#frameImage').attr({'src':nuname})
			$('#realImage').attr({'src':nuname})
			
			$("#imgBox").show();
		
			imagePanel.isLoaded=false;
			imagePanel.imageInfo = null;

			imagePanel.origWidth = ow
			imagePanel.origHeight = oh
			


			$('#frameImage')[0].onload = () => {

				if(!thisLoaded){
					

		
					$("#realCanvas")[0].width = imagePanel.origWidth;
	
					$("#realCanvas")[0].height = imagePanel.origHeight;

					

				

					this.cur_frame.base_image = nuname
					
					if(!imagePanel.targetWidth){
						imagePanel.targetWidth = 360
					}else{
						imagePanel.targetWidth = $("#imgDisplay").css("width")
						imagePanel.targetWidth = parseInt(imagePanel.targetWidth.slice(0, imagePanel.targetWidth.length - 2))
	
					}

					var scaleFactor = imagePanel.targetWidth/imagePanel.origWidth;
					if (scaleFactor != 1){
						imagePanel.scaleFactor = scaleFactor
					}
					
					
					var targetHeight = imagePanel.origHeight * scaleFactor;
					var targetWidth = imagePanel.targetWidth;

					console.log(targetHeight)

					
					$("#frameImage")[0].width = targetWidth;
					$("#frameImage")[0].height = targetHeight;
					$("#maskImage")[0].width = targetWidth;
					$("#maskImage")[0].height = targetHeight;

				

					$("#imgCanvas")[0].width = targetWidth
					$("#imgCanvas")[0].height = targetHeight

					$("#paintCanvas")[0].width = targetWidth
					$("#paintCanvas")[0].height = targetHeight

					$("#imgDisplay").css({'height':targetHeight, 'width':targetWidth})
			
			
				
					$("#imgBox").width(targetWidth);
					$("#imgBox").height(targetHeight + 60);
					
					
				



					imagePanel.init();
				
					

					imagePanel.isLoaded = true;
				
				
				}
				
			
			}

			

			$('#frameImage')[0].onerror = () => {
			
				$("#imgBox").hide();
				
			}
			
					
		}
	}

	

	this.deleteExtraPictures = function(){
		$.ajax({
			url: '/deleteExtraPics',
			data: JSON.stringify({"lol":"lol"}),
			type: 'POST',
			contentType: 'application/json;charset=UTF-8',
			success: function(response) {
				
				console.log("successfully deleted extra images")
			},
			error: function(error) {
				console.log(error);
			}
		});
	
	}

	//creates text labels for all of the current frame's bounding boxes

	this.render_text_labels = function() {
		
		if (app.cur_frame) {
			
			for (var i = 0; i < app.cur_frame.bounding_boxes.length; i++) {
			
				try{
					var box = app.cur_frame.bounding_boxes[i];
					if (box.text_label) {
						box.text_label.updatePosition();
					}
				}catch{
					continue
				}
				
			}

		}
	}



	this.toggleStatusText = function(on=true){
		if(on){
			$("#statusTextContainer").css("display", "block")
		}else{
			$("#statusTextContainer").css("display", "none")
		}
		
	}




}



function animate() {

	requestAnimationFrame( animate );
	

    render();
  

}


function render() {
   
    renderer.render( scene, camera );

    app.render_text_labels();

    if (app.globalViewMode == "orthographic") {
        grid.rotation.y = camera.rotation.z;
    }
    update_footer(getCurrentPosition());
}

function update_footer(pos) {

    
    var x = pos.z;
    var y = pos.x;

    $("#footer").find("p").html("Active tool: {0}{1}x: {2}{3}y: {4}".format(activeToolStr,"<br />", x.toFixed(3), "<br />",y.toFixed(3)));
}

