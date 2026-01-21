"""Blockly Demo: Add timestamps

Copyright 2020 Google LLC

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

"""A script to get all Xml entries in the datastore for Blockly demos
and reinsert any that do not have a last_accessed time.

This script should only need to be run once, but may take a long time
to complete.

NDB does not provide a way to query for all entities that are missing a
given property, so we have to get all of them and discard any that
already have a last_accessed time.

Auth: `gcloud auth login`

Set the correct project: `gcloud config set project blockly-demo`

See the current project: `gcloud config get-value project`

Start a venv: `python3 -m venv venv && source venv/bin/activate`
Inside your vm run `pip install google-cloud-ndb`
Run the script: `python3 add_timestamps.py`
"""

__author__ = "fenichel@google.com (Rachel Fenichel)"


from google.cloud import ndb
from storage import Xml
import datetime

PAGE_SIZE = 1000

def handle_results(results):
  for x in results:
    if (x.last_accessed is None):
      x.put()

def run_query():
  client = ndb.Client()
  with client.context():
    query = Xml.query()
    print(f'Total entries: {query.count()}')
    cursor = None
    more = True
    page_count = 0
    result_count = 0
    while more:
      results, cursor, more = query.fetch_page(PAGE_SIZE, start_cursor=cursor)
      handle_results(results)
      page_count += 1
      result_count += len(results)
      print(f'{datetime.datetime.now().strftime("%I:%M:%S %p")} : page {page_count} : {result_count}')

run_query()
