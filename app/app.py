from flask import Flask, render_template, request, jsonify



from frame_handler import FrameHandler

from classify.convert3d_2d import proj_lidar_on_image, proj_image_on_lidar, create_loaded_image, highlight_instance
from classify.calib import Calib

try:
	from add_bonnetal import bonnetal_predict
except Exception as e:
	print(e)
	print("Rangenet prediction for pointclouds will not be available.")
	
try:
	from detectron_results import SegmentationModel
	detectron = SegmentationModel()
except Exception as e:
	print(e)
	print("Detectron prediction for images will not be available.")
	pass

import numpy as np
import json
import os
import cv2
from pathlib import Path
import time
import getopt
import argparse

app = Flask(__name__, static_url_path='/static')
DIR_PATH = os.path.dirname(os.path.realpath(__file__))
CALIBRATION_PATH = os.path.join(DIR_PATH, "classify" ,"calib")

CUR_DIR = os.path.dirname(os.path.realpath(__file__))
DATASET_DIR = os.path.join(CUR_DIR, "test_dataset")
IMAGE_DIR = os.path.join(CUR_DIR, "static", "images")
DATASETS_DIR = os.path.join(CUR_DIR, "static", "datasets")

@app.route("/")
def root():
	return render_template("index.html")

	
@app.route("/loadFrameNames", methods=['POST'])
def loadFrameNames():
	return fh.get_frame_names()

@app.route("/loadFrameImages", methods=['POST'])
def loadFrameImages():
	json_request = request.get_json()
	drivename = json_request["drivename"]
	fname = json_request["fname"] 
	
	return json.dumps(fh.load_accum_dict(drivename, fname))

#collects information on point classes, instances, bouning boxes and sends to client as json
@app.route("/getFramePointCloud", methods=['POST'])
def getFramePointCloud():
	json_request = request.get_json()
	drivename = json_request["drivename"]
	fname = json_request["binname"]

	st = time.time()
	data = fh.get_pointcloud(drivename, fname, dtype=None)
	et = time.time()
	print("Getting pointcloud: {}".format(et-st))
	data_maxes = list(np.amax(data, 0) )
	data_mins = list(np.amin(data, 0))
	data_bounds = data_maxes + data_mins
	print(data_bounds)
	
	data_bounds = (",").join([str(x) for x in data_bounds])
	
	annotation_str = str(fh.load_annotation_from_bin(drivename, fname, dtype='json'))
	
	return '?'.join(["", annotation_str, data_bounds])

## creates a new masked image on demand and sends the url back to client side
@app.route("/loadImage", methods=['POST'])
def loadImage():
	json_request = request.get_json()
	baseImage = json_request["baseImage"]
	shortName = baseImage.split("/")[-1].split('.')[0]
	fname = json_request["fname"]
	drivename, fname = fname.split('/')


	
	pixelClasses = fh.load_pixel_classes_from_bin(drivename, fname, shortName )
	pixelInsts = fh.load_pixel_insts_from_bin(drivename, fname, shortName )
	print(len(pixelClasses))
	class_colors = fh.load_class_colors()

	newPath, origWidth, origHeight = create_loaded_image(pixelClasses, pixelInsts,  class_colors, baseImage, fh, [fname, drivename, shortName])



	return  json.dumps({'newPath':newPath,
	'pixelClasses':pixelClasses, 'pixelInst':pixelInsts,

	 'origWidth':origWidth, 'origHeight':origHeight})



#saving pointcloud information
@app.route("/writeOutput", methods=['POST'])
def writeOutput():
	frame = request.get_json()['output']
	fname = frame['filename']

	drivename, fname = fname.split('/')
	fh.save_annotation_bin(drivename, fname, frame["file"], split_output=True)
	return str("hi")

#saving image information
@app.route("/saveImage", methods=['POST'])
def saveImage():
	frame = request.get_json()
	pixelClass= frame['pixelClass']
	pixelInst = frame['pixelInst']
	fname = frame['fname']
	classColors = frame['classColors']
	classOrder = frame['classOrder']

	drivename, fname = fname.split('/')
	baseImage = frame['baseImage']
	shortName = baseImage.split("/")[-1]

	fh.save_class_colors(classColors)
	fh.save_class_order(classOrder)

	fh.save_image_bin(drivename, fname, shortName, json.dumps(pixelClass), json.dumps(pixelInst))
	return str("hi")


# highlighting image instance
@app.route("/highlightInstance", methods=['POST'])
def highlightInstance():
	frame = request.get_json()
	baseImage = frame['baseImage']
	instancePixs = frame['instancePixs']
	color = frame['color']
	classification = frame['classification']
	inst_id = frame['instance_id']
	
	
	return highlight_instance(baseImage, instancePixs, color, classification, inst_id)


# changing class color for image
@app.route("/changeClassColor", methods=['POST'])
def changeClassColor():
	frame = request.get_json()
	baseImage = frame['baseImage']
	instancePixs = frame['indices']
	color = frame['color']
	classification = frame['cl']
	inst_id = frame['inst_id']
	classColors = frame['classColors']
	fh.save_class_colors(classColors)
	
	
	return highlight_instance(baseImage, instancePixs, color, classification, inst_id)




# image detectron prediction
@app.route("/segmentModel", methods=['POST'])
def segmentModel():
	json_request = request.get_json()
	fname = json_request["fname"]
	drivename, fname = fname.split('/')
	baseImage = json_request['baseImage']
	imPath = os.path.join(CUR_DIR, baseImage)
	print(imPath)

	[pixel_ids, class_dict, inst_dict, color_dict] = detectron.predict(imPath)
	
	fh.update_image_from_detectron(pixel_ids, class_dict, inst_dict, color_dict, drivename, fname, baseImage)


	return str("hi")

# rangenet prediction
@app.route("/useRangenet", methods=['POST'])
def useRangenet():
	json_request = request.get_json()
	fname = json_request['filename']

	drivename, fname = fname.split('/')
	accum_dict = fh.load_accum_dict(drivename, fname)
	bin_names = accum_dict['file_names']
	full_bin_names = []
	for bn in bin_names:
		full_bin_names.append(os.path.join(DATASETS_DIR, drivename, "bin_data", bn + ".bin"))

	print(full_bin_names)


	
	[point_ids, class_dict, color_map, orig_size] = bonnetal_predict(full_bin_names)
	
	pc_classes, pc_insts = fh.update_pc_from_rangenet(point_ids, class_dict, color_map, drivename, fname, orig_size)
	


	return json.dumps({"pc_classes":pc_classes, "pc_insts":pc_insts})

# we produce extra 'masked' images on demand to send to the client side. Upon client side closure, we delete these extra images.  

@app.route("/deleteExtraPics", methods=['POST'])
def deleteExtraPics():
	print("DELETE")
	for ds in os.listdir(DATASETS_DIR):
		DATA_IMAGE_DIR = os.path.join(DATASETS_DIR, ds, "image")
		for im in os.listdir(DATA_IMAGE_DIR):
			cand = os.path.join(DATA_IMAGE_DIR, im)
			if "_masked" in cand or "_dotted" in cand:
				os.remove(cand)
	return "Success"

# # (disabled) projects lidar labels onto the image 
# @app.route("/projLidar2Img", methods=['POST'])
# def getLidar2Img():
# 	json_request = request.get_json()
# 	fname = json_request["fname"]
# 	drivename, fname = fname.split("/")
# 	pointcloud = fh.get_pointcloud(drivename, fname, dtype=None) 

# 	try:
# 		oldname = json_request["old_name"]
		
# 		os.remove(oldname)
# 	except:
# 		print("Failed to delete old picture")
# 		pass

# 	classes = json_request["point_classes"]
# 	class_colors = fh.load_class_colors()
		
# 	imgname = os.path.join(DATASET_DIR, drivename,  "image", fname + '.png')
	
# 	img = cv2.imread(imgname)
# 	stobject = proj_lidar_on_image(pointcloud, classes, class_colors, img, Calib(CALIBRATION_PATH),
# 	 drivename, fname)
# 	return json.dumps(stobject)

# # (disabled) projects image labels onto the pointcloud

# @app.route("/projImage2Pointcloud", methods=['POST'])
# def projImage2Pointcloud():
# 	json_request = request.get_json()
# 	outerVertices = np.array(json_request['outerVertices'])
# 	cp = np.array(json_request['cp'])
# 	look_at = np.array(json_request['look_at'])
# 	transform = np.array(json_request['transform']).reshape(4,4)
# 	print(transform)
	
# 	return json.dumps({"pts_3d":proj_image_on_lidar(outerVertices, cp, look_at,  transform, Calib(CALIBRATION_PATH))})





if __name__ == "__main__":
	fh = FrameHandler()

	

	app.run()
