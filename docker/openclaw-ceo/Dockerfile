FROM node:lts-trixie-slim

ARG OPENCLAW_NPM_TAG=latest

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git bash tini \
  && rm -rf /var/lib/apt/lists/*

# Install OpenClaw CLI
RUN npm install --global --omit=dev openclaw@${OPENCLAW_NPM_TAG}

ENV OPENCLAW_HOME=/root/.openclaw
WORKDIR /workspace

COPY start-openclaw-gateway.sh /usr/local/bin/start-openclaw-gateway.sh
RUN chmod +x /usr/local/bin/start-openclaw-gateway.sh

HEALTHCHECK --interval=20s --timeout=5s --retries=5 CMD openclaw gateway status >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/usr/local/bin/start-openclaw-gateway.sh"]
