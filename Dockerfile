FROM node:10-slim
WORKDIR /app

COPY sources.list /etc/apt/

# ---------
# Setup Puppeteer
# From https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
# ---------

# See https://crbug.com/795759
# See https://crbug.com/795759
RUN apt-get update && apt-get install -yq --force-yes software-properties-common libgconf-2-4 ca-certificates fonts-liberation

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
# https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-unstable
RUN apt-get update && apt-get install -y --force-yes wget --no-install-recommends \
    && wget --no-check-certificate -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update \
    && apt-get install -y --force-yes google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst \
      --no-install-recommends
RUN apt-add-repository ppa:malteworld/ppa && apt-get update && apt-get install -y \
    && msttcorefonts \
    && fonts-noto-color-emoji \
    && fonts-noto-cjk \
    && fonts-liberation \
    && fonts-thai-tlwg \
    && fontconfig
RUN rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb


# It's a good idea to use dumb-init to help prevent zombie chrome processes.
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Cleanup
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY package*.json ./
RUN npm install
COPY . ./
RUN ./node_modules/.bin/tsc

RUN npm prune --production &&\
  rm -rf src

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser\
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

ENV PORT=3000
ENV CONNECTION_TIMEOUT=30000

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD [ "node", "./dist/index.js" ]
