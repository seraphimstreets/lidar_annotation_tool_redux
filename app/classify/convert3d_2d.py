#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jul 30 17:23:50 2018

@author: bc
"""
import os
import time
import numpy as np
import matplotlib.pyplot as plt
import sys
# from classify.calib import Calib
# import classify.getCoord as getCoord
# import math
# import skimage
# from skimage import io
# import classify.config
from PIL import Image
import cv2
import json
import math 


from queue import PriorityQueue 
import base64



CUR_DIR = os.path.dirname(os.path.realpath(__file__))
PARENT_DIR = os.path.abspath(os.path.join(CUR_DIR, os.pardir))
print(PARENT_DIR)
SERVER_IMAGE_OUTPUT_PATH = os.path.join("http://localhost:8080", "images")
#IMAGE_OUTPUT_PATH = "C:\Programming\lidar_tool\lidar_tool\Scripts\lidar_annotation_tool\imgserver\images"
DATA_DIR = os.path.join(PARENT_DIR, "test_dataset")
IMAGE_PATH = "image"
BIN_PATH = "bin_data"
CALIBRATION_PATH = os.path.join(CUR_DIR, "calib")
INDS_OUTPUT_PATH = r"C:\Programming\lidar_tool\lidar_tool\Scripts\lidar_annotation_tool\output"

OUTPUT_DIR = os.path.join(PARENT_DIR, "output")

sys.path.insert(0, PARENT_DIR) 
from frame_handler import FrameHandler

def rotation_matrix(theta):
    return np.array([[np.cos(theta), -np.sin(theta)], 
                     [np.sin(theta), np.cos(theta)]])

def proj_lidar_on_image(pts_velo, classes, class_colors, img, calib, drivename, fname, knn=None):

    proj_velo2cam0 = calib.get_velo2cam(0)
    
    pts_2d = calib.proj_to_img(pts_velo.T, proj_velo2cam0)

    img_height = img.shape[0]
    img_width = img.shape[1]
    
 
    # Filter lidar points to be within image FOV
    inds = np.where((pts_2d[0, :] < img_width) & (pts_2d[0, :] >= 0) &
                    (pts_2d[1, :] < img_height) & (pts_2d[1, :] >= 0) &
                    (pts_velo[:, 0] > 0)
                    )[0]

    



    # Filter out pixels points
    imgfov_pc_pixel = pts_2d[:, inds]

    

    # Retrieve depth from lidar
    imgfov_pc_velo = pts_velo[inds, :]
    imgfov_pc_velo = np.hstack((imgfov_pc_velo, np.ones((imgfov_pc_velo.shape[0], 1))))
    imgfov_pc_cam2 = proj_velo2cam0 @ imgfov_pc_velo.transpose()

    if classes == "":
        cmap = plt.cm.get_cmap('hsv', 256)
        cmap = np.array([cmap(i) for i in range(256)])[:, :3] * 255
    else:
        class_fov = np.array(classes)[inds]

    
        
    

    

    if knn:
        canvas = np.zeros((img_height, img_width)) - 1
        canvas = canvas.reshape((img_height, img_width))
        num_pixels = img_height* img_width

        ccs = []
        for clr in class_colors.values():
            ccs.append(convert_hex_rgb(clr))
        
      
        for i in range(imgfov_pc_pixel.shape[1]):
            idx = int(np.round(imgfov_pc_pixel[1, i])) * img_width +  int(np.round(imgfov_pc_pixel[0, i]))
            if(idx > canvas.shape[0]):
                continue
            canvas[int(idx)] = class_fov[i]
        
            color = ccs[class_fov[i]]

            cv2.circle(img, (int(np.round(imgfov_pc_pixel[0, i])),
                            int(np.round(imgfov_pc_pixel[1, i]))),
                    2, color=(color[2], color[1], color[0]), thickness=-1)

        
        
        print(canvas.any())

        for i in range(canvas.shape[0]):
            for j in range(canvas.shape[1]):

                cl = canvas[i,j] 
                
              
                if(cl == -1):
                    neighbour_cls = []
                    posses = [[i,j+1], [i, j-1], [i+1, j], [i-1, j], 
                   [i+1,j+1], [i+1,j-1], [i-1,j+1] , [i-1,j-1]]
                    majority = -1
                    for poss in posses:
                        if poss[0] < 0 or  poss[0] >= img_height or  poss[1] < 0 or poss[1] >= img_width:
                            continue
                        
                       
                        neigh_cl = canvas[poss[0], poss[1]]
                      
                        if neigh_cl != -1:
                            print(majority)
                            majority = int(neigh_cl)
                    
                    
                    # majority = int(max(set(neighbour_cls), key=neighbour_cls.count))
                 
                    if majority == -1:
                        color = ccs[0]
                    else:
                        color = ccs[majority]
                
                    
                   
                    cv2.circle(img, (j, i), 2, color=(color[2], color[1], color[0]), thickness=-1)

                

    else:
        for i in range(imgfov_pc_pixel.shape[1]):

            if classes == "":
                depth = imgfov_pc_cam2[2, i]
                color = tuple(cmap[int(640.0 / depth), :])
            else:
                color = convert_hex_rgb(class_colors[str(class_fov[i])])

                
            
            cv2.circle(img, (int(np.round(imgfov_pc_pixel[0, i])),
                            int(np.round(imgfov_pc_pixel[1, i]))),
                    2, color=(color[2], color[1], color[0]), thickness=-1)

                    
                
   
    imgname =os.path.join("static/images/",drivename, fname + '_' +  str(time.time()) + '_dotted.png') 
    
    cv2.imwrite(imgname,img)
    return {'imgname':imgname}

def proj_image_on_lidar(pts_2d, cp, look_at, transform, calib):

    proj_cam2velo = calib.get_cam2velo(0)
    
    pts_3d = calib.proj_to_pointcloud(pts_2d, proj_cam2velo)
    # pts_3d = np.concatenate([pts_3d.T, np.ones((pts_3d.shape[1], 1))], axis=1).T
    # pts_3d = transform @ pts_3d
    # pts_3d = pts_3d[:,:3].T
   
    # cp = cp.reshape(3,1)
    # pts_3d = cp + pts_3d
    # pts_3d = look_at @ pts_3d
    # pts_3d = pts_3d[:3,:]
    print(pts_3d)

  

   
    return pts_3d.tolist()

def create_new_image(inPolygon, color , baseImage):
    image = Image.open(baseImage)
    img_arr = np.array(image)


    for (i, j) in inPolygon:
        img_arr[i,j][0] = color[0]
        img_arr[i,j][1] = color[1]
        img_arr[i,j][2] = color[2]
     

    img = Image.fromarray(img_arr, 'RGB')
    newPicPath = os.path.splitext(baseImage)[0] +  str(time.time()) + "_masked.png"
    img.save(newPicPath)
    return newPicPath

def fixPixelInsts(pixelInsts, fh, drivename, fname, baseImage):
    changed = False
    print(drivename)
    print(fname)
    print(baseImage)
   
    if(pixelInsts == -1 or pixelInsts == []):
        return

    
    try:
        for i, pi in enumerate(pixelInsts):
            if pi == 'null' or pi == None:
                changed = True
                pixelInsts[i] = -1
                
        if changed:
            fh.save_image_insts(drivename, fname, baseImage, json.dumps(pixelInsts))
    except:
        print("FAILED")
        print(pixelInsts)


def create_loaded_image(pixelClasses, pixelInsts,  class_colors, baseImage, fh=None, names=None):
    print(baseImage)
  
    image = Image.open(baseImage)
    if pixelClasses == 0:
        return baseImage
    
    img_arr = np.array(image)
    img_h, img_w = img_arr.shape[0], img_arr.shape[1]
    img_arr = img_arr.reshape(img_h*img_w, 3)

    color_obj = {}

    for color in class_colors.keys():
        color_obj[int(color)] = convert_hex_rgb(class_colors[str(color)])

    needs_change = False

    print("???")
   

    for i, cl in enumerate(pixelClasses):
        if cl == 0:
            continue


        if not cl in color_obj.keys():
            pixelClasses[i] = 0 
            pixelInsts = -1
            needs_change = True
          
            continue
    
        color = color_obj[cl]
    
        img_arr[i][0] = color[0]
        img_arr[i][1] = color[1]
        img_arr[i][2] = color[2]

    if needs_change:
        if fh:
            fh.save_image_bin(names[0], names[1], names[2], json.dumps(pixelClasses), json.dumps(pixelInsts))



    print(img_arr.shape)
        
        
    img_arr = img_arr.reshape(img_h, img_w, 3)
    img = Image.fromarray(img_arr, 'RGB')
    newPicPath = os.path.splitext(baseImage)[0] +  str(time.time()) + "_masked.png"
    img.save(newPicPath)
    print(newPicPath)
   

    return newPicPath, img_arr.shape[1], img_arr.shape[0]

def update_trackers_from_canvas(url, drivename, fname, shortName, pixelClasses, pixelInsts):
    savename = os.path.join(PARENT_DIR, drivename, fname, shortName + '_canvas.png')
    with open(savename, "wb") as fh:
        fh.write(base64.decodebytes(url))

def highlight_instance(baseImage, instancePixs, color, cl, inst_id):
    color = convert_hex_rgb(color)
    image = Image.open(baseImage)
    
    img_arr = np.array(image)
    img_h, img_w = img_arr.shape[0], img_arr.shape[1]
    img_arr = img_arr.reshape(img_h*img_w, 3)

    img_arr[instancePixs,:] = color

    img_arr = img_arr.reshape(img_h, img_w, 3)
    img = Image.fromarray(img_arr, 'RGB')

    newPicPath = os.path.splitext(baseImage)[0] +  str(time.time()) + "_instance" + str(inst_id) + "_masked.png"
    img.save(newPicPath)
   

    return newPicPath


    



def convert_hex_rgb(hexa):
    h = hexa.lstrip('#')
    n =  tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    return n

def getKclosest(arr,n,x,k): 
    k_closest = []
    # Make a max heap of difference with  
    # first k elements.  
    pq = PriorityQueue() 
    for i in range(k): 
        pq.put((-abs(arr[i]-x),i)) 
  
    # Now process remaining elements 
    for i in range(k,n): 
        diff = abs(arr[i]-x) 
        p,pi = pq.get() 
        curr = -p 
  
        # If difference with current  
        # element is more than root,  
        # then put it back.  
        if diff>curr: 
            pq.put((-curr,pi)) 
            continue
        else: 
  
            # Else remove root and insert 
            pq.put((-diff,i)) 
              
    # Print contents of heap. 
    while(not pq.empty()): 
        p,q = pq.get() 
        k_closest.append(arr[q])


    return k_closest


if __name__ == "__main__":
    
    fh = FrameHandler()
    for drivename in os.listdir(OUTPUT_DIR):
        for fname in os.listdir(os.path.join(OUTPUT_DIR, drivename)):
            cand = os.path.join(OUTPUT_DIR, drivename, fname)
            if os.path.isdir(cand):
                for ticker in os.listdir(cand):
                    if "imageInsts.json" in ticker:
                        baseImage = ticker.split('_')[:-1]
                        baseImage = '_'.join(baseImage)
                        imageInsts = fh.load_pixel_insts(drivename, fname, baseImage)
                        fixPixelInsts(imageInsts, fh, drivename, fname, baseImage)

