#!/bin/sh
set -e
echo "Aplicando migraciones..."
until python manage.py migrate --noinput; do
  echo "Esperando la base de datos..."; sleep 2
done
python manage.py seed_catalog
exec "$@"
