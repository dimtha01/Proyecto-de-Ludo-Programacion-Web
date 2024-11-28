#!/bin/bash

# Verificar si existe la carpeta build
if [ ! -d "build" ]; then
  mkdir build
fi

# Verificar si existe la carpeta public dentro de build
if [ ! -d "build/public" ]; then
  mkdir build/public
fi

# Ejecutar el comando npm run build:ui
npm run build:ui
