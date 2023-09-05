FROM denoland/deno:latest

# The port that your application listens to.
EXPOSE 8000

WORKDIR /app

# Prefer not to run as root.
USER deno

COPY . .

CMD ["run", "--allow-all", "index.ts"]