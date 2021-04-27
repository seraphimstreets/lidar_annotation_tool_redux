$(document).ready(() => {

    // $("#minXRange")[0].oninput =  () => {
    //     $("#minXRange").blur()
    //     $("#minXVal")[0].innerHTML = $("#minXRange")[0].value
    //     // $("#minXRange").prop({
           
    //     //     max: $("#maxXRange")[0].value
    //     //   });
        
    //     if(app.cur_frame.potential_bounding_boxes != []){
    //         var box = app.cur_frame.potential_bounding_boxes[0]
    //         box.resizeManual(parseFloat($("#minXRange")[0].value), 'min', 'x')
    //     }
    // }

    // $("#maxXRange")[0].oninput =  () => {
    //     $("#maxXRange").blur()
    //     $("#maxXVal")[0].innerHTML = $("#maxXRange")[0].value
    //     // $("#maxXRange").prop({
    //     //     min: $("#minXRange")[0].value

    //     //   });
    //     if(app.cur_frame.potential_bounding_boxes != []){
    //         var box = app.cur_frame.potential_bounding_boxes[0]
    //         box.resizeManual(parseFloat($("#maxXRange")[0].value), 'max', 'x')
    //     }
    // }

    // $("#minYRange")[0].oninput =  () => {
    //     $("#minYRange").blur()
    //     $("#minYVal")[0].innerHTML = $("#minYRange")[0].value
    //     // $("#minYRange").prop({
           
    //     //     max: $("#maxYRange")[0].value
    //     //   });
        
    //     if(app.cur_frame.potential_bounding_boxes != []){
    //         var box = app.cur_frame.potential_bounding_boxes[0]
    //         box.resizeManual(parseFloat($("#minYRange")[0].value), 'min', 'y')
    //     }
    // }

    // $("#maxYRange")[0].oninput =  () => {
    //     $("#maxYRange").blur()
    //     $("#maxYVal")[0].innerHTML = $("#maxYRange")[0].value
    //     // $("#maxYRange").prop({
    //     //     min: $("#minYRange")[0].value

    //     //   });
    //     if(app.cur_frame.potential_bounding_boxes != []){
    //         var box = app.cur_frame.potential_bounding_boxes[0]
    //         box.resizeManual(parseFloat($("#maxYRange")[0].value), 'max', 'y')
    //     }
    // }

    // $("#minZRange")[0].oninput =  () => {
    //     $("#minZRange").blur()
    //     $("#minZVal")[0].innerHTML = $("#minZRange")[0].value
    //     // $("#minZRange").prop({
           
    //     //     max: $("#maxZRange")[0].value
    //     //   });
        
    //     if(app.cur_frame.potential_bounding_boxes != []){
    //         var box = app.cur_frame.potential_bounding_boxes[0]
    //         box.resizeManual(parseFloat($("#minZRange")[0].value), 'min', 'z')
    //     }
    // }

    // $("#maxZRange")[0].oninput =  () => {
    //     $("#maxZRange").blur()
    //     $("#maxZVal")[0].innerHTML = $("#maxZRange")[0].value
    //     // $("#maxZRange").prop({
    //     //     min: $("#minZRange")[0].value

    //     //   });
    //     if(app.cur_frame.potential_bounding_boxes != []){
    //         var box = app.cur_frame.potential_bounding_boxes[0]
    //         box.resizeManual(parseFloat($("#maxZRange")[0].value), 'max', 'z')
    //     }
    // }

   

    $("#yawRange")[0].oninput =  () => {
        $("#yawVal")[0].innerHTML = $("#yawRange")[0].value
     
        if(app.cur_frame.potential_bounding_boxes != []){
            var box = app.cur_frame.potential_bounding_boxes[0]
            box.rotateManual('y', $("#yawRange")[0].value)
        }
    }

    // $("#rollRange")[0].oninput =  () => {
    //     $("#rollRange").blur()
    //     $("#rollVal")[0].innerHTML = $("#rollRange")[0].value
     
    //     if(app.cur_frame.potential_bounding_boxes != []){
    //         var box = app.cur_frame.potential_bounding_boxes[0]
    //         box.rotateManual('z', $("#rollRange")[0].value)
    //     }
    // }

    // $("#pitchRange")[0].oninput =  () => {
    //     $("#pitchRange").blur()
    //     $("#pitchVal")[0].innerHTML = $("#pitchRange")[0].value
     
    //     if(app.cur_frame.potential_bounding_boxes != []){
    //         var box = app.cur_frame.potential_bounding_boxes[0]
    //         box.rotateManual('x', $("#pitchRange")[0].value)
    //     }
    // }

})