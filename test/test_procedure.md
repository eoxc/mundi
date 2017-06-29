# General

For each release copy `test_report_template.md` to `test_report_<release>.md`
and fill in the table. For each row add the version of the browser used for
testing and add an `X` for each successful execution of below test procedure
with a particular client configuration.

At least one test shall be performed using the build as it is going to be
uploaded to GitHub. Other tests could be done using the npm dev-server.

# Test procedure for each OS/Browser combination:

* Open URL http://<URL-of-dev-environment>:8080/<configuration>.html e.g. http://localhost:8080/code-de.html or http://sao:8080/
  - [ ] Check proper loading of EOxC e.g. panels visibility, timeslider selection, map, search results, etc.
* Zoom, pan on map (make sure to zoom over dateline)
  - [ ] Check update of search results in list and on map
* Zoom, pan on timeslider
  - [ ] Check filling of timeslider histogram buckets or dots
* Select time interval on timeslider
  - [ ] Check update of search results
* Hover over map, search result, and timeslider
  - [ ] Check proper highlighting in all three elements
* Show details of products via map and search results
  - [ ] Check proper viewing of details
* Select products via map and search results
  - [ ] Check proper filling of downloads list and highlight on map
* Download selected products as URL-List, Metalink, and directly
  - [ ] Check proper files are downloaded as expected
* Change visibility, order, and transparency of Layers
  - [ ] Check proper update on map, timeslider, and search results
* Set time filter via left panel
  - [ ] Check update of search results
* Set spatial filter via left panel
  - [ ] Check update of search results
* Set additional filter via left panel
  - [ ] Check update of search results

# Testing preparation

## One-time testing preparation

* Checkout repositories
    ```bash
    git checkout git@github.com:eoxc/eoxc.git
    git checkout git@github.com:eoxc/CODE-DE.git
    ```
* Link repositories
    ```bash
    cd <path-to-CODE-DE-repository>
    npm link eoxc
    ```
* Install dependencies
    ```bash
    cd <path-to-eoxc-repository>
    npm install
    cd <path-to-CODE-DE-repository>
    npm install
    ```

## General testing preparation

* Get latest code and clean checkouts
    ```bash
    cd <path-to-eoxc-repository>
    git pull
    git status # check that checkout is clean
    cd <path-to-CODE-DE-repository>
    git pull
    git status # check that checkout is clean
    ```
* Start dev-server
    ```bash
    cd <path-to-CODE-DE-repository>
    npm run dev-server
    ```

## Additional preparations to include d3.TimeSlider and opensearch libraries

* Checkout repositories
    ```bash
    git checkout git@github.com:EOX-A/d3.TimeSlider.git
    git checkout git@github.com:eoxc/opensearch.git
    ```
* Link repositories
    ```bash
    cd <path-to-eoxc-repository>
    npm link D3.Timeslider
    npm link opensearch-browser
    ```
* Install dependencies
    ```bash
    cd <path-to-d3.timeslider-repository>
    npm install
    cd <path-to-opensearch-repository>
    npm install
    ```
* Get latest code and clean checkouts
    ```bash
    cd <path-to-d3.timeslider-repository>
    git pull
    git status # check that checkout is clean
    cd <path-to-opensearch-repository>
    git pull
    git status # check that checkout is clean
    npm run build
    ```
