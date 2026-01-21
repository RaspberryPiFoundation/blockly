#!/usr/bin/python3

# Code shared by translation conversion scripts.
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

import codecs
import json
import os
from datetime import datetime

class InputError(Exception):
    """Exception raised for errors in the input.

    Attributes:
        location -- where error occurred
        msg -- explanation of the error

    """

    def __init__(self, location, msg):
        Exception.__init__(self, '{0}: {1}'.format(location, msg))
        self.location = location
        self.msg = msg


def read_json_file(filename):
  """Read a JSON file as UTF-8 into a dictionary, discarding @metadata.

  Args:
    filename: The filename, which must end ".json".

  Returns:
    The dictionary.

  Raises:
    InputError: The filename did not end with ".json" or an error occurred
        while opening or reading the file.
  """
  if not filename.endswith('.json'):
    raise InputError(filename, 'filenames must end with ".json"')
  try:
    # Read in file.
    with codecs.open(filename, 'r', 'utf-8') as infile:
      defs = json.load(infile)
    if '@metadata' in defs:
      del defs['@metadata']
    return defs
  except ValueError as e:
    print('Error reading ' + filename)
    raise InputError(filename, str(e))


def _create_qqq_file(output_dir):
    """Creates a qqq.json file with message documentation for translatewiki.net.

    The file consists of key-value pairs, where the keys are message ids and
    the values are descriptions for the translators of the messages.
    What documentation exists for the format can be found at:
    http://translatewiki.net/wiki/Translating:Localisation_for_developers#Message_documentation

    The file should be closed by _close_qqq_file().

    Parameters:
        output_dir: The output directory.

    Returns:
        A pointer to a file to which a left brace and newline have been written.

    Raises:
        IOError: An error occurred while opening or writing the file.
    """
    qqq_file_name = os.path.join(os.curdir, output_dir, 'qqq.json')
    qqq_file = codecs.open(qqq_file_name, 'w', 'utf-8')
    print('Created file: ' + qqq_file_name)
    qqq_file.write('{\n')
    return qqq_file


def _close_qqq_file(qqq_file):
    """Closes a qqq.json file created and opened by _create_qqq_file().

    This writes the final newlines and right brace.

    Args:
        qqq_file: A file created by _create_qqq_file().

    Raises:
        IOError: An error occurred while writing to or closing the file.
    """
    qqq_file.write('\n}\n')
    qqq_file.close()


def _create_lang_file(author, lang, output_dir):
    """Creates a <lang>.json file for translatewiki.net.

    The file consists of metadata, followed by key-value pairs, where the keys
    are message ids and the values are the messages in the language specified
    by the corresponding command-line argument.  The file should be closed by
    _close_lang_file().

    Args:
        author: Name and email address of contact for translators.
        lang: ISO 639-1 source language code.
        output_dir: Relative directory for output files.

    Returns:
        A pointer to a file to which the metadata has been written.

    Raises:
        IOError: An error occurred while opening or writing the file.
    """
    lang_file_name = os.path.join(os.curdir, output_dir, lang + '.json')
    lang_file = codecs.open(lang_file_name, 'w', 'utf-8')
    print('Created file: ' + lang_file_name)
    # string.format doesn't like printing braces, so break up our writes.
    lang_file.write('{\n\t"@metadata": {')
    lang_file.write("""
\t\t"author": "{0}",
\t\t"lastupdated": "{1}",
\t\t"locale": "{2}",
\t\t"messagedocumentation" : "qqq"
""".format(author, str(datetime.now()), lang))
    lang_file.write('\t},\n')
    return lang_file


def _close_lang_file(lang_file):
    """Closes a <lang>.json file created with _create_lang_file().

    This also writes the terminating left brace and newline.

    Args:
        lang_file: A file opened with _create_lang_file().

    Raises:
        IOError: An error occurred while writing to or closing the file.
    """
    lang_file.write('\n}\n')
    lang_file.close()


def _create_key_file(output_dir):
    """Creates a keys.json file mapping Closure keys to Blockly keys.

    Args:
        output_dir: Relative directory for output files.

    Raises:
        IOError: An error occurred while creating the file.
    """
    key_file_name = os.path.join(os.curdir, output_dir, 'keys.json')
    key_file = open(key_file_name, 'w')
    key_file.write('{\n')
    print('Created file: ' + key_file_name)
    return key_file


def _close_key_file(key_file):
    """Closes a key file created and opened with _create_key_file().

    Args:
        key_file: A file created by _create_key_file().

    Raises:
        IOError: An error occurred while writing to or closing the file.
    """
    key_file.write('\n}\n')
    key_file.close()


def write_files(author, lang, output_dir, units, write_key_file):
    """Writes the output files for the given units.

    There are three possible output files:
    * lang_file: JSON file mapping meanings (e.g., Maze.turnLeft) to the
      English text.  The base name of the language file is specified by the
      "lang" command-line argument.
    * key_file: JSON file mapping meanings to Soy-generated keys (long hash
      codes).  This is only output if the parameter write_key_file is True.
    * qqq_file: JSON file mapping meanings to descriptions.

    Args:
        author: Name and email address of contact for translators.
        lang: ISO 639-1 source language code.
        output_dir: Relative directory for output files.
        units: A list of dictionaries with entries for 'meaning', 'source',
            'description', and 'keys' (the last only if write_key_file is true),
            in the order desired in the output files.
        write_key_file: Whether to output a keys.json file.

    Raises:
        IOError: An error occurs opening, writing to, or closing a file.
        KeyError: An expected key is missing from units.
    """
    lang_file = _create_lang_file(author, lang, output_dir)
    qqq_file = _create_qqq_file(output_dir)
    if write_key_file:
      key_file = _create_key_file(output_dir)
    first_entry = True
    for unit in units:
        if not first_entry:
            lang_file.write(',\n')
            if write_key_file:
              key_file.write(',\n')
            qqq_file.write(',\n')
        lang_file.write(u'\t"{0}": "{1}"'.format(
            unit['meaning'],
            unit['source'].replace('"', "'")))
        if write_key_file:
          key_file.write('"{0}": "{1}"'.format(unit['meaning'], unit['key']))
        qqq_file.write(u'\t"{0}": "{1}"'.format(
            unit['meaning'],
            unit['description'].replace('"', "'").replace(
                '{lb}', '{').replace('{rb}', '}')))
        first_entry = False
    _close_lang_file(lang_file)
    if write_key_file:
      _close_key_file(key_file)
    _close_qqq_file(qqq_file)
