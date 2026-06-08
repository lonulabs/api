angular.module('miApp', ['ngMaterial'])
    .run(function ($rootScope) {
        $rootScope.cartItems = [];

        function updateCartLine(line) {
            line.total = parseFloat(line.price) * line.quantity;
        }

        $rootScope.cartItemCount = function () {
            return $rootScope.cartItems.reduce(function (sum, line) {
                return sum + line.quantity;
            }, 0);
        };

        $rootScope.cartTotal = function () {
            return $rootScope.cartItems.reduce(function (sum, line) {
                return sum + line.total;
            }, 0);
        };

        $rootScope.addToCart = function (item, format, options) {
            options = options || {};
            if (!format) {
                return;
            }

            var id = item.name + '|' + format[1] + (options.promo ? '|promo' : '');
            var price = format[2] != null ? parseFloat(format[2]) : 0;
            var line = $rootScope.cartItems.find(function (existing) {
                return existing.id === id;
            });

            if (line) {
                line.quantity += 1;
                updateCartLine(line);
            } else {
                $rootScope.cartItems.push({
                    id: id,
                    name: item.name,
                    format: format[1],
                    price: price,
                    quantity: 1,
                    total: price,
                    promo: !!options.promo,
                    code: String(options.code || format[0])
                });
            }
        };

        $rootScope.isInCart = function (item, format, options) {
            if (!format) {
                return false;
            }
            options = options || {};
            var id = item.name + '|' + format[1] + (options.promo ? '|promo' : '');
            return $rootScope.cartItems.some(function (line) {
                return line.id === id;
            });
        };
    })
    .controller('CarruselController', function ($scope, $timeout, $interval, $http) {
        $scope.images = [
            'images/daniel-quiceno-m-unsplash.jpg',
            'images/gilles-detot-unsplash.jpg',
            'images/komorebi-photo-unsplash.jpg',
            'images/elisa-stone-unsplash.jpg',
            'images/abdul-rehman-khalid-unsplash.jpg',
            'images/b-cole-unsplash.jpg'
        ];
        $scope.webp_img = [
            'images/daniel-quiceno-m-unsplash.webp',
            'images/gilles-detot-unsplash.webp',
            'images/komorebi-photo-unsplash.webp',
            'images/elisa-stone-unsplash.webp',
            'images/abdul-rehman-khalid-unsplash.webp',
            'images/b-cole-unsplash.webp'
        ];
        $scope.promos = [];
        $http.get('promos/item-code-promos.json').then(function (resp) {
            $scope.promos = resp.data || [];
        }, function () { $scope.promos = []; });
        $scope.active = 0;
        $scope.imageSet = $scope.images;

        function updateImageSet() {
            $scope.imageSet = window.innerWidth <= 600 ? $scope.webp_img : $scope.images;
        }

        updateImageSet();
        window.addEventListener('resize', function () {
            $scope.$applyAsync(updateImageSet);
        });

        $scope.getPromoImageUrl = function (index) {
            const ext = window.innerWidth <= 600 ? 'webp' : 'png';
            return 'promos/p%20(' + index + ').' + ext;
        };
        const indice = $scope.images.length - 1;
        const time = 4000;

        function advance() {
            $scope.active = ($scope.active < indice) ? $scope.active + 1 : 0;
        }

        let auto = $interval(advance, time);

        $scope.pause = function () {
            if (auto) {
                $interval.cancel(auto);
                auto = null;
            }
        };

        $scope.resume = function () {
            if (!auto) auto = $interval(advance, time);
        };

        $scope.restart = function () {
            if (auto) $interval.cancel(auto);
            auto = $interval(advance, time);
        };

        $scope.siguiente = function () { advance(); $scope.restart(); };
        $scope.anterior = function () { $scope.active = ($scope.active > 0) ? $scope.active - 1 : indice; $scope.restart(); };
        $scope.irA = function (index) { $scope.active = index; $scope.restart(); };

        $scope.$on('$destroy', function () {
            if (auto) $interval.cancel(auto);
            window.removeEventListener('resize', updateImageSet);
        });
    })
    .controller('PromosController', function ($scope, $http, $rootScope) {
        $scope.promos = [];
        $scope.activePromo = null;
        $scope.activeIndex = 0;
        $scope.catalog = [];
        $scope.cartItems = $rootScope.cartItems;
        $scope.cartOpen = false;
        $scope.cartItemCount = $rootScope.cartItemCount;
        $scope.cartTotal = $rootScope.cartTotal;

        $http.get('promos/item-code-promos.json').then(function (resp) {
            $scope.promos = resp.data || [];
            if ($scope.promos.length) {
                $scope.activePromo = $scope.promos[0];
                $scope.activeIndex = 0;
            }
        }, function () {
            $scope.promos = [];
        });

        $http.get('catalog/catalog.json').then(function (resp) {
            $scope.catalog = resp.data || [];
        }, function () {
            $scope.catalog = [];
        });

        $scope.getPromoImageUrl = function (index) {
            const ext = window.innerWidth <= 600 ? 'webp' : 'png';
            return 'promos/p%20(' + index + ').' + ext;
        };

        $scope.mobilePreviewOpen = false;

        $scope.setActivePromo = function (promo, index) {
            $scope.activePromo = promo;
            $scope.activeIndex = index;
        };

        $scope.closeMobilePreview = function () {
            $scope.mobilePreviewOpen = false;
        };

        $scope.selectPromo = function (promo, index) {
            $scope.setActivePromo(promo, index);
            if (window.innerWidth <= 760) {
                $scope.mobilePreviewOpen = true;
            }
        };

        $scope.addPromoToCart = function (promo) {
            if (!promo || !promo.code) {
                return;
            }
            // Always use price from item-code-promos.json
            var promoFormat = [promo.code, promo.unit, promo.price];
            $rootScope.addToCart({ name: promo.name }, promoFormat, { promo: true, code: String(promo.code) });
        };

        $scope.isPromoInCart = function (promo) {
            if (!promo || !promo.code || !promo.unit) {
                return false;
            }
            var promoId = promo.name + '|' + promo.unit + '|promo';
            return $rootScope.cartItems.some(function (line) {
                return line.id === promoId;
            });
        };

        $scope.togglePromoInCart = function (promo) {
            if ($scope.isPromoInCart(promo)) {
                // Remove from cart
                var promoId = promo.name + '|' + promo.unit + '|promo';
                $rootScope.cartItems = $rootScope.cartItems.filter(function (line) {
                    return line.id !== promoId;
                });
                $scope.cartItems = $rootScope.cartItems;
            } else {
                // Add to cart
                $scope.addPromoToCart(promo);
            }
        };

        function updateCartLine(line) {
            line.total = parseFloat(line.price) * line.quantity;
        }

        $scope.increaseQty = function (line) {
            line.quantity += 1;
            updateCartLine(line);
        };

        $scope.decreaseQty = function (line) {
            if (line.quantity <= 1) {
                $rootScope.cartItems = $scope.cartItems.filter(function (existing) {
                    return existing.id !== line.id;
                });
                $scope.cartItems = $rootScope.cartItems;
            } else {
                line.quantity -= 1;
                updateCartLine(line);
            }
        };

        $scope.clearCart = function () {
            $rootScope.cartItems = [];
            $scope.cartItems = $rootScope.cartItems;
        };

        $scope.toggleCart = function () {
            $scope.cartOpen = !$scope.cartOpen;
        };

        $scope.sendCartToWhatsApp = function () {
            if (!$scope.cartItems.length) {
                return;
            }
            var phone = '525617524444';
            var lines = ['Hola, quiero realizar una compra de Biofarmex Bodega:'];
            $scope.cartItems.forEach(function (lineItem, index) {
                lines.push((index + 1) + '. ' + lineItem.name + ' | ' + lineItem.format + ' x' + lineItem.quantity + ' = $' + lineItem.total.toFixed(2));
            });
            lines.push('Total: $' + $scope.cartTotal().toFixed(2));
            var text = encodeURIComponent(lines.join('\n'));
            var url = 'https://api.whatsapp.com/send?phone=' + phone + '&text=' + text;
            window.open(url, '_blank');
        };
    })
    .controller('CatalogController', function ($scope, $http, $rootScope) {
        $scope.catalog = [];
        $scope.tags = [];
        $scope.filterTag = '';
        $scope.searchQuery = '';
        $scope.cartItems = $rootScope.cartItems;
        $scope.cartOpen = false;
        $scope.addToCart = $rootScope.addToCart;
        $scope.isInCart = $rootScope.isInCart;
        $scope.cartItemCount = $rootScope.cartItemCount;
        $scope.cartTotal = $rootScope.cartTotal;

        function updateTags(items) {
            const tagSet = new Set();
            items.forEach(function (item) {
                if (Array.isArray(item.tags)) {
                    item.tags.forEach(function (tag) {
                        tagSet.add(tag);
                    });
                }
            });
            $scope.tags = Array.from(tagSet).sort();
        }

        $scope.filterItem = function (item) {
            const query = ($scope.searchQuery || '').toLowerCase().trim();
            const matchesSearch = !query ||
                item.name.toLowerCase().indexOf(query) !== -1 ||
                (item.formula && Array.isArray(item.formula.rows) && item.formula.rows.some(function (row) {
                    const name = row[0] ? String(row[0]).toLowerCase() : '';
                    const amount = row[1] ? String(row[1]).toLowerCase() : '';
                    return name.indexOf(query) !== -1 || amount.indexOf(query) !== -1;
                }));
            return matchesSearch && (!$scope.filterTag || (item.tags && item.tags.indexOf($scope.filterTag) !== -1));
        };

        $scope.filteredItems = function () {
            return $scope.catalog.filter($scope.filterItem);
        };

        $scope.increaseQty = function (line) {
            line.quantity += 1;
            updateCartLine(line);
        };

        $scope.decreaseQty = function (line) {
            if (line.quantity <= 1) {
                $scope.cartItems = $scope.cartItems.filter(function (existing) {
                    return existing.id !== line.id;
                });
            } else {
                line.quantity -= 1;
                updateCartLine(line);
            }
        };

        $scope.toggleItemInCart = function (item, format) {
            if ($scope.isInCart(item, format)) {
                // Remove from cart
                var formatId = item.name + '|' + format[1];
                $rootScope.cartItems = $rootScope.cartItems.filter(function (line) {
                    return line.id !== formatId;
                });
                $scope.cartItems = $rootScope.cartItems;
            } else {
                // Add to cart
                $scope.addToCart(item, format);
            }
        };

        $scope.clearCart = function () {
            $scope.cartItems = [];
        };

        $scope.toggleCart = function () {
            $scope.cartOpen = !$scope.cartOpen;
        };

        $scope.sendCartToWhatsApp = function () {
            if (!$scope.cartItems.length) {
                return;
            }
            var phone = '525617524444';
            var lines = ['Hola, quiero realizar una compra de Biofarmex Bodega:'];
            $scope.cartItems.forEach(function (lineItem, index) {
                lines.push((index + 1) + '. ' + lineItem.name + ' | ' + lineItem.format + ' x' + lineItem.quantity + ' = $' + lineItem.total.toFixed(2));
            });
            lines.push('Total: $' + $scope.cartTotal().toFixed(2));
            var text = encodeURIComponent(lines.join('\n'));
            var url = 'https://api.whatsapp.com/send?phone=' + phone + '&text=' + text;
            window.open(url, '_blank');
        };

        $http.get('catalog/catalog.json').then(function (resp) {
            $scope.catalog = resp.data || [];
            updateTags($scope.catalog);
        }, function () {
            $scope.catalog = [];
            $scope.tags = [];
        });
    });

(function () {
    function initPromoCarousel() {
        const viewport = document.querySelector('.promo-viewport');
        const track = document.querySelector('.promo-track');
        const arrows = document.querySelectorAll('.promo-arrow');
        const prevBtn = arrows[0];
        const nextBtn = arrows[1];
        if (!viewport || !track) return;

        let visible = 4;
        const updateVisible = () => {
            if (window.innerWidth < 600) visible = 1;
            else if (window.innerWidth < 900) visible = 2;
            else visible = 4;
        };
        updateVisible();
        window.addEventListener('resize', updateVisible);

        const gap = parseFloat(getComputedStyle(track).gap) || 22;
        let index = 0;

        function cards() { return Array.from(document.querySelectorAll('.promo-card')); }
        const maxIndex = () => Math.max(0, cards().length - visible);

        function slideTo(i) {
            const c = cards();
            if (c.length === 0) return;
            const cardWidth = c[0].getBoundingClientRect().width;
            const x = -(i * (cardWidth + gap));
            track.style.transform = `translateX(${x}px)`;
        }

        function next() {
            index = (index < maxIndex()) ? index + 1 : 0;
            slideTo(index);
        }

        function prev() {
            index = (index > 0) ? index - 1 : maxIndex();
            slideTo(index);
        }

        let timer = setInterval(next, 2000);

        viewport.addEventListener('mouseenter', () => { clearInterval(timer); timer = null; });
        viewport.addEventListener('mouseleave', () => { if (!timer) timer = setInterval(next, 2000); });

        prevBtn && prevBtn.addEventListener('click', () => { prev(); if (timer) { clearInterval(timer); timer = setInterval(next, 2000); } });
        nextBtn && nextBtn.addEventListener('click', () => { next(); if (timer) { clearInterval(timer); timer = setInterval(next, 2000); } });

        window.addEventListener('load', () => { slideTo(0); });
    }

    window.addEventListener('load', initPromoCarousel);
    setTimeout(initPromoCarousel, 400);
})();