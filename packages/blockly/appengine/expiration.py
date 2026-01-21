"""
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

"""Delete expired XML.
"""

__author__ = "fenichel@google.com (Rachel Fenichel)"


import storage
import datetime

from google.cloud import ndb


EXPIRATION_DAYS = 365
# Limit the query to avoid timeouts.
QUERY_LIMIT = 1000

def delete_expired():
  """Deletes entries that have not been accessed in more than a year."""
  bestBefore = datetime.datetime.utcnow() - datetime.timedelta(days=EXPIRATION_DAYS)
  client = ndb.Client()
  with client.context():
    query = storage.Xml.query(storage.Xml.last_accessed < bestBefore)
    results = query.fetch(limit=QUERY_LIMIT, keys_only=True)
    for x in results:
      x.delete()
  return len(results)


def app(environ, start_response):
  headers = [
    ("Content-Type", "text/plain")
  ]
  start_response("200 OK", headers)
  n = delete_expired()
  out = "%d records deleted." % n
  return [out.encode("utf-8")]
