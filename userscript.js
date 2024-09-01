// ==UserScript==
// @name         Replays for deleted maps
// @namespace    -
// @version      0.0.1
// @description  -
// @author       not defined
// @include      /replay\.beatleader\..*/
// @run-at       document-start
// ==/UserScript==

(async function() {
    'use strict';

    function main() {
        function utils_get_cookie(name) {
            var nameEQ = name + '=';
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        AFRAME.registerComponent('map-fetcher', {
            init: function () {
                let zip_loader = null;
                let original_post_load_err = null;

                let update_zip_loader = () => {
                    if (zip_loader && original_post_load_err) {
                        return;
                    }

                    if (!zip_loader) {
                        zip_loader = this.el.sceneEl.components['zip-loader'];
                    }

                    original_post_load_err = zip_loader ? zip_loader.postchallengeloaderror : null;
                };

                let loadErrorCallback = e => {
                    if (!this.hash) {
                        return;
                    }

                    update_zip_loader();
                    if (!zip_loader) {
                        return;
                    }

                    zip_loader.fetchZip(`https://raw.githubusercontent.com/wpmftvicyetz/wpmftvicyetz/main/${this.hash}.zip`);
                    zip_loader.postchallengeloaderror = original_post_load_err;
                }

                let fetchCallback = e => {
                    if (!e.detail || !e.detail.hash) {
                        return;
                    }

                    this.hash = e.detail.hash.toLowerCase();

                    update_zip_loader();
                    if (!zip_loader) {
                        return;
                    }

                    zip_loader.postchallengeloaderror = function(hash) {
                        if (utils_get_cookie('autoplayReplay')) {
                            this.el.sceneEl.components['random-replay'].fetchRandomReplay(true);
                        }

                        zip_loader.el.emit('challengeloaderror', { hash });
                    }
                };

                this.el.sceneEl.addEventListener('replayInfofetched', fetchCallback);
                this.el.sceneEl.addEventListener('replayfetched', fetchCallback);
                this.el.sceneEl.addEventListener('challengeloaderror', loadErrorCallback);
            }
        });
    }

    let entity = document.createElement('a-entity');
    entity.setAttribute('map-fetcher', '');

    do {
        var a_scene = document.getElementsByTagName('a-scene');
        await new Promise(resolve => setTimeout(resolve, 50));
    } while (!a_scene.length)

    a_scene[0].appendChild(entity);

    let script = document.createElement('script');
    script.appendChild(document.createTextNode('('+ main +')();'));
    document.body.appendChild(script);
})();
