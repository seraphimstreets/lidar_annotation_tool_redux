// controller for resizing, rotating, translating, or hovering boxes and points


function write_frame_out() {
    app.write_frame_out();

}

function minimizeModule(e){
    var $cont = $(e.target).parents("thead").next("tbody");
    $cont.slideToggle("slow");
}




function intensityToggle(e){
    chk = $("#intensityFilter")[0].checked
    if(chk){
        updatePointCloudColorsFromIntensity()
        this.intensity_mode = true;

    }else{
        updatePointCloudColorsFromClasses()
        this.intensity_mode = false;

    }	
}

function projPointcloudOnImage( event ){
    console.log($(event.target).attr('clicked'))
    if ($(event.target).attr('clicked') == "true"){
        $('#container').show()
        $('#projimage').hide()
        $('#proj2D, #proj2D i').attr({'clicked':false})
    } else {
        app.proj_pointcloud_on_img() 
    }
    
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function rangenetHandler(e){
    app.toggleStatusText(true)
    $.ajax({
        url: '/useRangenet',
        data: JSON.stringify({"filename":app.cur_frame.fname}),
        type: 'POST',
        contentType: 'application/json;charset=UTF-8',
        success: function(response) {

            var fnn = app.cur_frame.fname
            app.cur_frame = null;
            app.set_frame(fnn);
            
            app.toggleStatusText(false)
            
        },
        error: function(error) {
            console.log(error);
            
        }  
    });
}


function settingsHandler(e){
    $("#dialog-box").css({"display":"block"})
    var currentPointsSize = app.cur_pointcloud.material.size
    $("#pointSizeRange").attr("val", currentPointsSize)
    $("#pointSizeVal").html(currentPointsSize.toString())
    // $("#pointSizeVal").html(currentPointsSize)
    $(document).on('input', '#pointSizeRange', (e) => {
        var id = e.target.id
        var newId = id.replace('Range', 'Val')
       
        $(e.target).blur()
        $('#' + newId).html(e.target.value)
       
        
    })

    $("#submitSettings").click(() => {
        var newPointSize = $("#pointSizeRange").val()

        $("#dialog-box").css({"display":"none"})
        app.globalPointSize = newPointSize
        clearThree(scene)

        generateNewPointCloud(app.cur_frame.data, COLOR_RED, app.cur_frame.class_tracker, app.cur_frame.instance_tracker);
        scene.add( app.cur_pointcloud )
        animate();
    })
}



function projectOntoXZ() {
    var count = 0;
    var colors = app.cur_pointcloud.geometry.colors;
    for (var i = 0; i < app.cur_pointcloud.geometry.vertices.length; i++) {
        var v = app.cur_pointcloud.geometry.vertices[i];
        if (colors[i].b > colors[i].r) {
            count += 1;
            v.y = -0.001;
        } else {
            v.y = 0;
        }
    }
    app.cur_pointcloud.geometry.verticesNeedUpdate = true;

    controls.maxPolarAngle = 0;
    controls.minPolarAngle = 0;
    controls.update();
    app.globalViewMode = "orthographic"
    $( '#orthographic-mode' ).blur()

}

function unprojectFromXZ() {
    if (app.cur_frame) {
        console.log("unproject");
        for (var i = 0; i < app.cur_pointcloud.geometry.vertices.length; i++) {
            var v = app.cur_pointcloud.geometry.vertices[i];
            v.y = app.cur_frame.ys[i];
        }
        app.cur_pointcloud.geometry.verticesNeedUpdate = true;
    } 

    controls.maxPolarAngle = 2 * Math.PI;
    controls.minPolarAngle = -2 * Math.PI;
    controls.update();
    app.globalViewMode = "perspective"
    $( '#perspective-mode' ).blur()
}


function switchMoveMode() {
    eventFire(document.getElementById('move'), 'click');
}

function switch2DMode() {
    eventFire(document.getElementById('move2D'), 'click');
}

function changeActiveTool(e){
    e.preventDefault()
    console.log(e)
    if(activeTool){
        activeTool.reset()
    }

    $(".toolBtn.selected").removeClass("selected")
    $(e.currentTarget).addClass('selected')

    activeToolStr = $(e.currentTarget).attr('id')
    console.log(activeToolStr)
    activeTool = allTools[activeToolStr]
    activeTool.init()

}

function mouseDownHandler(e){
    e.preventDefault()
    if(activeTool){
        activeTool.handleMouseDown(e)
    }
    
}

function mouseUpHandler(e){
    e.preventDefault()
    if(activeTool){
        activeTool.handleMouseUp(e)
    }
}

function mouseMoveHandler(e){
    e.preventDefault()
    updateMouse(e)
    if(activeTool){ 
        activeTool.handleMouseMove(e)
    }
}

function keyDownHandler(e){
    
   if(e.target.localName == 'input'){
       return
   }
    e.preventDefault()
    if(activeTool){
        activeTool.handleKeyDown(e)
    }
}

function keyUpHandler(e){
    if(e.target.localName == 'input'){
        return
    }
    e.preventDefault()
    if(activeTool){
        activeTool.handleKeyUp(e)
    }
}

function submitHandler(e){
    
    e.preventDefault()
    if(app.intensity_mode){
        return;
    }
    if(activeTool){
        console.log(activeTool.handleSubmit)
        activeTool.handleSubmit(e)
    }
}

function miscKeyDownHandler(e){

    if((e.keyCode == 46 || e.keyCode == 8) && classSelecting){
     
        app.removeClass(classOldName);
        
        return;
    }

    if((e.keyCode == 46 || e.keyCode == 8)){
        var selected_image_instance = $("#image-object-table td div[selected]")
        var selected_box = $("#boxes-table td div[selected]")
        var selected_object = $("#object-table td div[selected]")

        console.log(selected_image_instance)
        if(selected_image_instance.length > 0){
      
            var strang = $(selected_image_instance).text()
            var cl = strang.split(":")[0]
            var inst_id = strang.split(":")[1]
            app.cur_frame.removeImageInst(cl, inst_id);
            clearImageObjectTable();
            loadImageObjectTable();
            app.save_and_load_image();
        }else if(selected_object.length > 0){
            var object_id = $(selected_object).text()
            var cl = object_id.split(":")[0]
            var inst_id = object_id.split(":")[1]
            app.removeInst(cl, inst_id)
            app.statusSaved = false;
        }else if (selected_box.length > 0){
            var box_id = $(selected_box).text()
            deleteBox(box_id)
            app.statusSaved = false;

        }

        

    }
 
    if(e.ctrlKey && e.keyCode == 90){
        app.cur_frame.restorePC()
        app.statusSaved = false;
    }

    if(e.ctrlKey && e.keyCode == 88){
        app.cur_frame.restoreImage()
        app.statusSaved = false;
    }


    
    
    if(e.keyCode == 13 && classEditing){
        var impetus = $('#class-table .object_row_id input');
        console.log(impetus)
        if(impetus.length != 0){
            var classNewName = $(impetus[0]).val()
            
            app.class_order[classNewName] = app.class_order[classOldName]
            delete app.class_order[classOldName]
            var par = $(impetus[0]).parent()
            console.log(par)
            par.empty()
            par.html(classNewName)
            classEditing = false;
            unfocus_object_row(par);
            app.statusSaved = false;
        }
    }
    return;
}


function showPointImageHandler(e){
    e.preventDefault()
    console.log("here?")
    var nname;
    var fname = app.cur_frame.fname
    if($("#frameImage").attr('src') == 'static/images/' + fname + '.png'){
        
    
        app.proj_pointcloud_on_img()

        $("#frameImage").css({"z-index":4})
    
        
    }else{
        $("#frameImage").attr({'src':'static/images/' + fname + '.png'}) 

        $("#frameImage").css({"z-index":1})

    }
}   

function autoSegmentHandler(e){
    app.toggleStatusText(true)
    $.ajax({
        url: '/segmentModel',
        data: JSON.stringify({"baseImage": $('#frameImage').attr('src'), "fname":app.cur_frame.fname}),
        type: 'POST',
        contentType: 'application/json;charset=UTF-8',
        success: function(response) {

            
            
            app.load_frame_image($('#frameImage').attr('src'));
            app.toggleStatusText(false)

            
        },
        error: function(error) {
            console.log(error);
        }
    });
}