import cv2
import numpy as np
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--tilset_path', default='tilset_path.png')
parser.add_argument('--map_path', default='map.png')
parser.add_argument('--scale', default=2)
parser.add_argument('--tile_size', default=8)
args = parser.parse_args()

tilset_path = args.tilset_path
map_path = args.map_path
scale = args.scale
tile_size = args.tile_size

method = cv2.TM_SQDIFF_NORMED

world_map = cv2.imread(tilset_path)
world_map_base = world_map.copy()
map_image = cv2.imread(map_path)
map_image_base = map_image.copy()

def get_pos(pos):
    return tile_size * (pos//tile_size - 1)

def mouse_event(event,x,y,flags,param):
    if event == cv2.EVENT_LBUTTONDOWN:
        x = get_pos(x)
        y = get_pos(y)
        small_image = map_image_base[y: y + tile_size, x: x + tile_size]
        result = cv2.matchTemplate(small_image, world_map_base, method)
        mn,_,mnLoc,_ = cv2.minMaxLoc(result)
        MPx,MPy = mnLoc
        trows,tcols = small_image.shape[:2]
        world_map[0: world_map.shape[0], 0: world_map.shape[1]] = world_map_base
        cv2.rectangle(world_map, (MPx, MPy), (MPx + tcols, MPy + trows), (0, 0, 255), 1)
    elif event == cv2.EVENT_MOUSEMOVE:
        map_image[0: map_image.shape[0], 0: map_image.shape[1]] = map_image_base
        x = get_pos(x)
        y = get_pos(y)
        cv2.rectangle(map_image, (x, y), (x + tile_size, y + tile_size), (0,255,255), 2)

cv2.namedWindow('map')
cv2.setMouseCallback('map', mouse_event)

while(1):
    cv2.imshow('map', map_image)
    world_map_r = cv2.resize(world_map, (world_map.shape[1] * scale, world_map.shape[0] * scale), interpolation = cv2.INTER_AREA)
    cv2.imshow('world_map', world_map_r)
    if cv2.waitKey(20) & 0xFF == 27:
        break
cv2.destroyAllWindows()