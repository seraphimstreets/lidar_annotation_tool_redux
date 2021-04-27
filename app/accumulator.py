import os 
import numpy as np
import pandas as pd
import json
from oxt import  load_oxts_lite_data, oxts2pose
TARGET_POINTCLOUD_SIZE = 500000
CURRENT_DIRECTORY = os.getcwd()
DATASETS_DIR = os.path.join(CURRENT_DIRECTORY, "static", "datasets")

T_imu_lidar = np.array([0.9999976, 0.0007553071, -0.002035826, -0.8086759, -0.0007854027, 0.9998898, -0.01482298,0.3195559, 
0.002024406, 0.01482454, 0.9998881,-0.7997231, 0,0,0,1]).reshape(4,4)
print(T_imu_lidar)

def accumulate_pointclouds(ds_name, intensity_included=False):

    print(ds_name)

    raw_bin_folder = os.path.join(ds_name, "bin_data")
    images_folder = os.path.join(ds_name, "images")
    output_folder = os.path.join(ds_name, "accumulated_bins")
    pose_path= os.path.join(ds_name, 'poses.csv')

    pose_file = np.loadtxt(pose_path, delimiter=',')

    pose_timestamps = pose_file[:,0]
    pose_data = pose_file[:,1:]

 
    
    if not os.path.isdir(output_folder):
        try:  
            os.makedirs(output_folder)
        except OSError:  
            print ("Creation of the directory {} failed".format(output_folder))

    out_arr = []
    image_names = []
    accumulator_pc_tracker = [[]]
    accumulator_image_tracker = [[]]
    accumulator_dict = {}
    look_ats = []
    velo_transforms = []
    file_names = []
    all_counts = []

    count = 0
    accum_count = 0

    frame_origin = np.array([0,0,0])
    new_start = True
    accum_transform = np.eye(4)

    accumulator_dict[ds_name] = {}

    for i, fn in enumerate(os.listdir(raw_bin_folder)):

        filename = os.path.join(raw_bin_folder, fn)

        if intensity_included:
            bin_points = np.fromfile(filename, dtype=np.float32).reshape(-1,4)
            intensity = bin_points[:,3].reshape(-1, 1)
           
            bin_points = np.concatenate([bin_points[:,:3], np.ones((bin_points.shape[0], 1))], axis=1).T
          
        else:
            bin_points = np.fromfile(fn, dtype=np.float32).reshape(-1,3)
            bin_points = np.concatenate(bin_points, np.ones((bin_point.shape[0], 1)), axis=1).T
            intensity = np.zeros((bin_points.shape[0], 1))
        
        # homogeneous transformation matrix 
        velo_transform = pose_data[i].reshape(4,4)
        print(velo_transform)
        velo_translation = velo_transform[:, 3]
        velo_rotation = pose_data[:, :3]

        if new_start:
            frame_origin = velo_translation
            new_start = False

        accum_transform = velo_transform @ accum_transform
          

        image_name = fn.split('.')[0] + '.png'
        if os.path.exists(os.path.join(ds_name, "image", image_name)):
            image_names.append(image_name)

        camera_position = velo_translation - frame_origin

        file_names.append(fn.split('.')[0])
   
        ar = np.zeros((4,))
        ar[2:4] = 1
        kat = velo_transform @ ar
            
        look_ats.append(kat[:3].tolist())
        velo_transforms.append(velo_transform.flatten().tolist())
        accumulator_image_tracker[accum_count].append(camera_position[:3].tolist())
        all_counts.append(count)

        inv_transform = np.linalg.inv(velo_transform)


        # bin_points = T_imu_lidar @ bin_points
        bin_points = velo_transform @ bin_points

        bin_points = bin_points - frame_origin.reshape(4,1)
        bin_points = bin_points[:3, :].T
  
        bin_points = np.concatenate([bin_points, intensity], axis=1)

        print(bin_points[:5,:])
        

        out_arr.append(bin_points)

        count += bin_points.shape[0]
     

        if count >= TARGET_POINTCLOUD_SIZE or i == (len(os.listdir(raw_bin_folder)) - 1):

            out_arr = np.concatenate(out_arr, axis=0)
            out_arr = np.array(out_arr, dtype=np.float32)
            drivename = ds_name.split("\\")[-1]

            all_counts.append(count)
            fran = os.path.join(ds_name , "accumulated_bins", drivename + '_' + str(accum_count) + '.bin')
            flint = drivename + '_' + str(accum_count)

            
            accumulator_dict[flint] = {}
            accumulator_dict[flint]['file_names'] = file_names
            accumulator_dict[flint]['image_names'] = image_names
            accumulator_dict[flint]['camera_positions'] = accumulator_image_tracker[accum_count]
            accumulator_dict[flint]['look_ats'] =  look_ats
            accumulator_dict[flint]['point_counts'] = all_counts
            accumulator_dict[flint]['velo_transforms'] = velo_transforms
            out_arr.tofile(fran)


            if not (i == (len(os.listdir(raw_bin_folder)) - 1)):
                accumulator_image_tracker.append([])
                accumulator_pc_tracker.append([])
                out_arr = []
                look_ats = []
                file_names = []
                velo_transforms = []
                all_counts = []
                count = 0
                accum_count += 1
                new_start = True
                image_names = []
        else:
            new_start = False

  
        
    # save_filename = os.path.join(ds_name, "accumulator_image_tracker.json")
    # with open(save_filename, "w") as f:
    #     f.write(json.dumps(accumulator_image_tracker))

    # save_filename = os.path.join(ds_name, "accumulator_pc_tracker.json")
    # with open(save_filename, "w") as f:
    #     f.write(json.dumps(accumulator_pc_tracker))

    save_filename = os.path.join(ds_name, "accumulator_dict.json")
    with open(save_filename, "w") as f:
        f.write(json.dumps(accumulator_dict))
        
        

    
    
if __name__ == "__main__":

    for dn in os.listdir(DATASETS_DIR):
        ds_name  = os.path.join(DATASETS_DIR, dn)
        oxt_dir = os.path.join(ds_name,'oxts')
        poses_file = os.path.join(ds_name, 'poses.csv')
        if 'sync' in ds_name:
            if os.path.isdir(oxt_dir):
                oxts = load_oxts_lite_data(oxt_dir)
        
                oxts2pose(oxts,ds_name)

        print(ds_name)

        if 'sync' in ds_name:
            accumulate_pointclouds(ds_name, intensity_included=True)

        

        