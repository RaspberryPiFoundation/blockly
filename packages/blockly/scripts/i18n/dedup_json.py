#!/usr/bin/python3

# Consolidates duplicate key-value pairs in a JSON file.
# If the same key is used with different values, no warning is given,
# and there is no guarantee about which key-value pair will be output.
# There is also no guarantee as to the order of the key-value pairs
# output.
#
# Copyright 2013 Google LLC
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

import argparse
import codecs
import json
from common import InputError


def main():
  """Parses arguments and iterates over files.

  Raises:
    IOError: An I/O error occurred with an input or output file.
    InputError: Input JSON could not be parsed.
  """

  # Set up argument parser.
  parser = argparse.ArgumentParser(
      description='Removes duplicate key-value pairs from JSON files.')
  parser.add_argument('--suffix', default='',
                      help='optional suffix for output files; '
                      'if empty, files will be changed in place')
  parser.add_argument('files', nargs='+', help='input files')
  args = parser.parse_args()

  # Iterate over files.
  for filename in args.files:
    # Read in json using Python libraries.  This eliminates duplicates.
    print('Processing ' + filename + '...')
    try:
      with codecs.open(filename, 'r', 'utf-8') as infile:
        j = json.load(infile)
    except ValueError as e:
      print('Error reading ' + filename)
      raise InputError(filename, str(e))

    # Built up output strings as an array to make output of delimiters easier.
    output = []
    for key in j:
      if key != '@metadata':
        output.append('\t"' + key + '": "' +
                      j[key].replace('\n', '\\n') + '"')

    # Output results.
    with codecs.open(filename + args.suffix, 'w', 'utf-8') as outfile:
      outfile.write('{\n')
      outfile.write(',\n'.join(output))
      outfile.write('\n}\n')


if __name__ == '__main__':
  main()
