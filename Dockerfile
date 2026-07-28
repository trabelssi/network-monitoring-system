FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    libsnmp-dev \
    snmp \
    supervisor

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring bcmath exif gd zip snmp

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files FIRST (Entry 10 optimization)
COPY composer.json composer.lock ./

# Install dependencies BEFORE copying app (Entry 10 optimization)
# Use --no-scripts because artisan doesn't exist yet
RUN composer install --no-dev --no-scripts --optimize-autoloader --no-interaction

# Copy application code
COPY . .

# Run deferred scripts now that artisan exists
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Copy Supervisor configuration
COPY docker/supervisord/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose PHP-FPM port
EXPOSE 9000

# Start Supervisor (manages php-fpm + queue + scheduler)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
