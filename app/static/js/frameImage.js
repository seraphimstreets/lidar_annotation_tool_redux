function FrameImage(baseImage, pixelClasses, pixelInsts){

	
	this.baseImage = ""
    this.pixelClass = [];
	this.pixelInst = [];
	this.imageInstanceCounter = {};
	this.imageHistory = []
	this.fullMaskSrc = ""


	// for(var i=0; i<classes.length; i++){
	// 	cl = classes[i]
	// 	this.imageInstanceCounter[cl] = []
		
	// }

	// for(i=0;i<keys.length;i++){
	// 	k = keys[i]
	// 	insts = iic[k]
		
	// 	this.imageInstanceCounter[parseInt(k)] = insts
		
	// }
	this.baseImage = baseImage;
	this.pixelClass = pixelClasses;
	this.pixelInst = pixelInsts;

	this.getImageClassIndices = function(cl){
		var indices = [];
		for(i=0;i<this.pixelClass.length;i++){
			if(this.pixelClass[i] == cl){
				indices.push(i)
			}
		}

		return indices
	}

	

	this.updatePixelStore = function(classification, instance_id, new_instance=false, onlyClass=-2, brightnessThresh=false){

		var maskInfo = imagePanel.realInfo;
		var maskData = maskInfo.data
		var numPixels = maskInfo.width * maskInfo.height
		var brightness;

		if(brightnessThresh){
			var img = $("#realImage")[0]
			var tempCanvas = document.createElement("canvas")
			
			tempCanvas.width = img.width
			tempCanvas.height = img.height
			tempCanvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height)
			var baseData = tempCanvas.getContext('2d').getImageData(0,0,img.width, img.height).data
	
		}

		var targetColor = magicWandTool.hexToRgb(app.class_colors[classification].substring(1), 1);


		if(this.pixelClass.length == 0){
			for(i=0;i<numPixels;i++){
				this.pixelClass.push(0)
				this.pixelInst.push(-1)
			}
		}

	

		
		for(i=0;i<numPixels;i++){
	
			
			if(Math.abs(maskData[i*4] - targetColor[0]) < 2 & Math.abs(maskData[i*4+1] - targetColor[1]) < 2
				& Math.abs(maskData[i*4+2] - targetColor[2]) < 2){

				if(brightnessThresh){
					brightness =  0.2126 * baseData[i*4] + 0.7152 * baseData[i*4+1]  + 0.0722 * baseData[i*4+2]
			
					if (brightness < brightnessThresh){
						continue
					}
				}
			
				if(onlyClass != -2){
					if (this.pixelClass[i] == onlyClass){
						this.pixelClass[i] = classification;
						this.pixelInst[i] = instance_id;
					} 
				}else{
					this.pixelClass[i] = classification;
					this.pixelInst[i] = instance_id;
				}
			
		
			
			}
			
		}


		
			

	}

	this.createDefault = function(){
		
		var numPixels = imagePanel.origWidth * imagePanel.origHeight
		if(this.pixelClass.length == 0){
            for(i=0;i<numPixels;i++){
                this.pixelClass.push(0)
                this.pixelInst.push(-1)
            }
        }

        var class_names = Object.keys(app.class_colors) 
            for(i=0;i<class_names.length;i++){
                this.imageInstanceCounter[class_names[i]] = []
            }
   
        
	}

	this.loadImageInstanceCounter = function(instance_counter){
        var cl;
        var classes = Object.keys(instance_counter);
        for(i=0;i<classes.length;i++){
            cl = classes[i]
            this.imageInstanceCounter[cl] = instance_counter[cl]
        }

    }

	this.updatePixels = function(origClass, newClass){
		var numPixels = origWidth * origHeight
		for (i=0;i<numPixels;i++){
			if(this.pixelClass[i] == origClass){
				this.pixelClass[i] = newClass;
				if(newClass == 0){
					this.pixelInst[i] = -1
				}
			}
		}
	}

	this.build_new_image_instance_tracker = function(){
		var classes = this.pixelClass
		var instance_ids = this.pixelInst
		var tracker = {}
		var class_nums = Object.keys(app.class_colors)
		for(var i=0;i<class_nums.length;i++){
			tracker[class_nums[i]] = []
			
		}
		var cl, inst_id
		for(var i=0;i<classes.length;i++){
			
			inst_id = instance_ids[i]
			if(inst_id != -1){
				cl = classes[i]
				if(!(tracker[cl].includes(inst_id))){
					tracker[cl].push(inst_id)
				}
			}
		
		}
		
		for(var i=0;i<class_nums.length;i++){
			tracker[class_nums[i]] = tracker[class_nums[i]].sort()
		}
			

		this.imageInstanceCounter = tracker

		return tracker
	}
}