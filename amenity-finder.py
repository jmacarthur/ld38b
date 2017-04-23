#!/usr/bin/env python

import sys
import xml.etree.ElementTree as ET

"""Sorts through OSM XML and find amenities - nodes with particular
tags."""

def interesting(node):
    for tag in node:
        if tag.tag == "tag":
            if tag.attrib['k'] == "tourism" and tag.attrib['v'] == "museum": return True
    return False

def name(node):
    for tag in node:
        if tag.tag == "tag":
            if tag.attrib['k'] == "name": return tag.attrib['v']
    return None
    

def main():
    input_filename = sys.argv[1]
    tree = ET.parse(input_filename)
    root = tree.getroot()    
    for child in root:
        if(child.tag == "node"):
            (lon,lat) = (child.attrib["lon"], child.attrib["lat"])
            if interesting(child):
                print("%s,%s,%s"%(name(child), lon,lat))

if __name__=="__main__":
    main()
