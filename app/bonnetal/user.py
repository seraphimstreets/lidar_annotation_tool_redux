#!/usr/bin/env python3
# This file is covered by the LICENSE file in the root of this project.

import torch
import torch.nn as nn
import torch.optim as optim
import torch.backends.cudnn as cudnn
import torchvision.transforms as transforms
import imp
import yaml
import time
from PIL import Image
# import __init__ as booger
import collections
import copy
import cv2
import os
import numpy as np

from bonnetal.segmentator import *
from bonnetal.KNN import KNN
from bonnetal.parser import SemanticKitti
from bonnetal.parser import Parser
from bonnetal.laserscan import LaserScan, SemLaserScan
from matplotlib import pyplot as plt


CUR_DIR = os.getcwd()
OUTPUT_AREA = os.path.join(CUR_DIR, "output")

class User():
  def __init__(self, ARCH, DATA, modeldir):
    # parameters
    self.ARCH = ARCH
    self.DATA = DATA
 
  
    self.modeldir = modeldir


    self.sensor_img_means = torch.tensor(self.ARCH["dataset"]["sensor"]["img_means"],
                                         dtype=torch.float)
    self.sensor_img_stds = torch.tensor(self.ARCH["dataset"]["sensor"]["img_stds"],
                                        dtype=torch.float)

    self.max_points = self.ARCH["dataset"]["max_points"]

    


    # # get the data

    # self.parser = Parser(root=self.datadir,
    #                     train_sequences=self.DATA["split"]["train"],
    #                     valid_sequences=self.DATA["split"]["valid"],
    #                     test_sequences=self.DATA["split"]["test"],
    #                     labels=self.DATA["labels"],
    #                     color_map=self.DATA["color_map"],
    #                     learning_map=self.DATA["learning_map"],
    #                     learning_map_inv=self.DATA["learning_map_inv"],
    #                     sensor=self.ARCH["dataset"]["sensor"],
    #                     max_points=self.ARCH["dataset"]["max_points"],
    #                     batch_size=1,
    #                     workers=self.ARCH["train"]["workers"],
    #                     gt=True,
    #                     shuffle_train=False,
    #                     filenames=filenames)

    # concatenate the encoder and the head

    self.n_classes = len(self.DATA["learning_map_inv"])

    with torch.no_grad():
      self.model = Segmentator(self.ARCH,
                               self.n_classes,
                               self.modeldir)

    # use knn post processing?
    self.post = None
    if self.ARCH["post"]["KNN"]["use"]:
      self.post = KNN(self.ARCH["post"]["KNN"]["params"],
                      self.n_classes)

    # GPU?
    self.gpu = False
    self.model_single = self.model
    self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("Infering in device: ", self.device)
    if torch.cuda.is_available() and torch.cuda.device_count() > 0:
      cudnn.benchmark = True
      cudnn.fastest = True
      self.gpu = True
      self.model.cuda()

  # def infer(self):
  #   # do train set
  #   # self.infer_subset(loader=self.parser.get_train_set(),
  #   #                   to_orig_fn=self.parser.to_original)

  #   # # do valid set
  #   # self.infer_subset(loader=self.parser.get_valid_set(),
  #   #                   to_orig_fn=self.parser.to_original)
  #   # do test set
  #   self.infer_subset(loader=self.parser.get_test_set(),
  #                     to_orig_fn=self.parser.to_original)

  #   print('Finished Infering')

  #   return

  @staticmethod
  def get_mpl_colormap(cmap_name):
    cmap = plt.get_cmap(cmap_name)
    # Initialize the matplotlib color map
    sm = plt.cm.ScalarMappable(cmap=cmap)
    # Obtain linear color range
    color_range = sm.to_rgba(np.linspace(0, 1, 256), bytes=True)[:, 2::-1]
    return color_range.reshape(256, 1, 3)

  @staticmethod
  def make_log_img(depth, mask, pred, color_fn):
    # input should be [depth, pred, gt]
    # make range image (normalized to 0,1 for saving)
    depth = (cv2.normalize(depth, None, alpha=0, beta=1,
                           norm_type=cv2.NORM_MINMAX,
                           dtype=cv2.CV_32F) * 255.0).astype(np.uint8)
    out_img = cv2.applyColorMap(
        depth, User.get_mpl_colormap('viridis')) * mask[..., None]
    # make label prediction
    pred_color = color_fn((pred * mask).astype(np.int32))
    out_img = np.concatenate([out_img, pred_color], axis=0)
    return (out_img).astype(np.uint8)

  def infer_one(self, pth):

    start = time.time() 
    scan_file = pth

    scan = LaserScan(project=True,
                      H=self.ARCH["dataset"]["sensor"]["img_prop"]["height"],
                        W=self.ARCH["dataset"]["sensor"]["img_prop"]["width"],
                        fov_up=self.ARCH["dataset"]["sensor"]["fov_up"],
                        fov_down=self.ARCH["dataset"]["sensor"]["fov_down"],
                        max_points=self.max_points)

    # open and obtain scan
    scan.open_scan(scan_file)

    unproj_n_points = scan.points.shape[0]
    unproj_xyz = torch.full((self.max_points, 3), -1.0, dtype=torch.float)
    unproj_xyz[:unproj_n_points] = torch.from_numpy(scan.points)
    unproj_range = torch.full([self.max_points], -1.0, dtype=torch.float)
    unproj_range[:unproj_n_points] = torch.from_numpy(scan.unproj_range)
    unproj_remissions = torch.full([self.max_points], -1.0, dtype=torch.float)
    unproj_remissions[:unproj_n_points] = torch.from_numpy(scan.remissions)

    unproj_labels = []

    # get points and labels
    proj_range = torch.from_numpy(scan.proj_range).clone()
    proj_xyz = torch.from_numpy(scan.proj_xyz).clone()
    proj_remission = torch.from_numpy(scan.proj_remission).clone()
    proj_mask = torch.from_numpy(scan.proj_mask)

   
    proj_labels = []
    proj_x = torch.full([self.max_points], -1, dtype=torch.long)
    proj_x[:unproj_n_points] = torch.from_numpy(scan.proj_x)
    proj_y = torch.full([self.max_points], -1, dtype=torch.long)
    proj_y[:unproj_n_points] = torch.from_numpy(scan.proj_y)
    proj = torch.cat([proj_range.unsqueeze(0).clone(),
                      proj_xyz.clone().permute(2, 0, 1),
                      proj_remission.unsqueeze(0).clone()])
    proj = (proj - self.sensor_img_means[:, None, None]
            ) / self.sensor_img_stds[:, None, None]
    proj = proj * proj_mask.float()

    ####


    path_name = scan_file

    if self.gpu:
      proj_in = proj.cuda()
      proj_mask = proj_mask.cuda()
      p_x = proj_x.cuda()
      p_y = proj_y.cuda()
      if self.post:
        proj_range = proj_range.cuda()
        unproj_range = unproj_range.cuda()
    
    else:
      proj_in = torch.unsqueeze(proj, 0)
      proj_mask = torch.unsqueeze(proj_mask, 0)
      p_x = proj_x
      p_y = proj_y

    # compute output

    print(proj_in.shape)
    print(proj_mask.shape)

    
    proj_output = self.model(proj_in, proj_mask)
    proj_argmax = proj_output[0].argmax(dim=0)

  

    if self.post:
      # knn postproc
      unproj_argmax = self.post(proj_range,
                                unproj_range,
                                proj_argmax,
                                p_x,
                                p_y)
    else:
      # put in original pointcloud using indexes
      unproj_argmax = proj_argmax[p_y, p_x]

    # measure elapsed time
    if torch.cuda.is_available():
      torch.cuda.synchronize()

    print("Time elapsed: {}s".format(time.time() - start))
  

    # save scan
    # get the first scan in batch and project scan
    pred_np = unproj_argmax.cpu().numpy()
    pred_np = pred_np.reshape((-1)).astype(np.int32)

    # map to original label
    # pred_np = to_orig_fn(pred_np)
    pred_np = SemanticKitti.map(pred_np, self.DATA["learning_map_inv"])
    pred_np = pred_np[:unproj_n_points]

    # file_pref = fn.split('.')[0]

    # output_drive = os.path.join(OUTPUT_AREA, drivename)

    # if not os.path.isdir(output_drive):
    #   os.makedirs(output_drive)


    # # save scan
    # final_path = os.path.join(OUTPUT_AREA, drivename, file_pref + '.bin')
   
    # pred_np.tofile(final_path)

    return [pred_np, self.DATA["labels"], self.DATA["color_map"], scan.orig_size]


  def infer_subset(self, loader, to_orig_fn):
    # switch to evaluate mode
    self.model.eval()

    # empty the cache to infer in high res
    if self.gpu:
      torch.cuda.empty_cache()

    with torch.no_grad():
      end = time.time()

      for i, (proj_in, proj_mask, proj_range, unproj_range, p_x, p_y, path_name) in enumerate(loader):
        # first cut to rela size (batch size one allows it)
        # p_x = p_x[0, :npoints]
        # p_y = p_y[0, :npoints]
        # proj_range = proj_range[0, :npoints]
        # unproj_range = unproj_range[0, :npoints]
        # path_seq = path_seq[0]
        # path_name = path_name[0]

        if self.gpu:
          proj_in = proj_in.cuda()
          proj_mask = proj_mask.cuda()
          p_x = p_x.cuda()
          p_y = p_y.cuda()
          if self.post:
            proj_range = proj_range.cuda()
            unproj_range = unproj_range.cuda()

        # compute output
        print(proj_in.shape)
        print(proj_mask.shape)
        proj_output = self.model(proj_in, proj_mask)
        proj_argmax = proj_output[0].argmax(dim=0)

        ### DEBUG VIZ ###
        # pred_np = proj_argmax.cpu().numpy()
        # mask_np = proj_mask[0].cpu().numpy()
        # depth_np = proj_in[0][0].cpu().numpy()
        # out = User.make_log_img(depth_np, mask_np, pred_np, self.parser.to_color)
        # cv2.imshow("sample_training", out)
        # cv2.waitKey(1)
        ### DEBUG VIZ END ###

        if self.post:
          # knn postproc
          unproj_argmax = self.post(proj_range,
                                    unproj_range,
                                    proj_argmax,
                                    p_x,
                                    p_y)
        else:
          # put in original pointcloud using indexes
          unproj_argmax = proj_argmax[p_y, p_x]

        # measure elapsed time
        if torch.cuda.is_available():
          torch.cuda.synchronize()

        print( time.time() - end)
        end = time.time()

        # save scan
        # get the first scan in batch and project scan
        pred_np = unproj_argmax.cpu().numpy()
        pred_np = pred_np.reshape((-1)).astype(np.int32)

        # map to original label
        pred_np = to_orig_fn(pred_np)
        print(unproj_argmax.shape)
        print(path_name)

        fn = path_name[0].split('\\')[-1].split('.')[0]
        print(fn)

        # save scan
        path = os.path.join(OUTPUT_AREA, fn + '.bin')
        print(np.unique(pred_np))
        pred_np.tofile(path)
