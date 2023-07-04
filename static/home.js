//Prevent arrows to scroll the page
window.addEventListener("keydown", function(e) {
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) { // space and arrow keys
        e.preventDefault();
    }
}, false);

const dom_ready = () => {
    //Detect Firefox browser
    const is_firefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    if (is_firefox) {
        document.querySelector("#firefox-warning").style.display = "block";
    }
    const input_anim_1 = document.getElementById("animation_tester_enemy_party");
    input_anim_1.onfocus = () => (data.game.input.enabled = false);
    input_anim_1.onblur = () => (data.game.input.enabled = true);
    const input_anim_2 = document.getElementById("animation_tester_ability_keyname");
    input_anim_2.onfocus = () => (data.game.input.enabled = false);
    input_anim_2.onblur = () => (data.game.input.enabled = true);
};
document.addEventListener('DOMContentLoaded', dom_ready, false);
