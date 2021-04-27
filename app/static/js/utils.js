if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    };
  }

//mathematical functions
function calculateMean(arr) {
    var total = 0;
    for (var i = 0; i< arr.length; i++) {
        total += arr[i];
    }
    return total / arr.length;
}
function standardDeviation(arr) {
    var mean = calculateMean(arr);
    var variance = 0;
    for (var i = 0; i < arr.length; i++) {
        variance += Math.pow(arr[i] - mean, 2);
    }
    variance = variance / arr.length;
    return Math.pow(variance, 0.5);
}

function filter(arr, mean, thresh) {
    var result = [];
    for (var i = 0; i< arr.length; i++) {
        if (Math.abs(arr[i] - mean) < thresh) {
            result.push(arr[i]);
        }
    }
    return result;
}



function getMinElement(arr) {
    var min = Number.POSITIVE_INFINITY;
    for (var i = 0; i< arr.length; i++) {
        if (arr[i] < min) {
            min = arr[i];
        }
    }
    return min;
}





function getMaxElement(arr) {
    var max = Number.NEGATIVE_INFINITY;
    for (var i = 0; i< arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}


function getCenter(v1, v2) {
    return new THREE.Vector3((v1.x + v2.x) / 2.0, (v1.y + v2.y) / 2.0, (v1.z + v2.z) / 2.0);
}


function getOppositeCorner(idx) {
    if (idx == 0) {return 1;}
    if (idx == 1) {return 0;}
    if (idx == 2) {return 3;}
    if (idx == 3) {return 2;}
    if (idx == 4) {return 5;}
    if (idx == 5) {return 4;}
    if (idx == 6) {return 9;}
    if (idx == 9) {return 6;}
    if (idx == 7) {return 8;}
    if (idx == 8) {return 7;}
    return 2;
}



function clearThree(obj){
    while(obj.children.length > 0){ 
      clearThree(obj.children[0])
      obj.remove(obj.children[0]);
    }
    if(obj.geometry) obj.geometry.dispose()
  
    if(obj.material){ 
      //in case of map, bumpMap, normalMap, envMap ...
      Object.keys(obj.material).forEach(prop => {
        if(!obj.material[prop])
          return         
        if(obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')                                  
          obj.material[prop].dispose()                                                        
      })
      obj.material.dispose()
    }
  }   



function rotate(v1, v2, angle) {
    center = getCenter(v1, v2);
    v1.sub(center);
    v2.sub(center);
    var temp1 = v1.clone();
    var temp2 = v2.clone();
    v1.x = Math.cos(angle) * temp1.x - Math.sin(angle) * temp1.z;
    v2.x = Math.cos(angle) * temp2.x - Math.sin(angle) * temp2.z;

    v1.z = Math.sin(angle) * temp1.x + Math.cos(angle) * temp1.z;
    v2.z = Math.sin(angle) * temp2.x + Math.cos(angle) * temp2.z;

    v1.add(center);
    v2.add(center);
    
}

function distance2D(v1, v2) {
    return Math.pow(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.z - v2.z, 2), 0.5)
}

function closestPoint(p, vertices) {
    var shortestDistance = Number.POSITIVE_INFINITY;
    var closestIdx = null;
    for (var i = 0; i < vertices.length; i++) {
        if (p.distanceTo(vertices[i]) < shortestDistance) {
            shortestDistance = p.distanceTo(vertices[i]);
            closestIdx = i;
        }
    }
    return closestIdx;
}
  

function generateRandomNewColor() {
    used_colors = app.class_colors.values();
    while(true){
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
        }
        
        if(!used_colors){
            return color;
        }

        if(!(color in used_colors)){
            return color;
        }

        
    }
    
  }



function parsePythonJSON(json) {
	return JSON.parse(json.split("\'").join("\""));
}


// gets 2D mouse coordinates
function updateMouse( event ) {
    event.preventDefault();
    mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function get3DCoord(event, optionalZ = 0) {
   
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.z = optionalZ;
    mouse.unproject( camera );


    var dir = mouse.sub( camera.position ).normalize();

   
    var distance = - camera.position.y / dir.y;
   
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
  
 
    return pos;
}



/* Gets the 3D cursor position that is projected onto the z plane */
function getCurrentPosition() {
    var temp = new THREE.Vector3(mouse2D.x, mouse2D.y,  0);
    temp.unproject( camera );
    var dir = temp.sub( camera.position ).normalize();
    var distance = - camera.position.y / dir.y;
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    return pos;
}

function mouseToScreen(x, y) {
    var temp = new THREE.Vector3(x, y,  0);
    temp.unproject( camera );
    var dir = temp.sub( camera.position ).normalize();
    var distance = - camera.position.y / dir.y;
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    return pos;
}

function pointToScreen(point){
    var width = window.innerWidth, height = window.innerHeight;
    var widthHalf = width / 2, heightHalf = height / 2;

    pos = point.clone()
    camera.updateMatrixWorld();
    pos.project(camera);
    
    
    
    pos.x = ( pos.x * widthHalf ) + widthHalf;
    pos.y = - ( pos.y * heightHalf ) + heightHalf;
    
    return pos
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
}



function eventFire(el, etype){
    if (el.fireEvent) {
      el.fireEvent('on' + etype);
    } else {
      var evObj = document.createEvent('Events');
      evObj.initEvent(etype, true, false);
      el.dispatchEvent(evObj);
    }
  }
  
  function pathJoin(parts, sep){
     var separator = sep || '/';
     var replace   = new RegExp(separator+'{1,}', 'g');
     return parts.join(separator).replace(replace, separator);
  }
