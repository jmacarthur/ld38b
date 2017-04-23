#!/usr/bin/env python

"""Loads the previously filtered CSV maps and converts them into
separate maps for each minute-of-arc block."""

import sys

def abs(x):
    return -x if x<0 else x

def main():
    input_filename = sys.argv[1]
    ways = []
    all_nodes = {}
    inside_nodes = []
    gridX = -133
    gridY = 3207
    minute = 1/60.0; # Grid size in degrees
    
    with open(input_filename, "rt") as f:
        while True:
            l = f.readline()
            if l=="": break
            if l[0] == 'w':
                ways.append(map(int, l[1:].split(",")))
            elif l[0] == 'n':
                fields = l[1:].split(",")
                node_id = int(fields[0])
                lon = float(fields[1])
                lat = float(fields[2])
                
                all_nodes[node_id] = (lon,lat)
                if lon >= gridX * minute and lon < (gridX+1)*minute and lat >= gridY*minute and lat < (gridY+1)*minute:
                    inside_nodes.append(node_id)
    keep_ways = []
    keep_nodes = {}
    lon_prefix = 'w' if gridX<0 else 'e'
    lat_prefix = 's' if gridY<0 else 'n'
    output_file = open("%s%d%s%d.map"%(lon_prefix,abs(gridX),lat_prefix,abs(gridY)), "wt")
    for w in ways:
        for nodeid in w:
            if nodeid in inside_nodes:
                keep_ways.append(w)
                break
    for w in keep_ways:
        output_file.write("w"+",".join(map(str,w))+"\n")
        for nodeid in w:
            keep_nodes[nodeid] = 1
    for n in keep_nodes.keys():
        output_file.write("n%d,%f,%f\n"%(n,all_nodes[n][0], all_nodes[n][1]))
    output_file.close()
            
if __name__=="__main__":
    main()
