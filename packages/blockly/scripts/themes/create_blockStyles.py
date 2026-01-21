# !/usr/bin/env python
# Converts a single colour to primary, secondary and tertiary colours.
# Primary Colour - The colour given
# Secondary Colour - Lightens the primary colour by .8
# Tertiary Colour - Darkens the primary colour by .2
#
# Copyright 2012 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
#
# Usage: create_blockStyles.py <fileName>
#
# fileName - Name of the file holding the map of style names to colours.
# Refer to blockStyles_example.json for an example input.
#
# Input: A json file with the keys being style names and the values
# being either a hue (number) or a hex value (string).
# Ex: {"styleName": 10, "styleName2": "#FFFFFF"}
#
# Output: A json file with the keys being style names and the values being an
# object holding primary, secondary, and tertiary colours in hex format.
# {"styleName":
#    {"colourPrimary":"hexVal",
#     "colourSecondary":"hexVal",
#     "colourTertiary":"hexVal"
#    }
# }

import math
import json
import sys

HSV_SATURATION = .45
BRIGHTNESS_VAL = .65 * 255
LIGHT_FACTOR = .8
DARK_FACTOR = .2

#Change HSV (Hue Saturation Value) to RGB
#This is adapted to python from the js version found here:
#https://blockly-demo.appspot.com/closure-library/closure/goog/colour/color.js
def hsvToRgb(h, s, brightness):
   red = 0
   green = 0
   blue = 0
   if (s == 0):
      red = brightness
      green = brightness
      blue = brightness
   else:
      sextant = math.floor(h / 60)
      remainder = (float(h) / float(60)) - sextant
      val1 = brightness * (1 - s)
      val2 = brightness * (1 - (s * remainder))
      val3 = brightness * (1 - (s * (1 - remainder)))
   if sextant == 1:
      red = val2
      green = brightness
      blue = val1
   elif sextant == 2:
      red = val1
      green = brightness
      blue = val3
   elif sextant == 3:
      red = val1
      green = val2
      blue = brightness
   elif sextant == 4:
      red = val3
      green = val1
      blue = brightness
   elif sextant == 5:
      red = brightness
      green = val1
      blue = val2
   elif sextant == 0:
      red = brightness
      green = val3
      blue = val1
   return [math.floor(red), math.floor(green), math.floor(blue)]


#Blend two rgb colours with the factor being the weight given to the first colour
#This is adapted to python from the js version found here:
#https://blockly-demo.appspot.com/closure-library/closure/goog/colour/color.js
def blend(rgb1, rgb2, factor):
   factor = max(min(factor, 1), 0)
   return [
      round(rgb2[0] + factor * (rgb1[0] - rgb2[0])),
      round(rgb2[1] + factor * (rgb1[1] - rgb2[1])),
      round(rgb2[2] + factor * (rgb1[2] - rgb2[2]))
   ]


#Lightens a given rgb colour
#This is adapted to python from the js version found here:
#https://blockly-demo.appspot.com/closure-library/closure/goog/colour/color.js
def lighten(rgb, factor):
   white = [255, 255, 255]
   return blend(white, rgb, factor)


#Darkens a given rgb colour
#This is adapted to python from the js version found here:
#https://blockly-demo.appspot.com/closure-library/closure/goog/colour/color.js
def darken(rgb, factor):
   black = [0, 0, 0];
   return blend(black, rgb, factor)


#Converts rgb to hex
def rgbToHex(rgb):
   #Add checks in here to make sure valid numbers
   return '#%02x%02x%02x' % (rgb[0], rgb[1], rgb[2])


#Calculates the primary, secondary and tertiary colours for the block style
def findOtherColours(rgb):
   colourPrimary = rgbToHex(rgb)
   colourSecondary = rgbToHex(lighten(rgb, LIGHT_FACTOR))
   colourTertiary = rgbToHex(darken(rgb, DARK_FACTOR))
   return {
      "colourPrimary": colourPrimary,
      "colourSecondary": colourSecondary,
      "colourTertiary": colourTertiary
   }

# Converts a hex colour to rgb colour format
def hexToRgb(hexColour):
   r = int(hexColour[1:3], 16)
   g = int(hexColour[3:5], 16)
   b = int(hexColour[5:7], 16)
   return [r, g, b]

# Converts either a hue or hex colour to rgb colour format
def findRgbVal(colour):
   try:
      hue = int(colour)
      rgb = hsvToRgb(hue, HSV_SATURATION, BRIGHTNESS_VAL)
   except (TypeError, ValueError):
      hexColour = colour
      rgb = hexToRgb(hexColour)
   return rgb

# Get info on the input file
def getFileInfo():
   from pathlib import Path
   if (len(sys.argv) < 2):
      print("Please provide a filename")
      sys.exit()
   fileName = sys.argv[1]
   try:
      jsonFile = open(fileName).read()
      fileName = str(Path(fileName).parent / f"new_{Path(fileName).stem}.json")
      fileName = Path(fileName)
   except IOError as err:
      print('Could not find that file name')
      sys.exit()
   return (jsonFile, fileName)

# Creates a map with the keys being the style names and the values being an object
# holding colourPrimary, colourSecondary, colourTertiary
def createColourMap():
   (jsonFile, fileName) = getFileInfo()
   jsonData = json.loads(jsonFile)
   colourObj = {}
   for key in jsonData.keys():
      rgbVal = findRgbVal(jsonData[key])
      colourObj[key] = findOtherColours(rgbVal)
      f= open(fileName,"w+")
      f.write(json.dumps(colourObj, indent=2, sort_keys=True))
      f.close()

createColourMap()
