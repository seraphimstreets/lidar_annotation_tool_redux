function SubmitBuilder(){
    this.classSelector = '<tr id="classCont" class="boxCont"> \
                            <td> \
                                <label for="classSelector">Class:</label> \
                                <select id="classSelector" name="classSelector"> \
                                </select> \
                            </td>  \
                        </tr> '

    this.instanceCont = '<tr id="instanceCont" class="boxCont"> \
                            <td> \
                                <label for="instanceSelector">New Instance?</label> \
                                <input type="checkbox" name="instanceSelector" id="instanceSelector"> \
                            </td> \
                        </tr>'

    this.onlyClassSelector = '<tr id="classCont" class="boxCont"> \
                                    <td> \
                                        <label for="classSelector">Class:</label> \
                                        <select id="classSelector" name="classSelector"> \
                                        </select> \
                                    </td>  \
                                </tr>'
    
    this.includedMods = {'classSelector':this.classSelector,
                         'instanceCont':this.instanceCont,
                        'onlyClassSelector':this.onlyClassSelector}
    this.buildSubmitPanel = function(modOrder, externalMods={}, instanceEditor=false, image= false, classSelectorLabel="Class:"){
        console.log(instanceEditor)
        $('#submitMods').empty();

        $(document).off('change', '#classSelector')
        
        this.buildClassSelector(classSelectorLabel);
        this.buildOnlyClassSelector();
        var modName;
        for(i=0;i<modOrder.length;i++){
            modName = modOrder[i]
  
            if(modName in this.includedMods){
                $('#submitMods').append(this.includedMods[modName])
            }else if(modName in externalMods){
                $('#submitMods').append(externalMods[modName])
            }else{
                throw new Error("Module " + modName + " not found!")
            }
        }
        $('#BBoxPanel').css({'display':'block'});

        if(instanceEditor){
            $(document).on('change', '#classSelector', () => {
                $('#instanceSelector').prop('checked',false)
                var classification = $("#classSelector :selected").val()
                $('#instChoiceCont').remove();
                if(image){
                    var isl = this.buildImageInstanceChoice(classification)
                }else{
                    var isl = this.buildInstanceChoice(classification)
                }
               
                $('#classCont').after(isl)
                
            })
    
            $('#instanceSelector').click(() => {
                console.log($('#instanceSelector')[0])
                if($('#instanceSelector')[0].checked){
                  
                    $("#instChoiceCont").remove();
                    
                }else{
                    var classification = $("#classSelector :selected").val()
                    if(image){
                        var isl = this.buildImageInstanceChoice(classification)
                    }else{
                        var isl = this.buildInstanceChoice(classification)
                    }
                   
                    $('#classCont').after(isl)
                }
                
            })
        }

       
    
    }
    
    this.hideSubmitPanel = function(){
        $('#submitMods').empty();
        $('#BBoxPanel').css({'display':'none'});
    
    }

    this.buildClassSelector = function(classSelectorLabel){
        var className;
        var allClasses = Object.keys(app.class_order)
        clog = $('<tr id="classCont" class="boxCont"></tr>')
        console.log(clog)
        cd = $("<td></td>")
        cl = $('<label for="classSelector">{0}</label>'.format(classSelectorLabel))
        cs = $('<select id="classSelector" name="classSelector"></select>')
        for(i=0;i<allClasses.length;i++){
            className = allClasses[i];
            cs.append('<option value="{0}">{1}</option>'.format(className, className))
        }
        cl.append(cs)
        cd.append(cl)
        clog.append(cd)
        
        this.includedMods['classSelector'] = clog

        
    }

    this.buildOnlyClassSelector = function(){
            var className;
            var allClasses = Object.keys(app.class_order)
            var onlyClass = $('<tr id="onlyClassCont" class="boxCont"></tr>')
          
            var cd = $("<td></td>")
            var cl = $('<label for="onlyClassSelector">Only Change Class:</label>')
            var cs = $('<select id="onlyClassSelector" name="onlyClassSelector"></select>')
            cs.append('<option value="All">All</option>')
            for(var i=0;i<allClasses.length;i++){
                className = allClasses[i];
                cs.append('<option value="{0}">{1}</option>'.format(className, className))
            }
            cl.append(cs)
            cd.append(cl)
            onlyClass.append(cd)

            this.includedMods['onlyClassSelector'] = onlyClass
    }


    this.buildInstanceChoice = function(cl){
        var cl_num = app.class_order[cl]
        var cl_instances = app.cur_frame.instance_counter[cl_num]
        console.log(app.cur_frame.instance_counter)
        if(cl_instances != []){
            var clog = $('<tr class="boxCont" id="instChoiceCont"></tr>')
            console.log(clog)
            var cd = $("<td></td>")
            var cl = $('<label for="instanceChoice" id="instChoiceLabel">Instance Ids:</label>')
            var cs = $('<select id="instanceChoice" name="instanceChoice"></select>')
            var inst;
            cs.append('<option value="None">None</option>')
            for(i=0;i<cl_instances.length;i++){
                inst = cl_instances[i];
                cs.append('<option value="{0}">{1}</option>'.format(inst, inst))
            }
            cl.append(cs)
            cd.append(cl)
            clog.append(cd)
            return clog
        }

        return null
        



    }

    this.buildImageInstanceChoice = function(cl){
        var cl_num = app.class_order[cl]
        var cl_instances = app.cur_frame.cur_image.imageInstanceCounter[cl_num]
        console.log(app.cur_frame.cur_image.imageInstanceCounter)
        if(cl_instances != []){
            var clog = $('<tr class="boxCont" id="instChoiceCont"></tr>')
            console.log(clog)
            var cd = $("<td></td>")
            var cl = $('<label for="instanceChoice" id="instChoiceLabel">Instance Ids:</label>')
            var cs = $('<select id="instanceChoice" name="instanceChoice"></select>')
            var inst;
            cs.append('<option value="None">None</option>')
            if(cl_instances){
                for(i=0;i<cl_instances.length;i++){
                    inst = cl_instances[i];
                    cs.append('<option value="{0}">{1}</option>'.format(inst, inst))
                }
            }
            
            cl.append(cs)
            cd.append(cl)
            clog.append(cd)
            return clog
        }

        return null
        



    }





}
