FROM denoland/deno:alpine-2.9.4
WORKDIR /app
COPY main.js .
CMD ["deno", "--allow-all", "main.js"]
