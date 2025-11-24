# Dockerfile para build do projeto Portfólio

# Imagem base
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar arquivos do projeto
COPY . .

# Fazer build do projeto
RUN npm run build

