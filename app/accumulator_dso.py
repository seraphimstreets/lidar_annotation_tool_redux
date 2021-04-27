import numpy as np 
import pandas as pd
import mathutils
from mathutils import Vector, Matrix
import pyquaternion as pyq
import os
import math
from scipy.spatial.transform import Rotation as R
import json
import getopt
import argparse


TARGET_POINTCLOUD_SIZE = 500000
CURRENT_DIRECTORY = os.getcwd()
DATASETS_DIR = os.path.join(CURRENT_DIRECTORY, "static", "datasets")
initial_inv = None

# IMU-Lidar calibration. Change these as required.
trans_imu_lidar = np.array([2.1043210549, 0.5762276721, 1.3425229344 ]).reshape(3,1)
rot_imu_lidar = R.from_quat([-0.0218971284, 0.0227322260, -0.7102333014, 0.7032584299]).as_dcm()

def non_accumulate_pointclouds(ds_name, intensity_included):
    raw_bin_folder = os.path.join(ds_name, "bin_data")
    ds_image_folder = os.path.join(ds_name, "image")
    output_folder = os.path.join(ds_name, "accumulated_bins")
    ds_image_folder = os.path.join(ds_name, "image")
    

    raw_bin_names = os.listdir(raw_bin_folder)
    
    ds_image_names = os.listdir(ds_image_folder)
    print(ds_image_names)

    if len(ds_image_names) != len(raw_bin_names):
        print("Warning: Number of images does not match number of bins.")

    accumulator_dict = {}

    for i, fn in enumerate(raw_bin_names):
        rbn = os.path.join(raw_bin_folder, fn)

        if fn.split('.')[-1] == 'bin':
            bin_points = np.fromfile(rbn, dtype=np.float32)
            bin_points.tofile(os.path.join(output_folder, fn))
        elif fn.split('.')[-1] == 'txt':
            bin_points = np.loadtxt(rbn, delimiter=' ',skiprows=1).astype('float32')
            print("Text file found, saving to bin...")
            bin_points.tofile(os.path.join(output_folder, fn.replace(".txt", ".bin")))
            bin_name = os.path.join(raw_bin_folder, fn.replace(".txt", ".bin"))
            if not os.path.exists(bin_name):
                bin_points.tofile(bin_name)
            os.remove()
            fn = fn.replace(".txt", ".bin")


        else:
            print("Pointcloud is not in recognized format. (.bin/.txt). Exiting...")
            return

        
        rbf = fn.split(".")[0]

        accumulator_dict[rbf] = {}
        accumulator_dict[rbf]['file_names'] = [fn.split(".")[0]]
        accumulator_dict[rbf]['camera_positions'] = [[0,0,0]]
        accumulator_dict[rbf]['look_ats'] =  [[0,0,1]]
        accumulator_dict[rbf]['point_counts'] = [0]
        accumulator_dict[rbf]['image_names'] = [ds_image_names[i]]
        accumulator_dict[rbf]['velo_transforms'] = [np.eye(4).flatten().tolist()]


    save_filename = os.path.join(ds_name ,"accumulator_dict.json")
    with open(save_filename, "w") as f:
        f.write(json.dumps(accumulator_dict))







def accumulate_pointclouds(ds_name, intensity_included):


    output_folder = os.path.join(ds_name, "accumulated_bins")
    pose_path= os.path.join(ds_name, 'poses.csv')
    raw_bin_folder = os.path.join(ds_name, "bin_data")
    ds_image_folder = os.path.join(ds_name, "image")
    short_name = ds_name.split('\\')[-1]

   

    with open(os.path.join(ds_name, "timestamps.json")) as read_file:
        bin_timestamps =  json.load(read_file)
    for i in range(len(bin_timestamps)):
        bin_timestamps[i] = float(bin_timestamps[i])
    bin_timestamps = sorted(bin_timestamps)


    
    raw_bin_names = os.listdir(raw_bin_folder)
    
    ds_image_names = os.listdir(ds_image_folder)


    if len(raw_bin_names) != len(bin_timestamps):
        print("Number of bins does not match the number of timestamps given. Exiting...")
        return

    if len(ds_image_names) == 0:
        print("Warning: No images found.")

    if len(ds_image_names) != len(raw_bin_names):
        print("Warning: Number of images does not match number of bins.")

    pose_file = np.loadtxt(pose_path, delimiter=',')
    pose_data = pose_file[:,1:]
    pose_timestamps = sorted(pose_file[:,0])

  


    T_imu_lidar = np.concatenate([ rot_imu_lidar, trans_imu_lidar], axis=1)
    T_imu_lidar = np.concatenate([T_imu_lidar, np.array([0,0,0,1]).reshape(1,4)], axis=0)

 

    if not os.path.isdir(output_folder):
        try:  
            os.makedirs(output_folder)
        except OSError:  
            print ("Creation of the directory {} failed".format(output_folder))

    for fn in os.listdir(output_folder):
        path = os.path.join(output_folder, fn)
        os.remove(path)

    # out_arr all the transformed points
    out_arr = []

    # other miscellaneous intermediate info
    image_names = []
    accumulator_dict = {}
    look_ats = []
    velo_transforms = []
    file_names = []
    camera_positions = []
    all_point_counts = []

    count = 0
    accum_count = 0

    frame_origin = np.array([0,0,0])
    frame_transform = None


    bin_idx = 0
    pose_idx = 0


    min_pose_timestamp = min(pose_timestamps)
    new_start = True

    

    while True:
        if bin_idx == len(bin_timestamps) or pose_idx + 1 == len(pose_timestamps):

            if(len(out_arr) == 0):
                break
            out_arr = np.concatenate(out_arr, axis=0)
            out_arr = np.array(out_arr, dtype=np.float32)

            accum_pc_name = 'test' + '_' + str(accum_count)
            accumulated_name = os.path.join(ds_name, "accumulated_bins",  'test' + '_' + str(accum_count) + '.bin')
      
            accumulator_dict[accum_pc_name] = {}
            accumulator_dict[accum_pc_name]['file_names'] = file_names
            accumulator_dict[accum_pc_name]['camera_positions'] = camera_positions
            accumulator_dict[accum_pc_name]['look_ats'] =  look_ats
            accumulator_dict[accum_pc_name]['point_counts'] = all_point_counts
            accumulator_dict[accum_pc_name]['image_names'] = image_names
            accumulator_dict[accum_pc_name]['velo_transforms'] = velo_transforms

            out_arr.tofile(accumulated_name)

            break

        bin_timestamp = bin_timestamps[bin_idx]
        prev_pose_timestamp = pose_timestamps[pose_idx]
        next_pose_timestamp = pose_timestamps[pose_idx + 1]

     

        if bin_timestamp < min_pose_timestamp:
            print("Warning: One of the bin timestamps cannot be interpolated from poses as it is too early. Skipping...")
            bin_idx += 1
            continue


        

        if  bin_timestamp < next_pose_timestamp and bin_timestamp > prev_pose_timestamp:
            prev_mat = pose_data[pose_idx,:].reshape(4,4)
            next_mat = pose_data[pose_idx + 1,:].reshape(4,4)

          
            interpolation_factor = (bin_timestamp  - prev_pose_timestamp)/(next_pose_timestamp - prev_pose_timestamp)
            new_t = lerp_vec(prev_mat[:3,3], next_mat[:3,3], interpolation_factor).reshape(3, 1)
            if not np.array_equal(prev_mat[:3,:3], next_mat[:3,:3]):
                new_R = slerp_mat(prev_mat[:3,:3], next_mat[:3,:3], interpolation_factor)
            else:
                new_R = next_mat[:3,:3]
            new_T = make_mat_homogeneous(np.concatenate([new_R, new_t], axis=1))

            fn = os.path.join(raw_bin_folder, raw_bin_names[bin_idx])


            if fn.split('.')[-1] == 'bin':
                bin_points = np.fromfile(fn, dtype=np.float32)
            elif fn.split('.')[-1] == 'txt':
                bin_points = np.loadtxt(fn, delimiter=' ',skiprows=1).astype('float32')
                bin_name = os.path.join(raw_bin_folder, raw_bin_names[bin_idx].split('.')[0] + '.bin')
                print("Text file found, saving to bin...")
                if not os.path.exists(bin_name):
                    bin_points.tofile(bin_name)


            else:
                print("Pointcloud is not in recognized format. (.bin/.txt). Exiting...")
                return
            
          
            if intensity_included:
                
                bin_points = bin_points.reshape(-1,4)
                intensity = bin_points[:,3].reshape(-1, 1)
                bin_points = np.concatenate([bin_points[:,:3], np.ones((bin_points.shape[0], 1))], axis=1).T
       
             
            else:
                bin_points = bin_points.reshape(-1,3)
                intensity = np.zeros((bin_points.shape[0], 1))
                bin_points = np.concatenate(bin_points, np.ones((bin_point.shape[0], 1)), axis=1).T
                

            velo_transform = new_T
            velo_translation = new_T[:, 3]
            velo_rotation = new_T[:, :3]

            
 

            if new_start:
                frame_origin = velo_translation
                frame_transform = velo_transform @T_imu_lidar
                new_start = False
            
            ## collecting some miscellaneous info
            camera_position = velo_translation[:3] 
            camera_positions.append(camera_position.tolist())

            kat = velo_transform @ np.array([0,0,1,1])
            look_ats.append(kat[:3].tolist())  

            
            file_name = raw_bin_names[bin_idx].split('.')[0]
            file_names.append(file_name)
            
            im_name = ds_image_names[bin_idx]
            image_names.append(im_name)
            ohko = velo_transform @ T_imu_lidar
            relative_transform =   ohko @ np.linalg.inv(frame_transform)
            
            real_transform = np.linalg.inv(T_imu_lidar )  @ np.linalg.inv(velo_transform)
            print(real_transform) 
            


            velo_transforms.append(real_transform.flatten().tolist())
            print(f"Orig bin points: {bin_points[:5,:]}")

            bin_points = T_imu_lidar @ bin_points
            bin_points = velo_transform @ bin_points
            # bin_points = real_transform @ bin_points
            bin_points = bin_points[:3, :].T
            bin_points = bin_points - frame_origin[:3]

            test_bin_points = bin_points.copy()
            test_bin_points += frame_origin[:3]
            test_bin_points = np.concatenate([test_bin_points, np.ones((test_bin_points.shape[0], 1))], axis=1)
            test_bin_points = real_transform @ test_bin_points.T

            print(f"Test bin points:{test_bin_points[:5,:]}")
            bin_points = np.concatenate([bin_points, intensity], axis=1)

        
            
            out_arr.append(bin_points)



            all_point_counts.append(count)
            count += bin_points.shape[0]


            bin_idx += 1
        

            if count >= TARGET_POINTCLOUD_SIZE:

                out_arr = np.concatenate(out_arr, axis=0)
                out_arr = np.array(out_arr, dtype=np.float32)

                all_point_counts.append(count)


                accum_pc_name = 'test' + '_' + str(accum_count)
                
                accumulated_name = os.path.join(ds_name, "accumulated_bins",  accum_pc_name + '.bin')

        
                accumulator_dict[accum_pc_name] = {}
                accumulator_dict[accum_pc_name]['file_names'] = file_names
                accumulator_dict[accum_pc_name]['camera_positions'] = camera_positions
                accumulator_dict[accum_pc_name]['look_ats'] =  look_ats
                accumulator_dict[accum_pc_name]['point_counts'] = all_point_counts
                accumulator_dict[accum_pc_name]['image_names'] = image_names
                accumulator_dict[accum_pc_name]['velo_transforms'] = velo_transforms


                out_arr = []
                look_ats = []
                velo_transforms = []
                file_names = []
                count = 0
                accum_count += 1
                new_start = True
                
                image_names = []
                camera_positions = []
                all_point_counts = []
           
        else:
            pose_idx += 1
            



    save_filename = os.path.join(ds_name ,"accumulator_dict.json")
    with open(save_filename, "w") as f:
        f.write(json.dumps(accumulator_dict))

            

            
            

        
   
    
def lerp_vec(vec1, vec2, interpolation_factor):
    return (1-interpolation_factor) * vec1 + interpolation_factor * vec2

def slerp_mat(mat1, mat2, interpolation_factor):

    # mathutils.slerp can only slerp between two vectors/quaternions. 

    a = pyq.Quaternion(matrix=mat1)
    b = pyq.Quaternion(matrix=mat2)
    return pyq.Quaternion.slerp(a, b, interpolation_factor).rotation_matrix
    
   



def make_mat_homogeneous(mat):
    
    new_mat = np.eye(4)
    new_mat[:3,:] = mat
    return new_mat


def pose_converter(all_poses, ds_name):
    # converts (x,y,z, quaternion) data to transformation matrices

 
    timestamps = []
    poses = []


    
    for i in range(all_poses.shape[0]):  
    
        rot_mat = R.from_quat([all_poses[i][3],all_poses[i][4],all_poses[i][5],all_poses[i][6]]).as_dcm()
     
  
        trans_vec = np.array([all_poses[i][0],all_poses[i][1],all_poses[i][2]]).reshape(3,1)

        homo_mat = np.concatenate([rot_mat, trans_vec], axis=1)
        homo_mat = np.concatenate([homo_mat, np.array([0,0,0,1]).reshape(1,4)], axis=0)

        
        poses.append(homo_mat.reshape(1,16))

        timestamps.append(all_poses[i][7])
    
    poses = np.concatenate(poses, axis=0)
    timestamps = np.array(timestamps).reshape(-1,1)
    poses = np.concatenate([timestamps, poses ], axis=1)
    print(poses.shape)


    np.savetxt(os.path.join(ds_name, "poses.csv"), poses, delimiter=",")

    return "Success!"

if __name__ == "__main__":


    parser = argparse.ArgumentParser()
    parser.add_argument( "--intensity", "-i", help="intensity included", default=True, required=False, type=bool)
    parser.add_argument( "--edit", "-e", help="edit a previously accumulated pointcloud", default=[], required=False, nargs="+")
    parser.add_argument( "--size", "-s", help="target size of pointclouds", default=500000, required=False, type=int)
    parser.add_argument("--no-accumulation", "-na", default=False, type=bool, required=False)
    args = parser.parse_args()

    intensity_included = args.intensity
    editable = args.edit
    if len(editable) == 0:
        editable = os.listdir(DATASETS_DIR)

    TARGET_POINTCLOUD_SIZE = args.size

    no_accumulation = args.no_accumulation

    

  


    for dn in os.listdir(DATASETS_DIR):
      
        ds_name  = os.path.join(DATASETS_DIR, dn)

        
        if no_accumulation and dn in editable:
            non_accumulate_pointclouds(ds_name, intensity_included=intensity_included)
            continue

        poses_file = os.path.join(ds_name, 'poses.csv')
        timestamps_file = os.path.join(ds_name, "timestamps.json")


        # converting raw timestamps file 
        if not os.path.exists(timestamps_file):
            timestamps_raw_folder = os.path.join(ds_name, "timestamps")
            try:

                # finding averages of pointcloud, and saving 
                ts_raw_file_name = os.listdir(timestamps_raw_folder)[0]
             
                ts_raw_file = np.loadtxt(os.path.join(timestamps_raw_folder, ts_raw_file_name), delimiter=' ')
                splits =  ts_raw_file[:,0]
                averages =  (ts_raw_file[:,1] +  ts_raw_file[:,2])/2
                averages = averages.tolist()

                out_name = os.path.join(ds_name, 'timestamps.json')
                with open(out_name, 'w') as fl:
                    fl.write(json.dumps(averages))

                

            except Exception as e:
                print(e)
                print("Timestamps not found for {}. Skipping...".format(ds_name))
                continue



        # converting raw pose file into transformation matrices
        if not os.path.exists(poses_file):

            POSES_SKIPROWS = 1

            poses_folder = os.path.join(ds_name, "raw_poses")
            all_poses = []
            for fname in os.listdir(poses_folder):
            
                filename = os.path.join(poses_folder,fname)
                meka = np.loadtxt(filename, skiprows=POSES_SKIPROWS)
                
                all_poses.append(meka)

            all_poses = np.concatenate(all_poses , axis=0)
            pose_converter(all_poses, ds_name)


      

        if dn in editable:
            accumulate_pointclouds(ds_name, intensity_included=intensity_included)

        




   
           

    

    
    

