class MagicWandTool extends GenericTool{

    constructor(){
        super();
        this.colorThreshold = 15;
        this.blurRadius = 5;
        this.simplifyTolerant = 0;
        this.simplifyCount = 30;
        this.hatchLength = 4;
        this.hatchOffset = 0;

       
        this.cacheInd = null;
        this.mask = null;
        this.oldMask = null;
        this.downPoint = null;
        this.allowDraw = false;
        this.addMode = false;
        this.currentThreshold = this.colorThreshold;
        this.beginDraw = false;

        this.norm_polygon = null;
        this.raw_polygon = null;

    }

  

    init(e) {
        imagePanel.updateImageData()
        
        return
    }

    

    handleMouseDown(e) {
        if(!this.beginDraw) return;
        
        if ($(e.target).attr('id') != "imgCanvas") return;
        if (e.button == 0) {
            this.allowDraw = true;
            this.addMode = e.ctrlKey;
            this.downPoint = this.getMousePosition(e);
            
            this.drawMask(this.downPoint.x, this.downPoint.y);
        } else { 
            this.allowDraw = false;
            this.addMode = false;
            this.oldMask = null;
        }
    }

    handleMouseMove(e) {
        if(!this.beginDraw) return;
        if ($(e.target).attr('id') != "imgCanvas") return;
        if (this.allowDraw) {
            var p = this.getMousePosition(e);
            if (p.x != this.downPoint.x || p.y != this.downPoint.y) {
                var dx = p.x - this.downPoint.x,
                    dy = p.y - this.downPoint.y,
                    len = Math.sqrt(dx * dx + dy * dy),
                    adx = Math.abs(dx),
                    ady = Math.abs(dy),
                    sign = adx > ady ? dx / adx : dy / ady;
                sign = sign < 0 ? sign / 5 : sign / 3;
                var thres = Math.min(Math.max(this.colorThreshold + Math.floor(sign * len), 1), 255);
                //var thres = Math.min(colorThreshold + Math.floor(len / 3), 255);
                if (thres != this.currentThreshold) {
                    this.currentThreshold = thres;
                    this.drawMask(this.downPoint.x, this.downPoint.y);
                }
            }
        }
    }

    handleMouseUp(e) {
        if(!this.beginDraw) return;
        if ($(e.target).attr('id') != "imgCanvas") return;
        this.allowDraw = false;
        this.addMode = false;
        this.oldMask = null;
        this.currentThreshold = this.colorThreshold;
    }

    handleKeyDown(e){
        var keyID = e.keyCode;
       
        switch(keyID)
        {
            case 66: // b key
                if(!this.beginDraw){
                    var applyPolygonPointcloud = '<tr class="boxCont"> \
                            <td> \
                                <label for="applyPolygonPointcloud">Apply Pointcloud?</label> \
                                <input type="checkbox" name="applyPolygonPointcloud" id="applyPolygonPointcloud"> \
                            </td> \
                        </tr>'

                    submitBuilder.buildSubmitPanel(['classSelector', 'instanceCont', 'onlyClassSelector'],
                     {}, true, true);
                    this.beginDraw = true;
                  
                    controls.enabled=false;
                    controls.update()
                 
          
                    $('#imgBox').draggable("disable")
                    imagePanel.updateImageData()

                }else{
                    this.reset()
                }

                
                
                break;
    
            case 82: // r key
                break;
    
            default:
                break;
        }
        
    }

    handleKeyUp(e){
        var keyID = e.keyCode;
       
        switch(keyID)
        {
            case 66: // b key
                break;
    
            case 82: // r key
                break;
    
            default:
                break;
        }
    }

    handleSubmit(e){
        app.cur_frame.recordImageHistory()
        // var CMC = $("#clearMaskCanvas")[0].checked
        var instance_id;
        var new_instance = false;
        var applyPointcloud = false;

        var classification = $("#classSelector :selected").val();

        if($("#instanceSelector")[0].checked){
            console.log(parseInt(app.class_order[classification]))
            instance_id = app.cur_frame.create_new_image_instance_id(parseInt(app.class_order[classification]))
            new_instance = true;
        }else if($("#instanceChoice")[0]){
  
            if($("#instanceChoice")[0].value != "None"){
                instance_id = parseInt($("#instanceChoice")[0].value)
            }else{
                instance_id = -1
            }
            
        }else{
            
            instance_id = -1
        }

        if(instance_id === null){
            instance_id = -1
        }


        
        this.getPolygon()

        var onlyClass = $("#onlyClassSelector :selected").val()

        if(onlyClass == 'All'){
            onlyClass = -2
        }else{
            onlyClass = app.class_order[onlyClass]
        }

        
        
        imagePanel.applyPolygonsPointcloud(this.raw_polygon, this.norm_polygon, 
            classification, instance_id, new_instance=new_instance, applyPointcloud=applyPointcloud, onlyClass=onlyClass)
        

        submitBuilder.hideSubmitPanel();
      
        
    }

    reset(){
        console.log('reset')
        submitBuilder.hideSubmitPanel();
        
        this.cacheInd = null;
        this.mask = null;
        this.oldMask = null;
        this.downPoint = null;
        this.allowDraw = false;
        this.addMode = false;
        this.currentThreshold = this.colorThreshold;
        this.beginDraw = false;
        this.norm_polygon = null;
       
    
        camera.position.set(0, 100, 0);
        camera.lookAt(new THREE.Vector3(0,0,0));
        controls.enabled=true;
        controls.update();
        $('#imgBox').draggable("enable")
       
        console.log($( "#imgBox" ).draggable( "option", "disabled" ))
        imagePanel.clearSelectCanvas();
    }
 

    drawMask(x, y) {
       
        if (!imagePanel.imageInfo) return;
       
        var image = {
            data: imagePanel.imageInfo.data,
            width: imagePanel.imageInfo.width,
            height: imagePanel.imageInfo.height,
            bytes: 4
        };
        
      
        if (this.addMode && !this.oldMask) {
            this.oldMask = this.mask;
        }
        
        let old = this.oldMask ? this.oldMask.data : null;
        
        this.mask = MagicWand.floodFill(image, x, y, this.currentThreshold, old, true);
        if (this.mask) this.mask = MagicWand.gaussBlurOnlyBorder(this.mask, this.blurRadius, old);
        
        if (this.addMode && this.oldMask) {
            this.mask = this.mask ? this.concatMasks(this.mask, this.oldMask) : this.oldMask;
        }
        
        //drawBorder
        if (!this.mask) return;
        
        var x,y,i,j,k,
        w = imagePanel.imageInfo.width,
        h = imagePanel.imageInfo.height,
        ctx = imagePanel.imageInfo.context,
        imgData = ctx.createImageData(w, h),
        res = imgData.data;
        
        if (true) this.cacheInd = MagicWand.getBorderIndices(this.mask);
        
        ctx.clearRect(0, 0, w, h);
        
        var len = this.cacheInd.length;
        for (j = 0; j < len; j++) {
            i = this.cacheInd[j];
            x = i % w; // calc x by index
            y = (i - x) / w; // calc y by index
            k = (y * w + x) * 4; 

          

            if ((x + y + this.hatchOffset) % (this.hatchLength * 2) < this.hatchLength) { // detect hatch color 
                res[k + 3] = 255; // black, change only alpha
            } else {
                res[k] = 255; // white
                res[k + 1] = 255;
                res[k + 2] = 255;
                res[k + 3] = 255;
            }
        }

       
    
        ctx.putImageData(imgData, 0, 0);
    }

    makeRealCanvas(classification){
        classification = app.class_order[classification]
        var img = $('#realImage')[0]
        var cvs = document.getElementById("realCanvas")
        cvs.getContext("2d").drawImage(img, 0, 0, img.width, img.height)

        var resizedPoly = this.getResizedPolygon(1)
        var clr = app.class_colors[classification]

        this.traceAndFill(imagePanel.realInfo.context, resizedPoly,clr)
        imagePanel.realInfo.data = cvs.getContext("2d").getImageData(0, 0,
            img.width, img.height).data
        
    }

    


    getMousePosition(e) {
        var p = $(e.target).offset(),
            x = Math.round((e.clientX || e.pageX) - p.left),
            y = Math.round((e.clientY || e.pageY) - p.top);
        return { x: x, y: y };
    }



 

    traceAndFill(ctx, cs, color) {

        ctx.beginPath();
        ctx.moveTo(cs[0][0], cs[0][1]);
        
        for (var i = 1; i < cs.length-1; i++) {
            ctx.lineTo(cs[i][0], cs[i][1]);
        }
    
        ctx.closePath();
   
     
        ctx.fillStyle = color;
        ctx.fill();

    }

    hexToRgb(hex, alpha) {
        var int = parseInt(hex, 16);
        var r = (int >> 16) & 255;
        var g = (int >> 8) & 255;
        var b = int & 255;
   
      
        return [r,g,b, Math.round(alpha * 255)];
    
    }

    concatMasks(mask, old) {
        let 
          data1 = old.data,
            data2 = mask.data,
            w1 = old.width,
            w2 = mask.width,
            b1 = old.bounds,
            b2 = mask.bounds,
            b = { // bounds for new mask
                minX: Math.min(b1.minX, b2.minX),
                minY: Math.min(b1.minY, b2.minY),
                maxX: Math.max(b1.maxX, b2.maxX),
                maxY: Math.max(b1.maxY, b2.maxY)
            },
            w = old.width, // size for new mask
            h = old.height,
            i, j, k, k1, k2, len;
    
        let result = new Uint8Array(w * h);
    
        // copy all old mask
        len = b1.maxX - b1.minX + 1;
        i = b1.minY * w + b1.minX;
        k1 = b1.minY * w1 + b1.minX;
        k2 = b1.maxY * w1 + b1.minX + 1;
        // walk through rows (Y)
        for (k = k1; k < k2; k += w1) {
            result.set(data1.subarray(k, k + len), i); // copy row
            i += w;
        }
    
        // copy new mask (only "black" pixels)
        len = b2.maxX - b2.minX + 1;
        i = b2.minY * w + b2.minX;
        k1 = b2.minY * w2 + b2.minX;
        k2 = b2.maxY * w2 + b2.minX + 1;
        // walk through rows (Y)
        for (k = k1; k < k2; k += w2) {
            // walk through cols (X)
            for (j = 0; j < len; j++) {
                if (data2[k + j] === 1) result[i + j] = 1;
            }
            i += w;
        }
    
        return {
            data: result,
            width: w,
            height: h,
            bounds: b
        };
    }

    

    getPolygon() {
        var cs = MagicWand.traceContours(this.mask);
        cs = MagicWand.simplifyContours(cs, this.simplifyTolerant, this.simplifyCount);
        var vertices, v, normVertices;
        this.raw_polygon = []
        for(var i=0;i<cs.length;i++){
            if(cs[i].inner) continue
            vertices = cs[i].points 
            normVertices = [];
          
            for(var j=0;j<vertices.length;j++){
                v = vertices[j]
                this.raw_polygon.push([v.x, v.y])
                normVertices.push([v.x / imagePanel.scaleFactor, v.y / imagePanel.scaleFactor])
     
            }
            this.norm_polygon = normVertices;
        
        }
        return cs
    }

    getResizedPolygon(scaleFactor){
        
        var poly = this.norm_polygon;
        var resizedVerts = []
        var vert;

        for (var j=0;j<poly.length;j++){
            vert = poly[j]
        
            resizedVerts.push([vert[0]*scaleFactor, vert[1]*scaleFactor])
        }

        return resizedVerts
    }


 
}











