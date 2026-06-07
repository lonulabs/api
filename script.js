angular.module('miApp', ['ngMaterial'])
    .controller('CarruselController', function ($scope, $timeout, $interval, $http) {
        $scope.images = [
            'images/marino-bobetic-unsplash.jpg',
            'images/christina-maiia-unsplash.jpg',
            'images/daniel-quiceno-m-unsplash.jpg',
            'images/gilles-detot-unsplash.jpg'
        ];
        $scope.webp_img = [
            'images/marino-bobetic-unsplash.webp',
            'images/christina-maiia-unsplash.webp',
            'images/daniel-quiceno-m-unsplash.webp',
            'images/gilles-detot-unsplash.webp'
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
    .controller('PromosController', function ($scope, $http) {
        $scope.promos = [];
        $scope.activePromo = null;
        $scope.activeIndex = 0;

        $http.get('promos/item-code-promos.json').then(function (resp) {
            $scope.promos = resp.data || [];
            if ($scope.promos.length) {
                $scope.activePromo = $scope.promos[0];
                $scope.activeIndex = 0;
            }
        }, function () {
            $scope.promos = [];
        });

        $scope.getPromoImageUrl = function (index) {
            const ext = window.innerWidth <= 600 ? 'webp' : 'png';
            return 'promos/p%20(' + index + ').' + ext;
        };

        $scope.setActivePromo = function (promo, index) {
            $scope.activePromo = promo;
            $scope.activeIndex = index;
        };

        $scope.selectPromo = function (promo, index) {
            $scope.setActivePromo(promo, index);
        };
    })
    .controller('CatalogController', function ($scope, $http) {
        $scope.catalog = [];
        $scope.tags = [];
        $scope.filterTag = '';

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
            return !$scope.filterTag || (item.tags && item.tags.indexOf($scope.filterTag) !== -1);
        };

        $scope.filteredItems = function () {
            return $scope.catalog.filter($scope.filterItem);
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