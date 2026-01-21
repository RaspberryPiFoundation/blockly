"""Blockly Demo: Storage

Copyright 2012 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

"""Store and retrieve Blockly XML/JSON with App Engine.
"""

__author__ = "q.neutron@gmail.com (Quynh Neutron)"

import hashlib
from google.cloud import ndb
from random import randint
from urllib.parse import unquote


class Xml(ndb.Model):
  # A row in the database.
  xml_hash = ndb.IntegerProperty()
  xml_content = ndb.TextProperty()
  last_accessed = ndb.DateTimeProperty(auto_now=True)


def keyGen():
  # Generate a random string of length KEY_LEN.
  KEY_LEN = 6
  CHARS = "abcdefghijkmnopqrstuvwxyz23456789"  # Exclude l, 0, 1.
  max_index = len(CHARS) - 1
  return "".join([CHARS[randint(0, max_index)] for x in range(KEY_LEN)])


# Parse POST data (e.g. a=1&b=2) into a dictionary (e.g. {"a": 1, "b": 2}).
# Very minimal parser.  Does not combine repeated names (a=1&a=2), ignores
# valueless names (a&b), does not support isindex or multipart/form-data.
def parse_post(environ):
  fp = environ["wsgi.input"]
  data = fp.read().decode()
  parts = data.split("&")
  dict = {}
  for part in parts:
    tuple = part.split("=", 1)
    if len(tuple) == 2:
      dict[tuple[0]] = unquote(tuple[1])
  return dict


def xmlToKey(xml_content):
  # Store XML/JSON and return a generated key.
  xml_hash = int(hashlib.sha1(xml_content.encode("utf-8")).hexdigest(), 16)
  xml_hash = int(xml_hash % (2 ** 64) - (2 ** 63))
  client = ndb.Client()
  with client.context():
    lookup_query = Xml.query(Xml.xml_hash == xml_hash)
    lookup_result = lookup_query.get()
    if lookup_result:
      xml_key = lookup_result.key.string_id()
    else:
      trials = 0
      result = True
      while result:
        trials += 1
        if trials == 100:
          raise Exception("Sorry, the generator failed to get a key for you.")
        xml_key = keyGen()
        result = Xml.get_by_id(xml_key)
      row = Xml(id = xml_key, xml_hash = xml_hash, xml_content = xml_content)
      row.put()
  return xml_key


def keyToXml(key_provided):
  # Retrieve stored XML/JSON based on the provided key.
  # Normalize the string.
  key_provided = key_provided.lower().strip()
  # Check datastore for a match.
  client = ndb.Client()
  with client.context():
    result = Xml.get_by_id(key_provided)
  if not result:
    xml = ""
  else:
    # Put it back into the datastore immediately, which updates the last
    # accessed time.
    with client.context():
      result.put()
    xml = result.xml_content
    # Add a poison line to prevent raw content from being served.
    xml = "{[(< UNTRUSTED CONTENT >)]}\n" + xml
  return xml


def app(environ, start_response):
  headers = [
    ("Content-Type", "text/plain")
  ]
  if environ["REQUEST_METHOD"] != "POST":
    start_response("405 Method Not Allowed", headers)
    return ["Storage only accepts POST".encode("utf-8")]
  if ("CONTENT_TYPE" in environ and
      environ["CONTENT_TYPE"] != "application/x-www-form-urlencoded"):
    start_response("405 Method Not Allowed", headers)
    return ["Storage only accepts application/x-www-form-urlencoded".encode("utf-8")]

  forms = parse_post(environ)
  if "xml" in forms:
    out = xmlToKey(forms["xml"])
  elif "key" in forms:
    out = keyToXml(forms["key"])
  else:
    out = ""

  start_response("200 OK", headers)
  return [out.encode("utf-8")]
