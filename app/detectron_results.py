import win32con
import torch, torchvision
import detectron2
from detectron2.utils.logger import setup_logger
setup_logger()
import torch
from torch.utils.cpp_extension import CUDA_HOME
print(torch.cuda.is_available(), CUDA_HOME)

# import some common libraries
import numpy as np
import os, json, cv2, random
import cv2


# import some common detectron2 utilities
from detectron2 import model_zoo
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog, DatasetCatalog



class SegmentationModel():

    def __init__(self):

        self.cfg = get_cfg()
        # add project-specific config (e.g., TensorMask) here if you're not running a model in detectron2's core library
        self.cfg.merge_from_file(model_zoo.get_config_file("COCO-PanopticSegmentation/panoptic_fpn_R_101_3x.yaml"))
        self.cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5  # set threshold for this model
        # Find a model from detectron2's model zoo. You can use the https://dl.fbaipublicfiles... url as well
        self.cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url("COCO-PanopticSegmentation/panoptic_fpn_R_101_3x.yaml")
        self.cfg.MODEL.DEVICE = 'cpu'
        self.predictor = DefaultPredictor(self.cfg)

    def predict(self,im_path):
        im = cv2.imread(im_path)


        outputs = self.predictor(im)
   
        pixel_ids = outputs['panoptic_seg'][0].cpu().detach().numpy()

        metadata = MetadataCatalog.get(self.cfg.DATASETS.TRAIN[0])
        stuff_classes = metadata.stuff_classes
        thing_classes = metadata.thing_classes

        class_dict = {}
        inst_dict = {}
        color_dict = {}
        full_info = outputs['panoptic_seg'][1]
        print(full_info)
        for pixel in full_info:
            tos = pixel["isthing"]
            idx = pixel["category_id"]
            seg_id = pixel['id']

            if tos:
                class_str = thing_classes[idx]
                color = metadata.thing_colors[idx]
                if not class_str in class_dict:
                    inst_id = 0
                    class_dict[class_str] = [inst_id]
                    

                else:
                    inst_id = max(class_dict[class_str]) + 1
                    class_dict[class_str].append(inst_id)
                
            else:
                class_str = stuff_classes[idx]
                color = metadata.stuff_colors[idx]
                inst_id = -1
                class_dict[class_str] = []
                
            
            

        

            inst_str = class_str + ":" + str(inst_id)
            inst_dict[seg_id] = inst_str

            color_dict[class_str] = color

        inst_dict[0] = "Default:-1"

        print(pixel_ids.shape)
        print(class_dict)
        print(inst_dict)
        print(color_dict)
            

            

        
        return [pixel_ids.flatten(), class_dict, inst_dict, color_dict]

# model = SegmentationModel()
# model.predict(r"C:\Users\Intern\env\Scripts\lidar_annotation_tool\app\static\datasets\0_drive_0064_sync\image\0000000500.png")
# # test_im = cv2.imread(r"C:\Users\Intern\env\Scripts\lidar_annotation_tool\app\static\datasets\0_drive_0064_sync\image\0000000500.png")

# cfg = get_cfg()
# # add project-specific config (e.g., TensorMask) here if you're not running a model in detectron2's core library
# cfg.merge_from_file(model_zoo.get_config_file("COCO-PanopticSegmentation/panoptic_fpn_R_101_3x.yaml"))
# cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5  # set threshold for this model
# # Find a model from detectron2's model zoo. You can use the https://dl.fbaipublicfiles... url as well
# cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url("COCO-PanopticSegmentation/panoptic_fpn_R_101_3x.yaml")
# cfg.MODEL.DEVICE = 'cpu'
# predictor = DefaultPredictor(cfg)
# outputs = predictor(test_im)
# pixel_ids = outputs['panoptic_seg'][0].cpu().detach().numpy()

# metadata = MetadataCatalog.get(cfg.DATASETS.TRAIN[0])
# stuff_classes = metadata.stuff_classes
# thing_classes = metadata.thing_classes




# classes = []
# full_info = outputs['panoptic_seg'][1]
# print(full_info)
# for pixel in full_info:
#     tos = pixel["isthing"]
#     idx = pixel["category_id"]
#     if tos:
#         classes.append(thing_classes[idx])
#     else:
#         classes.append(stuff_classes[idx])





# print(pixel_ids.shape)
# print(classes)

