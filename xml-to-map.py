#!/usr/bin/env python

import sys
import xml.etree.ElementTree as ET

"""This can be passed an OSM extract file (.osm). It will produce a
CSV text file containing selected ways and all the nodes contained in
one of the selected ways."""

importantRoads = ["motorway", "motorway_link", "trunk", "trunk_link",
"primary", "primary_link", "river"]

def processRoad(way, road_type):
    points = []
    if(road_type in importantRoads):
        for point in way:
            if(point.tag == "nd"):                                
                points.append(int(point.attrib['ref']))
    return points

def main():
    input_filename = sys.argv[1]
    tree = ET.parse(input_filename)
    root = tree.getroot()    
    all_nodes = {}
    important_nodes = {}
    for child in root:
        if(child.tag == "node"):
            (lon,lat) = (child.attrib["lon"], child.attrib["lat"])
            node_id = int(child.attrib["id"])
            all_nodes[node_id] = (lon,lat)
        if(child.tag == "way"):
            valid_road = False
            road_type = None
            for i in child:
                if(i.tag == "tag"):
                    if(i.attrib['k']=="highway" or i.attrib['k']=="waterway"):
                        valid_road = True
                        road_type = i.attrib['v']
                        break
            if valid_road:
                ways = processRoad(child, road_type)
                if len(ways)>0:
                    print("w"+",".join(map(str,ways)))
                    for w in ways:
                        important_nodes[w] = 1
    for k in important_nodes.keys():
        print("n%d,%s,%s"%(k, all_nodes[k][0], all_nodes[k][1]))
if __name__=="__main__":
    main()
