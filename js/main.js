//
// utils
//
function fetchData(version) {
    return fetch(`data/local.${version}.json`)
        .then((response) => {
            if (!response.ok) { throw new Error(response.statusText); }
            return response.json()
        })
        .then((raw) => {
            return raw.suites[0].subtests.map((x) => {
                return {
                    name: x.name,
                    result: {
                        lowerIsBetter: x.lowerIsBetter,
                        unit: x.unit,
                        value: x.value
                    }
                }
            });
        });
}

//
// filters
//
Vue.filter('round', function(value, decimals) {
  if (!value) { value = 0; }
  if (!decimals) { decimals = 0; }

  return Number(Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toLocaleString();
});

// Vue.filter('percentage', function(value, decimals) {
//     if(!value) { value = 0; }
//     if(!decimals) { decimals = 0; }
  
//     Math.round(value * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
//     value = value + '%';
//     return value;
//   });

//
// components
//

Vue.component('test', {
    template: '#test-template',
    props: ['name', 'src', 'dst'],
    computed: {
        delta: function () {
            return (this.dst.test.value - this.src.test.value) / this.src.test.value;
        },
        isBetter: function () {
            return this.delta <= 0
                ? this.dst.test.lowerIsBetter
                : !this.dst.test.lowerIsBetter;

        }
    }
});

const VERSIONS = {src: 57, dst: 60};

Vue.component('dashboard', {
    template: '#dashboard-template',
    data: function () {
        return {
            rawTests: {}
        }
    },
    mounted: function () {
        Promise.all([fetchData(VERSIONS.src), fetchData(VERSIONS.dst)])
            .then(([srcTests, dstTests]) => {
                this.$set(this, 'rawTests', {
                    [VERSIONS.src]: srcTests,
                    [VERSIONS.dst]: dstTests
                });
            })
    },
    computed: {
        tests: function () {
            if (Object.keys(this.rawTests).length !== 2) { return []; }

            let src = this.rawTests[VERSIONS.src];
            let dst = this.rawTests[VERSIONS.dst];

            return src
                .filter((x) => dst.find(y => y.name === x.name))
                .map((x) => {
                    let other = dst.find(y => y.name === x.name);
                    return {
                        name: x.name,
                        src: {
                            version: VERSIONS.src,
                            test: x.result
                        },
                        dst: {
                            version: VERSIONS.dst,
                            test: other.result
                        }
                    }
                });
        }
    }
});

//
// main
//

window.onload = () => {
    new Vue({
        el: '#app',
    });
};