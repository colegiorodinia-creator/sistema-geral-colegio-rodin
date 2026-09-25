# Multi-stage Dockerfile for Vite React SPA
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL=https://jhjzyoztidfwzqeblhco.supabase.co
ARG VITE_SUPABASE_ANON_KEY=sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
