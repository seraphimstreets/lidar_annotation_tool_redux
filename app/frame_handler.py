import os
from os import listdir, makedirs
from os.path import isfile, join, dirname, realpath, isdir
import json
import numpy as np
import time

import random

class FrameHandler():
	CUR_DIR =dirname(realpath(__file__))
	PARENT_DIR = os.path.abspath(os.path.join(CUR_DIR, os.pardir))
	DATASET_REL_DIR = join("static", "datasets")
	DATASET_DIR = join(CUR_DIR, DATASET_REL_DIR)
	
	INPUT_BIN_DIR = "accumulated_bins"

	OUTPUT_ANN_DIR = join(CUR_DIR, "output")
	FINAL_OUT_DIR = join(CUR_DIR, "final_out")
	
	

	def __init__(self):
		self.pointcloud = None
		self.drives = dict()
		for drive in listdir(self.DATASET_DIR):
			if True:
				drave = drive
				bin_dir = join(self.DATASET_DIR, drive, self.INPUT_BIN_DIR)
				self.drives[drive] = []
				if os.path.isdir(bin_dir):
					for f in listdir(bin_dir):
						if isfile(join(bin_dir, f)) and '.bin' in f:
							self.drives[drive].append(f.split('.bin')[0])

				self.drives[drive] = sorted(self.drives[drive])

		print(self.drives)

	def get_frame_names(self):
		"""
		Get all the frame names
		"""
		# return ",".join(self.frame_names)
		return str(self.drives)

	

	def get_pointcloud(self, drivename, fname, dtype=str, ground_removed=False):
		"""
		Gets point cloud as list of floats

		Input:
		- fname: Frame name. Can have file extension. 

		Returns a string of comma-separated floats. The number of floats 
		is 4N, where N is the number of points in the point cloud. 
		Each point is represented by 4 numbers - the x, y, z coordinates 
		as well as the intensity.
		"""

		
		bin_dir = join(self.DATASET_DIR, drivename, self.INPUT_BIN_DIR)
		filename = join(bin_dir, fname.split(".")[0] + ".bin")

		
		data = np.fromfile(filename, dtype=np.float32)
		
			
		self.pointcloud = data.reshape((-1,4)) 

		if dtype == str:
			data = data.flatten(order="C").tolist()
			data_str = (",").join([str(x) for x in data])
			return data_str
		else:
			if ground_removed:
				return data.reshape((-1,4))
			else:
				return data.reshape((-1,4))[:,:3]

	def update_image_from_detectron(self, pixel_ids, class_dict, inst_dict, color_dict, drivename, fname, baseImage):
		class_order = self.load_class_order()
		class_colors = self.load_class_colors()

		model_classes = class_dict.keys()
		
		for cl in model_classes:
			if cl not in class_order.keys():
				newIdx = max(class_order.values()) + 1
				class_order[cl] = newIdx
				if color_dict[cl] not in class_colors.values():
					class_colors[newIdx] = self.rgb_to_hexa(color_dict[cl])

				else:
					class_colors[newIdx] = self.generate_random_new_color(class_colors.values())

		self.save_class_colors(class_colors)
		self.save_class_order(class_order)

		pixelClasses = self.load_pixel_classes_from_bin(drivename, fname, baseImage)
		pixelInsts = self.load_pixel_insts_from_bin(drivename, fname, baseImage)
		imageInstanceCounter = {}

		numPixels = pixel_ids.shape[0]

		if len(pixelClasses) == 0:
			for i in range(numPixels):
				pixelClasses.append(0)
				pixelInsts.append(-1)



		for i, p_id in enumerate(pixel_ids):
			p_info = inst_dict[p_id]
			p_class = class_order[p_info.split(":")[0]]
			p_inst = p_info.split(":")[1]

			pixelClasses[i] = p_class
			pixelInsts[i] = p_inst

		for cl_str in class_order.keys():
			if cl_str in class_dict.keys():
				imageInstanceCounter[class_order[cl_str]] = class_dict[cl_str]
			else:
				imageInstanceCounter[class_order[cl_str]] = []
			

		baseImage = baseImage.split("/")[-1]


		self.save_image_bin(drivename, fname, baseImage, json.dumps(pixelClasses), json.dumps(pixelInsts))

		return 1


	def update_pc_from_rangenet(self, point_ids, class_dict, color_map, drivename, fname, orig_size):
		class_order = self.load_class_order()
		class_colors = self.load_class_colors()

		model_classes = []
		model_colors = []
		for pid in point_ids:
			cl_str = class_dict[pid]
			
			if not cl_str in model_classes:
				cl_color = color_map[pid]
				model_classes.append(cl_str)
				print(cl_color)
				model_colors.append(cl_color)

		
		for i, cl in enumerate(model_classes):
			if cl not in class_order.keys():
				newIdx = max(class_order.values()) + 1
				class_order[cl] = newIdx

				# if self.rgb_to_hexa(model_colors[i]) not in class_colors.values():
				if False:
					class_colors[newIdx] = self.rgb_to_hexa(model_colors[i])

				else:
					class_colors[newIdx] = self.generate_random_new_color(class_colors.values())

		output_drive_dir = join(self.OUTPUT_ANN_DIR, "app")
		if not isdir(output_drive_dir):
			try:  
			    makedirs(output_drive_dir)
			except OSError:  
			    print ("Creation of the directory {} failed".format(output_drive_dir))

		self.save_class_colors(class_colors)
		self.save_class_order(class_order)

		pref = fname.split('.')[0]

		pc_classes = [0 for _ in range(orig_size)]
		pc_insts = [-1 for _ in range(orig_size)]
		# instance_counter = {}

		for i, pid in enumerate(point_ids):
			cl_str = class_dict[pid]
			pc_classes[i] = class_order[cl_str]

		# for cl in class_colors.keys():
		# 	instance_counter[cl] = []



		prefix = fname.split(".")[0]

		output_ds_fold = os.path.join(self.DATASET_REL_DIR, drivename, "output")
		if not os.path.isdir(output_ds_fold ):
			os.makedirs(output_ds_fold)
		
		output_accum_fold = os.path.join(output_ds_fold, prefix)

		if not os.path.isdir(output_accum_fold):
			os.makedirs(output_accum_fold)

		output_pc_fold = os.path.join(output_accum_fold, "pointclouds")

		if not os.path.isdir(output_pc_fold):
			os.makedirs(output_pc_fold)

		try:
			with open(os.path.join(self.DATASET_REL_DIR, drivename, "accumulator_dict.json")) as read_file:
				accum_object = json.load(read_file)
		except:
			print("Accumulator dict not found. Unable to save. Exiting...")
			return 0


		accum_info = accum_object[prefix]
		names = accum_info["file_names"]
		split_points = accum_info['point_counts']


		for i, name in enumerate(names):
			save_filename = os.path.join(output_pc_fold, name + "_classes.bin")
			cur_split = split_points[i]
			if i == len(names) - 1:
				next_split = 100000000000
			else:
				next_split = split_points[i+1]
			out_file = np.array(pc_classes[cur_split:next_split], dtype=np.int16)
			out_file.tofile(save_filename)

			save_filename = os.path.join(output_pc_fold, name + "_instances.bin")
			out_file = np.array(pc_insts[cur_split:next_split], dtype=np.int16)
			out_file.tofile(save_filename)
		


	

		# save_filename = join(output_accum_fold, prefix + '_instance_counter.json')
		# json_str = json.dumps(instance_counter)
		# with open(save_filename, "w") as f:
		# 	f.write(json_str)

		return pc_classes, pc_insts

		




	def generate_random_new_color(self, current_colors):

		ccs = []

		for col in current_colors:
			# ccs.append(self.rgb_to_hexa(col))
			ccs.append(col)

		while True:
			cand_color = "%06x" % random.randint(0, 0xFFFFFF)
			if not cand_color in ccs:
				return "#" + cand_color
			
	def rgb_to_hexa(self, col):
		print(col)

		return '#%02x%02x%02x' % (col[0], col[1], col[2])

	def hexa_to_rgb(self, col):
		col = col.lstrip("#")
		return tuple(int(col[i:i+2], 16) for i in (0, 2, 4))


	def get_frame_classes(self, drivename, fname, dtype=str):
		prefix = fname.split(".")[0]
		fname = prefix + "_classes" + ".json" 
		with open(join(self.OUTPUT_ANN_DIR, drivename, fname), "r") as read_file:
			try:
				temp = json.load(read_file)
			except json.JSONDecodeError:
				return ""

		return temp

	def save_class_colors(self, classColors):

		if not isdir(self.OUTPUT_ANN_DIR):
			try:  
			    makedirs(self.OUTPUT_ANN_DIR)
			except OSError:  
			    print ("Creation of the directory {} failed".format(self.OUTPUT_ANN_DIR))
		

		json_str = json.dumps(classColors)
		save_filename = join(self.OUTPUT_ANN_DIR, "app", "class_colors.json")
		with open(save_filename, "w") as f:
			f.write(json_str)

		
		return 1

	def save_class_order(self, classOrder):

		if not isdir(self.OUTPUT_ANN_DIR):
			try:  
			    makedirs(self.OUTPUT_ANN_DIR)
			except OSError:  
			    print ("Creation of the directory {} failed".format(self.OUTPUT_ANN_DIR))
		

		json_str = json.dumps(classOrder)
		save_filename = join(self.OUTPUT_ANN_DIR, "app", "class_order.json")
		with open(save_filename, "w") as f:
			f.write(json_str)

		
		return 1
		
		


	def load_annotation_from_bin(self, drivename, fname, dtype='object'):

		frame = {"frame":{}}

		try:
			with open(os.path.join(self.DATASET_REL_DIR, drivename, "accumulator_dict.json")) as read_file:
				accum_object = json.load(read_file)
		except:
			print("Accumulator dict not found. Unable to load. Exiting...")
			return 0

				
		prefix = fname.split(".")[0]
		accum_info = accum_object[prefix]
		names = accum_info["file_names"]
		split_points = accum_info['point_counts']


		output_ds_fold = os.path.join(self.DATASET_REL_DIR, drivename, "output")
		output_accum_fold = os.path.join(output_ds_fold, prefix)

		output_pc_fold = os.path.join(output_accum_fold, "pointclouds")

		# if not os.path.exists(output_pc_fold):
		# 	print(f"Target directory {output_pc_fold} does not exist! Exiting...")
		# 	return ""

		
		pointClasses = []
		pointInsts = []

		try:
			for name in names:
				load_filename = os.path.join(output_pc_fold, name + "_classes.bin")
				pointClasses.append(np.fromfile(load_filename, dtype=np.int16))
				load_filename = os.path.join(output_pc_fold, name + "_instances.bin")
				pointInsts.append(np.fromfile(load_filename, dtype=np.int16))

			pointClasses = np.concatenate(pointClasses).tolist()
			pointInsts = np.concatenate(pointInsts).tolist()

	
		except Exception as e:
			print(e)
			pass
		
		frame["frame"]["point_classes"] = pointClasses 
		frame["frame"]["instance_ids"] = pointInsts

		try:

			load_filename = os.path.join(output_pc_fold, prefix + "_boxes.json")
			with open(load_filename, "r") as f:
				frame["frame"]["bounding_boxes"] = json.load(f)
		except Exception as e:
			print(e)

			frame["frame"]["bounding_boxes"] = []

		# try:

		# 	load_filename = os.path.join(output_accum_fold, prefix + "_instance_counter.json")
		# 	with open(load_filename, "r") as f:
		# 		frame["frame"]["instance_counter"] = json.load(f)
		# except:
		# 	frame["frame"]["instance_counter"] = []

		app_types = ["class_colors" ,"class_order"]
		for at in app_types:
			try:
				with open(join(self.OUTPUT_ANN_DIR, "app", at + ".json")) as read_file:
					temp = json.load(read_file)
					frame["frame"][at] = temp
					print('Success!')
					
					
			except:
				frame["frame"]["class_colors"] = ""

		
		
		if frame["frame"] == {}:
			return ""


		

		return json.dumps(frame)



	def save_image_bin(self, drivename, fname, baseImage, imageClasses, imageInsts):
		prefix = fname.split(".")[0]
		baseImage = baseImage.split(".")[0]
		output_ds_fold = os.path.join(self.DATASET_REL_DIR, drivename, "output")
		
		output_accum_fold = os.path.join(output_ds_fold, prefix)
		output_image_fold = os.path.join(output_accum_fold, "images")

		if not os.path.isdir(output_ds_fold):
			os.makedirs(output_ds_fold)

		if not os.path.isdir(output_accum_fold):
			os.makedirs(output_accum_fold)

		if not os.path.isdir(output_image_fold):
			os.makedirs(output_image_fold)

		
		class_order = self.load_class_order()
		class_colors = self.load_class_colors()

		imageClasses = json.loads(imageClasses)
		imageInsts = json.loads(imageInsts)
		imageClasses, imageInsts = self.validateClassAndInsts(imageClasses, imageInsts, class_order, class_colors)

		

		save_filename = join(output_image_fold, baseImage  + '_imageClasses.bin')
		nu = np.array(imageClasses, dtype=np.int16)
		nu.tofile(save_filename)

		save_filename = join(output_image_fold, baseImage + '_imageInsts.bin')
		nu = np.array(imageInsts, dtype=np.int16)
		nu.tofile(save_filename)


		

		return 1


	def save_image_insts(self, drivename, fname, baseImage, imageInsts):
		imageInsts = [int(a)  if a is not None else -1 for a in imageInsts]
		save_filename = join(self.OUTPUT_ANN_DIR, drivename, fname, baseImage + '_imageInsts.json')
		with open(save_filename, "w") as f:
			f.write(imageInsts)



	def load_pc_classes(self, drivename, fname):
		try:
			with open(join(self.OUTPUT_ANN_DIR, drivename, fname +  '_classes.json')) as read_file:
				return json.load(read_file)
		except:
			return []

	def load_pc_insts(self, drivename, fname):
		try:
			with open(join(self.OUTPUT_ANN_DIR, drivename, fname +  '_instances.json')) as read_file:
				return json.load(read_file)
		except:
			return []

	



	def load_pixel_classes(self, drivename, fname, baseImage):
		print(join(self.OUTPUT_ANN_DIR, drivename, fname, baseImage + '_imageClasses.json'))
		baseImage = baseImage.split('.')[0]
		try:
			with open(join(self.OUTPUT_ANN_DIR, drivename, fname, baseImage + '_imageClasses.json')) as read_file:
				return json.load(read_file)
		except:
			return []

	def load_pixel_insts(self, drivename, fname, baseImage):
		baseImage = baseImage.split('.')[0]
		try:
			with open(join(self.OUTPUT_ANN_DIR, drivename, fname, baseImage +  '_imageInsts.json')) as read_file:
				return json.load(read_file)
		except:
			return []

	def load_pixel_classes_from_bin(self, drivename, fname, baseImage):
		prefix = fname.split(".")[0]
		output_ds_fold = os.path.join(self.DATASET_REL_DIR, drivename, "output")
		output_accum_fold = os.path.join(output_ds_fold, prefix)
		output_image_fold = os.path.join(output_accum_fold, "images")

		try:
			load_filename = os.path.join( output_image_fold, baseImage + '_imageClasses.bin')
			return np.fromfile(load_filename, dtype=np.int16).tolist()
		except Exception as e:
			print(e)
			return []

	def load_pixel_insts_from_bin(self, drivename, fname, baseImage):
		prefix = fname.split(".")[0]
		output_ds_fold = os.path.join(self.DATASET_REL_DIR, drivename, "output")
		output_accum_fold = os.path.join(output_ds_fold, prefix)
		output_image_fold = os.path.join(output_accum_fold, "images")
		try:
			load_filename = os.path.join( output_image_fold, baseImage + '_imageInsts.bin')
			return np.fromfile(load_filename, dtype=np.int16).tolist()
		except Exception as e:
			print(e)
			return []


	def load_image_inst_counter(self, drivename, fname, baseImage):
		baseImage = baseImage.split('.')[0]
		try:
			with open(join(self.OUTPUT_ANN_DIR, drivename, fname, baseImage + '_imageInstanceCounter.json')) as read_file:
				return json.load(read_file)
		except:
			return 0


	def load_class_colors(self):
		try:
			with open(join(self.OUTPUT_ANN_DIR, "app", "class_colors.json")) as read_file:
				return json.load(read_file)
		except:
			return {0:"#404040", 1:"#8cff78", 2:"#b32bed", 3:"#cc1616"}

	def load_class_order(self):
		try:
			with open(join(self.OUTPUT_ANN_DIR, "app", "class_order.json")) as read_file:
				return json.load(read_file)
		except:
			return {"Default":0, "Forest":1, "Car":2, "Person":3}

	def load_accum_dict(self, drivename, fname):
		print(join(self.DATASET_DIR, drivename, "accumulator_dict.json"))
		try:
			with open(join(self.DATASET_DIR, drivename, "accumulator_dict.json")) as read_file:
				
				accum_object = json.load(read_file)
				
				
		
				return accum_object[fname]
		except:
			print("HAA?")
			return []

	def validateClassAndInsts(self, pointClasses, pointInsts, class_order, class_colors):

		available_classes = class_colors.keys()
		available_classes = [int(a) for a in available_classes]
		print(len(pointClasses))
		
		for i in range(len(pointClasses)):
			pc = pointClasses[i]
			if not (pc in available_classes):
				pointClasses[i] = 0
				pointInsts[i] = -1 
		return pointClasses, pointInsts
			


	def save_annotation_bin(self, drivename, fname, json_str, split_output=False):
		"""
		Saves json string to output directory. 

		Inputs:
		- fname: Frame name. Can have file extension. 
		- json_str: String in json to be saved

		Returns 1 if successful, 0 otherwise
		"""
		assert type(json_str) == str, "json must be a string"

		prefix = fname.split(".")[0]

		output_ds_fold = os.path.join(self.DATASET_REL_DIR, drivename, "output")
		if not os.path.isdir(output_ds_fold ):
			os.makedirs(output_ds_fold)
		
		output_accum_fold = os.path.join(output_ds_fold, prefix)

		if not os.path.isdir(output_accum_fold):
			os.makedirs(output_accum_fold)

		output_pc_fold = os.path.join(output_accum_fold, "pointclouds")

		if not os.path.isdir(output_pc_fold):
			os.makedirs(output_pc_fold)
		



		try:
			json_object = json.loads(json_str)
		except ValueError:
			print("Annotation not a valid json")
			return 0

		try:
			with open(os.path.join(self.DATASET_REL_DIR, drivename, "accumulator_dict.json")) as read_file:
				accum_object = json.load(read_file)
		except:
			print("Accumulator dict not found. Unable to save. Exiting...")
			return 0

		
		
		
		accum_info = accum_object[prefix]
		names = accum_info["file_names"]
		split_points = accum_info['point_counts']

		pointClasses = json_object["frame"]["point_classes"]
		pointInsts = json_object["frame"]["instance_ids"]
		
		pointClasses, pointInsts = self.validateClassAndInsts(pointClasses, pointInsts, json_object["frame"]["class_order"], json_object["frame"]["class_colors"])
	
		boxesInfo = json_object["frame"]["bounding_boxes"]
		# instance_counter = json_object["frame"]["instance_counter"]


		superBoxTracker = {}



		for i, name in enumerate(names):
			save_filename = os.path.join(output_pc_fold, name + "_classes.bin")
			cur_split = split_points[i]
			if i == len(names) - 1:
				next_split = 100000000000
			else:
				next_split = split_points[i+1]
			out_file = np.array(pointClasses[cur_split:next_split], dtype=np.int16)
			out_file.tofile(save_filename)

			save_filename = os.path.join(output_pc_fold, name + "_instances.bin")
			out_file = np.array(pointInsts[cur_split:next_split], dtype=np.int16)
			out_file.tofile(save_filename)

			superBoxTracker[name] = []

		
		
		for box in boxesInfo:
			print(box)
			frame_origin = np.array(accum_info["camera_positions"][0])
			baseVerts = np.array(box["all_points"])
			
			# baseVerts = np.concatenate([baseVerts, np.ones((baseVerts.shape[0], 1))], axis=1)
			if box["subType"] == "ALL":

				for j, vt in enumerate(accum_info["velo_transforms"]):
					fn = names[j]
					transform = np.array(vt).reshape(4,4)
					relativeVerts = baseVerts + frame_origin
					relativeVerts  = np.concatenate([relativeVerts , np.ones((relativeVerts.shape[0], 1))], axis=1)
					print(relativeVerts.shape)
					print(transform.shape)
					relativeVerts = transform @ relativeVerts.T
					print(relativeVerts.shape)
					relativeVerts = relativeVerts.T[:,:3].tolist()


					boxTemplate = box.copy()
					boxTemplate["all_points"] = relativeVerts
					ff = (np.array(relativeVerts[1]) + np.array(relativeVerts[6])) / 2
					boxTemplate["frontFace"] = ff.tolist()
					superBoxTracker[fn].append(boxTemplate)

			else:
				boxTemplate = box.copy()
				superBoxTracker[box["subType"]].append(boxTemplate)

					
				
			for name in superBoxTracker.keys():
				save_filename = os.path.join(output_pc_fold, name + "_boxes.json")
				with open(save_filename, "w") as f:
					f.write(json.dumps(superBoxTracker[name]))



			# saving accumulated pointcloud information

			# save_filename = os.path.join(output_accum_fold, prefix + "_classes.bin")
			# out_file = np.array(pointClasses, dtype=np.int16)
			# out_file.tofile(save_filename)

			# save_filename = os.path.join(output_accum_fold, prefix + "_instances.bin")
			# out_file = np.array(pointInsts, dtype=np.int16)
			# out_file.tofile(save_filename)

			# save_filename = os.path.join(output_accum_fold, prefix + "_instance_counter.json")
			# with open(save_filename, "w") as f:
			# 	f.write(json.dumps(instance_counter))

			save_filename = os.path.join(output_pc_fold, prefix + "_boxes.json")
			with open(save_filename, "w") as f:
				f.write(json.dumps(boxesInfo))




			
			
		app_types = ['class_colors', 'class_order']
		for ft in app_types:
			
			nu = json_object["frame"][ft]

			json_str = json.dumps(nu)
			save_filename = join(self.OUTPUT_ANN_DIR, "app", ft + ".json")
			with open(save_filename, "w") as f:
				f.write(json_str)

		
		

			


		
		return 1
		

		


