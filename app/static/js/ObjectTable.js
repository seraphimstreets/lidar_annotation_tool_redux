

// method to add row to object id table


FRAMES_TABLE = "#frames-table"
OBJECT_TABLE = "#object-table"
BOXES_TABLE = "#boxes-table"
CLASS_TABLE = "#class-table"
IMAGE_OBJECT_TABLE = "#image-object-table"
ASSOCIATED_IMAGES_TABLE = "#associated-images-table"
ASSOCIATED_POINTCLOUDS_TABLE = "#associated-pointclouds-table"


function addFrameRow(fname) {
    $("{0} tbody".format(FRAMES_TABLE)).append(
        "<tr><td><div class='fname'>{0}</div></td></tr>".format(fname)
    );
}

function addBoxRow(cl, inst_id) {
    $("{0} tbody".format(BOXES_TABLE)).append(
        "<tr><td class='id'><div class='object_row object_row_id' id={0}>{1}:{2}</div></td> ".format(cl+inst_id,cl,inst_id)
    );
}

function addObjectRow(cl, inst_id) {
    $("{0} tbody".format(OBJECT_TABLE)).append(
        "<tr><td class='id'><div class='object_row object_row_id' id={0}>{1}:{2}</div></td> ".format(cl+inst_id,cl,inst_id)
    );
}

function addImageObjectRow(cl, inst_id) {
    $("{0} tbody".format(IMAGE_OBJECT_TABLE)).append(
        "<tr><td class='id'><div class='object_row object_row_id' id={0}>{1}:{2}</div></td> ".format(cl+inst_id,cl,inst_id)
    );
}

function addAssociatedImageRow(drivename, fname){
    $("{0} tbody".format(ASSOCIATED_IMAGES_TABLE)).append(
        "<tr><td class='id'><div class='object_row object_row_id' id={0}>{1}</div></td>"
        .format(drivename + '_' + fname, fname)
    );
}

function addAssociatedPointcloudsRow(fname, selected=false){
    if (selected){
        $("{0} tbody".format(ASSOCIATED_POINTCLOUDS_TABLE)).append(
            "<tr><td class='id'><div class='object_row object_row_id selected'>{0}</div></td>"
            .format(fname)
        );
    }else{
        $("{0} tbody".format(ASSOCIATED_POINTCLOUDS_TABLE)).append(
            "<tr><td class='id'><div class='object_row object_row_id'>{0}</div></td>"
            .format(fname)
        );
    }
 
}



function addClassRow(classification, color) {
    $("{0} tbody".format(CLASS_TABLE)).append(
        '<tr><td class="id"><label class="object_row object_row_id class_name">{0}</label></td> \
        <td><input type="color" value={1} class="class-color-picker" data-classification="{2}"></td>\
        <td class="object_row object_row_id show_class" data-classification="{3}">Show</td></tr>'
        .format(classification, color, classification, classification)
    );

    $(".class-color-picker").change((e) => {

        
        
        classification = $(e.target).attr("data-classification");

        color = $(e.target).val();
        
        app.updateClassColors(classification, color);
        if(app.cur_frame.cur_image){
            var indices = app.cur_frame.cur_image.getImageClassIndices(app.class_order[classification])
     
        
            $.ajax({
                url: '/changeClassColor',
                data: JSON.stringify({'classColors':app.class_colors, 'indices':indices, 
                'cl':app.class_order[classification], 'inst_id':-2, 'baseImage': $('#maskImage').attr('src'),
                'color':color}),
                type: 'POST',
                contentType: 'application/json;charset=UTF-8',
                success: function(response) {
                    
            
                
                    $('#maskImage').attr({'src':response})
                    $('#realImage').attr({'src':response})
                    app.cur_frame.fullMaskSrc = response
                    app.statusSaved = false;
            
                },
                error: function(error) {
                    console.log(error);
                }
            });
        }
       

    })

}

function modalMessage(message){
    $("#errorMessage").html(message)
    $("#errorBox").css({"display":"block"})

}

function addClassAdder(){
    $("{0} tbody".format(CLASS_TABLE)).append(
        "<tr> \
        <td><div class='object_row object_row_id' id='addClass'>+ Add Class</div></td></tr>" 
    );

    $('#addClass').click((e) => {
        $('#classAddPanel').css({'display':'block'})
    })

    $('#submitNewClass').click((e) => {
        var className, classColor
        className = document.getElementById('newClassName').value 
        
        classColor = $('#newClassColor').val();

        var existingClassNames = Object.keys(app.class_order)
        if(existingClassNames.includes(className)){
            console.log("Class name already in use!")
            $('#classAddPanel').css({'display':'none'})
            $("#errorMessage").html("Class name already in use!")
            $("#errorBox").css({"display":"block"})
            
            return
        }
        var existingClassColors = Object.keys(app.class_colors).map(function(key){
            return app.class_colors[key];

        });
        var ecc = []
        var rgb;
        for(var co of existingClassColors){
            console.log(co)
            rgb = magicWandTool.hexToRgb(co.substring(1), 1)
            ecc.push(rgb)
        }

        var cand_color = magicWandTool.hexToRgb(classColor.substring(1), 1)

        for(co of ecc){
            if(Math.abs(co[0] - cand_color[0]) < 3 && Math.abs(co[1] - cand_color[1]) < 3 && Math.abs(co[2] - cand_color[2]) < 3){
                console.log("Color selected is too similar to an existing class.")
                $('#classAddPanel').css({'display':'none'})
                $("#errorMessage").html("Color selected is too similar to an existing class.")
                $("#errorBox").css({"display":"block"})
                return
            }
        }
        var integers = [];
        classStrs = Object.keys(app.class_colors)
        for(i=0;i<classStrs.length;i++){
            integers.push(parseInt(classStrs[i]))
        }
       
        classNo = Math.max.apply(null, integers) + 1
      
       

        app.class_order[className] = classNo
        app.class_colors[classNo] = classColor
        if(app.cur_frame.cur_image){
            app.cur_frame.cur_image.imageInstanceCounter[classNo] = []
        }
        
        clearClassTable();
        loadClassTable();
        $('#classAddPanel').css({'display':'none'})

    })

   
}

$(FRAMES_TABLE).on("mousedown", "tbody tr", function() {
    var frameId = $(this).find('.fname').text();

    if(app.statusSaved){
        app.set_frame(frameId);
    }else{
        app.pending_frame = frameId
        $("#confirmSaveBox").css("display","block")
    }

    $("#saveYes").click(() => {
        $("#confirmSaveBox").css("display","none")
        if (app.cur_frame) {
			
			var output_frame = app.cur_frame.output();
		
			var output = {"frame": output_frame};
			var stringifiedOutput = JSON.stringify(output);

			console.log(output)
			
			$.ajax({
				url: '/writeOutput',
				data: JSON.stringify({output: {filename: app.cur_frame.fname, 
												file: stringifiedOutput}}),
				type: 'POST',
				contentType: 'application/json;charset=UTF-8',
				success: function(response) {

					app.statusSaved = true;
	
                    app.set_frame(app.pending_frame)
                    app.pending_frame = null;
                    
				},
				error: function(error) {
					console.log(error);
					modalMessage("Something went wrong while saving.")
				}
			});
		}
    })


    $("#saveNo").click(() => {
        $("#confirmSaveBox").css("display","none")
        app.set_frame(app.pending_frame)
        app.pending_frame = null;
        

    })
  
    
    $("{0} tbody tr".format(FRAMES_TABLE)).each(
        function(idx, elem) {
            unfocus_frame_row(elem);
        }
    );
    focus_frame_row($(this));


  
    
});

function focus_frame_row(frame) {
    $(frame).find(".fname").attr("selected", true);

}

function unfocus_frame_row(frame) {
    $(frame).find(".fname").attr("selected", false);
}

function unfocus_class_row(frame) {
    $(frame).find(".object_row_id").attr("selected", false);
}

function focus_object_row(frame) {
    $(frame).attr("selected", true);
}

function unfocus_object_row(frame) {
    $(frame).attr("selected", false);
    if ($(frame).find("input").length == 1) {
        var boxId = $(frame).find("input").val();
        $(frame).html(boxId);
       
    }
}


$(OBJECT_TABLE).on('mousedown', '.object_row_id', function(e) {
  
    if($(".object_row_id[selelcted=true]").length > 0){
        $(".object_row_id[selelcted=true]")[0].selected = false;
    }
    // $(".object_row_id").attr("selected", false);
    if (e.target != this) {return false;}
    app.cur_frame.unhighlightPoints()
    if(!($(this).attr("selected"))){
        var cl = $(this).text().split(":")[0]
        var inst_id = $(this).text().split(":")[1]
        $("#object-table td div").attr('selected', false)
        focus_object_row($(this));
        app.cur_frame.highlightPointsInst(cl, inst_id)


    }else{

        $("#object-table td div").attr('selected', false)
        app.cur_frame.unhighlightPoints()

    }
   
})

$(IMAGE_OBJECT_TABLE).on('mousedown', '.object_row_id', function(e) {
    
    if($(".object_row_id[selelcted=true]").length > 0){
        $(".object_row_id[selelcted=true]")[0].selected = false;
    }
    // $(".object_row_id").attr("selected", false);
    if (e.target != this) {return false;}
    app.cur_frame.unhighlightPoints()
    if(!($(this).attr("selected"))){
        var cl = $(this).text().split(":")[0]
        var inst_id = $(this).text().split(":")[1]
   
        $("#image-object-table td div").attr('selected', false)
   
        

        app.cur_frame.cur_image.fullMaskSrc = $('#maskImage').attr('src')
        focus_object_row($(this));
     
        
      
        imagePanel.highlightInstance(cl, inst_id)
        

   

    }else{
        $('#maskImage').attr('src', app.cur_frame.cur_image.fullMaskSrc)
        $('#realImage').attr('src', app.cur_frame.cur_image.fullMaskSrc)
        $("#image-object-table td div").attr('selected', false)
       

    }
   
})

$(ASSOCIATED_IMAGES_TABLE).on('mousedown', '.object_row_id', function(e) {
    
    if($(".object_row_id[selelcted=true]").length > 0){
        $(".object_row_id[selelcted=true]")[0].selected = false;
    }
    // $(".object_row_id").attr("selected", false);
    if (e.target != this) {return false;}
    imagePanel.removeCameraMarker()
    if(!($(this).attr("selected"))){
        
        var imagename = $(this).text()
        console.log(imagename)

        if (imagename == "Hide Image"){
            $("#associated-images-table td div").attr('selected', false)
            $("#imgBox").hide()
            return
        }

        $("#imgBox").show()
        var drivename = app.cur_frame.fname.split("/")[0]
        var img_path = "static/datasets/" + drivename + "/image/" + imagename
        
        $("#associated-images-table td div").attr('selected', false)
        app.cur_frame.activeImage = imagename
        
        focus_object_row($(this));
        frameImage = app.load_frame_image(img_path)
    

    }else{
  
        $("#associated-images-table td div").attr('selected', false)
       

    }
   
})



$(BOXES_TABLE).on('mousedown', '.object_row_id', function(e) {


    
   
    // $(".object_row_id").attr("selected", false);
    if (e.target != this) {return false;}

  
  
    if(!($(this).attr("selected"))){

        focus_object_row($(this));
        var box_id = $(this).text();
        var bbs = app.cur_frame.bounding_boxes;
        var bb;
        for(i=0;i<bbs.length;i++){
            bb = bbs[i]
            if(bb.id != box_id){
                hideBox(bb)
            }

        }
      
        

        
    }else{
        $("#boxes-table td div").attr('selected', false)
        clearSceneBB();
        repopulateSceneBB();
       

    }
   
})

$(ASSOCIATED_POINTCLOUDS_TABLE).on('mousedown', '.object_row_id', function(e) {
    $("#associated-pointclouds-table td div").attr('selected', false)

    if (e.target != this) {return false;}

  
  
    if(!($(this).attr("selected"))){
        
        var file_name = $(this).text()
        if(file_name == "ALL"){
            
            file_name =  app.cur_frame.fname
            console.log(file_name)
            app.set_frame(file_name, true)
            focus_object_row($(this));
            app.cur_frame.cur_pointcloud_name = "ALL"

        }else{
            console.log(app.cur_frame)
            var accum_obj = app.cur_frame.accum_object
            var point_counts = accum_obj['point_counts']
        
            var prev_idx = accum_obj["file_names"].indexOf(String(file_name))
            var next_idx = prev_idx + 1

            var transition_type = null
            console.log(app.cur_frame.cur_pointcloud_name)
            if(app.cur_frame.cur_pointcloud_name != "ALL"){
                transition_type = "subToSub"
            }else{
                transition_type = "ALLToSub"

            }


            app.cur_frame.cur_pointcloud_offset = [point_counts[prev_idx], point_counts[next_idx]]
            app.cur_frame.cur_pointcloud_name = file_name
            
            app.show_sub_pointcloud(app.cur_frame.fname.split('/')[0], file_name, [point_counts[prev_idx], point_counts[next_idx]], transition_type)
            

            focus_object_row($(this));

            if(activeTool){
                activeTool.reset()
            }
    
        }
       

    }else{
  
        $("#associated-pointclouds-table td div").attr('selected', false)
       

    }
   
})

$(CLASS_TABLE).on('mousedown', '.object_row_id', function(e) {
    
    if($(e.target).hasClass('class_name')){
        if(!classSelecting && !classEditing){
            var className = $(this).html();
            if(className == 'Default'){return;}
            classSelecting = true;
            $("#class-table td div").attr('selected', false);
            focus_object_row($(this));
            classOldName = className;
            
            return;
        }
        else if(classSelecting && !classEditing){
            var className = $(this).html();
            if(className == 'Default'){return;}
            if(classOldName != className){
                var row = $("#class-table tbody").find('td').filter(function() {
                    return $(this).text() == classOldName.toString();}).closest("tr");
          
                $("#class-table td div").attr('selected', false);
                focus_object_row($(this));
                classOldName = className;
                return
            }
            
            $(this).html("<input type='text' value='{0}'>".format(className));
            classEditing = true;
            classSelecting = false;
            classOldName = className;
        }else{
            $(this).attr('selected', false);
            classEditing = false;
            classSelecting = false;
        }
    }else if($(e.target).hasClass('show_class')){
        console.log($(this).attr("selected"))
        if(!($(this).attr("selected"))){
    
            focus_object_row($(this));
            var cl = $(this).attr("data-classification")
            updatePointCloudColorsFromClass(app.class_order[cl])
        }else{
          
            $(this).attr('selected', false);

            updatePointCloudColorsFromClasses()
        }
        
        
    }
   
    
});


// handler that saves input when input is changed
$("#object-table").on('change', 'tbody tr', updateObjectId);

// handler that is triggered when object table id is right-clicked
// $("#object-table").on('contextmenu', '.id', function() {
//     alert("hi");});


// method to update Box's object id
function updateObjectId() {
    var boxId, input, box;
   
    // console.log($(this).find("input").length);
    if ($(this).find("input").length == 1) {
        boxId = $(this).find("input").val();
        $(this).find(".object_row_id").html(boxId);
        console.log("input", boxId);
    }
    if ($(this).find("input").length == 0) {
        boxId = $(this).find(".id").text();
        console.log("not input", boxId);
    }
   
    box = getBoxById(boxId);
  
    if (box) {
        input = $(this).find('select').val();
        
        box.object_id = input;
        box.set_box_id(parseInt(boxId))

        box.add_timestamp();
    }
    
  
}


// method to get object id table row given id
function getRow(id) {
    var row = $("#object-table tbody").find('td').filter(function() {
        return $(this).text() == id.toString();}).closest("tr");
    return row;
}

// method to select row of object id table given ids
function selectRow(id) {
    var row = getRow(id);    
    $(row).find('select').get(0).focus();
}

function getFrameRow(id) {
    var row = $("{0}".format(FRAMES_TABLE)).find('.fname').filter(function() {
        return $(this).text() == id.toString();}).closest("tr");
    return row;
}

// removes row of object id table given corrensponding bounding box id
function deleteObjectRow(id) {

    var row = $("#" + id);
    row.remove();

   
}




function deleteClassRow(className) {
    var row = $("#class-table tbody").find('td').filter(function() {
        return $(this).text() == className.toString();}).closest("tr");

    row.remove();
}


function loadBoxesTable(){
    var bbs = app.cur_frame.bounding_boxes;
    var bb, cl, inst_id, full_id;
    for(i=0;i<bbs.length;i++){
        bb = bbs[i]
        full_id = bb.id.split(":")
        cl = full_id[0]
        inst_id = full_id[1]
        addBoxRow(cl, inst_id)
        
    }

}
function loadObjectTable(){
    var instance_counter = app.cur_frame.instance_counter
    var cl, cl_no, inst_id
    var classes = Object.keys(app.class_order)

    for(var i=0;i<classes.length;i++){
        cl = classes[i]
        cl_no = app.class_order[cl]
   
        if(instance_counter[cl_no]){
            for(var j=0;j<instance_counter[cl_no].length;j++){
                inst_id = instance_counter[cl_no][j].toString()
         
                addObjectRow(cl, inst_id)
            }
        }
        
    }
}

function loadImageObjectTable(){

    var instance_counter = app.cur_frame.cur_image.imageInstanceCounter
    var cl, cl_no, inst_id
    var classes = Object.keys(app.class_order)

    console.log(instance_counter)

    for(var i=0;i<classes.length;i++){
        cl = classes[i]
        cl_no = parseInt(app.class_order[cl])

        for(var j=0;j<instance_counter[cl_no].length;j++){
            inst_id = instance_counter[cl_no][j].toString()
      
            addImageObjectRow(cl, inst_id)
        }
    }

}

function loadAssociatedImagesTable(){

    var drivename = app.cur_frame.fname.split("/")[0]
    var accum_object = app.cur_frame.accum_object
   
    var images = accum_object['image_names']
    console.log(images)
    var imname;
    for(var i=0;i<images.length;i++){
        var imname = images[i]
        addAssociatedImageRow(drivename, imname)
    }

    $("{0} tbody".format(ASSOCIATED_IMAGES_TABLE)).append(
        "<tr><td class='id'><div class='object_row object_row_id' id='hideImage'>Hide Image</div></td>"
       
    );


}

function loadAssociatedPointcloudsTable(){
    var accum_object = app.cur_frame.accum_object
    var file_names = accum_object['file_names']
    addAssociatedPointcloudsRow('ALL', true)
    for(var i=0;i<file_names.length;i++){
        addAssociatedPointcloudsRow(file_names[i])
    }


}
function loadClassTable(){
    allClasses = Object.keys(app.class_order)
    for(var i=0;i<allClasses.length;i++){
        k = allClasses[i];
        cl = app.class_order[k]
        color = app.class_colors[cl]
        addClassRow(k, color)
        
    }
    addClassAdder()
}

function clearImageObjectTable() {
    $(IMAGE_OBJECT_TABLE).find('tbody tr').remove();
}

function clearObjectTable() {
    $(OBJECT_TABLE).find('tbody tr').remove();
}

function clearClassTable() {
    $(CLASS_TABLE).find('tbody tr').remove();
}

function clearAssociatedImagesTable(){
    $(ASSOCIATED_IMAGES_TABLE).find('tbody tr').remove();
}

function clearAssociatedPointcloudsTable(){
    $(ASSOCIATED_POINTCLOUDS_TABLE).find('tbody tr').remove();
}

function clearBoxesTable(){
    $(BOXES_TABLE).find('tbody tr').remove();
}

// gets box given its id
function getBoxById(id) {
    if (!app.cur_frame) return;
    var boundingBoxes = app.cur_frame.bounding_boxes;
    for (var i = 0; i < boundingBoxes.length; i++) {
        if (boundingBoxes[i].id == id) {
            return boundingBoxes[i];
        }
    }
    return null;
}