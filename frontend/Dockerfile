FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Client calls same-origin /api/* (proxied server-side to the backend service).
ENV NEXT_PUBLIC_API_URL=""

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]