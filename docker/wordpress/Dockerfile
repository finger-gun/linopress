FROM wordpress:php8.2-fpm

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl default-mysql-client \
  && rm -rf /var/lib/apt/lists/*

RUN curl -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
  && chmod +x /usr/local/bin/wp
