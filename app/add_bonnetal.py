import yaml
import numpy as np
import os 
from bonnetal.user import User 

CUR_DIR = os.getcwd()

MODEL_FOLDER = os.path.join(CUR_DIR, "bonnetal", "models", "darknet53")

try:
    DATA = yaml.safe_load(open(MODEL_FOLDER + "/data_cfg.yaml" , 'r'))
    ARCH = yaml.safe_load(open(MODEL_FOLDER + "/arch_cfg.yaml", 'r'))

    bonnetal_user = User(ARCH, DATA, MODEL_FOLDER)

except:
    print("Something went wrong while setting up the model. RangeNet predictions will not be available.")


def bonnetal_predict(full_bin_names):
    
    all_points = []
    size = 0
    for i, bin_name in enumerate(full_bin_names):
      
        [points,  class_dict, color_map, orig_size] = bonnetal_user.infer_one(bin_name)
        all_points.append(points)
        size += orig_size

    all_points = np.concatenate(all_points, axis=0)
    print(all_points.shape)
    
    return [all_points, class_dict, color_map, size]




