import WebSocketManager from './js/socket.js';
const socket = new WebSocketManager('127.0.0.1:24050');

let bar = document.querySelector("#bar");
let arrow = document.querySelector("#arrow");
let info = document.querySelector("#info");
let center = document.querySelector("#center");
const tick = document.querySelectorAll("[id^=tick]");

const cache = {
    OD: -1,
    state: -1,
    ur: -1,
    combo: -1,
    heal: -1,
    acc: -1,
};

let tickPos;
let fullPos;
let tempAvg;
let tempSmooth;
let hitErrorValue;

let timing_300g = 16;
let timing_300 = 0;
let timing_200 = 0;
let timing_100 = 0;
let timing_50 = 0;
let timing_0 = 0 ;


function updateTimingWindows(od) { // no mod timing windows
    timing_300 = 64 - (3 * od);
    timing_200 = 97 - (3 * od);
    timing_100 = 127 - (3 * od);
    timing_50 = 151 - (3 * od);
    timing_0 = 188 - (3 * od);
}

function updateHrTimingwindows(od) { // hard rock timing windows
    timing_300g = 11.43;
    timing_300 = (64 - (3 * od)) / 1.4;
    timing_200 = (97 - (3 * od)) / 1.4;
    timing_100 = (127 - (3 * od)) / 1.4;
    timing_50 = (151 - (3 * od)) / 1.4;
    timing_0 = (188 - (3 * od)) / 1.4;
}

socket.api_v2((data) => {
    try {
        if (cache.OD !== data.beatmap.stats.od.converted) {
            cache.OD = data.beatmap.stats.od.converted;
        }
        
        if (cache.state !== data.state.number) {
            cache.state = data.state.number;
            if (cache.state !== 2) {
                for (var n = 0; n < 30; n++) {
                    tick[n].style.transform = "translateX(0)";
                    tick[n].style.opacity = 0;
                }
                tickPos = 0;
                tempAvg = 0;
                arrow.style.transform = "translateX(0)";
                bar.style.opacity = 0;
                center.style.opacity = 0;
                info.style.opacity = 0;
                
            } else {
                bar.style.opacity = 1;
                center.style.opacity = 1;
                info.style.opacity = 1;
                if (data.play.mods.name.includes("HR")) {
                    updateHrTimingwindows(data.beatmap.stats.od.converted);
                } else {
                    updateTimingWindows(data.beatmap.stats.od.converted);
                }
            }
        }


        if (data.play.unstableRate == 0) {
            for (var n = 0; n < 30; n++) {
                tick[n].style.transform = "translateX(0)";
                tick[n].style.opacity = 0;
            }
            arrow.style.transform = "translateX(0)";
        }
        if (cache.acc !== data.play.accuracy) {
            cache.acc = data.play.accuracy;
        }
        if (cache.ur !== data.play.unstableRate) {
            cache.ur = data.play.unstableRate;
            tempAvg = 0;
            document.getElementById("info").innerHTML = (cache.ur/10).toFixed(2) + "ms - " + cache.acc.toFixed(2) + "%";
        }

    } catch (err) {
        console.log(err);
    };
});
// source reference: https://github.com/2222zz/gosumemory-theme/tree/main/mania_simple_hiterror_colorful/
socket.api_v2_precise((precise) => {
    try {
        tempSmooth = smooth(precise.hitErrors, 4);
        if (cache.heal !== tempSmooth.length) {
            cache.heal = tempSmooth.length;
            for (var a = 0; a < cache.heal; a++) {
                tempAvg = tempAvg * 0.90 + tempSmooth[a] * 0.1;
            }
            fullPos = (-10 * cache.OD + 199.5);
            tickPos = precise.hitErrors[cache.heal - 1] / fullPos * 145;
            hitErrorValue = precise.hitErrors[cache.heal - 1];

            arrow.style.transform = `translateX(${(tempAvg / fullPos) * 150}px)`;
            if ((tempAvg / fullPos) * 150 > 2.5) {
                arrow.style.borderColor = "#FF4040 transparent transparent transparent"
            }
            else if ((tempAvg / fullPos) * 150 < -2.5) {
                arrow.style.borderColor = "#1985FF transparent transparent transparent"
            }
            else {
                arrow.style.borderColor = "white transparent transparent transparent"
            }
            for (var c = 0; c < 30; c++) {
                if ((cache.heal % 30) == ((c + 1) % 30)) {
                    tick[c].style.opacity = 1;
                    tick[c].style.transform = `translateX(${tickPos}px)`;

                    if (hitErrorValue >= -(timing_300g) && hitErrorValue <= timing_300g) {
                        tick[c].style.backgroundColor = '#FFF';
                    }
                    else if (hitErrorValue >= -(timing_300) && hitErrorValue <= timing_300) {
                        tick[c].style.backgroundColor = '#ffec00';
                    }
                    else if (hitErrorValue >= -(timing_200) && hitErrorValue <= timing_200) {
                        tick[c].style.backgroundColor = '#00ff55';
                    }
                    else if (hitErrorValue >= -(timing_100) && hitErrorValue <= timing_100) {
                        tick[c].style.backgroundColor = '#42b0e2';
                    }
                    else if (hitErrorValue >= -(timing_50) && hitErrorValue <= timing_50) {
                        tick[c].style.backgroundColor = '#c134dd';
                    }
                    else {
                        tick[c].style.backgroundColor = '#dc2e52';
                    }

                    var s = document.querySelectorAll("[id^=tick]")[c].style;
                    s.opacity = 1;
                    setTimeout(function fade() {
                        (s.opacity -= .05) < 0 ? s.opacity = 0 : setTimeout(fade, 100)
                    }, 1500)();
                }
            }
        }
    }catch (error) {
        console.log(err);
    };
});