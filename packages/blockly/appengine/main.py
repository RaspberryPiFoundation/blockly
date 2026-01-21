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

import storage
import expiration


# Route to requested handler.
def app(environ, start_response):
  if environ["PATH_INFO"] == "/":
    return redirect(environ, start_response)
  if environ["PATH_INFO"] == "/storage":
    return storage.app(environ, start_response)
  if environ["PATH_INFO"] == "/expiration":
    return expiration.app(environ, start_response)
  start_response("404 Not Found", [])
  return [b"Page not found."]


# Redirect for root directory.
def redirect(environ, start_response):
  headers = [
    ("Location", "static/demos/index.html")
  ]
  start_response("301 Found", headers)
  return []
