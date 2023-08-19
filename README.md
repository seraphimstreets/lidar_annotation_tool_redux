#  Pointcloud/Image labeling tool  


## Installation
1. Clone this repository
2. Setup virtual environment:
   ```Shell
   virtualenv env
   ```
   Activate the virtual environment
   ```Shell
   source env/bin/activate
   ```
3. Install dependencies. By default we use Python3.
   ```bash
   pip3 install -r requirements.txt
   ```
4. To run the tool, run `python app.py` in wherever you have your `app` directory is
5. Open http://127.0.0.1:5000/ on a browser

## Windows Installation

1. Setup virtual environment:
   ```Shell
   python -m venv env_name
   ```
   Activate the virtual environment
   ```Shell
   cd env_name
   cd scripts
   activate
   ```
2. Clone this repository inside the virtual environment
3. Navigate into the repository
   ```Shell
   cd lidar_annotation_tool
   ```
4. Install dependencies. By default we use Python3.
   ```bash
   pip install -r requirements.txt
   ```


5. (Optional) Download compatible versions of torch and torchvision separately. I've tried with the following versions and they work.
   ```bash
      pip install torch==1.6.0+cu101 torchvision==0.7.0+cu101 -f https://download.pytorch.org/whl/torch_stable.html

   ```

6. (Optional) Build Facebook's detectron2 library (for image panoptic segmentation) from source using:
   ```bash
      python -m pip install 'git+https://github.com/facebookresearch/detectron2.git'

   ```

7. (Optional) Add the model files (arch_cfg, backbone, data_cfg, segmentation_decoder, segmentation_head) for rangenet in app/bonnetal/models

8. Navigate into app directory and run tool
   ```bash
   cd app
   python app.py

   ```


9. Open http://127.0.0.1:5000/ on a browser

## Registration of pointclouds without accumulation
1. Navigate to app/static/datasets and create a folder for your pointcloud with this file structure:

```bash
   static/datasets
      └──my_dataset_name
            ├── bin_data
            ├── image

```

2. Add .bin/.txt pointcloud files into the bin_data folder, and images (.png) into the same folder. The assumption is that there are the same number of pointcloud scans as images.

3. Run accumulator_dso.py -na True -e my_dataset_name

4. You should see that an accumulated_bins folder has been created with the same number of scans that you originally provided. Your dataset has been registered and you can proceed to run the app. 

## Adding and accumulation of pointclouds

1. Navigate to app/static/datasets and create a folder for your pointcloud with this file structure:

```bash
   static/datasets
      └──my_pointcloud
            ├── bin_data
            ├── image
            ├── raw_poses
            └── timestamps

```

2. Add .bin pointcloud files into the bin_data folder, and images (.png) into the image folder. Bin files are assumed to contain pointcloud data in either [x,y,z] or [x,y,z,intensity] format. 

3. Add your poses file (.txt) into the raw_poses folder. The poses file is assumed to have the format [x,y,z,quaternion,timestamp] for every row and skips the first row. (View the dso_test folder for reference)

4. Add the timestamps file (.txt) into the timestamps folder. The timestamps file is assumed to have this format [pointcloud_no, start_timestamp, end_timestamp] for every row, and should have the same number of rows as bin files. If you wish to skip this part, upload a timestamps.json into the parent folder, which contains timestamps for every bin file in an array. (View the dso_test folder for reference)

5. Return to parent folder app, and run accumulator_dso.py.

 Optional Arguments: 
 
 -i, --intensity,  bool, Indicates whether the bin files have intensity values. Default is True.

 -e, --edit, strings separated by spaces, Indicates which pointcloud folders to accumulate. Otherwise, all datasets will be accumulated (including previously accumulated ones).

 -s, --size, target size for each accumulated pointcloud. Will aspire to split the bin files into accumulated pointclouds close to this target size. Ex. with 20 bin files of ~32,000 points each, and a target size of 320,000, two accumulated pointclouds will be created from this set. Default is 500,000.

-na, --no-accumulation, tells the script not to accumulate the pointclouds. In this case, the 'accumulated_bins' folder will still be created, but will be filled with the original set of bin files in 'bin_data'. 

     

## Image and Pointcloud storage overview

Both image and pointcloud use a common class pool.

Pointcloud class and instance data are saved in separate integer arrays. Mapping of class string names to integers is saved in 'class order' file.

Image (pixel) class and instance data are also saved in separate integer arrays.




## Pointcloud (3D) tools 

### Bounding box (box icon)

![Bounding box tool](https://github.com/seraphimstreets/lidar_annotation_tool_redux/blob/master/common/media/3dboundingbox.gif)

Press and hold 'B' to initialize the tool. While holding 'B', click anywhere on the pointcloud to create a bounding box in that location. You will see the submit panel appear as well. 

In perspective mode, you can only translate/resize the bounding box in the y-direction. Hold 'R' key and drag the orbs to resize. Hold 'R' key and drag the pole to translate.

In orthographic mode, you can translate/resize along x/z axis, and rotate around the y-axis. Hold 'R' key and drag the box around to translate. Hold 'R' key and drag the corners to resize. Hold 'R' key and drag the top middle point to rotate. 

The eye indicates the front of the box. 

![3D Polygon tool](https://github.com/seraphimstreets/lidar_annotation_tool_redux/blob/master/common/media/2d3dprojection.gif)

### 3D Polygon tool (pencil icon)

Press 'B' to initialize the tool. The submit panel will appear.

Press and hold 'R' to start drawing a polygon. Click anywhere on the pointcloud to add the first vertex. As you drag, the line follows your mouse. Click again to add another vertex. 

When you are done drawing the polygon (>= 3 vertices), release 'R' and submit. The polygon will auto-connect the first and last vertices, annotating the points within the camera's current FOV. 


### Rangenet annotation (gears icon)

Click the button. After some time, your pointcloud will be automatically annotated! 


### Miscellaneous 3D Tools (question icon)

Press 'B' to initialize. Clear Labels removes all annotations, and Fill Remaining fills all unlabeled classes with the class of your choice. Only the first field with a non-default value will be executed. (aka. if Clear Labels is ticked, all labels are cleared, while Fill Remaining value is ignored) 



## Image (2D) tools


### Magic wand tool (magic wand icon)

Press 'B' to initialize the tool. Drag the cursor over the image, and an area is filled on the image based on the flood fill algorithm.  

### 2D Polygon tool (pencil icon)

Press 'B' to initialize the tool. Click and drag the points over the image, similar to 3D Polygon. 'Brightness Threshold' only annotates pixels if they are above the specified brightness value. 

### 2D Paint brush tool (brush icon)

Press 'B' to initialize the tool. Change the brush size and annotate over the image!

### Straight Line Tool (bell icon)

Press 'B' to initialize the tool. Helpful for drawing straight lines that are too thin for polygon and brush tools. 

### Detectron annotation (gears icon)

Click the button. After some time, the image will be automatically annotated using Facebook's detectron!

### Miscellaneous 2D Tools (question icon)

Press 'B' to initialize. Clear Labels removes all annotations, and Fill Remaining fills all unlabeled classes with the class of your choice. Only the first field with a non-default value will be executed. (aka. if Clear Labels is ticked, all labels are cleared, while Fill Remaining value is ignored) 



## Tables

Pointcloud instances and image instances are tracked separately. Click on the corresponding entry in these tables to view these instances!


## Uploading/Downloading labels

Labels are saved/read in the "static/datasets/{my_pointcloud}/output" folder. A typical output folder structure may look like this:

```bash
   static/datasets/my_pointcloud/output
      └──accum_pointcloud_1
      └──accum_pointcloud_2
      └──accum_pointcloud_3
         └──images
            └──image_0_imageClasses.bin
            └──image_0_imageInsts.bin
            └──image_2_imageClasses.bin
            └──image_2_imageInsts.bin
         └──pointclouds
            └──pc_0_classes.bin
            └──pc_0_instances.bin
            └──pc_0_boxes.json
            └──pc_1_classes.bin
            └──pc_1_instances.bin
            └──pc_1_boxes.json
            └─ accum_pointcloud_3_boxes.json

```


A folder is created for every accumulated pointcloud associated with the dataset. Each folder contains a folder for images and pointclouds. Labels are further split into instances and classes, which are 1D NumPy arrays of dtype int16. Note that the naming convention is important for reading in the data. Image class labels are named "{image_name}_imageClasses.bin", for instance. 

For pointclouds, bounding box data is also saved in json format. Each boxes file contains a list of Python dictionaries, each representing a 'box'. The dictionary contains certain information about that box, for instance its class and instance numbers, and the coordinates of its vertices transformed into the local coordinate frame. There are box files for every separate pointcloud for convenient reading, and also a single file for the accumulated pointcloud as a whole. The latter is what will be read by the app for visualization.  


