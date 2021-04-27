

function normalizeColors(vertices, color) {
    var maxColor = Number.NEGATIVE_INFINITY;
    var minColor = Number.POSITIVE_INFINITY;
    var intensities = [];
    var normalizedIntensities = [];
    var colors = app.cur_pointcloud.geometry.colors;
    intensity_colors = [];
    k = 0;
    
    // finds max and min z coordinates
    for ( var i = 0, l = vertices.length / DATA_STRIDE; i < l; i ++ ) {
        if (vertices[ DATA_STRIDE * k + 2] > maxColor) {
            maxColor = vertices[ DATA_STRIDE * k + 2];
        }
        if (vertices[ DATA_STRIDE * k + 2] < minColor) {
            minColor = vertices[ DATA_STRIDE * k + 2];
        }
        intensities.push(vertices[ DATA_STRIDE * k + 2]);
        k++;
    }
    app.cur_frame.intensity_tracker = intensities;
    mean = calculateMean(intensities);
    sd = standardDeviation(intensities);
    filteredIntensities = filter(intensities, mean, 1 * sd);
    min = getMinElement(filteredIntensities);
    max = getMaxElement(filteredIntensities);

    var intensity;
    for ( var i = 0;  i < app.cur_pointcloud.geometry.vertices.length; i ++ ) {
        intensity = intensities[i];
        if (i < intensities.length) {
            if (intensities[i] - mean >= 2 * sd) {
                intensity = 1;
            } else if (mean - intensities[i] >= 2 * sd) {
                intensity = 0;
            } else {
                intensity = (intensities[i] - min) / (max - min);
            }
        } else {
            intensity = 0;
        }
        new_c = colors[i].clone()
        new_c.setRGB(intensity, 0, 1 - intensity);
        new_c.multiplyScalar(intensity * 5);   
        intensity_colors.push(new_c) 
        
    }
    
    return intensity_colors;
}

function highlightPoints(indices) {
    var pointcloud = app.cur_pointcloud;
    for (var j = 0; j < indices.length; j++) {
        pointcloud.geometry.colors[indices[j]] = new THREE.Color(0x00ff6b);
    }
    pointcloud.geometry.colorsNeedUpdate = true;

}

function generateNewPointCloud( vertices, ocolor, class_arr, inst_arr, subset=false) {
    var geometry = new THREE.Geometry();
    var colors = [];
    var k = 0;
    var co, r, color_obj, kehs; 


    var pointSize = app.globalPointSize;

    

    var color_obj = {}
    var kehs = Object.keys(app.class_colors)
    var r, bc, co, v;
   
    for (var i=0;i<kehs.length;i++){
        r = parseInt(kehs[i])
        color_obj[r] = new THREE.Color(app.class_colors[r])
        
    }

    // keeping track of y values for orthographic/perspective projection
    app.cur_frame.ys = []

  

    // 
 
    for ( var i = 0, l = vertices.length / DATA_STRIDE; i < l; i ++ ) {
        
        // creates new vector from a cluster and adds to geometry
        // note that z-values are converted to y-values (and y => x, x => z) here for visualization purposes. 
        x = vertices[ DATA_STRIDE * k + 1 ]
        y = vertices[ DATA_STRIDE * k + 2 ]
        z = vertices[ DATA_STRIDE * k ]



        app.cur_frame.ys.push(y)


        // picking colors based on class

        if(class_arr.length > 0){
            bc = class_arr[k]
        }else{
            bc = 0
         
        }

 
        co = color_obj[bc]

        if(!co){
            co = color_obj[0]
            app.cur_frame.class_tracker[k] = 0
            app.cur_frame.instance_tracker[k] = -1
        }

        var v = new THREE.Vector3(x, y, z);

     
        geometry.vertices.push( v );

        colors.push(co.clone());
       
        k++;

    }
    
    geometry.colors = colors;
    geometry.computeBoundingBox();
    
    var material = new THREE.PointsMaterial( { size: pointSize, sizeAttenuation: false, vertexColors: THREE.VertexColors } );
    var pointcloud = new THREE.Points( geometry, material );

    app.cur_pointcloud = pointcloud;
    app.cur_pointcloud.geometry.colorsNeedUpdate = true;

    var intensity_colors = normalizeColors(vertices, ocolor);
    //get intensity_colors and save them
    app.cur_frame.intensity_colors = intensity_colors;
    
    
    
    return pointcloud;
}

function updatePointCloud( vertices, color ) {
    var k = 0;
    var n = vertices.length;
    var l = app.cur_pointcloud.geometry.vertices.length;
    var geometry = app.cur_pointcloud.geometry
    var v;
    for ( var i = 0; i < n / DATA_STRIDE; i ++ ) {
        if (i >= l) {
            v = new THREE.Vector3( vertices[ DATA_STRIDE * k + 1 ], 
                app.cur_frame.ys[k], vertices[ DATA_STRIDE * k ] );
            geometry.vertices.push(v);
            geometry.colors.push(color.clone());

            // stores y coordinates into yCoords
            // app.cur_frame.ys.push(vertices[ DATA_STRIDE * k + 2 ]);
            geometry.verticesNeedUpdate = true;
            geometry.colorsNeedUpdate = true;
        } else {
            v = geometry.vertices[k];
            v.setX(vertices[ DATA_STRIDE * k + 1 ]);
            v.setY(app.cur_frame.ys[k]);
            v.setZ(vertices[ DATA_STRIDE * k ]);
            geometry.verticesNeedUpdate = true;
        }
        k++;
    }
    normalizeColors(vertices, null);
    geometry.computeBoundingBox();
   
    if (app.cur_frame != null && app.cur_frame.mask_rcnn_indices.length > 0) {
        highlightPoints(app.cur_frame.mask_rcnn_indices);
    }

    return app.cur_pointcloud;


}

// color certain indices of pointcloud 

function updatePointCloudColors(indices, color){
    console.log(indices)
    console.log(color)
    color = new THREE.Color(color)
    var offset = app.cur_frame.cur_pointcloud_offset[0]
   

    pc_colors = app.cur_pointcloud.geometry.colors

    for(i=0;i<indices.length;i++){
        idx = indices[i] - offset

        pc_colors[idx] = color;
    }

    

    app.cur_pointcloud.geometry.colorsNeedUpdate = true;
    
}


//color pointcloud based on class_tracker

function updatePointCloudColorsFromClasses(offsets=[0, app.cur_frame.class_tracker.length]){

    //convert hexadecimal colors into THREE colors and store in new object.
    color_obj = {}
    kehs = Object.keys(app.class_colors)
    for (i=0;i<kehs.length;i++){
        k = kehs[i]
        color_obj[k] = new THREE.Color(app.class_colors[k])
    }

    console.log(color_obj)

    pc_colors = app.cur_pointcloud.geometry.colors
    point_tracker = app.cur_frame.class_tracker.slice(app.cur_frame.cur_pointcloud_offset[0], app.cur_frame.cur_pointcloud_offset[1])
    var c
    for(i=0;i<pc_colors.length;i++){
        //get the class of each point
        point_class = point_tracker[i]
        //assign each point a color based on their class
        c = color_obj[point_class]
        if(!c){
            console.log(point_class)
            c = color_obj[0]
            
        }
        pc_colors[i] = c
    }
    

    app.cur_pointcloud.geometry.colorsNeedUpdate = true;
}


//show only a certain class, other points are colored black

function updatePointCloudColorsFromClass(cl, offsets=[0, app.cur_frame.class_tracker.length]){

    color_obj = {}
    kehs = Object.keys(app.class_colors)
    for (i=0;i<kehs.length;i++){
        k = kehs[i]
        color_obj[k] = new THREE.Color(app.class_colors[k])
    }
    BLACK_COLOR = new THREE.Color("#000000")

    pc_colors = app.cur_pointcloud.geometry.colors
    point_tracker = app.cur_frame.class_tracker.slice(app.cur_frame.cur_pointcloud_offset[0], app.cur_frame.cur_pointcloud_offset[1])

    for(i=0;i<pc_colors.length;i++){
        //get the class of each point
        point_class = point_tracker[i]
        if(point_class == cl){
            pc_colors[i] = color_obj[point_class]
        }else{
            pc_colors[i] = BLACK_COLOR
        }
    }
    

    app.cur_pointcloud.geometry.colorsNeedUpdate = true;

}

//all points are colored the default color

function decolorisePointcloud(){

    color_obj = {}
    kehs = Object.keys(app.class_colors)
    for (i=0;i<kehs.length;i++){
        k = kehs[i]
        color_obj[k] = new THREE.Color(app.class_colors[k])
    }


    pc_colors = app.cur_pointcloud.geometry.colors


    for(i=0;i<pc_colors.length;i++){
      
        pc_colors[i] = color_obj[0]
        
    }
    

    app.cur_pointcloud.geometry.colorsNeedUpdate = true;

}

//color pointcloud based on intensity
function updatePointCloudColorsFromIntensity(){
    
    pc_colors = app.cur_pointcloud.geometry.colors
    intensity_colors = app.cur_frame.intensity_colors
 

    for(i=0;i<pc_colors.length;i++){
        
        pc_colors[i] = intensity_colors[i]
    }

    app.cur_pointcloud.geometry.colorsNeedUpdate = true;
}