Place a preprocessed Vietnam OSRM graph in this directory before starting the `osrm` container.

Expected file:

- `vietnam-latest.osrm`

During application development the backend can still run without OSRM because it falls back to a geometric travel-time matrix.
