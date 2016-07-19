# Build

    ./docker/build.sh

Docker image exposes port 1999 and 2000.

# Run

    ./docker/run.sh

Default run script requires following environment variables to be defined:

* `NODESTORAGE_DOMAIN` - host domain (like `1999.example.com:1999`)
* `NODESTORAGE_TWITTER_APPKEY` - Twitter app key
* `NODESTORAGE_TWITTER_SECRET` - Twitter app secret

Default ports are 1999 (HTTP) and 2000 (WebSockets)
