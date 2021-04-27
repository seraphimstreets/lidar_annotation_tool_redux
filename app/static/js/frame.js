
function Frame(drivename, fname, data) {
	this.drivename = drivename
	this.fname = fname;
	this.data = data;
	this.bounding_boxes = [];
	this.ys = [];
	this.annotated = false;
	// this.mask_rcnn_indices = [];
	this.class_tracker = []
	this.instance_tracker = [];
	this.boxclass_tracker = {};
	this.point_tracker = []
	this.intensity_colors = [];
	this.normal_colors = [];
	this.offsets = [];
	this.intensity_tracker = [];
	this.instance_counter = {};
	this.potential_bounding_boxes = [];
	this.associated_images = [];
	this.scale_factor = 1;
	this.base_image = null;
	this.accum_object = {};
	this.imageHistory = []
	this.cur_pointcloud_name = "ALL";
	this.cur_pointcloud_offset = [0, data.length/4];

	
	this.pcHistory = []
	this.cur_image = null;
	this.activeImage = null;

	this.origColors;
	this.fullMaskSrc;



	var classes = Object.keys(app.class_colors)
	var cl;

	console.log(classes)
	for(var i=0; i<classes.length; i++){
		cl = classes[i]
		this.instance_counter[cl] = []
		
	}

	

	var k = 0;
	for ( var i = 0, l = this.data.length / DATA_STRIDE; i < l; i ++ ) {
  
        this.ys.push(this.data[ DATA_STRIDE * k + 2 ]);
        
        k++;
    }
    for ( var i = 0; i < this.data.length / DATA_STRIDE; i ++ ) {
  
		this.class_tracker.push(0)
		this.instance_tracker.push(-1)
	
    }


	console.log(this.class_tracker)


	this.output = function() {
		return new OutputFrame(this);
	};

	this.add_class = function(class_name){
		this.point_tracker[class_name] = []
	}

	this.remove_class = function(class_name){
		delete this.point_tracker[class_name] 
	}





	this.get_point_classes = function(){
		
	

		var all_c = []
		var classes = Object.values(app.class_order)
		for(i=0;i<classes.length;i++){
			
			all_c.push(classes[i]) 
			
			
		}

		return all_c
	}



	this.update_point_tracker = function(addedPointsIndices, box_class, instance_id, build=false){
		var idx;
		
		for(i=0;i<addedPointsIndices.length;i++){
			idx = addedPointsIndices[i]
		
			if(build){
				this.class_tracker.push(box_class)
				this.instance_tracker.push(instance_id)
			}else{
				this.class_tracker[idx] = box_class
				this.instance_tracker[idx] = instance_id
			
			}
			
		}
	
		
	}

	this.update_point_tracker_classes = function(addedPointsIndices, box_class){
	

	
		for(i=0;i<addedPointsIndices.length;i++){
			idx = addedPointsIndices[i]
			this.class_tracker[idx] = box_class
			this.instance_tracker[idx] = instance_id
			
			
		}
		
		
	}

	this.change_box_classes = function(oldName, newName){
		if(oldName in this.boxclass_tracker){
			this.boxclass_tracker[newName] = this.boxclass_tracker[oldName]
			delete this.boxclass_tracker[oldName]
		}

	}


	this.build_new_instance_counter = function(classes, instance_ids){
		var tracker = {}
		var class_nums = Object.keys(app.class_colors)
		for(var i=0;i<class_nums.length;i++){
			tracker[class_nums[i]] = []
			
		}
		console.log(tracker)
		var cl, inst_id
		for(var i=0;i<classes.length;i++){
			
			inst_id = instance_ids[i]
			if(inst_id != -1){
				cl = classes[i]
				if(cl == 0){
					continue
				}
				if(!(tracker[cl].includes(inst_id))){
					console.log(inst_id)
					tracker[cl].push(inst_id)
				}
			}
		}

		for(var i=0;i<class_nums.length;i++){
			tracker[class_nums[i]] = tracker[class_nums[i]].sort()
		}
			
		this.instance_counter = tracker

		console.log(this.instance_counter)

		return tracker
		

	}

	

	

	this.generate_new_object_id = function(box_class){
		if(!(box_class in this.class_tracker)){
			this.boxclass_tracker[box_class] = 0
			return 0
		}else{
			this.boxclass_tracker[box_class] += 1
			return this.boxclass_tracker[box_class]
		}
	}

	this.findPointsOfClass = function(classification, bounds=[0, app.cur_frame.class_tracker.length]){
		pointIndices = []
		for(i=bounds[0];i<bounds[1];i++){
			if(app.cur_frame.class_tracker[i] == classification){
				pointIndices.push(i)
			}
		}
		console.log(i)

		return pointIndices;
	}

	this.removeImageInst = function(cl, inst_id){
		cl = app.class_order[cl]
		for(i=0;i<this.cur_image.pixelClass.length;i++){
			if(this.cur_image.pixelClass[i] == cl & this.cur_image.pixelInst[i] == inst_id){
				this.cur_image.pixelClass[i] = 0
				this.cur_image.pixelInst[i] = -1
			}
		}

		var arr = this.cur_image.imageInstanceCounter[cl];
	
		if(arr){
			var index = arr.indexOf(parseInt(inst_id));
			if (index !== -1) {
				arr.splice(index, 1);
			}
		}
		

	
		app.save_and_load_image();



	}

	this.highlightPointsInst = function(cl, inst_id, offset=app.cur_frame.cur_pointcloud_offset[0]){
		var pc_colors = app.cur_pointcloud.geometry.colors
		if(pc_colors){
			this.origColors = pc_colors.slice()
		}
		
		var class_no = app.class_order[cl]
		color = new THREE.Color(app.class_colors[class_no])
		var default_color = new THREE.Color("#404040")

		
		for(i=app.cur_frame.cur_pointcloud_offset[0];i<app.cur_frame.cur_pointcloud_offset[1];i++){
			if(this.class_tracker[i] == class_no & this.instance_tracker[i] == inst_id){
				pc_colors[i-offset] = color
			}else{
				pc_colors[i-offset] = default_color
			}
		}

		app.cur_pointcloud.geometry.colorsNeedUpdate = true;

	}

	this.recordPCHistory = function(){
		var MAX_BUFFER = 3;
		if(this.pcHistory.length >= MAX_BUFFER){
			this.pcHistory.shift()
		}
		var box_ids = []
		for(var i=0;i<this.bounding_boxes.length; i++){
			var box = this.bounding_boxes[i]
			box_ids.push(box.id)
		}
		this.pcHistory.push([this.class_tracker.slice(), this.instance_tracker.slice(), 
			JSON.stringify(this.instance_counter), box_ids])
	}

	this.restorePC = function(){
		
		if(this.pcHistory.length > 0){

			clearObjectTable(); 
			// this.clearBoxes();

			var all = this.pcHistory.pop()
			this.class_tracker = all[0]
			this.instance_tracker = all[1]
			this.instance_counter = JSON.parse(all[2])
			var box_ids= all[3]

			

			
			loadObjectTable();
			updatePointCloudColorsFromClasses();
			for(var i=0;i<this.bounding_boxes.length;i++){
				var box = this.bounding_boxes[i]
				if(!(box_ids.includes(box.id))){
					scene.remove(box.points);
					scene.remove(box.boxHelper)
					app.cur_frame.bounding_boxes.splice(i)
					box.text_label.element.remove();
				}
			}
		}
		
	}

	this.recordImageHistory = function(){
		var MAX_BUFFER = 3;
		if(this.imageHistory.length >= MAX_BUFFER){
			this.imageHistory.shift()
		}
		this.imageHistory.push([this.cur_image.pixelClass.slice(), this.cur_image.pixelInst.slice(), 
			JSON.stringify(this.cur_image.imageInstanceCounter)])

	
	}

	this.restoreImage = function(){
		
		if(this.imageHistory.length > 0){

		
			var all = this.imageHistory.pop()
			var pixelClass = all[0]
			var pixelInst = all[1]
			var imageInstanceCounter = JSON.parse(all[2])

			$.ajax({
				url: '/saveImage',
				data: JSON.stringify({'pixelClass':pixelClass, 'pixelInst':pixelInst, 
				'classColors':app.class_colors, 'classOrder': app.class_order, 'fname':app.cur_frame.fname,
				 'imageInstanceCounter':imageInstanceCounter, 'baseImage':this.cur_image.baseImage}),
				type: 'POST',
				contentType: 'application/json;charset=UTF-8',
				success: function(response) {
	
					
					
					app.load_frame_image(app.cur_frame.cur_image.baseImage);
	
					
				},
				error: function(error) {
					console.log(error);
				}
			});
	

		}
	}

	



	this.getInstIndices = function(cl, inst_id){
	

		var class_no = app.class_order[cl]
		
		var pointsIndices = [];
		
		for(i=0;i<this.class_tracker.length;i++){
			if(this.class_tracker[i] == class_no & this.instance_tracker[i] == inst_id){
				pointsIndices.push(i)
			}
		}

		return pointsIndices

	}



	this.unhighlightPoints = function(){
	
		updatePointCloudColorsFromClasses()



	}

	

	this.recomputeBoxInstanceIds = function(){
		var bb, bc;
		var bbs = app.cur_frame.bounding_boxes;
		this.boxclass_tracker = {}
		for(i=0;i<bbs.length;i++){
			bb = bbs[i]
			bc = bb.box_class
			if(!(bc in this.boxclass_tracker )){
				this.boxclass_tracker[bc] = -1
			}
			this.boxclass_tracker[bc] += 1

			bb.instance_id = this.class_tracker[bc]
		}
	}

	this.create_new_instance_id = function(cl){
	
		if(!(cl in this.instance_counter)){
			this.instance_counter[cl] = [0]
			return 0
		}



		if(this.instance_counter[cl].length == 0){
			this.instance_counter[cl].push(0)
			return 0
		}
		var max_id = Math.max.apply(null, this.instance_counter[cl])
	
		this.instance_counter[cl].push(max_id+1)
		return max_id+1


	}

	this.create_new_image_instance_id = function(cl){
	
		if(!(cl in this.cur_image.imageInstanceCounter)){
			this.cur_image.imageInstanceCounter[cl] = [0]
			return 0
		}



		if(this.cur_image.imageInstanceCounter[cl].length == 0){
			this.cur_image.imageInstanceCounter[cl].push(0)
			return 0
		}
		var max_id = Math.max.apply(null, this.cur_image.imageInstanceCounter[cl])
	
		this.cur_image.imageInstanceCounter[cl].push(max_id+1)
		return max_id+1


	}

	this.getIndicesClasses = function(indices){
		var indexClasses = []
		var idx
		for(i=0;i<indices.length;i++){
			idx = indices[i]
			indexClasses.push(this.class_tracker[idx])

		}

		return indexClasses
	}

	

	
	


}

function OutputFrame(frame) {
	this.fname = frame.fname;
	this.bounding_boxes = [];
	this.point_classes = frame.class_tracker;
	this.instance_counter = frame.instance_counter


	this.instance_ids = frame.instance_tracker
	this.class_colors = app.class_colors;
	this.class_order = app.class_order

	

	for (var i = 0; i < frame.bounding_boxes.length; i++) {
		this.bounding_boxes.push(frame.bounding_boxes[i].output());
	}





}


	
